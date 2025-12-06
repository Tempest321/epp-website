# EPP Technical Architecture

## System Overview

EPP is a multi-tenant SaaS platform that combines large language models (LLaMA 13B) with specialized ML models to provide accurate construction project cost and schedule predictions.

## Core Design Principles

1. **Separation of Concerns**: LLMs for understanding, tabular ML for prediction
2. **Parameter Efficiency**: LoRA adapters for company-specific customization
3. **Multi-Tenancy**: Single codebase serving many companies with strong isolation
4. **Reproducibility**: Config-driven onboarding, canonical schema
5. **Explainability**: Every prediction comes with reasoning

## Service Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                   Next.js + React + Tailwind                 │
│  - Project input forms                                       │
│  - Prediction results dashboard                             │
│  - Analytics & insights                                      │
│  - Admin panel (mapping UI)                                  │
└──────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌──────────────────────────────────────────────────────────────┐
│                      API Gateway (FastAPI)                   │
│  - Authentication (JWT)                                      │
│  - Authorization (company-scoped)                           │
│  - Rate limiting                                             │
│  - Request routing                                           │
└──────────────────────────────────────────────────────────────┘
       ↓                    ↓                    ↓
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Ingestion  │     │  Inference  │     │   Training  │
│   Service   │     │   Service   │     │   Service   │
└─────────────┘     └─────────────┘     └─────────────┘
       ↓                    ↓                    ↓
┌──────────────────────────────────────────────────────────────┐
│                    LLM Inference Service                     │
│                    vLLM + LoRA Support                       │
│  - Base LLaMA 13B (loaded once)                             │
│  - Hot-swappable LoRA adapters per company                  │
│  - Batched inference for efficiency                         │
└──────────────────────────────────────────────────────────────┘
       ↓                    ↓                    ↓
┌──────────────────────────────────────────────────────────────┐
│                   Data & Storage Layer                       │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │   PostgreSQL 15+   │  │  Object Storage    │            │
│  │   + pgvector       │  │  (MinIO / S3)      │            │
│  │                    │  │                    │            │
│  │  - Projects        │  │  - Documents       │            │
│  │  - Deliverables    │  │  - Model artifacts │            │
│  │  - Features        │  │  - LoRA adapters   │            │
│  │  - Predictions     │  │  - Embeddings      │            │
│  └────────────────────┘  └────────────────────┘            │
└──────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Ingestion Service

**Purpose:** ETL pipeline for client data → canonical schema

**Endpoints:**
- `POST /api/v1/ingest/project` - Single project upload
- `POST /api/v1/ingest/bulk` - CSV/Excel bulk upload
- `POST /api/v1/ingest/document` - Document upload (RFPs, SOWs)
- `GET /api/v1/ingest/validate` - Validate uploaded data

**Responsibilities:**
1. Load company-specific field mapping config
2. Parse CSV/Excel/JSON into internal format
3. Validate against schema (type checking, required fields, ranges)
4. Clean and normalize:
   - Unit conversions (ft ↔ m, USD ↔ EUR)
   - Date parsing
   - Text normalization
5. Store in canonical tables
6. Trigger feature extraction pipeline (async)

**Tech Stack:**
- FastAPI for endpoints
- Pandas for data manipulation
- Pydantic for validation
- Celery/Prefect for async processing

**Error Handling:**
- Validation errors → detailed report with line numbers
- Partial failures → rollback transaction, return error manifest
- Idempotency: Use upsert based on project_id

### 2. Inference Service

**Purpose:** Generate predictions for new project scopes

**Endpoints:**
- `POST /api/v1/predict` - Main prediction endpoint
- `GET /api/v1/similar/{project_id}` - Find similar historical projects
- `GET /api/v1/explain/{prediction_id}` - Get detailed explanation
- `POST /api/v1/what-if` - Scenario analysis (adjust parameters)

**Prediction Flow:**

