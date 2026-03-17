# ClassiFi

ClassiFi is a full-stack classroom platform focused on programming assignments, grading workflows, and academic integrity tooling.

## Overview

ClassiFi provides role-based experiences for students, teachers, and admins:

- Students can join classes, view assignments, submit code, and monitor grades.
- Teachers can manage classes and assignments, review submissions, run plagiarism analysis, and manage grade overrides.
- Admins can manage users, classes, and system-level operations.

## Core Capabilities

- Programming assignments with Python, Java, and C support
- Test-case based evaluation and manual test execution
- Assignment modules with teacher-side module view and list view workflows
- Teacher submissions workspace with collapsible instructions, per-status metric cards, and a paginated submissions table
- Role-gated hidden test-case detail access (teacher/admin can review hidden inputs/outputs; student view stays masked)
- Late submission policy and late-penalty configuration
- Gradebook with override workflows
- Plagiarism analysis with graph-first review, pairwise comparison, and PDF evidence export
- Role-based access control using Supabase authentication
- Notifications for assignment and grading events, plus per-user notification channel preferences

## Architecture

### Frontend

- Stack: React + TypeScript + Vite + Tailwind CSS v4
- Pattern: Clean Architecture (`presentation -> business -> data`)
- Global UI/auth state: Zustand stores (`useAuthStore`, `useToastStore`)
- Routing: React Router with auth, shared, teacher, student, and admin route groups

### Backend

- Stack: Fastify + TypeScript + Drizzle ORM + PostgreSQL
- Pattern: Controller -> Service -> Repository
- Layout: Module-first under `backend-ts/src/modules/*`
- Dependency Injection: `tsyringe`
- Validation: Zod-based request and environment validation
- Route composition: centralized API v1 registration with protected-route mounting and module entrypoints

## Project Structure

```text
ClassiFi/
|-- frontend/
|   |-- src/
|   |   |-- app/                  # App shell and route registration
|   |   |-- presentation/         # UI components/pages/hooks/schemas
|   |   |-- business/             # Domain models and services
|   |   |-- data/                 # API clients, repositories, mappers
|   |   |-- tests/                # Centralized frontend tests (unit/e2e/mocks/setup)
|   |   `-- shared/               # Shared constants, store, types, utils
|   `-- documentation.md
|
|-- backend-ts/
|   |-- src/
|   |   |-- api/                  # Route aggregator, middleware, plugins
|   |   |-- modules/              # Feature modules (controller/service/repo)
|   |   |-- shared/               # Config, DI, DB, errors, logger
|   |   |-- models/               # Shared model exports
|   |   `-- services/             # Cross-cutting services/interfaces
|   |-- tests/                    # Centralized backend tests (api/services/repos/modules)
|   `-- documentation.md
|
|-- judge0/                       # Local Judge0 setup (optional)
|-- semantic-service/             # Semantic similarity sidecar service
|-- render.yaml                   # Render deployment configuration
|-- AGENTS.md                     # Agent development rules
`-- README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Supabase project (Auth/DB/Storage)
- Optional: Judge0 instance for code execution

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Default dev URL: `http://localhost:5173`

### Backend

```bash
cd backend-ts
npm install
npm run dev
```

Default API URL: `http://localhost:8001`

Backend environment variables are documented in [backend-ts/documentation.md](./backend-ts/documentation.md).

### Optional Judge0

```bash
cd judge0
docker-compose up -d
```

Default Judge0 URL: `http://localhost:2358`

## Testing and Quality

### Frontend

```bash
cd frontend
npm run build
npm test
```

Unit test location: `frontend/src/tests/unit/**/*.test.ts(x)`
E2E test location: `frontend/src/tests/e2e/**/*.spec.ts`

### Backend

```bash
cd backend-ts
npm run typecheck
npm test
```

Unit/integration test location: `backend-ts/tests/**/*.test.ts`

### Test Placement Rules

- Frontend unit tests must stay under `frontend/src/tests/unit/**`.
- Frontend E2E tests must stay under `frontend/src/tests/e2e/**`.
- Backend tests must stay under `backend-ts/tests/**` (for example: `api/`, `services/`, `repositories/`, `modules/`, `integration/`).
- Do not add new test files inside `frontend/src/**` feature folders or `backend-ts/src/**`.

## Deployment

- Frontend: Vercel
- Backend: Render
- Database/Auth/Storage: Supabase
- Judge0: self-hosted
- Semantic similarity sidecar: `semantic-service/`

Deployment configuration currently lives in `render.yaml`, backend/frontend environment docs, and service-specific folders such as `judge0/` and `semantic-service/`.

## Documentation

- [frontend/documentation.md](./frontend/documentation.md)
- [backend-ts/documentation.md](./backend-ts/documentation.md)
- [AGENTS.md](./AGENTS.md)
- [implementation_plan.md](./implementation_plan.md)

