# Architecture

**Analysis Date:** 2026-01-23

## Pattern Overview

**Overall:** Hybrid LLM + Tabular ML architecture with clear separation of concerns and multi-tenant service design.

**Key Characteristics:**
- **LLM for understanding:** LLaMA 13B with LoRA adapters handles unstructured scope documents and text understanding
- **Tabular ML for prediction:** XGBoost with quantile regression handles cost/schedule numeric prediction
- **Multi-service design:** Modular services for ingestion, inference, and training with clear APIs
- **Company-specific adaptation:** LoRA adapters per company enable efficient multi-tenancy without code duplication
- **Feature-driven pipeline:** Centralized feature engineering bridges LLM outputs and ML model inputs

## Layers

**Data Ingestion Layer:**
- Purpose: Parse and normalize heterogeneous client data into canonical schema
- Location: `src/epp/ingestion/`
- Contains: CSV/Excel/JSON parsers, validators, field mappers, normalizers, orchestration pipeline
- Depends on: Database models (`src/epp/db/`), utilities (`src/epp/utils/`)
- Used by: API endpoints for data upload, asynchronous background jobs triggered via Prefect

**Feature Engineering Layer:**
- Purpose: Extract features from raw data and LLM outputs for ML models
- Location: `src/epp/features/`
- Contains: Feature extractors (scope embeddings, complexity scores), embeddings generation, deliverable aggregations, feature store interface
- Depends on: Database layer, ingestion pipeline, LLM inference
- Used by: Training service and inference service when building feature vectors

**LLM Inference Service:**
- Purpose: Serve LLaMA 13B with hot-swappable LoRA adapters for scope understanding
- Location: External via vLLM (not in src/epp but configured and called)
- Contains: Base model loading, adapter registration, batching logic, CORS handling
- Depends on: Model artifacts in object storage (MinIO/S3)
- Used by: Feature extraction, scope normalization, complexity scoring, risk factor identification

**ML Models Layer:**
- Purpose: Store and manage trained prediction models
- Location: `src/epp/models/`
- Contains: LLM wrapper (`llm.py`), predictor interface (`predictor.py`), LoRA adapter management (`lora.py`)
- Depends on: Database, LLM service, feature engineering
- Used by: Inference service to generate predictions and explanations

**Training Pipeline:**
- Purpose: Train/update models as new data arrives
- Location: `src/epp/training/`
- Contains: LoRA adapter training (`llm_adapter.py`), tabular model training (`tabular.py`), evaluation metrics, CLI interface
- Depends on: Ingestion, features, database, models
- Used by: Scheduled jobs via Prefect orchestration, triggered on company onboarding and monthly updates

**API Layer:**
- Purpose: HTTP endpoints for client prediction requests and admin operations
- Location: `src/epp/api/`
- Contains: FastAPI application, Pydantic request/response models, authentication middleware, routing
- Depends on: All internal services (ingestion, inference, training)
- Used by: Frontend web UI, external integrations

**Database Layer:**
- Purpose: Persistent storage of projects, deliverables, predictions, features, models metadata
- Location: `src/epp/db/`
- Contains: SQLAlchemy ORM models, query builders, database configuration
- Depends on: Utilities for connection pooling and transaction management
- Used by: All other layers for data persistence and retrieval

**Utilities & Configuration:**
- Purpose: Shared infrastructure for logging, config management, metrics, type definitions
- Location: `src/epp/utils/`
- Contains: Config class (from pydantic-settings), logging setup (via loguru), Prometheus metrics, common types
- Depends on: External packages only
- Used by: All layers for initialization and cross-cutting concerns

## Data Flow

**Onboarding Flow (Company Setup):**

