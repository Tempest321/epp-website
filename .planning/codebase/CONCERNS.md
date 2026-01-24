# Codebase Concerns

**Analysis Date:** 2026-01-23

## Tech Debt

**Stub Implementation - Core API Client:**
- Issue: `EPPClient` in `src/epp/api/client.py` contains only Pydantic data models with NotImplementedError placeholders for critical methods (`predict()` and `get_similar_projects()`)
- Files: `src/epp/api/client.py` (lines 73-94, 96-114)
- Impact: API client is non-functional; any code importing EPPClient for predictions will fail immediately. This blocks end-to-end testing and production deployment.
- Fix approach: Implement actual API calls to POST `/api/v1/predict` endpoint. Replace placeholder docstrings with actual HTTP request logic using requests/httpx library.

**Empty Python Modules:**
- Issue: Most of `src/epp/` is scaffolding. Directories like `src/epp/db/`, `src/epp/ingestion/`, `src/epp/training/`, `src/epp/features/`, `src/epp/models/`, and `src/epp/utils/` contain only empty `__init__.py` files with no actual implementation.
- Files: `src/epp/db/__init__.py`, `src/epp/ingestion/__init__.py`, `src/epp/training/__init__.py`, `src/epp/features/__init__.py`, `src/epp/models/__init__.py`, `src/epp/utils/__init__.py` (all 6 lines each)
- Impact: Backend services referenced in PLAN.md (Ingestion Service, Training Service, Feature Engineering, Model serving) are completely unimplemented. This represents 80%+ of backend functionality gap.
- Fix approach: Implement each service following architecture doc guidelines. Start with database layer (`src/epp/db/`), then feature engineering, then inference pipeline. Priority order in PLAN.md sections 3-5.

**Oversized Frontend Demo Files:**
- Issue: `website/js/demo.js` (496 lines) and `website/js/demo-unico.js` (526 lines) contain massive hardcoded system prompts (100+ lines each) and complex calculation logic mixed with DOM manipulation.
- Files: `website/js/demo.js`, `website/js/demo-unico.js`
- Impact: These files are difficult to maintain, test, and modify. Business logic (survey pricing multipliers, regional factors) should be externalized to data files or backend. Changing estimation rules requires editing JavaScript.
- Fix approach: Extract system prompts and cost models into separate JSON/YAML config files. Create utility modules for cost calculations. Keep demo.js focused on UI orchestration only.

## Security Considerations

**Hardcoded API Worker URL:**
- Risk: Frontend JavaScript references specific Cloudflare Worker URL: `https://fse-api-proxy.andrewpayne005.workers.dev/api/gemini/generate`
- Files: `website/js/demo.js` (line 5), `website/js/demo-unico.js` (line 5)
- Current mitigation: URL is public and API key is stored in Cloudflare secrets (not in code). Worker verifies origin headers.
- Recommendations:
  - Consider making API endpoint URL configurable via environment variable or data attribute
  - Add rate limiting on Worker (currently accepts up to 429 gracefully but no proactive limit)
  - Document that hardcoding domain name ties deployment to specific worker URL (refactor if moving to different domain)

**Client-Side Authentication Bypass Risk:**
- Risk: `website/js/client-auth.js` uses URL parameter (`?client=unico`) to unlock client-specific content, stored in sessionStorage. This is trivial to bypass.
- Files: `website/js/client-auth.js` (lines 14-26)
- Current mitigation: Only controls UI visibility; actual demo page content is the same. No sensitive data exposed.
- Recommendations:
  - This design is acceptable for demo purposes but inadequate for production
  - Add server-side authentication and JWT tokens for real implementation
  - Never use URL parameters for security-critical access control
  - Consider this client-auth.js as temporary demo scaffolding only

