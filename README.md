# Engineering Project Predictions (EPP)

**AI-powered cost and schedule estimation for construction and engineering companies**

EPP learns from your company's historical project data to provide dramatically more accurate estimates—and reveals which deliverables you're systematically under- or over-estimating.

---

## The Problem

Construction and engineering projects routinely exceed budgets by 20-80% and face even worse schedule delays. Human estimators have blind spots specific to each company—certain types of work are chronically underestimated, causing painful overruns, while others are conservatively padded, leaving margin on the table.

## The Solution

EPP transforms your historical project data into a personalized AI prediction engine that:

- **Predicts costs and schedules** with P50/P80/P90 confidence intervals (not just a single number)
- **Identifies systematic biases** in your estimation process
- **Explains its reasoning** - which factors drive costs and risks
- **Finds similar projects** from your history to ground predictions
- **Learns continuously** as new projects complete

### What Makes EPP Different?

**Company-Specific Learning:** Unlike generic estimating tools, EPP learns the unique patterns in *your* data. The same deliverable might run over budget at one company but under at another—EPP captures this.

**Hybrid AI Architecture:** We combine LLaMA 13B (for understanding messy project scopes) with specialized ML models (for precise numeric prediction). Best of both worlds.

**Deliverable Misestimation Analytics:** EPP tells you "Your company typically underestimates electrical switchgear installation by 22%, based on 37 past projects." This insight alone can transform estimation practices.

---

## Quick Start

### Prerequisites
- Python 3.10+
- PostgreSQL 15+ with pgvector extension
- (Optional) GPU for LLM inference (NVIDIA T4 or better)

### Installation

```bash
# Clone the repository
cd /home/devkit/EPP

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Set up database
createdb epp_dev
psql epp_dev < docs/schema.sql

# Configure environment
cp .env.example .env
# Edit .env with your settings
```

### Example: Making a Prediction

```python
from epp.api import EPPClient

# Initialize client
client = EPPClient(api_key="your_api_key", company_id="acme_construction")

# Define new project scope
project = {
    "name": "Industrial Plant Expansion - Phase 2",
    "description": """
        Expansion of existing chemical processing facility.
        Scope includes:
        - 10,000 sqft new concrete foundations
        - Structural steel for 3 new process towers
        - Process piping (carbon steel and stainless)
        - Electrical switchgear and MCC installation
        - HVAC for new control room
    """,
    "location": {"country": "USA", "region": "Gulf Coast"},
    "project_type": "industrial_plant",
    "contract_type": "lump_sum",
    "estimated_size": {"value": 10000, "unit": "sqft"}
}

# Get prediction
result = client.predict(project)

print(f"Cost Estimate:")
print(f"  P50 (median): ${result.cost_p50:,.0f}")
print(f"  P80: ${result.cost_p80:,.0f}")
print(f"  P90: ${result.cost_p90:,.0f}")

print(f"\nSchedule Estimate:")
print(f"  P50: {result.duration_p50} days")
print(f"  P80: {result.duration_p80} days")

print(f"\nTop Risk Factors:")
for factor in result.top_risk_factors[:3]:
    print(f"  - {factor.name}: {factor.impact}")

print(f"\nDeliverables with Historical Underestimation:")
for item in result.risky_deliverables[:3]:
    print(f"  - {item.name}: typically {item.avg_error:+.1%} vs estimate")

print(f"\nSimilar Past Projects:")
for proj in result.similar_projects[:3]:
    print(f"  - {proj.name} ({proj.year}): "
          f"${proj.actual_cost:,.0f}, {proj.actual_duration} days")
```

**Output:**
```
Cost Estimate:
  P50 (median): $2,450,000
  P80: $2,890,000
  P90: $3,210,000

Schedule Estimate:
  P50: 187 days
  P80: 224 days

Top Risk Factors:
  - Electrical Switchgear Installation: +12% cost variance typical
  - Gulf Coast Location (hurricane season): +8 days schedule risk
  - Stainless Steel Piping: Supply chain volatility

Deliverables with Historical Underestimation:
  - Electrical Switchgear Installation: typically +22% vs estimate
  - Process Piping - Stainless Steel: typically +18% vs estimate
  - Concrete Foundation - Industrial Equipment: typically +9% vs estimate

Similar Past Projects:
  - Plant Modernization 2022 (2022): $2,380,000, 201 days
  - Tank Farm Expansion (2021): $1,950,000, 178 days
  - Boiler Replacement Project (2023): $3,100,000, 215 days
```