1. Client provides historical project data (CSV/Excel with custom field names)
2. Upload to `POST /api/v1/ingest` endpoint → ingestion service
3. Ingestion service loads company-specific field mapping config
4. Data is parsed, validated against schema, and normalized (units, dates, text)
5. Canonical project and deliverable records inserted into PostgreSQL
6. Asynchronous feature extraction triggered (via Prefect)
7. Feature extractor calls LLM to generate scope embeddings, complexity scores, normalized deliverable classes
8. Features computed and stored in `project_features` table
9. Misestimation statistics computed by analyzing historical actual vs estimated costs/durations
10. Training pipeline triggered: LoRA adapter trained on company's scope documents
11. XGBoost predictor fine-tuned or trained on company's completed projects with computed features
12. Models validated on holdout set, then registered and deployed

**Prediction Flow (Runtime Inference):**

1. User enters new project scope via web UI
2. `POST /api/v1/predict` with project description and deliverables
3. API loads company's LoRA adapter into vLLM inference
4. LLM generates 768-dim scope embedding from description
5. LLM extracts complexity score (0-1), risk factors, and normalizes deliverable descriptions to standard classes
6. Feature engineer builds feature vector by combining:
   - Scope embedding (768 dims)
   - Complexity score (1 dim)
   - Aggregated deliverable counts by class (~20 dims)
   - Location one-hot encoding (~50 dims)
   - Temporal features like season (~12 dims)
   - Historical similar project statistics (~10 dims)
   - Company embedding (~32 dims)
7. XGBoost predictor loaded and evaluates feature vector
8. Model outputs: cost P50/P80/P90 and duration P50/P80/P90 quantiles
9. SHAP values computed to identify top feature drivers
10. Vector similarity search finds top-K historical projects with similar scope embeddings
11. Deliverable misestimation statistics looked up for this company
12. All results combined into Prediction response object:
    - Cost and duration estimates with confidence intervals
    - Top risk factors and drivers
    - Risky deliverables (those historically mis-estimated)
    - Similar past projects and their performance
13. Prediction logged to database for audit trail and future retraining

**State Management:**

- **Model State:** Serialized artifacts (LoRA adapters, XGBoost pkl files) stored in S3/MinIO, referenced in database
- **Prediction State:** All predictions logged in `predictions` table with inputs, outputs, timestamp, company_id
- **Feature State:** Computed features cached in `project_features` table and Redis (24h TTL) for repeated lookups
- **Configuration State:** Company-specific configs (field mappings, model paths) stored in database `company_configs` table

## Key Abstractions

**Prediction Model:**
- Purpose: Represents a cost/schedule estimate with confidence intervals and explanations
- Examples: `src/epp/api/client.py` - Pydantic model `Prediction`
- Pattern: DTO (Data Transfer Object) with typed fields for cost quantiles, risk factors, similar projects

**RiskFactor, RiskyDeliverable, SimilarProject:**
- Purpose: Components of explanation output to make predictions human-interpretable
- Examples: `src/epp/api/client.py` - Pydantic models `RiskFactor`, `RiskyDeliverable`, `SimilarProject`
- Pattern: Nested domain models that compose the Prediction response

**Feature Engineering Pipeline:**
- Purpose: Orchestrate extraction of features from raw data and LLM outputs
- Examples: `src/epp/features/` module (planned: `extractors.py`, `embeddings.py`, `aggregations.py`, `store.py`)
- Pattern: Pipeline pattern with pluggable extractors for different feature types

**LoRA Adapter Management:**
- Purpose: Load, cache, and hot-swap company-specific LLM adapters
- Examples: `src/epp/models/lora.py` (planned)
- Pattern: Registry pattern with lazy loading and LRU cache for frequently-used adapters

**Company Isolation:**
- Purpose: Enforce data and model isolation in multi-tenant system
- Examples: `company_id` foreign key across all database tables, LoRA adapter per company, object storage key prefixes
- Pattern: Tenant-scoped architecture where all queries and model lookups filtered by `company_id`

## Entry Points