**Credentials in Docker Compose:**
- Risk: Default database password, MinIO credentials, and secrets visible in plain text in `docker-compose.yml`
- Files: `docker-compose.yml` (multiple lines: POSTGRES_PASSWORD, MINIO_ROOT_PASSWORD, AWS credentials in mlflow service)
- Current mitigation: Uses .env.example guidance (users should create .env), but docker-compose.yml defaults are production-unsafe
- Recommendations:
  - Update docker-compose.yml to source credentials from .env file (use `${VARIABLE}` syntax for all secrets)
  - Ensure docker-compose.yml is in .gitignore if it will contain real secrets (currently not needed)
  - Document required secret generation process in README
  - Rotate default MinIO credentials documented in setup

**Hardcoded Secret Key in .env.example:**
- Risk: `SECRET_KEY=your-secret-key-change-in-production` in `.env.example` is placeholder but represents a critical gap
- Files: `.env.example` (line 31)
- Current mitigation: Marked as example, but developers might copy this directly
- Recommendations: Generate random key at onboarding time. Add pre-deployment validation to reject default keys.

## Known Bugs

**Duration Display Unit Mismatch:**
- Symptoms: `website/js/demo-unico.js` (lines 414-417) displays duration as "X months" regardless of actual value which is calculated in days
- Files: `website/js/demo-unico.js` lines 414-417, 379-382 (duration is in days but labeled as months)
- Trigger: Any form submission for UNICO demo
- Workaround: Calculation is correct; only the display label is wrong. User can infer actual timeline by dividing by ~20-30 working days/month.

**Missing Error Handling for Malformed JSON Responses:**
- Symptoms: If Gemini API returns non-JSON or malformed response, `website/js/demo.js` and `website/js/demo-unico.js` will throw uncaught exception in JSON.parse()
- Files: `website/js/demo.js` (lines 227-232), `website/js/demo-unico.js` (lines 227-232)
- Trigger: Gemini API returns plain text or HTML error response
- Workaround: Fallback to mock prediction is triggered on HTTP errors (429) but not on JSON parse errors

## Performance Bottlenecks

**Gemini API Latency:**
- Problem: Frontend demo makes blocking request to Gemini API via Cloudflare Worker. No timeout specified; user sees loading spinner indefinitely on slow connections.
- Files: `website/js/demo.js` (lines 183-201), `website/js/demo-unico.js` (lines 180-201)
- Cause: Direct synchronous fetch() with default browser timeout (~90s). Large system prompts (100+ lines) increase token processing time.
- Improvement path:
  - Add explicit timeout (20s recommended) with user-friendly error message
  - Compress system prompts or use model version with better prompt efficiency
  - Consider caching common requests
  - Implement request queuing if API has rate limits

**Large System Prompts Sent on Every Request:**
- Problem: 100-150 line system prompts (cost multipliers, pricing tables, regional factors) are sent with every API call. Estimated 3-5KB per request.
- Files: `website/js/demo.js` (lines 16-140), `website/js/demo-unico.js` (lines 16-140)
- Cause: Static prompt embedded in JavaScript. Could be cached server-side or reference via ID.
- Improvement path:
  - Create prompt version system ("prompt_v1", "prompt_v2")
  - Store prompt templates on backend, send ID + user inputs
  - Reduces per-request payload by 80%

**No Database Query Optimization Planned:**
- Problem: `src/epp/` backend modules unimplemented, but PLAN.md shows feature extraction pipeline will need to query historical projects. No indexing or caching strategy documented.
- Files: `docs/architecture.md` (similarity search and embedding lookup)
- Cause: Architecture designed but implementation details skipped
- Improvement path: Plan pgvector indexes on embeddings, add Redis caching for frequently-accessed feature vectors, implement pagination for bulk operations

## Fragile Areas

**Calculation Logic in Calculator Closure:**
- Files: `website/js/calculator.js` (entire file)
- Why fragile: Complex nested state (`savedCalc` object) updated by multiple event handlers. Loss item animations transition between states (red/green) with magic delay numbers (200ms, 500ms, 1000ms). Order-dependent phase transitions.
- Safe modification:
  - Document state machine explicitly (what states exist, valid transitions)
  - Extract delay values to named constants at top of file
  - Add assertions to validate state before transitions
  - Test coverage: Currently no test files (test suite is empty)