```python
def predict(company_id: str, project_scope: dict) -> Prediction:
    # 1. Load company's LoRA adapter
    adapter = load_lora_adapter(company_id)
    llm_model = base_llm + adapter

    # 2. Generate scope embedding
    scope_text = project_scope['description']
    embedding = llm_model.encode(scope_text)

    # 3. Extract features via LLM
    complexity = llm_model.classify_complexity(scope_text)
    risk_factors = llm_model.extract_risk_factors(scope_text)
    normalized_deliverables = llm_model.normalize_deliverables(
        project_scope['deliverables']
    )

    # 4. Build feature vector
    features = FeatureEngineer.build_features(
        embedding=embedding,
        complexity=complexity,
        risk_factors=risk_factors,
        deliverables=normalized_deliverables,
        structured_attrs=project_scope['attributes'],
        company_id=company_id
    )

    # 5. Load prediction model
    predictor = load_prediction_model(company_id)

    # 6. Predict quantiles
    cost_quantiles = predictor.predict_cost_quantiles(features)
    duration_quantiles = predictor.predict_duration_quantiles(features)

    # 7. Generate explanation
    shap_values = predictor.explain(features)
    top_drivers = get_top_drivers(shap_values)

    # 8. Find similar projects
    similar = find_similar_projects(
        embedding=embedding,
        company_id=company_id,
        top_k=5
    )

    # 9. Lookup deliverable misestimation stats
    risky_deliverables = get_risky_deliverables(
        company_id=company_id,
        deliverable_classes=normalized_deliverables
    )

    return Prediction(
        cost_p50=cost_quantiles[0.5],
        cost_p80=cost_quantiles[0.8],
        cost_p90=cost_quantiles[0.9],
        duration_p50=duration_quantiles[0.5],
        duration_p80=duration_quantiles[0.8],
        duration_p90=duration_quantiles[0.9],
        confidence=calculate_confidence(features, similar),
        top_drivers=top_drivers,
        similar_projects=similar,
        risky_deliverables=risky_deliverables
    )
```

**Performance Requirements:**
- Latency: < 3 seconds p95
- Throughput: 100+ predictions/min per GPU
- Caching: Embeddings cached for 24h

### 3. Training Service

**Purpose:** Train and update models

**Pipelines (Prefect/Airflow):**

#### `train_base_llm_adapter`
- Frequency: One-time per company at onboarding
- Input: Company's historical scope documents
- Output: LoRA adapter weights (~10-50MB)
- Steps:
  1. Load pretrained LLaMA 13B
  2. Prepare training data:
     - Scope texts + metadata (complexity, type, etc.)
     - Format as instruction-following tasks
  3. Configure LoRA (rank=16, alpha=32)
  4. Fine-tune for 3-5 epochs
  5. Validate on holdout set
  6. Save adapter to S3
  7. Update company record with adapter path

#### `train_tabular_predictor`
- Frequency: Monthly (incremental updates)
- Input: All companies' completed projects (with privacy controls)
- Output: Base prediction model + optional company-specific fine-tuned versions
- Steps:
  1. Load features from feature store
  2. Compute cost/duration ratios
  3. Train XGBoost model:
     - Objective: Quantile regression
     - Quantiles: [0.5, 0.8, 0.9]
     - Features: [embeddings, structured attrs, company_id]
  4. Evaluate on temporal holdout (last 6 months)
  5. If accuracy improved: promote to production
  6. Generate model card (metrics, feature importances)

#### `compute_misestimation_stats`
- Frequency: Weekly
- Input: Completed projects with actual costs/durations
- Output: Updated `deliverable_misestimation_stats` table
- Steps:
  1. For each company:
  2. Group deliverables by `deliverable_class`
  3. Compute:
     ```
     cost_error = (actual_cost - estimated_cost) / estimated_cost
     duration_error = (actual_duration - estimated_duration) / estimated_duration
     ```
  4. Aggregate: mean, std, count
  5. Filter for statistical significance (n >= 5)
  6. Upsert into stats table

#### `extract_features`
- Frequency: Triggered on new project ingestion
- Input: Project record
- Output: Row in `project_features` table
- Steps:
  1. Generate scope embedding via LLM
  2. Normalize deliverables
  3. Compute aggregated features:
     - Counts by discipline
     - Complexity scores
     - Location one-hot encodings
     - Temporal features (season, year)
  4. Lookup historical similar projects
  5. Compute similarity-weighted average ratios
  6. Store features

### 4. LLM Service (vLLM)

**Purpose:** High-performance LLM inference with LoRA support

