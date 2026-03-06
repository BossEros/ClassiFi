# ClassiFi Architecture Map

## 1. Repository-Level System Shape
- ClassiFi is a multi-app repository with a browser frontend in `frontend/`, an API backend in `backend-ts/`, a semantic ML sidecar in `semantic-service/`, and optional local code execution infrastructure in `judge0/`.
- The product runtime center is the backend API entry path `backend-ts/src/server.ts` -> `backend-ts/src/app.ts`.
- The frontend runtime entry path is `frontend/src/main.tsx` -> `frontend/src/app/App.tsx`.
- Shared deployment wiring is expressed in `render.yaml`.

## 2. Frontend Architecture (Clean Layering)
- Layering is explicitly `Presentation -> Business -> Data`, documented and implemented under `frontend/src/presentation/`, `frontend/src/business/`, and `frontend/src/data/`.
- Route composition happens in `frontend/src/app/App.tsx` through route modules in `frontend/src/app/routes/*.routes.tsx`.
- Presentation components/pages call business services, e.g. `frontend/src/presentation/pages/teacher/ClassesPage.tsx` imports `frontend/src/business/services/classService.ts`.
- Business services enforce validation and orchestration, then delegate to repositories, e.g. `frontend/src/business/services/classService.ts`.
- Data repositories call transport adapters (`frontend/src/data/api/apiClient.ts`) and map DTOs with `frontend/src/data/mappers.ts`.
- Global app/session UI state is isolated in Zustand stores (`frontend/src/shared/store/useAuthStore.ts`, `frontend/src/shared/store/useToastStore.ts`).
- Auth session synchronization is delegated to `frontend/src/data/api/supabaseAuthAdapter.ts` (initialized in `frontend/src/main.tsx`).

## 3. Backend Architecture (Module-First + Controller/Service/Repository)
- Each feature module under `backend-ts/src/modules/*` co-locates controller/service/repository/schema/model/mapper files.
- HTTP transport layer lives in `backend-ts/src/api/` with middleware, plugins, and v1 route aggregation in `backend-ts/src/api/routes/v1/index.ts`.
- Dependency injection composition is centralized in `backend-ts/src/shared/container.ts` and tokenized via `backend-ts/src/shared/di/tokens.ts`.
- Controllers resolve services via DI and stay thin, e.g. `backend-ts/src/modules/classes/class.controller.ts`.
- Services contain business rules and orchestration, e.g. `backend-ts/src/modules/classes/class.service.ts`.
- Repositories encapsulate Drizzle/Postgres access, e.g. `backend-ts/src/modules/classes/class.repository.ts` using `backend-ts/src/shared/database.ts`.
- Shared cross-cutting concerns are centralized in `backend-ts/src/shared/config.ts`, `backend-ts/src/shared/errors.ts`, and `backend-ts/src/shared/logger.ts`.
- Database table definitions are feature-local but re-exported through `backend-ts/src/models/index.ts`.

## 4. Entry Points and Bootstrap Order
- Frontend:
- `frontend/src/main.tsx` initializes auth listener then renders `App`.
- `frontend/src/app/App.tsx` mounts router, route groups, and `ToastContainer`.
- Backend:
- `backend-ts/src/server.ts` calls `buildApp()` and starts Fastify.
- `backend-ts/src/app.ts` wires CORS/multipart/swagger/validation/error handler/routes and starts plagiarism auto-analysis service.
- API versioning boundary: `backend-ts/src/api/routes/v1/index.ts` mounts auth (public) then protected route groups.
- Semantic sidecar entry: `semantic-service/main.py` exposes `/health` and `/similarity`.

## 5. Dependency Direction Rules (Observed)
- Frontend direction: `presentation/*` -> `business/services/*` -> `data/repositories/*` -> `data/api/*`.
- Backend direction: `modules/*/*.controller.ts` -> `modules/*/*.service.ts` -> `modules/*/*.repository.ts` -> `shared/database.ts`.
- Feature modules depend on shared infrastructure; shared infrastructure does not import feature controllers/services.
- API middleware (`backend-ts/src/api/middlewares/auth.middleware.ts`) depends on auth service; route handlers depend on middleware, not inverse.
- Sidecar integration is outbound only from backend (`backend-ts/src/modules/plagiarism/semantic-similarity.client.ts` -> `semantic-service` HTTP API).

## 6. Module Boundaries
- Frontend boundary contracts:
- UI and hooks are in `frontend/src/presentation/`; no direct `apiClient` use in normal flow.
- Domain-oriented models/validation live in `frontend/src/business/models/` and `frontend/src/business/validation/`.
- Backend boundary contracts:
- Feature APIs are mounted from module index files such as `backend-ts/src/modules/auth/index.ts`, `backend-ts/src/modules/classes/index.ts`, and `backend-ts/src/modules/submissions/index.ts`.
- Admin features are grouped under `backend-ts/src/modules/admin/` with focused services (`admin-user.service.ts`, `admin-class.service.ts`, etc.).

## 7. Data Flow Paths
- Standard UI request:
- `frontend/src/presentation/pages/...` -> service in `frontend/src/business/services/...` -> repository in `frontend/src/data/repositories/...` -> `frontend/src/data/api/apiClient.ts` -> backend controller -> backend service -> backend repository -> PostgreSQL via Drizzle.
- Auth flow:
- frontend uses Supabase SDK (`frontend/src/data/api/supabaseClient.ts` and `supabaseAuthAdapter.ts`) for session, while backend validates bearer tokens in `backend-ts/src/api/middlewares/auth.middleware.ts` via `backend-ts/src/modules/auth/auth.service.ts`.
- Submission test execution:
- backend submission/test services (`backend-ts/src/modules/submissions/submission.service.ts`, `backend-ts/src/modules/test-cases/code-test.service.ts`) call Judge0 client `backend-ts/src/services/judge0.service.ts`.
- Plagiarism analysis:
- plagiarism service `backend-ts/src/modules/plagiarism/plagiarism.service.ts` computes structural similarity and optionally enriches semantic score through `semantic-similarity.client.ts` hitting `semantic-service/main.py`.

## 8. Architectural Patterns in Use
- Frontend: Clean Architecture layering plus centralized API adapter pattern (`apiClient`) and state-store pattern (Zustand).
- Backend: Controller-Service-Repository with DI (`tsyringe`) and module-first vertical slicing.
- Validation pattern: Zod schemas in frontend presentation schemas and backend pre-handler validators (`backend-ts/src/api/plugins/zod-validation.ts`).
- Error handling pattern: domain errors in `backend-ts/src/shared/errors.ts` with unified Fastify error handler in `backend-ts/src/api/middlewares/error-handler.ts`.
