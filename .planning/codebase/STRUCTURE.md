# Codebase Structure

**Analysis Date:** 2026-01-23

## Directory Layout

```
/home/xavier-gonzales/Desktop/epp-website/
├── src/epp/                    # Core Python package
│   ├── __init__.py             # Package exports (EPPClient, version)
│   ├── api/                    # FastAPI application & client
│   │   ├── __init__.py
│   │   └── client.py           # Client SDK + Pydantic models (Prediction, RiskFactor, etc.)
│   ├── db/                     # Database models & queries
│   │   └── __init__.py         # ORM models, query builders (planned: models.py, queries.py)
│   ├── features/               # Feature engineering & feature store
│   │   └── __init__.py         # Feature extractors (planned: extractors.py, embeddings.py, aggregations.py, store.py)
│   ├── ingestion/              # ETL pipelines
│   │   └── __init__.py         # Data parsers, validators, mappers, normalizers (planned)
│   ├── models/                 # ML models (LLM & tabular prediction)
│   │   └── __init__.py         # LLM wrapper, predictor, LoRA management (planned: llm.py, predictor.py, lora.py)
│   ├── training/               # Model training pipelines
│   │   └── __init__.py         # LoRA training, tabular training, evaluation, CLI (planned)
│   └── utils/                  # Shared utilities
│       └── __init__.py         # Config, logging, metrics, types (planned: config.py, logging.py, metrics.py, types.py)
├── tests/                      # Test suite
│   └── __init__.py             # (Currently minimal, structured per module under src/epp/)
├── website/                    # Static web UI (HTML/CSS/JS)
│   ├── index.html              # Main landing/demo page
│   ├── demo.html               # Interactive prediction demo
│   ├── demo-unico.html         # Alternative demo variant
│   ├── pricing.html            # Pricing page
│   ├── technology.html         # Technology stack page
│   ├── unico.html              # Alternative page variant
│   ├── css/                    # Stylesheets
│   └── js/                     # Client-side JavaScript
├── worker/                     # Cloudflare Workers edge function
│   ├── src/
│   │   └── index.js            # Gemini API proxy with CORS & auth
│   └── wrangler.toml           # Cloudflare Workers config
├── data/                       # Data files (not committed)
│   ├── raw/                    # Original client data
│   ├── processed/              # Cleaned & normalized data
│   └── kaggle/                 # Kaggle datasets (reference)
├── models/                     # Trained model artifacts (not committed)
│   ├── lora/                   # LoRA adapter weights per company
│   ├── xgboost/                # XGBoost predictor models
│   └── checkpoints/            # Training checkpoints
├── notebooks/                  # Jupyter notebooks (exploration)
├── docs/                       # Documentation
│   ├── architecture.md         # Detailed system design
│   └── schema.sql              # PostgreSQL schema DDL
├── .planning/                  # GSD planning docs (generated)
│   └── codebase/               # Analysis documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
├── .env.example                # Environment variables template
├── docker-compose.yml          # Local dev environment (PostgreSQL, Redis, MinIO, MLflow)
├── Makefile                    # Development commands
├── pyproject.toml              # Python package config, dependencies, tool settings
├── PLAN.md                     # Master product plan & technical roadmap
├── README.md                   # Project overview & quick start
├── BUSINESS_PLAN_SEED.md       # Business model & go-to-market
├── PITCH.md                    # Investor pitch
├── PREDICTION_METHODS.md       # Detailed algorithm explanations
├── RESEARCH.md                 # Background research & references
├── pricing_sheets.md           # Pricing strategy documents
├── .gitignore                  # Git ignore rules
├── wrangler.toml               # Cloudflare configuration (top-level, alternative location)
└── RESEARCH.md                 # Background research notes
```

## Directory Purposes

**`src/epp/`:**
- Purpose: Main Python package containing all business logic
- Contains: Seven core modules (api, db, features, ingestion, models, training, utils)
- Key files: `__init__.py` at each level for module exports

