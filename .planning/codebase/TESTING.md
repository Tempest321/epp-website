# Testing Patterns

**Analysis Date:** 2026-01-23

## Test Framework

**Runner:**
- pytest 7.4.0+ (configured in `pyproject.toml` lines 165-180)
- Config file: `pyproject.toml` [tool.pytest.ini_options]
- Test paths: `tests/` directory (line 166)

**Assertion Library:**
- pytest built-in assertions (no external assertion library configured)
- pytest-mock for mocking (line 78 of pyproject.toml)

**Run Commands:**
```bash
make test              # Run all tests (pytest)
make test-cov          # Run tests with coverage report (HTML + terminal)
pytest                 # Direct pytest execution
pytest -m "not slow"   # Skip slow tests
pytest -m "not gpu"    # Skip GPU tests
pytest -m integration  # Run only integration tests
```

**Coverage Configuration:**
- Source: `src/epp` (line 183 in pyproject.toml)
- Omits: `*/tests/*`, `*/migrations/*`, `*/__init__.py`
- Report format: Term with missing lines + HTML report (via `make test-cov`)

## Test File Organization

**Location:**
- Tests are co-located in `tests/` directory at project root
- Pattern: NOT in same directory as source code
- Path: `/home/xavier-gonzales/Desktop/epp-website/tests/`

**Naming:**
- Python files: `test_*.py` (line 167: `python_files = ["test_*.py"]`)
- Classes: `Test*` (line 168: `python_classes = ["Test*"]`)
- Functions: `test_*` (line 169: `python_functions = ["test_*"]`)

**Structure:**
```
tests/
├── __init__.py                    # Package marker
├── test_api_client.py            # Tests for epp.api.client
├── test_features.py              # Tests for epp.features
├── test_training.py              # Tests for epp.training
├── test_ingestion.py             # Tests for epp.ingestion
├── integration/                   # Integration tests
│   └── test_api_endpoints.py
└── fixtures/                      # Shared test fixtures
    └── conftest.py               # pytest fixtures
```

## Test Structure

**Suite Organization:**
```python
import pytest
from epp.api.client import EPPClient, Prediction

class TestEPPClient:
    """Test suite for EPPClient"""

    @pytest.fixture
    def client(self):
        """Fixture: Create EPP client instance"""
        return EPPClient(
            api_key="test-key",
            company_id="test-company",
            base_url="http://test-api.local"
        )

    def test_predict_raises_not_implemented(self, client):
        """Test: predict() raises NotImplementedError"""
        with pytest.raises(NotImplementedError):
            client.predict({"name": "Test Project"})

    def test_get_similar_projects_raises_not_implemented(self, client):
        """Test: get_similar_projects() raises NotImplementedError"""
        with pytest.raises(NotImplementedError):
            client.get_similar_projects("proj-123")
```

**Patterns Observed:**
- Setup: pytest fixtures with `@pytest.fixture` decorator
- Teardown: Using fixture cleanup (yield pattern)
- Assertions: pytest assert statements with descriptive messages

## Mocking

**Framework:**
- pytest-mock (line 78 of pyproject.toml, provides `mocker` fixture)
- Also supports: unittest.mock via standard library

**Patterns:**
```python
def test_api_client_initialization(mocker):
    """Test client initialization with mocked dependencies"""
    mock_http = mocker.patch('epp.api.client.requests')

    client = EPPClient(api_key="key", company_id="company")

    # Verify mock was called
    assert client.api_key == "key"
```

**What to Mock:**
- External API calls (prevent network requests in tests)
- Database connections (use fixtures instead)
- File I/O operations (use temporary directories)
- Random/time-dependent operations

**What NOT to Mock:**
- Pydantic model validation (test real validation)
- Business logic in core methods
- Type checking systems
- Configuration loading

## Fixtures and Factories

**Test Data:**
```python
@pytest.fixture
def sample_project():
    """Fixture: Sample project dict for testing"""
    return {
        "name": "Office Building A",
        "description": "12-story commercial office tower",
        "location": {"country": "US", "region": "CA"},
        "project_type": "Commercial Office",
        "contract_type": "Fixed Price",
        "estimated_size": {"value": 150000, "unit": "sqft"}
    }

@pytest.fixture
def sample_prediction():
    """Fixture: Sample prediction result"""
    return Prediction(
        cost_p50=15000000,
        cost_p80=18000000,
        cost_p90=21000000,
        duration_p50=24,
        duration_p80=28,
        duration_p90=32,
        confidence_score=0.87,
        top_risk_factors=[],
        risky_deliverables=[],
        similar_projects=[],
        prediction_id="pred-123",
        model_version="1.0.0"
    )
```