**Implementation:**
```python
from vllm import LLM, SamplingParams
from vllm.lora.request import LoRARequest

# Load base model at startup
llm = LLM(
    model="meta-llama/Llama-2-13b-hf",
    tensor_parallel_size=1,
    enable_lora=True,
    max_lora_rank=16
)

# Register company LoRA adapters
company_adapters = {
    "company_abc": LoRARequest("company_abc", 1, "/models/lora/company_abc"),
    "company_xyz": LoRARequest("company_xyz", 2, "/models/lora/company_xyz"),
}

def generate(company_id: str, prompt: str):
    lora_request = company_adapters.get(company_id)
    outputs = llm.generate(
        [prompt],
        sampling_params=SamplingParams(temperature=0.1, max_tokens=512),
        lora_request=lora_request
    )
    return outputs[0].outputs[0].text
```

**LoRA Adapter Hot-Swapping:**
- Adapters loaded on-demand (lazy loading)
- LRU cache for most frequently used adapters (top 20 companies)
- Cold adapter load time: ~200ms
- Warm adapter switch time: ~5ms

**Batching:**
- Group requests from same company → single batch
- Continuous batching for mixed-company requests
- Max batch size: 32

### 5. Feature Store

**Purpose:** Consistent features for training and inference

**Options:**
- **Option A (MVP):** Materialized view in Postgres (`project_features` table)
- **Option B (Scale):** Feast feature store

**Feature Groups:**

#### Project-Level Features
- `scope_embedding` (768-dim vector from LLaMA)
- `complexity_score` (0.0 - 1.0)
- `risk_score` (0.0 - 1.0)
- `num_deliverables` (count)
- `num_disciplines` (unique disciplines)
- `share_concrete_pct`, `share_steel_pct`, etc. (deliverable composition)
- `location_*` (one-hot encoded location features)
- `temporal_*` (season, year, market indices)