---

## Documentation

- **[Master Plan](PLAN.md)** - Comprehensive product vision, technical strategy, and roadmap
- **[Architecture](docs/architecture.md)** - System design, service components, data flows
- **[Data Schema](docs/schema.sql)** - Canonical database schema
- **[API Reference](docs/api.md)** - REST API documentation *(coming soon)*
- **[Onboarding Guide](docs/onboarding.md)** - How to onboard a new company *(coming soon)*

---

## Project Structure

```
EPP/
├── src/epp/              # Core Python package
│   ├── api/              # FastAPI application
│   ├── models/           # ML models (LLM & tabular)
│   ├── features/         # Feature engineering
│   ├── ingestion/        # ETL pipelines
│   ├── db/               # Database models & queries
│   └── utils/            # Shared utilities
├── tests/                # Test suite
├── docs/                 # Documentation
├── config/               # Company-specific configs
├── scripts/              # Utility scripts (onboarding, training)
├── models/               # Trained model artifacts
├── data/                 # Sample & test data
│   ├── raw/              # Original client data
│   └── processed/        # Cleaned & normalized
└── notebooks/            # Jupyter notebooks (exploration)
```

---

## Development

### Running Tests

```bash
# All tests
pytest

# With coverage
pytest --cov=epp --cov-report=html

# Specific module
pytest tests/test_features.py -v
```

### Code Quality

```bash
# Format
black src/ tests/
isort src/ tests/

# Lint
flake8 src/ tests/
mypy src/

# All checks
make lint
```

### Running Locally

```bash
# Start database and services (Docker Compose)
docker-compose up -d

# Run API server
uvicorn epp.api.main:app --reload --port 8000

# Run training pipeline
prefect agent start -q default
```

### Running the Web UI

```bash
cd web/
npm install
npm run dev
# Open http://localhost:3000
```

---

## Key Technologies

| Component | Technology | Why |
|-----------|-----------|-----|
| **LLM** | LLaMA 13B + LoRA | Understanding scopes, parameter-efficient fine-tuning |
| **Prediction** | XGBoost | Best for tabular data, quantile regression |
| **Database** | PostgreSQL 15 + pgvector | Vector similarity search built-in |
| **API** | FastAPI | Modern, async, auto-docs |
| **Orchestration** | Prefect | ML pipeline scheduling |
| **Serving** | vLLM | Fast LLM inference with LoRA support |
| **Frontend** | Next.js + React | SSR, great DX |

---

## Roadmap

### ✅ Phase 0: Foundation (Current)
- [x] Project setup and structure
- [x] Data schema design
- [x] Architecture documentation
- [ ] Development environment (Docker Compose)
- [ ] Sample synthetic dataset

### 🚧 Phase 1: Single-Company MVP (In Progress)
- [ ] ETL pipeline
- [ ] LLaMA scope understanding module
- [ ] XGBoost cost/schedule predictor
- [ ] Basic API endpoints
- [ ] Simple web UI

### 📋 Phase 2: Multi-Tenant Platform (Planned)
- [ ] LoRA adapter training & swapping
- [ ] Company-specific model fine-tuning
- [ ] Deliverable misestimation analytics
- [ ] Onboarding automation
- [ ] Advanced web dashboard

### 🔮 Phase 3: Advanced Features (Future)
- [ ] What-if scenario analysis
- [ ] Risk decomposition (SHAP)
- [ ] Excel plugin
- [ ] ERP integrations (Procore, etc.)
- [ ] Exec reporting

---

## Contributing

This is currently a private project. If you're part of the development team:

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes with tests
3. Ensure all tests pass: `pytest`
4. Ensure code quality: `black . && isort . && flake8`
5. Commit with clear messages (no Claude Code attribution per CLAUDE.md)
6. Push and create a pull request

---

## License

Proprietary - All Rights Reserved

---

## Contact

For questions or access requests, contact: [your-email@example.com]

---

**Built with:** Python • PyTorch • LLaMA • XGBoost • PostgreSQL • FastAPI • Next.js