- Test coverage: No unit tests for calculator logic; only manual testing possible.

**Frontend-Backend Contract Mismatch:**
- Files: `website/js/demo.js`, `website/js/demo-unico.js` expect JSON structure with fields like `cost.p10`, `cost.p50`, `cost.p90`, `costBreakdown`, `risks[]`, `analysis`
- Why fragile: Actual API implementation doesn't exist yet. When backend is built, if response schema changes, frontend breaks silently (JSON.parse succeeds but field access returns undefined).
- Safe modification:
  - Add schema validation on frontend before display
  - Create shared TypeScript interfaces/Pydantic models for request/response
  - Add version field to response, reject unknown versions
- Test coverage: No integration tests

**Date/Time Handling Missing:**
- Files: `src/epp/` has no datetime utilities despite PLAN.md requiring temporal features (seasonality, project year, market conditions)
- Why fragile: Future timeline feature engineering will need to handle timezone-aware timestamps, but no utility functions exist yet. Each service will implement independently and inconsistently.
- Safe modification: Create `src/epp/utils/datetime.py` with standardized helpers before timeline features are added.

## Scaling Limits

**Single Cloudflare Worker Instance:**
- Current capacity: Limited by Cloudflare Worker CPU timeout (10s) and request size limits
- Limit: If Gemini API requests exceed 10s (large prompts + slow network), requests timeout. No load balancing or worker scaling visible.
- Scaling path: Upgrade to Cloudflare Workers Plan with higher limits, or migrate API proxy to dedicated backend (FastAPI service)

**LLM Inference Bottleneck:**
- Current capacity: PLAN.md specifies vLLM with LoRA adapters, but implementation missing. Base model (LLaMA 13B = 26GB) loads once.
- Limit: Single GPU can serve ~5-10 concurrent requests before queue delays exceed 30s. Multi-tenant requests will compete.
- Scaling path: Implement model server scaling tier in Kubernetes or similar. Add request queueing with SLA guarantees.

**PostgreSQL + pgvector for Similarity Search:**
- Current capacity: Not yet implemented, but planned feature requires embedding lookup and cosine similarity computation
- Limit: pgvector queries on large embedding tables (100K+ projects) will be slow without proper indexes. No implementation guidance in codebase.
- Scaling path: Plan explicit pgvector index creation during schema migration. Consider dedicated vector database (Weaviate, Pinecone) if similarity queries dominate workload.

## Scaling Concerns - Data Volume

**Model Artifacts Storage:**
- Issue: PLAN.md references storing model checkpoints, LoRA adapters (~10-50MB per company), embeddings, etc. in MinIO/S3
- Impact: Multi-tenant storage can quickly exceed typical S3 budgets if not managed. No cleanup/retention policy for old model versions.
- Recommendation: Implement versioning + automatic cleanup. Store only N recent model versions per company.

## Test Coverage Gaps

**Zero Backend Tests:**
- What's not tested: Entire `src/epp/` package (API client, database, ingestion, training, features). All 171 lines are untested.
- Files: `tests/__init__.py` is empty (1 line only)
- Risk: Any Python backend changes will ship without verification. Critical data pipeline (ingestion, feature engineering) has zero test coverage.
- Priority: HIGH - implement test suite before backend implementation begins. Minimum: unit tests for data validation, feature extraction, model inference pipeline.

**No Frontend Unit Tests:**
- What's not tested: All calculator logic (`calculator.js`), demo form handling (`demo.js`, `demo-unico.js`), state management
- Files: No test files in `website/` directory
- Risk: UI state transitions are fragile; changes to event handlers or animations silently break functionality
- Priority: MEDIUM - add Jest/Vitest test suite for calculator and demo modules once backend stabilizes