#### Historical Features
- `historical_similar_avg_cost_ratio` (avg cost ratio of top-10 similar projects)
- `historical_similar_avg_duration_ratio`
- `company_avg_cost_ratio` (company's overall average)

#### Deliverable Risk Features
- `num_high_risk_deliverables` (count of deliverable classes with avg_cost_error > 20%)
- `expected_underestimation_pct` (weighted by deliverable counts)

**Feature Engineering Pipeline:**
```python
class FeatureEngineer:
    def build_features(
        self,
        embedding: np.ndarray,
        complexity: float,
        risk_factors: List[str],
        deliverables: List[Dict],
        structured_attrs: Dict,
        company_id: str
    ) -> np.ndarray:

        # Aggregate deliverable features
        deliverable_features = self._aggregate_deliverables(deliverables)

        # One-hot encode categoricals
        location_features = self._encode_location(structured_attrs['location'])
        contract_features = self._encode_contract(structured_attrs['contract_type'])

        # Temporal features
        temporal_features = self._encode_temporal(structured_attrs['start_date'])

        # Historical features
        historical_features = self._lookup_historical(
            company_id=company_id,
            deliverable_classes=[d['class'] for d in deliverables]
        )

        # Company features
        company_embedding = self._get_company_embedding(company_id)

        # Concatenate all
        return np.concatenate([
            embedding,                  # 768
            [complexity],              # 1
            deliverable_features,      # ~20
            location_features,         # ~50
            contract_features,         # ~5
            temporal_features,         # ~12
            historical_features,       # ~10
            company_embedding          # 32
        ])  # Total: ~900 features
```

## Data Flow Diagrams

### Onboarding Flow
```
Client provides data
        ↓
Upload to Ingestion Service
        ↓
Parse & validate against schema
        ↓
Apply company field mapping
        ↓
Store in canonical tables (projects, deliverables)
        ↓
Trigger feature extraction (async)
        ↓
LLM generates embeddings & normalizes text
        ↓
Compute project-level features
        ↓
Store in feature store
        ↓
Trigger model training
        ↓
Train LoRA adapter (LLM)
        ↓
Fine-tune tabular predictor
        ↓
Evaluate on holdout
        ↓
Deploy to production (update company record)
```

### Prediction Flow
```
User enters project scope
        ↓
POST /api/v1/predict
        ↓
Load company LoRA adapter
        ↓
Generate scope embedding (LLM)
        ↓
Extract features (LLM: complexity, risks, normalized deliverables)
        ↓
Build feature vector
        ↓
Load prediction model
        ↓
Predict cost & duration quantiles
        ↓
Compute SHAP explanations
        ↓
Find similar projects (vector similarity)
        ↓
Lookup deliverable misestimation stats
        ↓
Return prediction + explanations
        ↓
Log to predictions table (for audit & retraining)
```

## Multi-Tenancy & Security

### Data Isolation
- **Database:** Row-level security via `company_id` foreign key
- **Storage:** Object keys prefixed with `company_id/`
- **Models:** Separate LoRA adapters per company
- **API:** JWT contains `company_id` claim, enforced at middleware layer

### Security Measures
- **Authentication:** JWT tokens (15min expiry) + refresh tokens (30 days)
- **Authorization:** Role-based access control (admin, estimator, viewer)
- **Encryption:**
  - At rest: PostgreSQL transparent encryption, S3 server-side encryption
  - In transit: TLS 1.3 for all external communication
- **Secrets:** Stored in AWS Secrets Manager / HashiCorp Vault
- **Audit Logging:** All API calls logged with user_id, company_id, timestamp

### Compliance Considerations
- **SOC 2 Type II:** Target for enterprise tier
- **GDPR:** Data retention policies, right to deletion
- **Data Residency:** Option for region-specific deployments (EU, US)

## Scaling Strategy

### Horizontal Scaling
- **API Gateway:** Stateless, auto-scale based on CPU
- **Inference Service:** Stateless, GPU-based scaling
- **Database:** Read replicas for analytics queries
- **Object Storage:** S3 scales automatically

### GPU Scaling
- **Single A10G GPU:** Can serve ~10-20 companies via adapter swapping
- **Multi-GPU:** Use tensor parallelism for base model, partition adapters
- **Cost Optimization:**
  - Spot instances for training
  - Reserved instances for inference
  - Auto-scale down during off-hours

### Caching Strategy
- **Embeddings:** Redis cache (TTL: 24h)
- **Predictions:** Cache identical requests (TTL: 1h)
- **Model Artifacts:** Local SSD cache on inference nodes

## Monitoring & Observability

### Metrics
- **System Metrics:**
  - API latency (p50, p95, p99)
  - GPU utilization
  - Database connection pool usage
  - Cache hit rates
- **Business Metrics:**
  - Predictions per day per company
  - Active users per company
  - Prediction accuracy (MAE, RMSE) tracked over time
- **ML Metrics:**
  - Feature drift detection
  - Model prediction distribution shifts
  - Calibration (predicted quantiles vs actuals)

### Logging
- **Structured Logging:** JSON format with trace IDs
- **Log Aggregation:** ELK stack or CloudWatch
- **Levels:**
  - DEBUG: Feature values, model inputs
  - INFO: API requests, prediction results
  - WARN: Validation failures, missing data
  - ERROR: Exceptions, model load failures

### Alerting
- **Critical:**
  - API down (> 1 min)
  - Database connection failures
  - GPU OOM errors
- **Warning:**
  - Latency degradation (p95 > 5s)
  - Accuracy drop (MAE increase > 10%)
  - High error rates (> 5%)

## Disaster Recovery

### Backup Strategy
- **Database:** Daily full backups, continuous WAL archiving (PITR)
- **Object Storage:** Versioning enabled, cross-region replication
- **Models:** All training artifacts versioned in MLflow

### Recovery Procedures
- **Database Failure:** Promote read replica to primary (~5 min RTO)
- **Service Failure:** Auto-restart via Kubernetes (< 1 min)
- **Region Failure:** Failover to secondary region (target: 15 min RTO)

---

## Technology Choices - Rationale

| Component | Choice | Why? |
|-----------|--------|------|
| **LLM** | LLaMA 13B | Open source, good performance, supports LoRA |
| **LLM Serving** | vLLM | Fastest inference, native LoRA support, continuous batching |
| **Tabular ML** | XGBoost | Best for tabular data, fast, quantile regression support |
| **Database** | PostgreSQL 15+ | Robust, pgvector for embeddings, JSONB for flexibility |
| **Vector DB** | pgvector | Avoid separate service, 90% as good as Pinecone for our scale |
| **Object Storage** | MinIO/S3 | Industry standard, cheap, scalable |
| **API Framework** | FastAPI | Modern, async, auto-docs, type safety |
| **Orchestration** | Prefect | Python-native, better UX than Airflow |
| **Frontend** | Next.js | SSR, great DX, Vercel deployment |
| **Deployment** | Kubernetes | Container orchestration, auto-scaling, industry standard |

---

## Next: Implementation Roadmap

See `PLAN.md` Section 8 for detailed implementation phases.
