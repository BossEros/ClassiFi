# Testing Patterns

**Analysis Date:** 2026-03-08

## Test Framework

**Runner:**
- Frontend: Vitest (`frontend/vitest.config.ts`) with `jsdom` environment.
- Backend: Vitest (`backend-ts/vitest.config.ts`) with `node` environment.
- E2E: Playwright (`frontend/playwright.config.ts`).

**Assertion Library:**
- Vitest built-in `expect` in both frontend and backend.
- Frontend also uses `@testing-library/jest-dom` matchers via `frontend/src/tests/setup.ts`.

**Run Commands:**
```bash
# Frontend (frontend/package.json)
npm test
npm run test:coverage
npm run build

# Backend (backend-ts/package.json)
npm test
npm run test:coverage
npm run typecheck

# Frontend E2E
npx playwright test
```

## Test File Organization

**Location:**
- Frontend unit tests live under `frontend/src/tests/unit/**`.
- Frontend E2E tests live under `frontend/src/tests/e2e/**`.
- Backend tests live under `backend-ts/tests/**` split by concern (`services`, `repositories`, `api`, `modules`, `integration`, `shared`).

**Naming:**
- Unit/integration tests use `*.test.ts` and `*.test.tsx`.
- No separate suffix for most integration tests; they are grouped by folder (`backend-ts/tests/integration/*`).
- E2E files also use `.spec.ts`/`.test.ts` style (`frontend/src/tests/e2e/smoke.spec.ts`).

**Current distribution (observed):**
- Frontend unit: 68 files.
- Frontend e2e: 5 files.
- Backend total: 41 files.
- Backend services: 18 files.
- Backend repositories: 9 files.
- Backend API controller tests: 2 files.

## Test Structure

**Suite Organization:**
- Standard Vitest hierarchy: `describe` -> nested `describe` -> `it`.
- Clear scenario names focusing on expected behavior and error conditions.
- Common lifecycle usage:
  - `beforeEach` for test setup and mocks.
  - `afterEach` for cleanup/reset.

**Patterns:**
- Arrange/Act/Assert is commonly followed, sometimes with explicit comments in complex tests.
- Frontend tests often render through `MemoryRouter` when route context is required.
- Backend tests instantiate services directly with mocked dependencies or intercept DI container resolution.

## Mocking

**Framework:**
- Vitest mocking APIs: `vi.mock`, `vi.fn`, `vi.mocked`, `vi.clearAllMocks`, `vi.resetAllMocks`.

**Frontend mocking patterns:**
- Network-layer mocking with MSW (`frontend/src/tests/mocks/server.ts`, `frontend/src/tests/mocks/handlers.ts`).
- Module mocking for business services, stores, or heavy presentation components (`vi.mock("@/business/services/..." )`).
- Browser API mocks in setup (`localStorage`, `matchMedia`) via `frontend/src/tests/setup.ts`.

**Backend mocking patterns:**
- Module mocks for repositories/adapters/config (`vi.mock("../../src/..." )`).
- Container-based mocking for controller tests (mocking `tsyringe.container.resolve`).
- Drizzle/database mocks for repository logic tests.

**What is usually mocked:**
- External HTTP/network boundaries.
- Supabase/auth adapters.
- Database and ORM query layers.
- DI container and middleware in controller-unit tests.

**What is usually not mocked:**
- Pure mapping and utility logic.
- Zod schema validation in schema-specific tests (tested directly).

## Fixtures and Factories

**Shared factories:**
- Frontend: `frontend/src/tests/utils/factories.ts` provides typed factory helpers (`createMockUser`, `createMockClass`, etc.).
- Backend: `backend-ts/tests/utils/factories.ts` provides model-aligned factories.

**Pattern:**
- Factories return valid defaults and support per-test overrides (`overrides?: Partial<T>`).
- Large tests keep inline scenario-specific objects when behavior needs explicit readability.

## Coverage

**Enforcement style:**
- Both frontend and backend use strict per-file thresholds (`lines/functions/branches/statements = 100`, `perFile: true`) for selected include lists.
- Coverage is intentionally targeted to critical modules rather than blanket entire-source enforcement.

**Frontend coverage config (`frontend/vitest.config.ts`):**
- Provider: `v8`.
- Reporters: `text`, `html`.
- Includes selected business/data/schema files.
- Excludes test setup/mocks and build artifacts.

**Backend coverage config (`backend-ts/vitest.config.ts`):**
- Provider: `v8`.
- Reporters: `text`, `html`, `lcov`.
- `all: true` with selected include list for key modules/schemas/services.
- Excludes tests, dist, and barrel index files.

## Test Types

**Unit Tests:**
- Dominant test type in both apps.
- Frontend: services, hooks, utilities, pages/components via Testing Library.
- Backend: services, repositories, schemas, and some controllers with mocked app/reply objects.

**Integration Tests:**
- Present in backend (`backend-ts/tests/integration/*`) for cross-module behavior (for example notification flow).
- Frontend has practical integration-style unit tests that combine routing + mocked services.

**E2E Tests:**
- Playwright-based in frontend (`frontend/src/tests/e2e/smoke.spec.ts`).
- Uses real login flows and role-based browser contexts.
- Environment-driven credentials are required (`TEST_TEACHER_EMAIL`, `TEST_STUDENT_EMAIL`, etc.).

## Common Patterns

**Async testing:**
- `async/await` is standard.
- Promise rejection checks use `await expect(promise).rejects.toThrow(...)`.
- UI async state uses Testing Library `waitFor` with assertions.

**Error-path testing:**
- Strong emphasis on invalid-input and failure behavior in both service tests and UI tests.
- Common pattern: verify fallback/error message and ensure downstream calls were skipped when validation fails.

**State isolation:**
- Frontend setup clears DOM, mocks, handlers, and `localStorage` between tests.
- Backend suites commonly reset/clear mocks per test and clear DI container instances after integration tests.

**Snapshot testing:**
- Snapshot testing is not a dominant pattern; explicit assertions are preferred.

## Practical Add-Test Checklist

- Place tests in the existing tree (`frontend/src/tests/unit`, `backend-ts/tests/...`) with `*.test.ts(x)` naming.
- Reuse factory helpers before creating new ad-hoc mock builders.
- Mock at architectural boundaries (API/DB/adapters), not pure logic.
- Cover both success and failure paths.
- Keep assertions behavior-focused and role-aware for UI flows.
- Run required verification commands after changes (`frontend: npm run build`; `backend-ts: npm run typecheck && npm test`).

---

*Testing analysis: 2026-03-08*
*Update when test patterns change*