**`src/epp/api/`:**
- Purpose: HTTP API and client SDK
- Contains: FastAPI application setup, Pydantic request/response models, client class
- Key files:
  - `client.py`: Defines `Prediction`, `RiskFactor`, `RiskyDeliverable`, `SimilarProject`, `EPPClient` classes
  - `__init__.py`: Exports `EPPClient`

**`src/epp/db/`:**
- Purpose: Data persistence layer
- Contains: SQLAlchemy ORM models, database connection setup, migration management
- Key files: `models.py` (ORM), `queries.py` (query builders), `migrations/` (Alembic scripts)
- Used by: All services for data storage and retrieval

**`src/epp/features/`:**
- Purpose: Feature computation and storage
- Contains: Feature extractors, embedding generation, aggregations, feature store interface
- Key files: `extractors.py`, `embeddings.py`, `aggregations.py`, `store.py`
- Pipeline: Raw project data → LLM outputs → feature vectors for ML models

**`src/epp/ingestion/`:**
- Purpose: ETL and data normalization
- Contains: CSV/Excel/JSON parsers, field mappers, validators, normalizers, pipeline orchestration
- Key files: `parsers.py`, `validators.py`, `mappers.py`, `normalizers.py`, `pipeline.py`
- Flow: Client data (messy) → canonical schema (clean)

**`src/epp/models/`:**
- Purpose: ML model definitions and management
- Contains: LLM wrapper for scope understanding, predictor interface for cost/schedule, LoRA adapter registry
- Key files: `llm.py`, `predictor.py`, `lora.py`
- Responsibility: Load, cache, and invoke models at prediction time

**`src/epp/training/`:**
- Purpose: Model training and evaluation
- Contains: LoRA adapter fine-tuning, XGBoost training, evaluation metrics, CLI interface
- Key files: `llm_adapter.py`, `tabular.py`, `evaluation.py`, `cli.py`
- Triggered: Company onboarding (one-time), monthly updates (incremental)

**`src/epp/utils/`:**
- Purpose: Shared infrastructure and utilities
- Contains: Configuration management, logging setup, Prometheus metrics, type definitions
- Key files: `config.py`, `logging.py`, `metrics.py`, `types.py`
- Used by: All other modules for initialization

**`tests/`:**
- Purpose: Test suite
- Currently: Minimal, single `__init__.py`
- Expected structure: Tests follow module hierarchy (e.g., `tests/test_ingestion.py`, `tests/test_models/test_predictor.py`)
- Tool: pytest with coverage tracking

**`website/`:**
- Purpose: Static marketing and demo website
- Contains: HTML pages, CSS stylesheets, client-side JavaScript
- Key files:
  - `index.html`: Main landing page with hero section
  - `demo.html`: Interactive prediction demo
  - `pricing.html`: Pricing plans
  - `technology.html`: Tech stack overview
- Note: Separate from main Python backend; served statically or via simple HTTP server

**`worker/`:**
- Purpose: Cloudflare Workers serverless edge function
- Contains: API proxy that securely forwards requests to Gemini API
- Key files: `src/index.js` - Handler for `/api/gemini/generate` endpoint
- Responsibility: Hide Gemini API key, enforce origin validation, add CORS headers
- Config: `wrangler.toml` - Cloudflare Workers project configuration

**`data/`:**
- Purpose: Data files for ingestion and testing
- Structure:
  - `raw/`: Original client data (CSV, Excel) - not committed
  - `processed/`: Cleaned and normalized data - not committed
  - `kaggle/`: Reference datasets for research
- Note: Gitignored; populated locally or via data pipeline

**`models/`:**
- Purpose: Trained ML model artifacts
- Structure:
  - `lora/`: LoRA adapter weights (one per company, ~10-50MB each)
  - `xgboost/`: Serialized XGBoost models
  - `checkpoints/`: Training checkpoints for resumption
- Note: Gitignored; stored in S3/MinIO in production

**`notebooks/`:**
- Purpose: Jupyter notebooks for exploration and analysis
- Contents: Data exploration, algorithm validation, performance analysis
- Note: For development/research only, not production code

