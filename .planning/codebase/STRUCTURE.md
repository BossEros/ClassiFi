# Codebase Structure

**Analysis Date:** 2026-03-08

## Directory Layout

```text
ClassiFi/
+-- frontend/                  # React SPA client (Clean Architecture layers)
¦   +-- src/
¦   ¦   +-- app/              # App shell + route composition
¦   ¦   +-- presentation/     # UI components/pages/hooks/schemas
¦   ¦   +-- business/         # Client business services + validation
¦   ¦   +-- data/             # API clients, repositories, mappers
¦   ¦   +-- shared/           # Cross-cutting store/types/utils/constants
¦   ¦   +-- tests/            # Centralized frontend tests (unit/e2e/mocks)
¦   +-- public/               # Static assets
¦   +-- documentation.md      # Frontend architecture guide
+-- backend-ts/                # Fastify API server (module-first)
¦   +-- src/
¦   ¦   +-- api/              # Middleware/plugins/route aggregation
¦   ¦   +-- modules/          # Feature modules (controller/service/repository)
¦   ¦   +-- services/         # Infra adapters (email, storage, auth, judge0)
¦   ¦   +-- repositories/     # Shared base repository abstractions
¦   ¦   +-- shared/           # DI/config/db/errors/logger/transaction utils
¦   ¦   +-- lib/              # Internal plagiarism algorithm library
¦   ¦   +-- app.ts            # Fastify app composition
¦   ¦   +-- server.ts         # Process entry/startup
¦   +-- tests/                # Centralized backend tests
¦   +-- drizzle/              # DB schema/migrations
¦   +-- documentation.md      # Backend architecture guide
+-- semantic-service/          # Python semantic similarity sidecar service
+-- judge0/                    # Local Judge0 docker runtime config
+-- dolos-main/                # Vendored external Dolos project sources
+-- .planning/                 # Planning/research/roadmap artifacts
+-- AGENTS.md                  # Agent operating rules
+-- README.md                  # Repository overview
+-- render.yaml                # Deployment blueprint
```

## Directory Purposes

