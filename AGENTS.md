# ClassiFi Agent Guidelines

This document serves as the primary reference for AI agents working on the ClassiFi codebase. Follow these guidelines to ensure consistency, maintainability, and high-quality code.

## 1. Project Context & Tech Stack

### Frontend (`/frontend`)

- **Framework**: React 19 + Vite
- **Styling**: TailwindCSS v4
- **Icons**: Lucide React
- **Editor**: Monaco Editor (`@monaco-editor/react`)
- **Testing**: Vitest, Playwright
- **State/Data**: React Hooks, Supabase Client

### Backend (`/backend-ts`)

- **Runtime**: Node.js
- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Dependency Injection**: Tsyringe
- **Validation**: Zod (`fastify-type-provider-zod`)
- **Testing**: Vitest

## 2. Core Principles & User Rules

> [!IMPORTANT]
> These rules are mandatory and must be followed without exception.

1.  **Best Practices & Guidance**
    - **ALWAYS** refer to or use the **Context7 MCP** or **Ref MCP** for guidance on coding best practices.
    - **ALWAYS** use **Exa MCP** or **Perplexity MCP** for browser searches or any external research.

2.  **Code Quality & Standards**
    - **SOLID & DRY**: Always apply SOLID (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion) and DRY (Don't Repeat Yourself) principles.
    - **Descriptive Naming**: Use clear, verbose names for variables, functions, and classes.
    - **Systematic Approach**: Do everything systematically. Plan -> Implement -> Verify.

3.  **Implementation Strategy**
    - **Reuse First**: Always check for similar or identical methods in the codebase before writing new ones. Reuse existing utilities and repositories whenever possible.
    - **Architecture Awareness**: Always take into consideration the architectural pattern that the codebase is following (e.g., Repository pattern in backend, Component composition in frontend).

## 3. Agent Workflow

1.  **Exploration**:
    - Start by exploring relevant files using `list_dir` and `view_file_outline`.
    - Use `grep_search` to find usage patterns of existing components or functions.

2.  **Planning**:
    - Create an `implementation_plan.md` for complex tasks.
    - Break down work into small, verifiable steps.

3.  **Verification**:
    - **Frontend**: Run `npm run build` in `/frontend` to check for type errors.
    - **Backend**: Run `npm test` in `/backend-ts` to ensure no regressions.

If you are gonna use your integrated browser to simulate or test the system, you can use the following credentials to login.

Teacher account
Email: namisvilan@gmail.com
Password: Qwerty123!

Student account
Email: marfiezeros@gmail.com
Password: Qwerty123!