**`docs/`:**
- Purpose: Technical documentation
- Key files:
  - `architecture.md`: Detailed system design (data flows, services, scaling)
  - `schema.sql`: PostgreSQL DDL for all tables
  - Other planned: API reference, onboarding guide

**`.planning/codebase/`:**
- Purpose: Generated GSD codebase analysis documents
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md, STACK.md, INTEGRATIONS.md
- Note: Auto-generated by GSD orchestrator; informs planning and execution

## Key File Locations

**Entry Points:**

- `src/epp/api/main.py`: FastAPI app initialization (planned)
  - Callable as `epp-api` CLI command via pyproject.toml
  - Starts uvicorn server on port 8000

- `src/epp/training/cli.py`: Training CLI entry point (planned)
  - Callable as `epp-train` CLI command
  - Runs Prefect flows or direct training

- `src/epp/ingestion/cli.py`: Ingestion CLI entry point (planned)
  - Callable as `epp-ingest` CLI command
  - Runs one-off data imports

- `worker/src/index.js`: Cloudflare Workers handler
  - Deployed to Cloudflare edge network
  - Handles `/api/gemini/generate` requests

**Configuration:**

- `pyproject.toml`: Python project metadata, dependencies, tool settings
  - Black config (line length 88, Python 3.10+ target)
  - isort config (black profile, line length 88)
  - mypy config (strict mode, disallow untyped defs)
  - pytest config (test discovery, markers, coverage)
  - CLI entry points definition

- `.env.example`: Template for environment variables
  - Copy to `.env` and populate locally

- `docker-compose.yml`: Local development environment
  - PostgreSQL 15 with pgvector
  - Redis 7 for caching
  - MinIO for local S3 storage
  - MLflow for experiment tracking

**Core Logic:**

- `src/epp/api/client.py`: Public SDK and data models
  - `Prediction`: Main output model with cost/duration estimates
  - `EPPClient`: Client class for making predictions

- `src/epp/db/__init__.py`: Database configuration (planned)
  - SQLAlchemy setup, session management
  - ORM model imports

- `src/epp/features/`: Feature engineering pipeline (planned)
  - Scope embeddings, complexity scoring, deliverable aggregation

- `src/epp/models/`: ML model loading and inference (planned)
  - LLM wrapper, predictor inference, LoRA adapter registry

**Testing:**

- `tests/__init__.py`: Test package root
- `tests/test_*.py`: Test modules (one per feature area)
  - Use pytest fixtures from conftest
  - Mock external services (vLLM, database)

## Naming Conventions

**Files:**

- Python modules: `snake_case.py` (e.g., `ingestion.py`, `llm_adapter.py`)
- Configuration: `{name}.config.js` or `.{name}rc` (e.g., `.prettierrc`, `jest.config.js`)
- SQL migrations: `{version}_{description}.sql` or Alembic auto-generated
- Web files: `index.html`, `demo.html`, descriptive kebab-case for other pages

**Directories:**

- Python packages: `snake_case/` (e.g., `src/epp/ingestion/`)
- Data directories: `{category}/` (e.g., `data/raw/`, `data/processed/`)
- Docs: Descriptive `.md` files (e.g., `docs/architecture.md`)

**Python Classes:**

- Domain models (Pydantic): `PascalCase` (e.g., `Prediction`, `RiskFactor`)
- Services: `PascalCase` + `Service` suffix (planned, e.g., `IngestService`, `PredictService`)
- Utilities: `PascalCase` (e.g., `FeatureEngineer`)

**Python Functions:**

- Private: `_snake_case()` (e.g., `_load_lora_adapter()`)
- Public: `snake_case()` (e.g., `predict()`, `extract_features()`)

**Environment Variables:**

- All caps with underscores: `DATABASE_URL`, `GEMINI_API_KEY`, `ALLOWED_ORIGINS`
- Company-specific: Prefix with company name or use per-company config table

## Where to Add New Code

**New Feature (e.g., "What-if Scenario Analysis"):**