**frontend/**
- Purpose: User-facing single-page application for student/teacher/admin flows.
- Contains: Vite React app, layered `src/` architecture, frontend tests.
- Key files: `frontend/src/main.tsx`, `frontend/src/app/App.tsx`, `frontend/documentation.md`.
- Subdirectories: `app`, `presentation`, `business`, `data`, `shared`, `tests`.

**backend-ts/**
- Purpose: REST API and business backend for class/assignment/submission workflows.
- Contains: Fastify server, module-first domain code, centralized tests, Drizzle DB assets.
- Key files: `backend-ts/src/server.ts`, `backend-ts/src/app.ts`, `backend-ts/src/api/routes/v1/index.ts`, `backend-ts/documentation.md`.
- Subdirectories: `src/api`, `src/modules`, `src/services`, `src/shared`, `tests`, `drizzle`.

**semantic-service/**
- Purpose: Semantic similarity scoring sidecar consumed by backend plagiarism module.
- Contains: Python service entry and app modules.
- Key files: `semantic-service/main.py`, `semantic-service/app/predictor.py`, `semantic-service/app/schemas.py`.
- Subdirectories: `app/`.

**judge0/**
- Purpose: Local infrastructure configuration for code execution engine.
- Contains: Docker Compose and service config template.
- Key files: `judge0/docker-compose.yml`, `judge0/judge0.conf.template`.
- Subdirectories: none.

**dolos-main/**
- Purpose: Included upstream plagiarism tooling project for reference/integration context.
- Contains: Multi-package upstream source (API/CLI/core/parsers/web/docs).
- Key files: `dolos-main/dolos-main/README.md`, package manifests, Docker files.
- Subdirectories: `api`, `cli`, `core`, `lib`, `parsers`, `web`, `docs`.

**.planning/**
- Purpose: Project planning state and research artifacts.
- Contains: roadmap/state/phase documents and codebase mapping docs.
- Key files: `.planning/PROJECT.md`, `.planning/ROADMAP.md`, `.planning/STATE.md`.
- Subdirectories: `phases`, `research`, `codebase`.

## Key File Locations

**Entry Points:**
- `frontend/src/main.tsx`: Frontend application bootstrap.
- `frontend/src/app/App.tsx`: Frontend route and shell composition.
- `backend-ts/src/server.ts`: Backend process startup.
- `backend-ts/src/app.ts`: Fastify app factory + route/plugin registration.
- `semantic-service/main.py`: Semantic sidecar process entry.

**Configuration:**
- `frontend/vite.config.ts`: Frontend bundler/build config.
- `frontend/tsconfig*.json`: Frontend TypeScript settings.
- `backend-ts/src/shared/config.ts`: Backend env validation + typed settings.
- `backend-ts/drizzle.config.ts`: ORM/migration config.
- `render.yaml`: Deployment/service wiring.
- `judge0/docker-compose.yml`: Local Judge0 stack.

**Core Logic:**
- `frontend/src/business/services/**`: Frontend use-case orchestration.
- `frontend/src/data/repositories/**`: Frontend transport layer.
- `backend-ts/src/modules/**`: Backend feature modules.
- `backend-ts/src/services/**`: Backend external/infrastructure adapters.
- `backend-ts/src/lib/plagiarism/**`: Internal algorithmic library.

**Testing:**
- `frontend/src/tests/unit/**`: Frontend unit tests grouped by layer.
- `frontend/src/tests/e2e/**`: Frontend Playwright tests.
- `backend-ts/tests/**`: Backend API/service/repository/module/integration tests.

**Documentation:**
- `README.md`: Monorepo overview.
- `AGENTS.md`: Global coding and workflow standards.
- `frontend/documentation.md`: Frontend architecture and patterns.
- `backend-ts/documentation.md`: Backend architecture and conventions.

## Naming Conventions

**Files:**
- Frontend React components: `PascalCase.tsx` (example: `ClassDetailPage.tsx`, `NotificationBadge.tsx`).
- Frontend services/repos/utils: `camelCase.ts` (example: `classService.ts`, `formErrorMap.ts`).
- Backend modules/services/repos/controllers/schemas: `kebab-case` with role suffix (example: `auth.service.ts`, `class.controller.ts`, `notification-preference.repository.ts`).
- Tests: `*.test.ts` / `*.test.tsx` in centralized test directories.

**Directories:**
- Frontend feature/UI folders: mostly lowercase by domain (`teacher`, `student`, `shared`, `admin`).
- Backend module folders: lowercase plural or domain nouns (`auth`, `classes`, `test-cases`, `notifications`).
- Planning folders: uppercase filenames for key artifacts (`PROJECT.md`, `ROADMAP.md`).

**Special Patterns:**
- `index.ts` / `index.tsx` used for barrel exports and route-module entrypoints.
- Backend module colocation pattern: `{feature}.{controller|service|repository|schema|mapper|model}.ts` inside `backend-ts/src/modules/<feature>/`.
- Frontend architecture partition by layer in `frontend/src/{presentation,business,data,shared}`.

## Where to Add New Code

**New Frontend Feature:**
- Primary code: `frontend/src/presentation/pages/<role>/` and `frontend/src/presentation/components/<role-or-shared>/`.
- Business orchestration: `frontend/src/business/services/`.
- Data access: `frontend/src/data/repositories/` (+ `frontend/src/data/api/*.types.ts` when contracts change).
- Tests: `frontend/src/tests/unit/<layer>/...` and optional `frontend/src/tests/e2e/`.

**New Backend Feature Module:**
- Implementation: `backend-ts/src/modules/<feature>/` with controller/service/repository/schema/model/mapper.
- Route registration: `backend-ts/src/modules/<feature>/index.ts` then wire in `backend-ts/src/api/routes/v1/index.ts`.
- DI registration: `backend-ts/src/shared/container.ts` and token update in `backend-ts/src/shared/di/tokens.ts`.
- Tests: `backend-ts/tests/services`, `backend-ts/tests/repositories`, `backend-ts/tests/api` (and integration where needed).

**New Cross-Cutting Utility:**
- Frontend shared helper/type/store: `frontend/src/shared/{utils,types,store}`.
- Backend shared concern: `backend-ts/src/shared/` or `backend-ts/src/services/interfaces/` for contracts.

**New External Integration:**
- Backend adapter/service: `backend-ts/src/services/`.
- Feature orchestration entry: relevant backend module service (`backend-ts/src/modules/<feature>/*.service.ts`).
- Environment/config additions: `backend-ts/src/shared/config.ts` and `.env.example`.

## Special Directories

**backend-ts/dist/**
- Purpose: Compiled backend build artifacts.
- Source: Generated by backend build step.
- Committed: No (build output).

**backend-ts/coverage/**
- Purpose: Test coverage reports.
- Source: Generated by test coverage commands.
- Committed: No (report artifact).

**frontend/node_modules/** and `backend-ts/node_modules/`
- Purpose: Installed dependencies.
- Source: Package manager install.
- Committed: No.

**output/**
- Purpose: Local generated outputs/artifacts from tooling workflows.
- Source: Runtime/tool generated.
- Committed: Typically no.

**dolos-main/**
- Purpose: Upstream code copy, separate from primary frontend/backend runtime code paths.
- Source: Vendored external project.
- Committed: Yes.

---

*Structure analysis: 2026-03-08*
*Update when directory structure changes*