**No Integration Tests:**
- What's not tested: End-to-end flow: form → API call → result display. Frontend/backend contract validation.
- Risk: Mismatch between frontend expectations and API response schema caught only in production
- Priority: MEDIUM - add integration tests once API implementation is complete

**No Load/Stress Tests:**
- What's not tested: Gemini API rate limiting behavior. Cloudflare Worker timeout scenarios. Concurrent prediction requests.
- Risk: Performance degradation under load only discovered in production
- Priority: LOW (post-MVP) - required before scaling to production load

## Dependencies at Risk

**Outdated Dependencies in pyproject.toml:**
- Risk: Dependencies locked to broad ranges without pinned versions (e.g., `torch>=2.0.0`). torch 2.5+ may introduce breaking changes.
- Impact: `pip install -e ".[dev]"` may pull incompatible versions silently
- Migration plan:
  - Generate requirements.txt with exact pinned versions using pip-tools
  - Pin all production dependencies to specific versions
  - Test each major version bump before updating

**vLLM Compatibility:**
- Risk: PLAN.md specifies vLLM but pyproject.toml has `vllm>=0.2.0` (very old). Current vLLM is 0.6+, with breaking API changes.
- Impact: Inference service implementation will be incompatible with tested version
- Migration plan: Upgrade to vLLM 0.6+ before implementing inference service. Test with specified LLaMA model version.

**PEFT/LoRA Stability:**
- Risk: PEFT library (LoRA adapters) used for multi-tenant model customization but no version pinning strategy. API changes between 0.6 → 0.7 were breaking.
- Impact: Fine-tuning pipeline will fail if PEFT changes incompatibly
- Migration plan: Pin PEFT to specific tested version. Document exact steps to create/load LoRA adapters.

## Architectural Tech Debt

**No Configuration Management:**
- Problem: `.env.example` lists 50+ environment variables with no validation or documentation of dependencies (e.g., REDIS_URL is optional but ENABLE_CACHING defaults to true - what happens if Redis is missing?)
- Files: `.env.example`, no validation code in `src/epp/`
- Fix approach: Create `src/epp/config.py` with Pydantic BaseSettings that validates environment on startup. Fail fast with clear error messages.

**No Secrets Management Strategy:**
- Problem: All credentials (DB password, API keys, JWT secrets) go into environment variables. No rotation, auditing, or revocation mechanism.
- Files: `.env.example` (all secrets as plain text)
- Fix approach: Plan for secrets management (Vault, AWS Secrets Manager, or Doppler). Document rotation policy.

**Missing API Versioning Strategy:**
- Problem: PLAN.md references `/api/v1/predict` but no API versioning code exists. Future changes to response schema will break clients.
- Files: No API code yet (client.py is stub)
- Fix approach: Implement API versioning from day 1. Use URL path versioning (`/api/v1/`, `/api/v2/`). Version all response schemas.

**No Monitoring/Observability:**
- Problem: pyproject.toml includes `prometheus-client>=0.18.0` but no instrumentation in codebase. No logging strategy except `loguru>=0.7.0` (not integrated).
- Files: Empty `src/epp/` modules
- Fix approach: Plan metrics collection (response time, error rate, model inference latency) and logging structure before implementing services.

## Missing Critical Features

**No Authentication/Authorization:**
- Problem: PLAN.md describes multi-tenant system but no auth implementation exists. API Gateway needs JWT validation and company-scoped data isolation.
- Blocks: Production deployment. Security validation. Multi-tenant testing.

**No API Rate Limiting:**
- Problem: PLAN.md mentions rate limiting but not implemented. Without it, Gemini API quota can be exhausted by single user or attacker.
- Blocks: Production readiness. Cost control.

**No Data Validation Pipeline:**
- Problem: Ingestion service (unimplemented) needs to validate CSV/Excel uploads against schema. No validation code exists.
- Blocks: Bulk data upload feature. Data quality assurance.

---

*Concerns audit: 2026-01-23*