1. **Primary code:**
   - If involves API endpoint: Add route handler to `src/epp/api/` (in future `main.py`)
   - If involves model training: Add pipeline to `src/epp/training/` (future `cli.py`)
   - If involves data transformation: Add to `src/epp/features/` or `src/epp/ingestion/`

2. **Tests:**
   - Add to `tests/test_{module_name}.py` with pytest fixtures
   - Mock external services (vLLM, database) using pytest-mock

3. **Database changes:**
   - Create Alembic migration in `src/epp/db/migrations/`
   - Update SQLAlchemy models in `src/epp/db/models.py` (future)

**New Component/Module (e.g., "Risk Decomposition Service"):**

1. **Implementation:**
   - Create new directory under `src/epp/{module_name}/`
   - Create `__init__.py` with public API exports
   - Implement core logic in focused files (e.g., `decomposer.py`, `explainer.py`)

2. **Integration:**
   - Import and wire into API handlers or training pipelines
   - Add Prometheus metrics to `src/epp/utils/metrics.py` (future)
   - Add configuration to `src/epp/utils/config.py` (future)

3. **Testing:**
   - Mirror structure in `tests/test_{module_name}/`
   - Include unit tests, integration tests with database fixtures

**Utilities:**

- Generic helper functions: `src/epp/utils/helpers.py` or create focused module
- Type definitions: `src/epp/utils/types.py`
- Constants: Define in module where used, extract to `src/epp/utils/constants.py` if shared

**Web UI Enhancements:**

- New HTML pages: Add to `website/` directory
- Styling: Add CSS to `website/css/` (or inline in HTML)
- Client-side scripts: Add to `website/js/` or inline in HTML
- Cloudflare Worker logic: Update `worker/src/index.js` and test with `wrangler dev`

## Special Directories

**`models/`:**
- Purpose: Trained model artifacts
- Generated: Yes (by training pipeline)
- Committed: No (too large, stored in S3/MinIO)
- Structure:
  - `models/lora/{company_id}/adapter_config.json` and `adapter_model.bin`
  - `models/xgboost/{company_id}/model.pkl`

**`data/`:**
- Purpose: Sample and test data
- Generated: Partially (processed/ created by pipeline, raw/ sourced externally)
- Committed: No (too large, privacy concerns)
- Structure:
  - `data/raw/`: Original CSV/Excel files from clients
  - `data/processed/`: Normalized data after ingestion pipeline
  - `data/kaggle/`: Reference public datasets

**`notebooks/`:**
- Purpose: Exploration and research
- Generated: Yes (by data scientists)
- Committed: Yes (git tracks ipynb files)
- Structure: Descriptive names like `01_data_exploration.ipynb`, `02_model_validation.ipynb`

**`.planning/codebase/`:**
- Purpose: GSD planning and analysis documents
- Generated: Yes (by GSD orchestrator on-demand)
- Committed: Yes (guides development)
- Files: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md, STACK.md, INTEGRATIONS.md

## Module Import Hierarchy

**High-level structure (no circular dependencies):**

```
api/ → (calls services)
  ↓
ingestion/, features/, training/, models/ → (use database & utils)
  ↓
db/ → (uses utils)
  ↓
utils/ → (no dependencies)
```

**Typical import statements:**

- Internal: `from epp.api.client import Prediction`
- Database: `from epp.db import Project, Deliverable` (future, when models.py exists)
- Features: `from epp.features.extractors import extract_embeddings` (future)
- Utilities: `from epp.utils.config import Settings`

**External packages:**

- ML: `torch`, `transformers`, `xgboost`, `sklearn`
- API: `fastapi`, `uvicorn`, `pydantic`
- Database: `sqlalchemy`, `psycopg2-binary`, `pgvector`, `alembic`
- Task scheduling: `prefect`, `tenacity`
- Data: `pandas`, `numpy`, `openpyxl`, `pyarrow`
- Observability: `loguru`, `prometheus-client`
- LLM serving: `vllm` (external service, not imported)

