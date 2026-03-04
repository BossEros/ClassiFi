# ClassiFi Repository Structure Map

## 1. Top-Level Layout
- `frontend/`: React + Vite client application.
- `backend-ts/`: Fastify + TypeScript API server.
- `semantic-service/`: Python FastAPI semantic similarity microservice.
- `judge0/`: Local/self-hosted Judge0 stack (Docker Compose).
- `.planning/codebase/`: generated architecture/codebase mapping docs.
- `render.yaml`: environment/deployment blueprint for Render.
- `AGENTS.md`: repository agent workflow and quality rules.

## 2. Frontend Key Locations (`frontend/src`)
- App bootstrap and route assembly:
- `frontend/src/main.tsx`
- `frontend/src/app/App.tsx`
- `frontend/src/app/routes/auth.routes.tsx`
- `frontend/src/app/routes/shared.routes.tsx`
- `frontend/src/app/routes/teacher.routes.tsx`
- `frontend/src/app/routes/admin.routes.tsx`
- Presentation layer (UI pages/components/hooks/schemas):
- `frontend/src/presentation/pages/`
- `frontend/src/presentation/components/`
- `frontend/src/presentation/hooks/`
- `frontend/src/presentation/schemas/`
- Business layer (domain models/services/validation):
- `frontend/src/business/models/`
- `frontend/src/business/services/`
- `frontend/src/business/validation/`
- Data layer (transport/repositories/mapping):
- `frontend/src/data/api/`
- `frontend/src/data/repositories/`
- `frontend/src/data/mappers.ts`
- Shared cross-cutting frontend assets:
- `frontend/src/shared/store/`
- `frontend/src/shared/types/`
- `frontend/src/shared/utils/`

## 3. Backend Key Locations (`backend-ts/src`)
- Runtime bootstrap:
- `backend-ts/src/server.ts`
- `backend-ts/src/app.ts`
- API transport shell:
- `backend-ts/src/api/routes/v1/index.ts`
- `backend-ts/src/api/middlewares/`
- `backend-ts/src/api/plugins/`
- `backend-ts/src/api/schemas/`
- Module-first feature verticals:
- `backend-ts/src/modules/auth/`
- `backend-ts/src/modules/users/`
- `backend-ts/src/modules/classes/`
- `backend-ts/src/modules/assignments/`
- `backend-ts/src/modules/submissions/`
- `backend-ts/src/modules/test-cases/`
- `backend-ts/src/modules/gradebook/`
- `backend-ts/src/modules/dashboard/`
- `backend-ts/src/modules/notifications/`
- `backend-ts/src/modules/plagiarism/`
- `backend-ts/src/modules/admin/`
- Shared/backend infrastructure:
- `backend-ts/src/shared/config.ts`
- `backend-ts/src/shared/container.ts`
- `backend-ts/src/shared/database.ts`
- `backend-ts/src/shared/errors.ts`
- `backend-ts/src/shared/logger.ts`
- Model barrel:
- `backend-ts/src/models/index.ts`
- Cross-module services/interfaces:
- `backend-ts/src/services/`
- `backend-ts/src/services/interfaces/`

## 4. Supporting Services and Infra
- Semantic service app entry and schema/predictor package:
- `semantic-service/main.py`
- `semantic-service/app/schemas.py`
- `semantic-service/app/predictor.py`
- Judge0 local runtime orchestration:
- `judge0/docker-compose.yml`
- `judge0/judge0.conf.template`

## 5. Tests and Quality Locations
- Frontend centralized tests:
- `frontend/src/tests/unit/`
- `frontend/src/tests/e2e/`
- `frontend/src/tests/mocks/`
- `frontend/src/tests/setup.ts`
- Backend centralized tests:
- `backend-ts/tests/`
- Build/typecheck entry scripts:
- `frontend/package.json` (`build`, `test`)
- `backend-ts/package.json` (`typecheck`, `test`)

## 6. Naming and File Conventions (Observed)
- Backend feature file suffixes are role-specific:
- `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `*.schema.ts`, `*.model.ts`, `*.mapper.ts` (example: `backend-ts/src/modules/classes/class.service.ts`).
- Backend multi-word module directories use kebab-case where needed (`backend-ts/src/modules/test-cases/`).
- Frontend page/component/hook files are mostly PascalCase for components/pages (`frontend/src/presentation/pages/auth/LoginPage.tsx`) and camelCase for hooks/utilities (`frontend/src/presentation/hooks/shared/useZodForm.ts`).
- Frontend service/repository naming uses `<domain>Service.ts` and `<domain>Repository.ts` (examples: `frontend/src/business/services/assignmentService.ts`, `frontend/src/data/repositories/assignmentRepository.ts`).
- Schema naming uses explicit domain schema files (examples: `frontend/src/presentation/schemas/auth/authSchemas.ts`, `backend-ts/src/modules/auth/auth.schema.ts`).
- Path alias convention is `@/` in both apps (configured in `frontend/tsconfig.app.json` and `backend-ts/tsconfig.json`).
