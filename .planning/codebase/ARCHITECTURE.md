# Architecture

**Analysis Date:** 2026-03-08

## Pattern Overview

**Overall:** Multi-service full-stack monolith workspace with layered frontend + modular layered backend.

**Key Characteristics:**
- Frontend uses Clean Architecture-style separation: `presentation -> business -> data`.
- Backend uses module-first Controller -> Service -> Repository with dependency injection (`tsyringe`).
- Shared authentication boundary through Supabase (frontend session + backend token verification).
- Auxiliary compute services (Judge0 + semantic similarity sidecar) are integrated as infrastructure dependencies.

## Layers

**Frontend Presentation Layer:**
- Purpose: Render UI, manage interactions, route guarding, and form UX.
- Contains: React pages/components/hooks/schemas in `frontend/src/presentation/**`, route wiring in `frontend/src/app/**`.
- Depends on: Business services and shared store/types (`frontend/src/business/**`, `frontend/src/shared/**`).
- Used by: Browser entry point `frontend/src/main.tsx` and route tree in `frontend/src/app/App.tsx`.

**Frontend Business Layer:**
- Purpose: Client-side business rules, input validation, orchestration of repository calls.
- Contains: Service modules and validators in `frontend/src/business/services/**`, `frontend/src/business/validation/**`.
- Depends on: Data repositories and shared/domain models.
- Used by: Presentation components/pages/hooks.

**Frontend Data Layer:**
- Purpose: External I/O for frontend (HTTP API, Supabase auth/storage adapters, DTO mapping).
- Contains: `frontend/src/data/api/**`, `frontend/src/data/repositories/**`, `frontend/src/data/mappers.ts`.
- Depends on: External services (backend API + Supabase SDK).
- Used by: Business services.

**Backend API/Transport Layer:**
- Purpose: HTTP app bootstrapping, middleware, request validation, route registration.
- Contains: `backend-ts/src/app.ts`, `backend-ts/src/api/**`, route aggregator `backend-ts/src/api/routes/v1/index.ts`.
- Depends on: Module controllers/services via DI container.
- Used by: Server startup (`backend-ts/src/server.ts`) and HTTP clients.

**Backend Domain Module Layer:**
- Purpose: Feature-specific domain behavior with module colocation.
- Contains: `backend-ts/src/modules/*` (auth, classes, assignments, submissions, gradebook, notifications, plagiarism, admin, dashboard, users, test-cases).
- Depends on: Shared infra (`backend-ts/src/shared/**`), cross-cutting services, repositories.
- Used by: API routes and other domain services.

**Backend Data Access Layer:**
- Purpose: Persistence and query composition.
- Contains: Module repositories `backend-ts/src/modules/*/*.repository.ts`, shared `backend-ts/src/repositories/base.repository.ts`, DB config `backend-ts/src/shared/database.ts`.
- Depends on: Drizzle ORM/Postgres.
- Used by: Module services.

**Infrastructure/External Services Layer:**
- Purpose: External platform integration and specialized execution.
- Contains: Backend adapters/services in `backend-ts/src/services/**`, semantic sidecar in `semantic-service/**`, Judge0 docker setup in `judge0/**`.
- Depends on: Supabase, SendGrid/SMTP, Judge0, semantic model service.
- Used by: Backend services and plagiarism pipeline.

## Data Flow

**Primary User Request Flow (Frontend -> Backend):**
1. Browser starts app in `frontend/src/main.tsx` and initializes Supabase auth listener.
2. Route tree in `frontend/src/app/App.tsx` selects protected/role-based page components.
3. Presentation component calls business service (for example `frontend/src/business/services/classService.ts`).
4. Business service validates inputs and calls repository (for example `frontend/src/data/repositories/classRepository.ts`).
5. Repository uses `apiClient` (`frontend/src/data/api/apiClient.ts`) to call backend `/api/v1/*` routes with bearer token from Supabase session.
6. Backend Fastify app (`backend-ts/src/app.ts`) routes to module controller via `backend-ts/src/api/routes/v1/index.ts`.
7. Middleware validates auth (`backend-ts/src/api/middlewares/auth.middleware.ts`) and body/query/params (`backend-ts/src/api/plugins/zod-validation.ts`).
8. Controller invokes service resolved from DI container (`backend-ts/src/shared/container.ts`).
9. Service executes business rules and delegates persistence to repository.
10. Repository reads/writes Postgres via Drizzle and returns domain data.
11. Controller sends standardized JSON payload; frontend repository/service maps and returns to UI.

**Authentication Session Flow:**
1. Frontend login path calls `frontend/src/business/services/authService.ts`.
2. Repository uses `frontend/src/data/api/supabaseAuthAdapter.ts` for `signInWithPassword`.
3. Frontend verifies profile through backend `/auth/verify`.
4. Backend `AuthService` (`backend-ts/src/modules/auth/auth.service.ts`) validates token through `SupabaseAuthAdapter` and resolves local user via `UserRepository`.
5. Frontend stores user profile in Zustand `useAuthStore`; Supabase handles token refresh lifecycle.

