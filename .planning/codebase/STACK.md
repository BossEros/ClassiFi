# Technology Stack

**Analysis Date:** 2026-03-08

## Languages

**Primary:**
- TypeScript - Main application language for frontend (`frontend/src/**`) and backend (`backend-ts/src/**`).
- Python - Semantic similarity microservice (`semantic-service/main.py`, `semantic-service/app/**`).

**Secondary:**
- JavaScript - Tooling/config and generated lockfile context (`frontend/eslint.config.js`, `.github/workflows/*.yml`).
- SQL - PostgreSQL schema/migrations via Drizzle and Supabase-backed Postgres (`backend-ts/src/models/*.model.ts`, `backend-ts/drizzle/**`).
- YAML - CI/CD and deployment configuration (`.github/workflows/*.yml`, `render.yaml`, `judge0/docker-compose.yml`, `semantic-service/docker-compose.yml`).
- Shell/PowerShell - Operational scripts and commands in workflow/docs.

## Runtime

**Environment:**
- Node.js 20.x - Backend runtime pinned via `backend-ts/package.json` `engines.node`.
- Browser runtime - Frontend React SPA built by Vite (`frontend`).
- Python 3.11 - Semantic service runtime (`semantic-service/Dockerfile`).
- Docker Compose runtime - Optional self-hosted sidecars (`judge0/`, `semantic-service/docker-compose.yml`).

**Package Manager:**
- npm - Frontend and backend dependency/runtime management (`frontend/package-lock.json`, `backend-ts/package-lock.json`).
- pip - Semantic service Python dependencies (`semantic-service/requirements.txt`).
- Lockfiles: `frontend/package-lock.json`, `backend-ts/package-lock.json` present.

## Frameworks

**Core:**
- React 19 + React Router 7 - Frontend UI and routing (`frontend/package.json`).
- Vite 7 - Frontend bundler/dev server (`frontend/package.json`, `frontend/vite.config.ts`).
- Fastify 5 - Backend HTTP framework (`backend-ts/package.json`, `backend-ts/src/app.ts`).
- Drizzle ORM + postgres client - Data access layer (`backend-ts/package.json`, `backend-ts/src/shared/database.ts`).
- FastAPI + Uvicorn - Semantic similarity service API (`semantic-service/requirements.txt`, `semantic-service/main.py`).

**Testing:**
- Vitest 4 - Unit/integration tests for frontend and backend (`frontend/package.json`, `backend-ts/package.json`).
- Playwright 1.58 - Frontend E2E/browser tests (`frontend/package.json`, `frontend/playwright.config.ts`).

**Build/Dev:**
- TypeScript 5.x - Typed compilation and checking (`frontend/tsconfig*.json`, `backend-ts/tsconfig.json`).
- tsx + tsc-alias - Backend dev runtime and post-build path alias rewrite (`backend-ts/package.json`).
- drizzle-kit - Schema generation/migration tooling (`backend-ts/package.json`, `backend-ts/drizzle.config.ts`).
- Tailwind CSS v4 - Frontend styling (`frontend/package.json`).

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` - Shared auth/storage integration in frontend and backend.
- `fastify` + `@fastify/*` - Core backend transport, multipart uploads, CORS, docs.
- `drizzle-orm` + `postgres` - Backend persistence layer to PostgreSQL.
- `tsyringe` - Dependency injection in backend services/controllers.
- `zod` + `zod-to-json-schema` - Runtime validation and OpenAPI-compatible schema generation.
- `@monaco-editor/react` + `monaco-editor` - In-browser coding interface.

**Infrastructure:**
- `@sendgrid/mail` + `nodemailer` - Email delivery with primary/fallback model.
- `tree-sitter` + language grammars (`tree-sitter-python`, `tree-sitter-java`, `tree-sitter-c`) - Structural plagiarism tokenization pipeline.
- `transformers` + `torch` - Semantic similarity inference in Python sidecar.

## Configuration

**Environment:**
- Backend centralized env validation via Zod (`backend-ts/src/shared/config.ts`) and `.env.example`.
- Frontend env usage through Vite (`frontend/.env.example`, `import.meta.env`).
- Semantic service loads env via Pydantic settings (`semantic-service/app/config.py`).

**Build:**
- Frontend: `frontend/vite.config.ts`, `frontend/tsconfig*.json`, `frontend/vercel.json`.
- Backend: `backend-ts/tsconfig.json`, `backend-ts/drizzle.config.ts`, `backend-ts/vitest.config.ts`.
- Infra: `render.yaml`, `.github/workflows/ci.yml`, `.github/workflows/codeql.yml`.

## Platform Requirements

**Development:**
- Node.js 20+ and npm for frontend/backend.
- Python 3.11 + pip for semantic service development.
- Docker/Docker Compose for optional local Judge0 + Redis/Postgres sidecar stack and semantic sidecar containerization.

**Production:**
- Frontend deployment target: Vercel (`frontend/vercel.json`, CI deploy hook support).
- Backend deployment target: Render Web Service (`render.yaml`).
- Managed Postgres/Auth/Storage dependency: Supabase.
- Optional external runtime dependencies: self-hosted Judge0 API and semantic similarity service endpoint.

---

*Stack analysis: 2026-03-08*
*Update after major dependency changes*
