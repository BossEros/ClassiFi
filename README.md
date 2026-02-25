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
- Teacher submissions workspace with collapsible instructions, per-status metric cards, and a paginated submissions table
- Role-gated hidden test-case detail access (teacher/admin can review hidden inputs/outputs; student view stays masked)
- Late submission policy and late-penalty configuration
- Gradebook with override workflows
- Plagiarism analysis with student-centric and pairwise views
- Role-based access control using Supabase authentication
- Notifications for assignment and grading events

## Architecture

### Frontend

- Stack: React + TypeScript + Vite + Tailwind CSS
- Pattern: Clean Architecture (`presentation -> business -> data`)
- Global UI/auth state: Zustand stores (`useAuthStore`, `useToastStore`)
- Routing: React Router with protected and role-based route wrappers

### Backend

- Stack: Fastify + TypeScript + Drizzle ORM + PostgreSQL
- Pattern: Controller -> Service -> Repository
- Layout: Module-first under `backend-ts/src/modules/*`
- Dependency Injection: `tsyringe`
- Validation: Zod-based request and environment validation

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
|-- docs/                         # Deployment and supporting docs
|-- AGENTS.md                     # Agent development rules
`-- README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
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
cp .env.example .env
npm run dev
```

Default API URL: `http://localhost:8001`

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

### Backend

```bash
cd backend-ts
npm run typecheck
npm test
```

Unit/integration test location: `backend-ts/tests/**/*.test.ts`

## Deployment

- Frontend: Vercel
- Backend: Render
- Database/Auth/Storage: Supabase
- Judge0: self-hosted

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for deployment details.

## Documentation

- [frontend/documentation.md](./frontend/documentation.md)
- [backend-ts/documentation.md](./backend-ts/documentation.md)
- [AGENTS.md](./AGENTS.md)

