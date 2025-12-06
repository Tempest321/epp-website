# Engineering Project Predictions (EPP) - Master Plan

## Executive Summary

EPP is an AI-powered SaaS platform that provides construction and engineering companies with dramatically more accurate project cost and schedule estimates by learning from their historical project data. The system combines LLaMA 13B for understanding unstructured project scopes with specialized ML models for numeric prediction, using parameter-efficient fine-tuning to create company-specific "equation weights" that capture each organization's unique patterns of estimation error.

**Key Innovation:** Instead of replacing human judgment, EPP reveals systematic biases in estimation—which deliverables are chronically under-estimated (causing overruns) and which are over-estimated (leaving margin on the table).

**Business Model:** Multi-tenant SaaS with repeatable onboarding. Each new client requires minimal custom engineering due to canonical data schema and adapter-based model personalization.

---

## 1. Product Vision & Core Value Proposition

### 1.1 The Problem
- Construction/engineering projects routinely exceed budgets by 20-80%
- Schedule delays are even more common
- Human estimators have systematic blind spots specific to each company
- No feedback loop to learn from past estimation errors

### 1.2 The Solution
EPP transforms a company's historical project data into a personalized prediction engine that:
- Outputs **P50/P80/P90 cost and schedule estimates** (not single numbers)
- Identifies **which deliverables are systematically mis-estimated**
- Provides **confidence intervals and risk decomposition**
- **Learns continuously** as new projects complete

### 1.3 Core Outputs (For Any New Project Scope)

**Primary:**
1. **Estimated Project Cost**
   - P50 (median), P80, P90 values
   - Confidence bands
   - Cost breakdown by deliverable category

2. **Estimated Project Schedule**
   - Total duration + key milestone dates
   - P50/P80/P90 duration distributions
   - Critical path risk factors

**Explanatory:**
3. **Misestimation Analytics**
   - Top 10 deliverables this company under-estimates
   - Top 10 deliverables this company over-estimates
   - Contributing factors (location, season, complexity, etc.)

4. **Similar Projects**
   - Top-K analogous past projects (via embedding similarity)
   - Their actual vs estimated performance

---

## 2. Technical Architecture (Hybrid LLM + Tabular ML)

### 2.1 Why Not LLaMA Alone?

**Problem:** LLMs are poor at precise numeric reasoning and regression tasks.

**Solution:** Use LLaMA 13B for what it's good at (understanding messy text), then feed structured features into specialized ML models for prediction.

### 2.2 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     INPUT LAYER                             │
│  • Project scope documents (RFPs, SOWs, proposals)          │
│  • Structured attributes (location, type, size)             │
│  • Line-item deliverables (descriptions + quantities)       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              SCOPE UNDERSTANDING MODULE                     │
│                   (LLaMA 13B + LoRA)                        │
│                                                             │
│  Base Model: LLaMA 13B (shared, frozen)                    │
│  Per-Company: LoRA adapters (~10-50MB each)                │
│                                                             │
│  Tasks:                                                     │
│  1. Generate project embedding                             │
│  2. Extract complexity score                               │
│  3. Identify risk factors                                  │
│  4. Normalize deliverable descriptions → standard classes  │
│  5. Extract implicit requirements from text                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   FEATURE ENGINEERING                       │
│                                                             │
│  Combine:                                                   │
│  • LLM embeddings (768-dim vectors)                        │
│  • Structured attributes (location, type, size, etc.)      │
│  • Aggregated deliverable features:                        │
│    - Count by standard class                               │
│    - Historical error rates per class                      │
│    - Complexity distribution                               │
│  • Temporal features (season, year, market conditions)     │
│  • Company-specific features (size, region, specialization)│
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│           COST & SCHEDULE PREDICTION MODELS                 │
│              (XGBoost / LightGBM / Neural Net)              │
│                                                             │
│  Two-head model (or two separate models):                  │
│                                                             │
│  Head 1: Cost Prediction                                   │
│    Input: Feature vector                                   │
│    Output: [Q50_cost, Q80_cost, Q90_cost]                 │
│            + variance estimates                             │
│                                                             │
│  Head 2: Schedule Prediction                               │
│    Input: Feature vector                                   │
│    Output: [Q50_duration, Q80_duration, Q90_duration]      │
│            + critical path risk scores                      │
│                                                             │
│  Training Strategy:                                         │
│    • Base model: Trained on multi-company anonymized data  │
│    • Company-specific: Fine-tuned or mixed-effects model   │
│      with company_id as categorical feature                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  EXPLAINABILITY LAYER                       │
│                                                             │
│  • SHAP values for feature importance                      │
│  • Deliverable-level misestimation lookup                  │
│  • Risk factor decomposition                               │
│  • Similar project retrieval (cosine similarity in         │
│    embedding space)                                         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    OUTPUT LAYER                             │
│  • Cost estimate (P50/P80/P90 + confidence intervals)      │
│  • Schedule estimate (durations + milestone predictions)   │
│  • Top risk factors and drivers                            │
│  • Deliverables likely under/over-estimated                │
│  • Comparable historical projects                          │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Parameter-Efficient Fine-Tuning (The "Skim Difference Method")

