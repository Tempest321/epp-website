# Technology Stack

**Analysis Date:** 2026-01-23

## Languages

**Primary:**
- Python 3.10+ - Core ML/AI backend, API server, data pipeline, training orchestration

**Secondary:**
- JavaScript (Vanilla) - Frontend static site, interactive demos, Cloudflare Workers
- SQL (PostgreSQL dialect) - Database schema, queries

## Runtime

**Environment:**
- Python 3.10+ (required per `pyproject.toml`)
- Node.js (for Cloudflare Workers deployment)
- Docker + Docker Compose (for local development infrastructure)

**Package Manager:**
- pip (Python package manager via setuptools)
- Lockfile: Generated dynamically from `pyproject.toml` (no explicit lock file in repo)

## Frameworks

**Core Backend:**
- FastAPI 0.104.0+ - HTTP API server, async request handling, auto-generated OpenAPI docs
  - Location: `src/epp/api/` (main FastAPI app)
  - Entry point: CLI command `epp-api = "epp.api.main:run"`

**ML & Prediction:**
- PyTorch 2.0.0+ - Neural network inference, model loading
- Transformers 4.35.0+ - LLaMA 13B base model, tokenization, embeddings
- XGBoost 2.0.0+ - Tabular cost/schedule predictor with quantile regression
- LightGBM 4.1.0+ - Alternative gradient boosting for comparison/ensemble
- scikit-learn 1.3.0+ - Preprocessing, metrics, utilities

**LLM Serving:**
- vLLM 0.2.0+ - Fast LLM inference with LoRA adapter support (replaces vLLM for production)
- PEFT 0.6.0+ - Parameter-efficient fine-tuning (LoRA) for company-specific adapters
- Accelerate 0.24.0+ - Distributed training and inference utilities

**Data Processing:**
- Pandas 2.0.0+ - Tabular data manipulation, feature engineering
- NumPy 1.24.0+ - Numerical computations, arrays
- PyArrow 14.0.0+ - Parquet file support for efficient storage
- openpyxl 3.1.0+ - Excel file parsing for customer data ingestion

**API & Web:**
- Uvicorn 0.24.0+ - ASGI server for FastAPI
- Pydantic 2.4.0+ - Request/response validation, type safety
- pydantic-settings 2.0.0+ - Environment configuration management
- python-multipart 0.0.6 - File upload handling
- python-jose 3.3.0+ - JWT token creation/validation
- passlib 1.7.4+ - Password hashing with bcrypt

**Testing:**
- pytest 7.4.0+ - Test runner
- pytest-cov 4.1.0+ - Coverage reporting
- pytest-asyncio 0.21.0+ - Async test support
- pytest-mock 3.12.0+ - Mocking utilities
- httpx 0.25.0+ - Async HTTP client for FastAPI testing
- faker 20.0.0+ - Test data generation

**Code Quality:**
- black 23.0.0+ - Code formatter (88 char line length)
- isort 5.12.0+ - Import sorting (black-compatible profile)
- flake8 6.0.0+ - Linter
- mypy 1.7.0+ - Static type checker (strict mode: `disallow_untyped_defs = true`)
- pylint 3.0.0+ - Additional linting

**Orchestration:**
- Prefect 2.14.0+ - ML pipeline scheduling, workflow orchestration (scheduled jobs)
- MLflow 2.8.0+ - Model registry, experiment tracking, artifact storage

**Documentation:**
- mkdocs 1.5.0+ - Static documentation site
- mkdocs-material 9.4.0+ - Material theme for mkdocs

**Utilities:**
- python-dotenv 1.0.0+ - Environment variable loading from `.env`
- PyYAML 6.0.0+ - Configuration files
- tenacity 8.2.0+ - Retry logic for API calls
- tqdm 4.66.0+ - Progress bars
- loguru 0.7.0+ - Structured logging
- prometheus-client 0.18.0+ - Metrics collection

**Optional GPU:**
- torch>=2.0.0+cu118 - CUDA 11.8 GPU support (when installing `gpu` extra)
- triton 2.1.0+ - GPU kernel compilation for optimized inference

## Key Dependencies

**Critical Infrastructure:**
- PostgreSQL 15+ with pgvector extension (vector similarity search)
  - Client: psycopg2-binary 2.9.0+
  - ORM: SQLAlchemy 2.0.0+
  - Migrations: Alembic 1.12.0+
  - Vector support: pgvector 0.2.0+

**Caching & Sessions:**
- Redis 7 (via Docker) - Session storage, caching

**File Storage:**
- MinIO (S3-compatible object storage via Docker) - Model artifacts, training data, inference results

**Observability:**
- prometheus-client 0.18.0+ - Metrics (optional, controlled by `ENABLE_METRICS` env var)

## Configuration

**Environment Variables:**
- Loaded from `.env.example` template
- Key categories:
  - `DATABASE_*` - PostgreSQL connection, pool settings
  - `REDIS_URL` - Redis connection
  - `S3_*` - MinIO/S3 object storage credentials
  - `LLM_*` - LLaMA base model path, service URL, generation parameters
  - `API_*` - FastAPI host, port, worker count
  - `JWT_*` - JWT algorithm, expiry settings
  - `MLFLOW_*` - Experiment tracking server
  - `PREFECT_*` - Workflow orchestration
  - `LOG_*` - Logging level and format
  - Feature flags: `ENABLE_CACHING`, `ENABLE_METRICS`, `ENABLE_TRACING`
  - `MAX_UPLOAD_SIZE_MB`, `RATE_LIMIT_PER_MINUTE` - Rate limiting
  - `ENV` - development/staging/production environment selector

**Build System:**
- `pyproject.toml` - Single source of truth for dependencies and metadata
  - Build backend: setuptools 68.0+
  - Package discovery: `src/epp` layout
  - Entry points: 3 CLI commands (epp-api, epp-train, epp-ingest)

**Code Quality Configuration:**
- `.black` section: 88 char line length, Python 3.10 target
- `.isort` section: black profile, known_first_party = ["epp"]
- `.mypy` section: strict mode, pydantic plugin enabled
- `.pytest.ini_options`: `tests/` directory, test markers (slow, integration, gpu)
- `.coverage` section: source = src/epp, omit tests and migrations

## Platform Requirements

**Development:**
- Python 3.10+ (local or venv)
- Docker & Docker Compose (for postgres, redis, minio, mlflow)
- PostgreSQL 15+ with pgvector extension
- pip/setuptools
- Optional: NVIDIA GPU (T4 or better) for LLM inference speed

**Production:**
- Python 3.10+ (container or host)
- PostgreSQL 15+ (managed service or self-hosted)
- Redis (managed service or self-hosted)
- S3-compatible object storage (AWS S3, MinIO, Wasabi, etc.)
- vLLM serving infrastructure for LLM inference (GPU optional)
- Prefect Cloud or self-hosted Prefect server
- MLflow tracking server
- Cloudflare Workers (for API proxy, `forsightengine.ai` domain)

---

*Stack analysis: 2026-01-23*
