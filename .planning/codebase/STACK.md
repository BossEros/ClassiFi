# ClassiFi Technology Stack

## Repository Shape
- Monorepo-style layout with primary apps in `frontend/`, `backend-ts/`, `semantic-service/`, and `judge0/`.
- Root deployment blueprint is defined in `render.yaml`.
- High-level architecture references are in `frontend/documentation.md` and `backend-ts/documentation.md`.

## Languages and Runtimes
- Frontend language/runtime: TypeScript + React running in browser, bundled by Vite (`frontend/package.json`, `frontend/vite.config.ts`).
- Backend language/runtime: TypeScript on Node.js 20.x (`backend-ts/package.json`, `backend-ts/tsconfig.json`).
- Semantic sidecar language/runtime: Python 3.11 + FastAPI/Uvicorn (`semantic-service/Dockerfile`, `semantic-service/main.py`).
- Code execution stack runtime: Judge0 containers + Redis + Postgres (`judge0/docker-compose.yml`, `judge0/judge0.conf.template`).

## Frontend Frameworks and Major Dependencies
- UI framework: `react` and `react-dom` v19 (`frontend/package.json`).
- Router: `react-router-dom` (`frontend/package.json`).
- Styling: Tailwind CSS v4 via Vite plugin `@tailwindcss/vite` (`frontend/package.json`, `frontend/vite.config.ts`).
- Forms/validation: `react-hook-form`, `@hookform/resolvers`, `zod` (`frontend/package.json`).
- State management: `zustand` (`frontend/package.json`).
- Supabase SDK: `@supabase/supabase-js` (`frontend/package.json`, `frontend/src/data/api/supabaseClient.ts`).
- Editor and calendars: `@monaco-editor/react`, `monaco-editor`, `react-big-calendar` (`frontend/package.json`).
- Frontend API transport uses native `fetch` through centralized client in `frontend/src/data/api/apiClient.ts`.

## Backend Frameworks and Major Dependencies
- HTTP framework: `fastify` with `@fastify/cors`, `@fastify/multipart` (`backend-ts/package.json`, `backend-ts/src/app.ts`).
- API docs: `@fastify/swagger` + `@fastify/swagger-ui` (`backend-ts/package.json`, `backend-ts/src/api/plugins/swagger.ts`).
- Validation: `zod` + `zod-to-json-schema` (`backend-ts/package.json`).
- ORM/database: `drizzle-orm` with `postgres` driver (`backend-ts/package.json`, `backend-ts/src/shared/database.ts`).
- Dependency injection: `tsyringe` + decorators metadata (`backend-ts/package.json`, `backend-ts/src/shared/container.ts`, `backend-ts/tsconfig.json`).
- Logging: `pino` wrapped by internal logger (`backend-ts/package.json`, `backend-ts/src/shared/logger.ts`).
- External service SDKs: `@supabase/supabase-js`, `@sendgrid/mail`, `nodemailer` (`backend-ts/package.json`).
- Plagiarism parsing libs: `tree-sitter`, `tree-sitter-python`, `tree-sitter-java`, `tree-sitter-c` (`backend-ts/package.json`).

## Semantic Service Stack
- API framework: `fastapi` and `uvicorn` (`semantic-service/requirements.txt`, `semantic-service/main.py`).
- ML stack: `transformers`, `torch` (CPU build) (`semantic-service/requirements.txt`, `semantic-service/Dockerfile`).
- Runtime model orchestration and inference code live in `semantic-service/app/predictor.py` and `semantic-service/app/config.py`.

## Testing and Quality Tooling
- Frontend unit tests: Vitest + jsdom (`frontend/vitest.config.ts`, `frontend/package.json`).
- Frontend E2E tests: Playwright (`frontend/playwright.config.ts`, `frontend/package.json`).
- Backend tests: Vitest in Node environment (`backend-ts/vitest.config.ts`, `backend-ts/package.json`).
- Linting: ESLint configurations in `frontend/eslint.config.js` and `backend-ts/eslint.config.js`.
- Formatting: Prettier base config in `.prettierrc`; package scripts in both `frontend/package.json` and `backend-ts/package.json`.

## Configuration Locations (Practical Map)
- Frontend env and app endpoints: `frontend/.env.example`.
- Frontend TypeScript configs: `frontend/tsconfig.json`, `frontend/tsconfig.app.json`, `frontend/tsconfig.node.json`, `frontend/tsconfig.test.json`.
- Frontend bundler config: `frontend/vite.config.ts`.
- Backend env validation and typed settings: `backend-ts/src/shared/config.ts`.
- Backend sample env: `backend-ts/.env.example`.
- Backend server/app bootstrap: `backend-ts/src/server.ts`, `backend-ts/src/app.ts`.
- Backend DB generation config: `backend-ts/drizzle.config.ts` (targets output `./drizzle`, currently config-defined).
- Judge0 infra config: `judge0/docker-compose.yml`, `judge0/judge0.conf.template`.
- Semantic sidecar infra config: `semantic-service/docker-compose.yml`, `semantic-service/Dockerfile`.
- Cloud deployment blueprint: `render.yaml`.
