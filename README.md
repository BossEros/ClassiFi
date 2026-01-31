# ClassiFi

A full-stack web application for classroom management and interaction, built as an undergraduate Computer Science thesis project.

## 🚀 Overview

ClassiFi is a modern platform designed to facilitate interaction between instructors and students. It features classroom management, assignment tracking, automated code grading, and plagiarism detection.

### Key Features

- **Multi-language Support**: Python, Java, and C programming assignments
- **Automated Testing**: Judge0-powered code execution with configurable test cases
- **Plagiarism Detection**: Winnowing-based similarity detection with AST parsing
- **Grade Management**: Automated grading with late penalties and manual overrides
- **Admin Dashboard**: Comprehensive user and class management
- **Real-time Feedback**: Instant test results and submission history
- **Secure Authentication**: Supabase-powered auth with role-based access control

## 🛠️ Technology Stack

### Frontend

- **Framework:** React 19 + TypeScript 5.9
- **Build Tool:** Vite 7
- **Styling:** Tailwind CSS 4
- **Architecture:** Clean Architecture (Presentation → Business → Data)
- **Code Editor:** Monaco Editor 0.55
- **Testing:** Vitest 4 + Playwright 1.58

### Backend

- **Framework:** Fastify 5 (Node.js/TypeScript)
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Drizzle ORM 0.36
- **Authentication:** Supabase Auth 2.93
- **Code Execution:** Judge0
- **Code Analysis:** Tree-Sitter 0.25
- **Dependency Injection:** tsyringe
- **Testing:** Vitest 4

### Infrastructure

- **Database & Auth:** Supabase
- **File Storage:** Supabase Storage
- **Code Execution:** Judge0 (self-hosted via Docker)
- **Deployment:** Vercel (Frontend) + Render (Backend)

## 🏁 Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended)
- pnpm
- PostgreSQL database (or Supabase account)
- Judge0 instance (optional, for code execution)

### 1. Frontend Setup

```bash
cd frontend
pnpm install
cp .env.example .env
# Configure environment variables in .env
pnpm dev
# App runs at http://localhost:5173
```

### 2. Backend Setup

```bash
cd backend-ts
pnpm install
cp .env.example .env
# Configure environment variables in .env
pnpm dev
# Server runs at http://localhost:8001
```

### 3. Judge0 Setup (Optional)

For code execution features:

```bash
cd judge0
docker-compose up -d
# Judge0 API runs at http://localhost:2358
```

## 📂 Project Structure

```text
ClassiFi/
├── frontend/              # React 19 + TypeScript frontend
│   ├── business/          # Business logic layer
│   ├── data/              # Data access layer
│   ├── presentation/      # UI components and pages
│   │   ├── components/    # Reusable components
│   │   │   ├── admin/     # Admin management UI
│   │   │   ├── plagiarism/# Plagiarism detection UI
│   │   │   ├── gradebook/ # Grade management UI
│   │   │   └── ui/        # Base UI components
│   │   └── pages/         # Route pages
│   └── shared/            # Shared utilities
│
├── backend-ts/            # Fastify + TypeScript backend
│   ├── src/
│   │   ├── api/           # Controllers, routes, schemas
│   │   │   └── controllers/
│   │   │       └── admin/ # Admin-specific controllers
│   │   ├── lib/           # External libraries
│   │   │   └── plagiarism/# Plagiarism detection engine
│   │   ├── models/        # Database models (Drizzle)
│   │   ├── repositories/  # Data access layer
│   │   ├── services/      # Business logic
│   │   │   └── admin/     # Admin services
│   │   └── shared/        # Shared utilities
│   └── tests/             # Unit tests
│
├── judge0/                # Judge0 Docker configuration
│   └── docker-compose.yml
│
└── docs/                  # Documentation
    └── DEPLOYMENT.md
```

## 🚀 Deployment

ClassiFi is configured for automatic deployment:

| Component       | Platform                         | Status              | URL                                    |
| --------------- | -------------------------------- | ------------------- | -------------------------------------- |
| Frontend        | [Vercel](https://vercel.com)     | Auto-deploy on push | Production URL from Vercel             |
| Backend         | [Render](https://render.com)     | Auto-deploy on push | Production URL from Render             |
| Database & Auth | [Supabase](https://supabase.com) | Managed             | Configured via environment variables   |
| Judge0          | Self-hosted (Docker)             | Manual deployment   | Requires separate server configuration |

See **[Deployment Guide](./docs/DEPLOYMENT.md)** for detailed setup instructions.

## 📚 Documentation

For more detailed information, please refer to:

- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Deploy to Vercel & Render
- **[Frontend Documentation](./frontend/documentation.md)** - Architecture, components, and services
- **[Backend Documentation](./backend-ts/documentation.md)** - API reference, services, and database
- **[Agent Guidelines](./AGENTS.md)** - Development standards and workflows

## 🧪 Testing

### Frontend
```bash
cd frontend
pnpm test              # Unit tests (Vitest)
pnpm test:e2e          # E2E tests (Playwright)
```

### Backend
```bash
cd backend-ts
pnpm test              # Unit tests (Vitest)
pnpm test:coverage     # With coverage report
pnpm typecheck         # TypeScript validation
```

## 🎨 Code Quality

Both frontend and backend use:
- **Prettier 3.8** for code formatting
- **ESLint 9** for linting
- **TypeScript 5** for type safety
- **Vitest 4** for testing

```bash
pnpm format            # Format code
pnpm format:check      # Check formatting
pnpm lint              # Run linter
```

## 👥 Authors

- **Christian Dave Vilan** - Project Developer

## 📄 License

This project is created for academic purposes as part of an undergraduate Computer Science thesis.