**Core Insight:** Instead of training separate 13B models for each company (infeasible), we use LoRA (Low-Rank Adaptation):

**Base Model (Shared):**
- LLaMA 13B weights (~26GB)
- Frozen during company-specific training
- Loaded once in GPU memory

**Per-Company Adapters:**
- LoRA rank-16 adapters (~10-50MB per company)
- Captures company-specific vocabulary, document styles, project types
- Hot-swappable at inference time

**At Inference:**
```python
# Load base model once (startup)
base_model = load_llama_13b()

# For company X's request:
adapter_x = load_lora_adapter(company_id="company_x")
model = base_model + adapter_x  # Merge is cheap
output = model.encode(project_scope)

# For company Y's next request:
adapter_y = load_lora_adapter(company_id="company_y")
model = base_model + adapter_y
output = model.encode(project_scope)
```

**Benefits:**
- **Storage:** 26GB base + (50MB × N companies) vs (26GB × N companies)
- **Training:** Fine-tune only ~0.5% of parameters per company
- **Serving:** Single GPU can serve many companies
- **Economics:** Makes multi-tenant profitable

**Implementation:**
- Use Hugging Face PEFT library
- LoRA rank: 8-16 (experiment)
- Target modules: query, value projection layers
- Training: 500-2000 examples sufficient for adapter

### 2.4 Tabular Prediction Model Strategy

**Why Not Company-Specific Models?**
Early-stage companies may have only 20-100 projects. Not enough for deep learning.

**Solution: Hierarchical Mixed-Effects Approach**

**Option A: Single Model with Company Embeddings**
```
Features = [
    project_features,        # 100-200 dims
    llm_embedding,          # 768 dims
    company_embedding       # 32 dims (learned)
]
→ XGBoost/LightGBM → [cost_q50, cost_q80, cost_q90, duration_q50, ...]
```

**Option B: Transfer Learning**
1. Train base model on all companies' data
2. Fine-tune final layers on company-specific data with small learning rate
3. Store company-specific checkpoint (only last 2-3 layers)

**Recommended: Option A for MVP** (simpler deployment)

**Training Targets:**
Don't predict raw costs (scale varies wildly). Predict **ratios**:
```
cost_ratio = actual_cost / baseline_cost
duration_ratio = actual_duration / baseline_duration
```

Where `baseline` is either:
- The company's human estimate (if available)
- A simple parametric model ($/sqft × sqft)

**Why?** Ratios normalize across project scales and let the model learn: "Hospital projects run 1.3x over budget, industrial 0.95x"

---

## 3. Data Schema Design (Canonical Schema)

### 3.1 Philosophy
Every client maps their data → our canonical schema. This is non-negotiable for scaling.

### 3.2 Core Tables