**Submission + Analysis Sidecar Flow:**
1. Student submission hits backend submission module (`backend-ts/src/modules/submissions/*`).
2. Test execution service uses Judge0 adapter (`backend-ts/src/services/judge0.service.ts`) and routes in test-cases module.
3. Plagiarism module orchestrates detector + persistence + optional semantic similarity sidecar (`backend-ts/src/modules/plagiarism/*`).
4. Semantic score enrichment calls `SEMANTIC_SERVICE_URL` sidecar (`semantic-service/main.py`).

**State Management:**
- Frontend: Local component state + minimal global Zustand (`frontend/src/shared/store/useAuthStore.ts`, `useToastStore.ts`).
- Backend: Request-scoped stateless HTTP handling with persistent Postgres storage; background auto-analysis scheduler inside backend app lifecycle.

## Key Abstractions

**Service Abstraction (Frontend):**
- Purpose: Keep UI components thin by centralizing client-side rules.
- Examples: `frontend/src/business/services/authService.ts`, `classService.ts`, `assignmentService.ts`.
- Pattern: Module-level function service facade.

**Repository Abstraction (Frontend):**
- Purpose: Isolate transport/API specifics from business services.
- Examples: `frontend/src/data/repositories/authRepository.ts`, `classRepository.ts`.
- Pattern: API repository wrapping shared `ApiClient`.

**Service Abstraction (Backend):**
- Purpose: Feature business logic and orchestration.
- Examples: `backend-ts/src/modules/auth/auth.service.ts`, `assignment.service.ts`, `plagiarism.service.ts`.
- Pattern: Injectable class services resolved through DI tokens.

**Repository Abstraction (Backend):**
- Purpose: Persistent data operations and query composition.
- Examples: `backend-ts/src/modules/classes/class.repository.ts`, `submissions/submission.repository.ts`, `dashboard/dashboard-query.repository.ts`.
- Pattern: Repository classes with base repository and transaction helpers.

**DI Token Registry:**
- Purpose: Stable indirection for service/repository/adapters.
- Examples: `backend-ts/src/shared/di/tokens.ts`, registration in `backend-ts/src/shared/container.ts`.
- Pattern: Tokenized dependency injection container.

**Schema + Validation Boundary:**
- Purpose: Runtime contract validation at API boundary and forms.
- Examples: Backend schemas (`backend-ts/src/modules/*/*.schema.ts`), frontend schemas (`frontend/src/presentation/schemas/**`).
- Pattern: Zod schema validation before business logic.

## Entry Points

**Frontend App Entry:**
- Location: `frontend/src/main.tsx`
- Triggers: Browser loads Vite SPA.
- Responsibilities: Initialize auth listener, mount React root and app shell.

**Frontend Route Composition Entry:**
- Location: `frontend/src/app/App.tsx`
- Triggers: React render lifecycle.
- Responsibilities: Register route groups and global toast container.

**Backend Runtime Entry:**
- Location: `backend-ts/src/server.ts`
- Triggers: Node process start.
- Responsibilities: Build Fastify app, listen on configured port, graceful shutdown.

**Backend App Factory Entry:**
- Location: `backend-ts/src/app.ts`
- Triggers: Called by `server.ts`.
- Responsibilities: Configure plugins/middleware, health routes, register v1 API routes, start/stop background plagiarism auto-analysis service.

**Semantic Service Entry:**
- Location: `semantic-service/main.py`
- Triggers: Sidecar process start.
- Responsibilities: Serve semantic similarity scoring API for plagiarism pipeline.

## Error Handling

**Strategy:** Layered exception handling with global Fastify error middleware on backend and normalized API error objects on frontend.

**Patterns:**
- Backend throws typed domain errors (`backend-ts/src/shared/errors.ts`) from services/repositories.
- Global handler (`backend-ts/src/api/middlewares/error-handler.ts`) maps exceptions to HTTP responses.
- Frontend `ApiClient` normalizes diverse server/network error payloads and sanitizes user-facing messages.
- Frontend services convert validation failures into actionable UI messages before network calls.

## Cross-Cutting Concerns

**Logging:**
- Backend centralized logger factory in `backend-ts/src/shared/logger.ts`; used across server/services/middleware.

**Validation:**
- Backend request validation via Zod pre-handlers (`backend-ts/src/api/plugins/zod-validation.ts`) and module schemas.
- Frontend input validation in `frontend/src/business/validation/**` and `frontend/src/presentation/schemas/**`.

**Authentication & Authorization:**
- Supabase-backed auth boundary with frontend session management and backend token verification.
- Backend protected route grouping in `backend-ts/src/api/routes/v1/index.ts` + role middleware where needed.

**Configuration:**
- Backend environment validation/fail-fast config in `backend-ts/src/shared/config.ts`.
- Frontend environment-driven API/Supabase endpoints via Vite env usage in data API modules.

**Testing Architecture:**
- Frontend centralized tests under `frontend/src/tests/**` split by layer (`unit/business`, `unit/data`, `unit/presentation`, `unit/shared`) and E2E.
- Backend centralized tests under `backend-ts/tests/**` split by `api`, `services`, `repositories`, `modules`, `integration`.

---

*Architecture analysis: 2026-03-08*
*Update when major patterns change*
