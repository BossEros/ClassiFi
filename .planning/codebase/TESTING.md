# ClassiFi Testing Map (Observed)

## 1) Test Frameworks in Use
- Backend unit/integration tests use Vitest with Node environment: `backend-ts/vitest.config.ts`.
- Frontend unit tests use Vitest + jsdom + Testing Library: `frontend/vitest.config.ts` and `frontend/src/tests/setup.ts`.
- Frontend API-level mocks are handled with MSW (`frontend/src/tests/mocks/server.ts`, `frontend/src/tests/mocks/handlers.ts`).
- Frontend E2E tests use Playwright in Chromium project config: `frontend/playwright.config.ts`.

## 2) Test Directory Structure
- Backend test discovery is centralized to `tests/**/*.test.ts` via `backend-ts/vitest.config.ts`.
- Backend suites are grouped by concern: `backend-ts/tests/services`, `backend-ts/tests/repositories`, `backend-ts/tests/api`, `backend-ts/tests/modules`, `backend-ts/tests/integration`.
- Frontend unit tests are centralized in `frontend/src/tests/unit/**` by layer (`business`, `data`, `presentation`, `shared`).
- Frontend E2E tests live under `frontend/src/tests/e2e/**`.
- Shared frontend test helpers are in `frontend/src/tests/utils/render.tsx` and `frontend/src/tests/utils/factories.ts`.

## 3) Execution Commands (Current)
- Backend:
- `cd backend-ts && npm run typecheck`
- `cd backend-ts && npm test`
- `cd backend-ts && npm run test:coverage`
- Frontend:
- `cd frontend && npm run build`
- `cd frontend && npm test`
- `cd frontend && npm run test:coverage`
- `cd frontend && npx playwright test`

## 4) Coverage and Quality Gates
- Backend Vitest enforces per-file 100% thresholds on critical files listed in `backend-ts/vitest.config.ts` (e.g. `auth.service.ts`, `class.schema.ts`, `submission.schema.ts`).
- Frontend Vitest enforces per-file 100% thresholds on selected critical service/validation/repository/schema files in `frontend/vitest.config.ts`.
- Both stacks use `coverage.provider = "v8"` and fail when thresholded files regress.

## 5) Backend Test Patterns
- Unit tests instantiate services directly with mocked dependencies rather than container bootstrapping, e.g. `backend-ts/tests/services/auth.service.test.ts`.
- `vi.mock(...)` is used to stub modules/classes and preserve selected exports when needed (see USER_ROLES preservation in `backend-ts/tests/services/auth.service.test.ts`).
- Controller tests mock tsyringe `container.resolve` and capture registered Fastify handlers from mocked `app.get/post/patch`, e.g. `backend-ts/tests/api/submission.controller.test.ts`.
- Schema tests validate both success/failure paths with `safeParse` and coercion behavior, e.g. `backend-ts/tests/modules/class.schema.test.ts`.
- Factory builders provide typed defaults with override hooks in `backend-ts/tests/utils/factories.ts`.

## 6) Frontend Test Patterns
- Global setup starts/stops MSW and clears test state (`cleanup`, `server.resetHandlers`, `vi.clearAllMocks`, `localStorage.clear`) in `frontend/src/tests/setup.ts`.
- `render` helper wraps UI with shared providers (currently `BrowserRouter`) in `frontend/src/tests/utils/render.tsx`.
- Service tests mock repositories and validation modules (`vi.mock("@/data/repositories/...")`) and assert behavior around success/failure contracts, e.g. `frontend/src/tests/unit/business/services/authService.test.ts`.
- Repository tests mock `apiClient` and assert endpoint strings + normalized throw behavior, e.g. `frontend/src/tests/unit/data/repositories/classRepository.test.ts`.
- Component tests rely on Testing Library interactions/assertions (`screen`, `fireEvent`) and semantic roles, e.g. `frontend/src/tests/unit/presentation/components/ui/Button.test.tsx`.

## 7) Mocking and Isolation Conventions
- Backend commonly mocks external adapters (Supabase, container) and tests pure service/controller logic in isolation.
- Frontend commonly mocks network with MSW for integration-like behavior and directly mocks modules for unit-focused behavior.
- Environment defaults are seeded in setup files (`backend-ts/tests/setup.ts`, `frontend/src/tests/setup.ts`) to reduce per-test boilerplate.
- Store state is reset between tests (`useAuthStore.setState(...)` in service tests and `localStorage.clear()` in setup).

## 8) E2E Coverage (Frontend)
- Playwright is configured for local dev server boot (`command: "npm run dev"`) and base URL `http://localhost:5173` in `frontend/playwright.config.ts`.
- Current suites cover auth/classes/assignments/smoke flows under `frontend/src/tests/e2e/`.
- E2E retries/workers are environment-sensitive (CI vs local) in `frontend/playwright.config.ts`.

## 9) Current Testing Gaps and Risks
- Backend has no true end-to-end HTTP+DB suite with a real Fastify app + real test database transaction isolation; most tests are mocked/unit-level (`backend-ts/tests/api` and `backend-ts/tests/services`).
- Backend integration coverage exists but is narrow (`backend-ts/tests/integration/notification-flow.test.ts`, `email-fallback.test.ts`), so cross-module regressions can slip.
- Frontend heavy mock usage in service/repository tests can miss real contract drift against backend response shape (many assertions rely on mocked `success/data` envelopes).
- Frontend auth pages currently contain inlined form implementations in page files (`frontend/src/presentation/pages/auth/LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx`), which increases UI test maintenance and weakens component-level reuse.
- Playwright config only defines Chromium project; cross-browser regressions (Firefox/WebKit) are not actively covered (`frontend/playwright.config.ts`).

## 10) Practical Testing Guidance for Future Changes
- Add schema tests whenever backend Zod schemas change (`backend-ts/tests/modules/*.schema.test.ts` pattern).
- For backend route logic, follow handler-extraction pattern from `backend-ts/tests/api/submission.controller.test.ts`.
- For frontend API behavior changes, pair repository tests (`frontend/src/tests/unit/data/repositories/*`) with service tests (`frontend/src/tests/unit/business/services/*`).
- Prefer MSW handlers for realistic network paths before adding bespoke per-test fetch mocks (`frontend/src/tests/mocks/handlers.ts`).
- Keep tests in centralized test trees only (no new `*.test.ts(x)` under feature source folders).