#### `projects`
```sql
project_id              TEXT PRIMARY KEY
company_id              TEXT NOT NULL
project_name            TEXT
sector                  TEXT  -- industrial, commercial, infrastructure, etc.
project_type            TEXT  -- plant, road, bridge, building, pipeline, etc.
location_country        TEXT
location_region         TEXT
location_climate        TEXT  -- tropical, temperate, arctic, arid
location_urban_rural    TEXT
contract_type           TEXT  -- lump_sum, time_materials, gmp, cost_plus
project_size_primary    FLOAT -- primary quantity (sqft, linear_ft, tonnage, etc.)
project_size_unit       TEXT
estimated_cost_total    FLOAT -- company's original estimate
actual_cost_total       FLOAT -- final actual (NULL if ongoing)
estimated_duration_days INT
actual_duration_days    INT   -- NULL if ongoing
baseline_cost           FLOAT -- parametric baseline for ratio calculation
start_date              DATE
end_date                DATE  -- NULL if ongoing
complexity_score        FLOAT -- model-generated or human-input
scope_text              TEXT  -- concatenated scope documents
scope_embedding         VECTOR(768) -- generated by LLaMA
```

#### `deliverables` (line items / work packages)
```sql
deliverable_id          TEXT PRIMARY KEY
project_id              TEXT REFERENCES projects(project_id)
line_number             INT
description_raw         TEXT  -- original text from BOQ/SOW
description_normalized  TEXT  -- standardized via LLaMA
deliverable_class       TEXT  -- mapped to standard taxonomy
discipline              TEXT  -- civil, structural, mechanical, electrical, etc.
quantity                FLOAT
unit                    TEXT  -- sqft, lf, ea, tons, hours
estimated_cost          FLOAT
actual_cost             FLOAT -- NULL if not tracked at line level
estimated_duration      INT   -- days
actual_duration         INT
embedding               VECTOR(768)
```

#### `deliverable_classes` (master taxonomy)
```sql
class_id                TEXT PRIMARY KEY
class_name              TEXT  -- "Concrete Foundation - Industrial Equipment"
discipline              TEXT
typical_units           TEXT[]
avg_cost_per_unit       FLOAT -- across all companies (anonymized benchmark)
```

#### `documents`
```sql
document_id             TEXT PRIMARY KEY
project_id              TEXT REFERENCES projects(project_id)
doc_type                TEXT  -- rfp, sow, proposal, drawings, specs
file_path               TEXT
text_content            TEXT  -- extracted via OCR/parsing
upload_date             TIMESTAMP
```

#### `execution_signals` (optional, powerful)
```sql
signal_id               TEXT PRIMARY KEY
project_id              TEXT REFERENCES projects(project_id)
signal_type             TEXT  -- change_order, rfi, rework, delay_event
date                    DATE
description             TEXT
cost_impact             FLOAT
schedule_impact_days    INT
```

#### `companies` (multi-tenant)
```sql
company_id              TEXT PRIMARY KEY
company_name            TEXT
industry_focus          TEXT[]
regions_active          TEXT[]
avg_project_size        FLOAT
model_version_id        TEXT  -- which model checkpoint
lora_adapter_path       TEXT  -- path to company's LoRA weights
onboarding_date         DATE
subscription_tier       TEXT
```

### 3.3 Feature Store Schema

Precomputed features for fast inference:

#### `project_features`
```sql
project_id              TEXT PRIMARY KEY
scope_embedding         VECTOR(768)
complexity_score        FLOAT
risk_score              FLOAT
num_deliverables        INT
num_disciplines         INT
num_high_risk_items     INT
share_concrete_pct      FLOAT
share_steel_pct         FLOAT
-- ... more aggregated features
location_onehot         JSONB
season_start            TEXT
historical_similar_avg_cost_ratio FLOAT
historical_similar_avg_duration_ratio FLOAT
```

---

## 4. Model Training Strategy

### 4.1 Phase 1: Base Models (Multi-Company)

**Scope Understanding (LLaMA 13B):**
1. Start with pretrained LLaMA 13B
2. Optional: Further pretrain on public construction documents (RFPs, specs) using unsupervised learning
3. Fine-tune on multi-company dataset for:
   - Classification: project_type, sector, complexity
   - NER: Extract entities (equipment, materials, locations)
   - Embedding: Generate meaningful representations

**Cost/Schedule Prediction:**
1. Aggregate anonymized data from all companies
2. Train base XGBoost/LightGBM model with:
   - Input: [project_features, scope_embedding, company_id_onehot]
   - Output: [cost_q50, cost_q80, cost_q90, duration_q50, duration_q80, duration_q90]
3. Use quantile regression loss
4. Validate with temporal split (train on years 1-4, test on year 5)

