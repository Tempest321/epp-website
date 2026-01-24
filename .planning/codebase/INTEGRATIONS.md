# External Integrations

**Analysis Date:** 2026-01-23

## APIs & External Services

**Gemini (Google Generative AI):**
- What it's used for: Content generation, project description analysis via API proxy
- SDK/Client: Via HTTP requests (no SDK in main dependencies)
- Auth: `GEMINI_API_KEY` stored as Cloudflare secret (not in code)
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- Proxy location: `worker/src/index.js` - Cloudflare Worker that proxies requests
- CORS: Whitelist includes https://forsightengine.ai, https://forsightengine.com, https://forsightenginepage.pages.dev, http://localhost:8000

**LLaMA 13B (Meta):**
- What it's used for: Scope understanding, project description embeddings
- Model: `meta-llama/Llama-2-13b-hf` (from HuggingFace Hub)
- Served via: vLLM 0.2.0+ for fast inference
- Base model location: Configured via `LLM_BASE_MODEL` env var
- Service URL: `LLM_SERVICE_URL` (default: http://localhost:8001)
- Token config: `LLM_MAX_TOKENS` (default: 512), `LLM_TEMPERATURE` (default: 0.1)
- Embedding dimension: 768-dimensional vectors stored in pgvector

## Data Storage

**Databases:**
- PostgreSQL 15+
  - Connection: `DATABASE_URL` env var (format: postgresql://user:password@host:port/dbname)
  - Pool: `DATABASE_POOL_SIZE` (default: 10), `DATABASE_MAX_OVERFLOW` (default: 20)
  - Client: psycopg2-binary 2.9.0+
  - ORM: SQLAlchemy 2.0.0+
  - Extensions required: `vector` (pgvector), `uuid-ossp`
  - Schema: `docs/schema.sql` (canonical)
  - Key tables:
    - `companies` - Multi-tenant support with LoRA adapter paths
    - `projects` - Core project data with scope embeddings
    - `deliverables` - Line items with embeddings
    - `deliverable_classes` - Master taxonomy
    - `predictions` - Audit log of all predictions
    - `model_versions` - Model registry with artifact paths
    - `predictions_log` - Prediction history for retraining
    - `user_activity` - Usage metrics
  - Migrations: Alembic 1.12.0+ (location: `src/epp/db/migrations/` - not shown but referenced)
  - Vector indexes: IVFFlat indexes on scope_embedding and embedding columns for cosine similarity search

**File Storage:**
- S3-compatible (MinIO in dev, AWS S3 or equivalent in production)
  - Connection: `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION` env vars
  - Default dev endpoint: http://localhost:9000 (MinIO)
  - Bucket: `epp-artifacts`
  - Use cases:
    - Model artifact storage (trained XGBoost, LLaMA LoRA adapters)
    - Training data snapshots
    - Upload documents (RFPs, scopes, specs)
  - Docker service: minio:latest (container: epp_minio)

**Caching:**
- Redis 7
  - Connection: `REDIS_URL` env var (default: redis://localhost:6379/0)
  - Use cases:
    - Session storage
    - Embedding cache (TTL: `EMBEDDING_CACHE_TTL_HOURS`, default: 24)
    - Prediction cache (TTL: `PREDICTION_CACHE_TTL_HOURS`, default: 1)
  - Controlled by: `ENABLE_CACHING` feature flag
  - Docker service: redis:7-alpine (container: epp_redis)

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based
  - Implementation: python-jose 3.3.0+ with cryptography
  - Token algorithm: `JWT_ALGORITHM` (default: HS256)
  - Expiry: `JWT_EXPIRY_MINUTES` (default: 15 min)
  - Refresh token: `REFRESH_TOKEN_EXPIRY_DAYS` (default: 30 days)
  - Secret key: `SECRET_KEY` env var (CHANGE IN PRODUCTION)
  - Password hashing: passlib 1.7.4+ with bcrypt
  - Location: `src/epp/api/` (implementation pending)

**API Authentication:**
- Header-based: `api_key` for EPPClient (defined in `src/epp/api/client.py`)
- Company context: `company_id` parameter for multi-tenant isolation

## Monitoring & Observability

**Error Tracking:**
- Not detected - Future enhancement (Phase 3+)

**Logs:**
- loguru 0.7.0+ - Structured logging
- Format: `LOG_FORMAT` env var (default: json)
- Level: `LOG_LEVEL` env var (default: INFO)
- JSON format enables aggregation in centralized logging (ELK, CloudWatch, etc.)

**Metrics:**
- prometheus-client 0.18.0+ - Prometheus-compatible metrics
- Feature flag: `ENABLE_METRICS` (default: true)
- Tracing: `ENABLE_TRACING` flag (default: false, future feature)

**Model Monitoring:**
- MLflow Tracking Server
  - Backend store: PostgreSQL (shares epp_dev database)
  - Artifact root: S3 (s3://mlflow-artifacts)
  - Server URL: `MLFLOW_TRACKING_URI` (default: http://localhost:5000)
  - Experiment name: `MLFLOW_EXPERIMENT_NAME` (default: epp-experiments)
  - Docker service: ghcr.io/mlflow/mlflow:latest (container: epp_mlflow)
  - Tracks: Model versions, training metrics, parameters, artifacts

## CI/CD & Deployment

**Hosting:**
- Cloudflare Pages (static website)
  - Project name: forsightengine (in wrangler.toml)
  - Build output: `./website`
  - HTML files: index.html, demo.html, demo-unico.html, unico.html, pricing.html, technology.html

**Cloudflare Workers (API Proxy):**
- Worker name: fse-api-proxy
- Main entry: `worker/src/index.js`
- Compatibility date: 2024-01-01
- Configuration: `worker/wrangler.toml`
- Endpoints:
  - POST `/api/gemini/generate` - Proxies to Gemini API
  - Preflight: OPTIONS for CORS handling
- Secrets: `GEMINI_API_KEY` (via `wrangler secret put`)
- Allowed origins: Configured in env vars, split by comma

**CI Pipeline:**
- Not detected in repo - Likely configured in GitHub Actions or other service (not in code)

**Local Development:**
- Docker Compose orchestration (`docker-compose.yml`):
  - Services: postgres, redis, minio, mlflow
  - Network: epp_network
  - Volumes: postgres_data, redis_data, minio_data (persistent)

## Environment Configuration

**Required env vars (from .env.example):**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION` - MinIO/S3
- `LLM_BASE_MODEL` - HuggingFace model ID (meta-llama/Llama-2-13b-hf)
- `LLM_SERVICE_URL` - vLLM server endpoint
- `SECRET_KEY` - JWT signing key (MUST change in production)
- `MLFLOW_TRACKING_URI` - MLflow server URL
- `PREFECT_API_URL` - Prefect server URL
- `ENV` - Environment: development, staging, production

**Secrets location:**
- Development: `.env` file (gitignored)
- Production: Environment variables or secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- Cloudflare: Secrets via `wrangler secret put` command

## Webhooks & Callbacks

**Incoming:**
- Not detected - Future integration point for:
  - Procore webhooks (Phase 3: ERP integrations)
  - Project status updates
  - Change order notifications

**Outgoing:**
- Not detected - Potential future:
  - Completion callbacks to customer systems
  - Model retraining triggers
  - Alert notifications

## Deployment Architecture

**Local Development Stack:**
```
┌─ Docker Compose Network (epp_network) ─────────────────┐
│                                                         │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐   │
│  │  PostgreSQL  │  │    Redis    │  │    MinIO     │   │
│  │  port 5432   │  │  port 6379  │  │  port 9000   │   │
│  └──────────────┘  └─────────────┘  └──────────────┘   │
│                                                         │
│  ┌──────────────┐                                       │
│  │    MLflow    │                                       │
│  │  port 5000   │                                       │
│  └──────────────┘                                       │
└─────────────────────────────────────────────────────────┘

Host Machine:
┌────────────────────────────────────────┐
│  FastAPI (uvicorn)                     │
│  port 8000                             │
│  - Routes: /api/v1/predict, etc.       │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  vLLM Server                           │
│  port 8001                             │
│  - LLaMA 13B inference                 │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  Prefect Agent                         │
│  - Training job scheduling             │
│  - Pipeline orchestration              │
└────────────────────────────────────────┘
```

**Production Deployment (anticipated):**
- FastAPI: Kubernetes or managed container service
- PostgreSQL: Managed database (RDS, Cloud SQL)
- Redis: Managed cache (ElastiCache, Memorystore)
- S3: AWS S3 or equivalent
- vLLM: GPU-enabled container cluster or inference endpoint
- MLflow: Managed or self-hosted
- Frontend: Cloudflare Pages + Workers

---

*Integration audit: 2026-01-23*