**API Server (`/api` endpoints):**
- Location: `src/epp/api/main.py` (planned) with FastAPI app initialization
- Triggers: HTTP requests from web UI and external clients
- Responsibilities:
  - Route prediction requests to inference service
  - Route data uploads to ingestion service
  - Handle authentication/authorization
  - Return JSON responses

**CLI Commands (defined in pyproject.toml):**
- `epp-api`: Starts FastAPI server via `epp.api.main:run`
- `epp-train`: Runs training pipeline via `epp.training.cli:main`
- `epp-ingest`: Runs one-off ingestion via `epp.ingestion.cli:main`

**Prefect Flows (Orchestration):**
- Triggered on company onboarding to train models
- Scheduled monthly to update models and compute statistics
- Triggered asynchronously after data ingestion to compute features

**Web Worker (Cloudflare):**
- Location: `worker/src/index.js`
- Triggers: POST requests to `/api/gemini/generate` from web frontend
- Responsibilities: Proxy requests to Gemini API while hiding API key, handle CORS

## Error Handling

**Strategy:** Layered validation with detailed error reporting and graceful degradation.

**Patterns:**

1. **Ingestion Validation Errors:**
   - Catch in `ingestion/validators.py`
   - Return detailed report with line numbers and column mappings
   - Rollback database transaction on partial failure
   - Log with company_id and data fingerprint for debugging

2. **LLM Inference Errors:**
   - Timeout: Fall back to rule-based feature extraction (no embedding)
   - API error: Return cached embeddings from previous batch if available
   - OOM: Partition batch and retry smaller chunks

3. **Prediction Errors:**
   - Missing features: Use imputation (mean/median from training data)
   - Model load failure: Return cached prediction for identical input if within TTL
   - Quantile regression failure: Return confidence interval widened appropriately

4. **Database Errors:**
   - Connection failures: Retry with exponential backoff (max 5 attempts)
   - Constraint violations: Log and return validation error with column name
   - Query timeout: Use read replica if available, cache result

5. **API Response Errors:**
   - 400: Validation failure (invalid project scope)
   - 401: Missing/invalid JWT token
   - 403: User not authorized for company_id
   - 500: Internal error with request_id for debugging

## Cross-Cutting Concerns

**Logging:**
- Framework: `loguru` configured in `src/epp/utils/logging.py`
- Pattern: Structured JSON logging with trace IDs for request correlation
- Levels: DEBUG (feature values), INFO (API calls, predictions), WARN (validation failures), ERROR (exceptions)

**Validation:**
- Framework: Pydantic at API boundaries, custom validators in ingestion layer
- Pattern: Fail fast with detailed error messages indicating what field failed and why

**Authentication:**
- Method: JWT tokens (15min expiry) + refresh tokens (30 days)
- Pattern: Middleware extracts JWT claim `company_id` and enforces in all queries

**Authorization:**
- Method: Role-based access control (admin, estimator, viewer)
- Pattern: Check user role and company_id match at handler entry point

**Caching:**
- Strategy: Redis for embeddings (24h TTL), in-memory LRU for LoRA adapters, database query caching
- Pattern: Cache-aside with TTL-based invalidation

**Metrics & Monitoring:**
- Framework: Prometheus client (`prometheus-client`)
- Pattern: Expose metrics at `/metrics` endpoint for scraping by monitoring system
- Tracked: API latency (p50, p95, p99), GPU utilization, prediction accuracy, feature drift

## Deployment Architecture

**Kubernetes Deployment:**
- API pods: Stateless, autoscale based on CPU load
- Inference pods: GPU-enabled, adapter cache per pod
- Database: PostgreSQL with read replicas for analytics
- Cache: Redis for embeddings and prediction caching
- Object Storage: MinIO or S3 for model artifacts and documents

**Service Dependencies:**
- PostgreSQL 15+ with pgvector extension
- Redis 7+ for caching
- vLLM server for LLM inference (GPU resource)
- Prefect server for orchestration
- MLflow for experiment tracking (optional)