### 4.2 Phase 2: Company-Specific Fine-Tuning

**For Each New Company:**

**Step 1: LoRA Adapter Training (LLaMA)**
```python
from peft import LoRA, get_peft_model

# Load base model
base_model = AutoModelForCausalLM.from_pretrained("llama-13b")

# Configure LoRA
lora_config = LoRAConfig(
    r=16,                    # rank
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
)

# Create adapter
model = get_peft_model(base_model, lora_config)

# Fine-tune on company's scope documents
trainer.train(
    model=model,
    dataset=company_scope_dataset,  # 500-2000 examples
    epochs=3-5
)

# Save adapter (only ~10-50MB)
model.save_adapter(f"adapters/company_{company_id}")
```

**Step 2: Tabular Model Personalization**

**Option A: Company-Specific Feature Engineering**
- Add features: `historical_error_by_deliverable_class` (company-specific)
- Retrain base model with company's data weighted 10x
- Save as `models/company_{company_id}_predictor.pkl`

**Option B: Ensemble**
- Keep base model
- Train small company-specific model
- Final prediction = 0.7 × base + 0.3 × company_specific

**Recommended: Option A for MVP**

### 4.3 Deliverable Misestimation Analytics

For each company, compute:

```python
# Group by normalized deliverable class
misestimation_stats = deliverables.groupby('deliverable_class').agg({
    'cost_error': ['mean', 'std', 'count'],
    'duration_error': ['mean', 'std', 'count']
})

# Filter for statistical significance
significant = misestimation_stats[misestimation_stats['count'] >= 5]

# Identify systematic biases
underestimated = significant[significant['cost_error_mean'] > 0.15].sort_values('cost_error_mean', ascending=False)
overestimated = significant[significant['cost_error_mean'] < -0.10].sort_values('cost_error_mean')
```

Store in:
```sql
deliverable_misestimation_stats
    company_id
    deliverable_class
    avg_cost_error
    avg_duration_error
    sample_size
    last_updated
```

Use this table:
- As features in prediction model
- For UI display ("⚠️ This project contains 12 instances of 'Electrical Switchgear Installation', which your company typically underestimates by 22%")

---

## 5. System Components & Tech Stack

### 5.1 Recommended Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **API Server** | FastAPI (Python) | Async, OpenAPI docs, type hints |
| **Database** | PostgreSQL 15+ with pgvector | JSONB + vector similarity search |
| **Object Storage** | MinIO / S3 | Documents, model artifacts |
| **LLM Serving** | vLLM | Fast inference, batching, LoRA support |
| **Tabular ML** | XGBoost / LightGBM | Best for tabular data, fast inference |
| **Feature Store** | Feast (or custom) | Consistent features train/serve |
| **Orchestration** | Prefect | Modern, Python-native, good UI |
| **ML Tracking** | MLflow | Experiment tracking, model registry |
| **Vector Search** | pgvector or Qdrant | Similar project lookup |
| **Frontend** | Next.js + React | SSR, TypeScript, good DX |
| **UI Components** | shadcn/ui + Tailwind | Modern, accessible |
| **Auth** | Auth0 or Supabase Auth | Multi-tenant, SSO support |
| **Deployment** | Docker + Kubernetes | Scalability, resource isolation |
| **GPU Inference** | NVIDIA T4 or A10G | Cost-effective for LLaMA 13B |

### 5.2 Service Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Web Application                   │
│              (Next.js + React + Tailwind)           │
└─────────────────────────────────────────────────────┘
                         ↓ HTTPS
┌─────────────────────────────────────────────────────┐
│                    API Gateway                      │
│         (FastAPI - Authentication, Routing)         │
└─────────────────────────────────────────────────────┘
          ↓                ↓                ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Ingestion  │  │  Inference   │  │   Training   │
│   Service    │  │   Service    │  │   Service    │
└──────────────┘  └──────────────┘  └──────────────┘
          ↓                ↓                ↓
┌─────────────────────────────────────────────────────┐
│              LLM Service (vLLM)                     │
│     LLaMA 13B + LoRA Adapter Hot-Swapping          │
└─────────────────────────────────────────────────────┘
          ↓                ↓                ↓
