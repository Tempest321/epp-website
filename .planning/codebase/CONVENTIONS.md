# Coding Conventions

**Analysis Date:** 2026-01-23

## Naming Patterns

**Files:**
- Snake case for Python files: `client_auth.js`, `calculator.js`
- Lowercase with hyphens for JavaScript files in `/website/js/`
- Module files reflect their purpose: `client.py`, `models.py`, `extractors.py`

**Functions:**
- Python: Snake case throughout, e.g., `get_similar_projects()`, `get_authenticated_client()`
- JavaScript: camelCase, e.g., `checkUrlParam()`, `updateNavigation()`, `fmt()`
- Private functions prefixed with underscore in Python (convention, not enforced)

**Variables:**
- Python: Snake case for all variables: `api_key`, `company_id`, `base_url`
- JavaScript: camelCase for standard variables: `clientParam`, `urlParams`, `savedCalc`
- Constants in JavaScript: SCREAMING_SNAKE_CASE: `CLIENT_KEY`, `VALID_CLIENTS`, `API_PROXY_URL`
- Data object properties: camelCase: `totalLoss`, `pctLow`, `pctHigh`

**Types:**
- Python Pydantic models: PascalCase: `RiskFactor`, `RiskyDeliverable`, `SimilarProject`, `Prediction`, `EPPClient`
- Type hints used throughout: `Dict[str, Any]`, `List[SimilarProject]`, `Optional[str]`
- Python uses full type annotations on all functions

**Classes:**
- PascalCase: `EPPClient`, `RiskFactor`
- Pydantic BaseModel subclasses for data validation

## Code Style

**Formatting:**
- Black formatter configured with 88 character line length
- Configuration in `pyproject.toml` lines 121-140:
  - `line-length = 88`
  - `target-version = ['py310']`
  - Excludes: `.eggs`, `.git`, `.mypy_cache`, `.tox`, `.venv`, `models/`, `data/`

**Linting:**
- Flake8 for Python style enforcement
- Commands: `make lint` runs both flake8 and mypy
- Mypy strict mode enabled (line 152 in pyproject.toml): `disallow_untyped_defs = true`
- All function parameters and returns require explicit type hints

**JavaScript Style:**
- Self-evident patterns from code analysis:
  - Indentation: 4 spaces (visible in demo.js, calculator.js)
  - Semicolons: Optional but consistent (mostly absent in modern JS files)
  - Use of `const` for immutable values (client-auth.js, tabs.js)
  - Use of `var` in older calculator.js code (legacy code)
  - Arrow functions and regular functions mixed based on context

## Import Organization

**Python Order:**
1. Standard library imports
2. Third-party imports (pydantic, fastapi, etc.)
3. Local imports (epp package modules)

**Examples from `src/epp/api/client.py`:**
```python
from typing import Any, Dict, List, Optional

from pydantic import BaseModel
```

**Path Aliases:**
- First-party package: `epp` (configured in isort via `known_first_party = ["epp"]`)
- All imports use full package path: `from epp.api.client import EPPClient`

**JavaScript Imports:**
- Direct script loads via HTML (no module system detected in website JS)
- No ES6 imports/exports visible in codebase
- Cloudflare Worker uses standard JS: `const API_PROXY_URL = '...'`

## Error Handling

**Python Patterns:**
- Pydantic BaseModel validation for data input
- Raises `NotImplementedError` for stub methods (see `client.py` lines 91-93)
- Use of type hints to prevent runtime errors
- Logging via `loguru` (in dependencies)

**JavaScript Patterns:**
- Defensive checks: `if (!input || !calculateBtn) return;` (calculator.js line 13)
- Safe element access with null checks
- DOM queries with fallbacks: `var lossTotal = results ? results.querySelector('.loss-total') : null;`
- Error feedback via visual changes: `input.parentElement.style.borderColor = '#ef4444'`

## Logging

**Framework:**
- Python: `loguru` (configured in dependencies at line 66 of pyproject.toml)
- JavaScript: `console` (implicit, not configured)

**Patterns:**
- Python uses loguru for structured logging
- JavaScript: No logging framework detected; uses simple string concatenation and console methods (if needed)
- No visible logging in the client JavaScript files (stateless DOM manipulation)

## Comments

**When to Comment:**
- Module-level docstrings required (shown in all Python files)
- Class docstrings mandatory (all Pydantic models have docstrings)
- Complex algorithm steps get inline comments (calculator.js has detailed comments for phases)

**JSDoc/TSDoc:**
- Python uses docstring format for all public APIs
- Example from `client.py` (lines 63-88):
```python
def __init__(self, api_key: str, company_id: str, base_url: str = "http://localhost:8000"):
    """Initialize EPP client

    Args:
        api_key: API authentication key
        company_id: Company identifier
        base_url: Base URL for API server
    """
```

- JavaScript uses comment blocks for complex functions:
```javascript
/**
 * Client Authentication via URL Parameter + sessionStorage
 *
 * Usage: Visit any page with ?client=unico to unlock UNICO-specific content
 * The authentication persists for the browser session (until tab closes)
 */
```

## Function Design

**Size:**
- Keep functions focused on single responsibility
- Python: Most functions under 50 lines (client methods are straightforward)
- JavaScript: IIFE pattern for encapsulation (calculator.js wraps entire module in `(function() { ... })()`)

**Parameters:**
- Python: Use explicit parameters with type hints
- Consider Pydantic models for complex parameter sets (e.g., `Project` dict in `predict()`)
- JavaScript: Use object parameters for flexibility: `data-tier` attributes vs. parameters

**Return Values:**
- Python: Always declare return type: `-> Prediction:`, `-> List[SimilarProject]:`
- JavaScript: Implicit returns (no return type declarations)
- Use meaningful return values; avoid `None` if possible (use Optional types in Python)

## Module Design

**Exports:**
- Python: `__all__` list explicitly defines public API (see `src/epp/__init__.py`):
```python
__all__ = ["EPPClient", "__version__"]
```

- Barrel files organize submodule exports
- Namespace packages via `src/epp/` layout

**Barrel Files:**
- Each subpackage has `__init__.py` with module documentation
- Examples at:
  - `src/epp/utils/__init__.py`: Documents feature modules
  - `src/epp/training/__init__.py`: Documents training pipeline modules
  - `src/epp/db/__init__.py`: Documents database modules
  - `src/epp/models/__init__.py`: Documents model modules
  - `src/epp/features/__init__.py`: Documents feature engineering modules

- These act as contract documentation for module contents

## Code Quality Standards

**Type Checking:**
- Mypy required: strict mode enforces all functions/methods have type hints
- Configuration excludes some libraries: `vllm`, `prefect`, `mlflow`, `xgboost`, `lightgbm`

**Consistency:**
- All Python code must pass: `black`, `isort`, `flake8`, `mypy`
- Run via `make format` and `make lint` before commit

---

*Convention analysis: 2026-01-23*