**Location:**
- Central fixtures: `tests/conftest.py` (loaded automatically by pytest)
- Module-specific fixtures: In `test_*.py` files directly
- Shared test data: `tests/fixtures/` directory

## Coverage

**Requirements:**
- No explicit minimum coverage enforced (not configured in pyproject.toml)
- Suggested target based on dependencies: 80%+ for critical path

**View Coverage:**
```bash
make test-cov              # Generates HTML report in htmlcov/
open htmlcov/index.html    # View in browser
pytest --cov-report=term   # View in terminal
```

**Excluded from Coverage:**
- `__repr__` methods
- `raise AssertionError` statements
- `raise NotImplementedError` statements
- `if __name__ == "__main__":` blocks
- `if TYPE_CHECKING:` blocks
- `@abstractmethod` decorated methods

## Test Types

**Unit Tests:**
- Scope: Individual functions/methods in isolation
- Approach: Use mocks for dependencies
- Location: `tests/test_*.py`
- Example: Testing `Prediction` model validation without API calls

**Integration Tests:**
- Scope: Multiple components working together
- Approach: Real database/service interactions or realistic mocks
- Marker: `@pytest.mark.integration` (line 178 of pyproject.toml)
- Location: `tests/integration/`
- Run: `pytest -m integration`

**E2E Tests:**
- Framework: Not detected in codebase
- Implication: E2E testing may be handled separately (external to pytest)
- Candidates for future addition: Selenium/Playwright for website JS

**Performance Tests:**
- Marker: `@pytest.mark.slow` (line 177 of pyproject.toml)
- Skip: `pytest -m "not slow"` to exclude in CI

**GPU Tests:**
- Marker: `@pytest.mark.gpu` (line 179 of pyproject.toml)
- Skip: `pytest -m "not gpu"` for non-GPU environments

## Common Patterns

**Async Testing:**
- Framework: pytest-asyncio (line 77 of pyproject.toml)
- Pattern:
```python
@pytest.mark.asyncio
async def test_async_prediction():
    """Test: Async prediction method"""
    client = EPPClient(api_key="key", company_id="company")
    # await client.predict_async(project)
    # assert result.confidence_score > 0
```

**Error Testing:**
```python
def test_predict_with_invalid_project():
    """Test: Predict raises error on invalid input"""
    client = EPPClient(api_key="key", company_id="company")

    invalid_project = {"name": ""}  # Missing required fields

    with pytest.raises(ValueError):
        client.predict(invalid_project)
```

**HTTP Testing:**
- Framework: httpx (line 79 of pyproject.toml, for testing FastAPI)
- Pattern:
```python
from httpx import AsyncClient
from epp.api.main import app

@pytest.mark.asyncio
async def test_api_predict_endpoint():
    """Test: /api/v1/predict endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post("/api/v1/predict", json={...})
        assert response.status_code == 200
```

**Data Generation:**
- Framework: faker (line 80 of pyproject.toml)
- Pattern:
```python
from faker import Faker

@pytest.fixture
def fake_project():
    """Fixture: Generate random project data"""
    fake = Faker()
    return {
        "name": fake.company(),
        "location": {"country": "US", "region": fake.state()},
        ...
    }
```

## Test Markers

**Available Markers (from pyproject.toml):**

| Marker | Purpose | Usage |
|--------|---------|-------|
| `slow` | Marks slow tests | `pytest -m "not slow"` to skip in CI |
| `integration` | Integration tests | `pytest -m integration` |
| `gpu` | GPU-dependent tests | `pytest -m "not gpu"` on CPU-only machines |

**Custom Markers:**
```python
# Define in conftest.py or use direct decorator
@pytest.mark.slow
def test_expensive_computation():
    """This test is expensive and should be skipped in fast CI"""
    pass
```

## Pre-Commit Hooks

**Configured Via:**
- `pre-commit>=3.5.0` (line 88 of pyproject.toml)
- Hooks file: `.pre-commit-config.yaml` (if present)
- Run manually: `pre-commit run --all-files`

**Likely Hooks:**
- black (formatting)
- isort (import sorting)
- flake8 (linting)
- mypy (type checking)

---

*Testing analysis: 2026-01-23*