┌─────────────────────────────────────────────────────┐
│   PostgreSQL (Projects, Deliverables, Features)    │
│   + pgvector (Embeddings, Similarity Search)        │
└─────────────────────────────────────────────────────┘
          ↓                ↓                ↓
┌─────────────────────────────────────────────────────┐
│      Object Storage (Documents, Model Artifacts)    │
│              MinIO / S3 Compatible                  │
└─────────────────────────────────────────────────────┘
```

### 5.3 Key Services Detail

#### Ingestion Service
- **Endpoints:**
  - `POST /ingest/project` - Upload single project
  - `POST /ingest/bulk` - Upload CSV/Excel
  - `POST /ingest/document` - Upload scope docs
- **Responsibilities:**
  - Validate against canonical schema
  - Apply company-specific field mappings
  - Clean and normalize units
  - Trigger feature extraction pipeline

#### Inference Service
- **Endpoints:**
  - `POST /predict` - Main prediction endpoint
  - `GET /similar-projects/{project_id}` - Find analogous projects
  - `GET /explain/{prediction_id}` - Get SHAP explanations
- **Flow:**
  1. Load company's LoRA adapter
  2. Generate scope embedding via LLaMA
  3. Fetch precomputed features from feature store
  4. Run prediction model
  5. Lookup deliverable misestimation stats
  6. Return JSON response

#### Training Service
- **Orchestrated Pipelines (Prefect):**
  - `train_base_models` - Weekly/monthly retrain on all data
  - `train_company_adapter` - Triggered on new company onboarding
  - `incremental_update` - Monthly update with new completed projects
- **Outputs:**
  - Model artifacts → S3
  - Metrics → MLflow
  - Update model registry

---

## 6. Repeatable Onboarding Pipeline

### 6.1 Onboarding Checklist (Target: 2-4 Weeks)

**Week 1: Data Collection & Mapping**
- [ ] Client provides historical data (min 50 projects, ideally 100+)
- [ ] Initial data quality assessment
- [ ] Create company-specific field mapping config
- [ ] Map their taxonomy → canonical deliverable classes

**Week 2: ETL & Validation**
- [ ] Run ETL pipeline
- [ ] Automated validation (missing values, outliers, unit consistency)
- [ ] Manual QA on sample projects
- [ ] Generate data quality report

**Week 3: Model Training**
- [ ] Train LoRA adapter on scope documents
- [ ] Fine-tune/retrain tabular model with company data
- [ ] Compute deliverable misestimation statistics
- [ ] Generate baseline embeddings for all historical projects

**Week 4: Calibration & Deployment**
- [ ] Benchmark: Model predictions vs human estimates on holdout set
- [ ] Calibration report (MAE, RMSE, coverage of confidence intervals)
- [ ] Deploy company's models to production
- [ ] Onboarding call: Demo UI, train users
- [ ] Set up feedback loop (monthly data refresh)

### 6.2 Technical Onboarding Automation

**Config-Driven Approach:**

Each company gets a config file: `config/company_abc.yaml`

```yaml
company_id: "company_abc"
company_name: "ABC Construction"

# Field mapping (their columns → canonical schema)
field_mapping:
  projects:
    "Project ID": "project_id"
    "Job Name": "project_name"
    "Contract Value": "estimated_cost_total"
    "Final Cost": "actual_cost_total"
    "Start": "start_date"
    "Completion": "end_date"
    # ...

  deliverables:
    "Line": "line_number"
    "Description": "description_raw"
    "Qty": "quantity"
    "Unit": "unit"
    # ...

# Unit conversions
unit_conversions:
  cost: "USD"  # convert all to USD
  length: "ft" # convert all to feet

# Custom taxonomy mappings
taxonomy_overrides:
  "Pour concrete slab": "Concrete Foundation - General"
  "Install MCC": "Electrical Switchgear Installation"

# Model hyperparameters (optional overrides)
model_config:
  lora_rank: 16
  lora_alpha: 32
  xgboost_max_depth: 8
```

**Automated ETL Script:**

```bash
python scripts/onboard_company.py \
  --config config/company_abc.yaml \
  --data-dir /uploads/company_abc/ \
  --output-dir /processed/company_abc/
```

This script:
1. Loads config
2. Reads CSV/Excel files
3. Applies field mappings
4. Validates data
5. Generates canonical tables
6. Triggers model training pipeline
7. Outputs onboarding report

---

## 7. Feature Roadmap

### MVP (Phase 1) - Core Prediction Engine
- [ ] Data ingestion pipeline
- [ ] LLaMA-based scope understanding
- [ ] Cost & schedule prediction (P50/P80/P90)
- [ ] Basic web UI for single project estimation
- [ ] Single-company deployment

### Phase 2 - Multi-Tenant & Analytics
- [ ] Multi-company support with LoRA adapters
- [ ] Deliverable misestimation analytics dashboard
- [ ] Similar projects finder
- [ ] Confidence interval calibration
- [ ] Onboarding automation

### Phase 3 - Advanced Features
- [ ] **What-If Scenario Analysis**
  - Sliders: Adjust location, timeline, design complexity
  - Real-time cost/schedule recalculation
- [ ] **Risk Decomposition**
  - Break down variance by: weather, labor, supply chain, design changes
  - Monte Carlo simulation for schedule risk
- [ ] **Explainability**
  - SHAP force plots
  - "Why is this estimate higher than similar projects?"
- [ ] **Analogous Project Deep Dive**
  - Click on similar project → see full details, lessons learned
- [ ] **Integration APIs**
  - Plugin for Excel (estimators' primary tool)
  - API for ERP systems (SAP, Oracle, Procore)
  - Webhooks for project updates

### Phase 4 - Continuous Learning
- [ ] **Active Learning**
  - Flag high-uncertainty predictions for human review
  - Prioritize projects for more detailed data collection
- [ ] **Automated Retraining**
  - Monthly: Ingest newly completed projects
  - Incremental model updates
  - A/B testing of model versions
- [ ] **Benchmark Reporting**
  - Quarterly exec report: Estimation accuracy trends
  - Industry benchmarks (anonymized multi-company stats)

---

## 8. Implementation Phases (Concrete Timeline)

### Phase 0: Foundation (Weeks 1-4)
**Goal:** Lock in architecture, schema, tech stack, and development environment.

**Deliverables:**
- [ ] Finalize canonical data schema (SQL DDL)
- [ ] Set up development environment (Docker Compose: Postgres, MinIO, Prefect)
- [ ] Skeleton services (FastAPI boilerplate, vLLM server config)
- [ ] Sample dataset (10 synthetic projects for testing)
- [ ] CI/CD pipeline (GitHub Actions: lint, test, build)

**Team:**
- 1 ML Engineer
- 1 Backend Engineer

### Phase 1: Single-Company MVP (Weeks 5-14)
**Goal:** End-to-end working system for one friendly pilot client.

**Deliverables:**
- [ ] ETL pipeline for client's data
- [ ] LLaMA scope understanding:
  - Generate embeddings
  - Extract complexity score
  - Normalize deliverable descriptions
- [ ] Tabular prediction model:
  - Train XGBoost for cost/schedule
  - Quantile regression outputs
- [ ] Basic inference API:
  - `POST /predict` endpoint
  - Returns cost/schedule with confidence intervals
- [ ] Simple web UI:
  - Input: Project scope text + basic fields
  - Output: Prediction + top 5 similar projects
- [ ] Evaluation report:
  - MAE, RMSE on holdout set
  - Compare model vs human estimates

**Team:**
- 2 ML Engineers
- 1 Backend Engineer
- 1 Frontend Engineer (weeks 11-14)

**Key Risks:**
- Client data quality issues (mitigate: extensive validation scripts)
- LLaMA inference speed (mitigate: vLLM, batching)
- Model accuracy not exceeding human baseline (mitigate: iterative feature engineering)

### Phase 2: Multi-Tenant Platform (Weeks 15-24)
**Goal:** Onboard 2-3 additional clients with minimal custom work.

**Deliverables:**
- [ ] Multi-tenancy infrastructure:
  - Row-level security in Postgres
  - Company-scoped API endpoints
  - Separate LoRA adapters per company
- [ ] Mapping UI:
  - Web tool for clients to map their fields → canonical schema
  - Save as YAML config
- [ ] Automated onboarding pipeline:
  - `onboard_company.py` script
  - Data validation reports
  - Automated model training trigger
- [ ] Deliverable misestimation analytics:
  - Compute stats per company
  - Dashboard showing top under/over-estimated classes
- [ ] Enhanced UI:
  - Company switcher
  - Historical projects browser
  - Misestimation insights page

**Team:**
- 2 ML Engineers
- 2 Backend Engineers
- 1 Frontend Engineer
- 1 DevOps/MLOps Engineer

**Key Risks:**
- Adapter swapping complexity (mitigate: extensive integration tests)
- Data privacy/security (mitigate: SOC 2 compliance checklist, encryption at rest)

### Phase 3: Advanced Features & Optimization (Weeks 25-36)
**Goal:** Differentiate with advanced analytics and integrations.

**Deliverables:**
- [ ] What-if scenario analysis
- [ ] Risk decomposition (SHAP-based)
- [ ] Excel plugin (VBA or JS add-in)
- [ ] API integrations (Procore, Autodesk Build)
- [ ] Exec-level reporting (PDF quarterly reports)
- [ ] Performance optimization:
  - Model quantization (INT8)
  - Caching layer for embeddings
  - Horizontal scaling for inference service

**Team:**
- 1 ML Engineer (advanced features)
- 2 Backend Engineers (integrations, optimization)
- 1 Frontend Engineer (dashboards, reports)
- 1 DevOps Engineer (scaling, monitoring)

### Phase 4: Production Hardening & Scale (Weeks 37-48)
**Goal:** Bulletproof system for 10+ clients, public launch.

**Deliverables:**
- [ ] Comprehensive monitoring:
  - Prediction latency, accuracy drift
  - Data quality metrics
  - Business metrics (usage, accuracy improvement)
- [ ] Automated testing:
  - Integration tests for all API endpoints
  - Regression tests for model predictions
- [ ] Security audit & compliance:
  - Penetration testing
  - SOC 2 Type II certification
- [ ] Documentation:
  - API docs (OpenAPI/Swagger)
  - User guides
  - Onboarding playbooks
- [ ] Sales enablement:
  - Demo environment
  - ROI calculator
  - Case studies

**Team:**
- Full team + 1 Technical Writer + 1 QA Engineer

---

## 9. Business Model & Scaling Strategy

### 9.1 Pricing Model

**Tiered SaaS:**

| Tier | Annual Contract | Projects/Year | Users | Features |
|------|----------------|---------------|-------|----------|
| **Starter** | $50k | Up to 50 | 5 | Basic prediction, 1 year history |
| **Professional** | $150k | Up to 200 | 15 | + Misestimation analytics, What-if analysis |
| **Enterprise** | $500k+ | Unlimited | Unlimited | + API access, Dedicated support, Custom integrations |

**Value Proposition:**
- If EPP reduces estimation error by just 5% on a $100M/year portfolio → $5M saved
- ROI: 10-100x the subscription cost

### 9.2 Unit Economics

**Per-Company Costs:**
- GPU inference: $200-500/month (amortized across companies via adapter swapping)
- Storage: $50/month (documents, embeddings)
- Database: $100/month (managed Postgres)
- **Total variable cost: ~$350-650/month per company**

**Gross Margin:**
- Starter tier: ~90% ($4k/mo cost, $4.2k/mo revenue)
- Professional: ~95% ($650/mo cost, $12.5k/mo revenue)

**Scaling:**
- Single GPU (A10G) can serve ~10-20 companies with adapter swapping
- Horizontal scaling: Add GPUs as needed

### 9.3 Go-To-Market

**Phase 1: Pilot (3 companies)**
- Direct sales to existing network
- Heavy onboarding support
- Gather testimonials

**Phase 2: Early Adopters (10 companies)**
- Target: Mid-size construction firms ($50M-500M revenue)
- Channel: Industry conferences, trade publications
- Positioning: "AI Copilot for Estimators"

**Phase 3: Scale (50+ companies)**
- Self-service onboarding for Starter tier
- Partnerships with ERP vendors (Procore, Viewpoint)
- Industry-specific variants (heavy civil, industrial, commercial)

---

## 10. Key Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Insufficient training data from clients** | High | Medium | Require minimum 50 projects; offer data augmentation; start with larger clients |
| **Model accuracy doesn't beat humans** | High | Medium | Iterative feature engineering; hybrid human-AI workflow; focus on confidence intervals not just point estimates |
| **LLaMA inference too slow/expensive** | Medium | Low | Use vLLM, quantization (INT8/INT4), smaller model (7B), or distillation |
| **Data privacy concerns** | High | Medium | SOC 2, encryption, air-gapped deployments for sensitive clients |
| **Client adoption resistance** | Medium | High | Position as "Copilot" not replacement; show ROI clearly; Excel integration for familiarity |
| **Adapter swapping complexity** | Medium | Medium | Extensive testing; fallback to base model; monitoring |
| **Competitors (traditional software or other AI startups)** | Medium | High | Speed to market; deep domain expertise; superior UX |

---

## 11. Success Metrics

### Technical Metrics
- **Prediction Accuracy:**
  - MAE on cost estimation < 10% (vs 20-30% human baseline)
  - P80 coverage: 80% of actual costs fall within predicted P80 band
- **Inference Latency:** < 3 seconds for full prediction
- **Uptime:** 99.9% for inference API

### Business Metrics
- **Time to Onboard:** < 4 weeks per new client
- **Customer Satisfaction:** NPS > 50
- **Usage:** Avg 10+ predictions per user per week
- **Retention:** 90%+ annual renewal rate
- **Expansion:** 30% of clients upgrade tier within first year

### Product Metrics
- **Accuracy Improvement:** Demonstrate 40-60% reduction in estimation error vs human baseline
- **Margin Recovery:** Identify $500k-5M in over-estimated deliverables per client per year
- **Risk Avoidance:** Flag high-risk projects that later prove problematic (leading indicator)

---

## 12. Next Steps (Immediate Actions)

1. **Validate with 1-2 pilot clients:**
   - Do they have sufficient data? (min 50 projects)
   - What format is their data in?
   - What's their current estimation process?

2. **Build synthetic dataset:**
   - Generate 100 realistic projects for development
   - Ensures we can make progress before real data arrives

3. **Set up development environment:**
   - Docker Compose with Postgres + MinIO + Prefect
   - Install vLLM, Hugging Face PEFT
   - Skeleton FastAPI app

4. **Prototype scope understanding:**
   - Fine-tune LLaMA 7B (faster iteration) on construction RFPs
   - Test embedding quality with similarity search

5. **Design UI mockups:**
   - Estimation input form
   - Results page with confidence intervals
   - Similar projects view
   - Misestimation analytics dashboard

---

## Appendix A: Comparison with Original Plan

### What We Kept:
✅ Hybrid LLM + tabular ML architecture
✅ Canonical data schema with repeatable onboarding
✅ Company-specific fine-tuning
✅ Deliverable misestimation analytics
✅ Multi-tenant SaaS model
✅ Phased implementation approach

### What We Improved:
🔧 **Parameter-efficient fine-tuning:** Made LoRA/adapter approach explicit with implementation details
🔧 **Training strategy:** Clarified base model + company fine-tuning with transfer learning
🔧 **Prediction targets:** Use cost/duration ratios instead of raw values for better generalization
🔧 **Tech stack:** More specific choices (vLLM for LLM serving, pgvector for similarity search, Prefect for orchestration)
🔧 **Onboarding automation:** Config-driven approach with `onboard_company.py` script
🔧 **Business model:** Concrete pricing tiers and unit economics

### What We Added:
➕ **Success metrics:** Technical, business, and product KPIs
➕ **Risk analysis:** Key risks with mitigations
➕ **Immediate next steps:** Actionable tasks to start today
➕ **Synthetic data strategy:** For development before client data arrives
➕ **Feature roadmap:** Clear progression from MVP to advanced features

### Key Insight (The "Skim Difference Method"):
The original plan mentioned company-specific customization but didn't make explicit how to serve many companies economically. **LoRA adapters** are the key:
- Store base LLaMA 13B once (26GB)
- Each company's adapter is ~10-50MB
- Hot-swap at inference time
- Makes multi-tenant AI economically viable

This is the technical innovation that makes the business model work.

---

**This plan is comprehensive and ready for implementation. The next step is to start Phase 0 and build the foundation.**
