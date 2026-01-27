# ClassiFi Agent Guidelines

This document is the **primary operational playbook** for AI agents working on ClassiFi. Strict adherence to these guidelines ensures code quality, architectural integrity, and system stability.

## 1. 📚 Documentation First

Before making any changes, **YOU MUST** understand the architecture of the specific module you are working on.

- **Frontend**: Read `frontend/documentation.md` (Clean Architecture: Presentation -> Business -> Data)
- **Backend**: Read `backend-ts/documentation.md` (Controller-Service-Repository Pattern)

> **Rule**: Do not invent new patterns. Follow the existing architecture documented in these files.

## 2. 🛠️ Tech Stack & Key Libraries

| Context      | Core Tech                       | Key Libraries                                                                                 |
| :----------- | :------------------------------ | :-------------------------------------------------------------------------------------------- |
| **Frontend** | React 19, Vite, TypeScript      | `tailwindcss` (v4), `lucide-react`, `@monaco-editor/react`, `supabase-js`, `react-router-dom` |
| **Backend**  | Node.js, Fastify, TypeScript    | `drizzle-orm`, `tsyringe` (DI), `zod` (Validation), `vitest`                                  |
| **Testing**  | Vitest (Unit), Playwright (E2E) | -                                                                                             |

## 3. 🚨 Core Rules (Mandatory)

1.  **Conform to Architecture**:
    - **Frontend**: Components must utilize _Services_ for logic. Never import Repositories or API clients directly into UI components.
    - **Backend**: Controllers handle HTTP -> Services handle Business Logic -> Repositories handle DB.
2.  **Systematic Workflow**:
    - **Plan**: Always create an `implementation_plan.md` for non-trivial tasks.
    - **Implement**: Write SOLID, DRY code with descriptive variable, method, and class names so the implementation is self-explanatory.
    - **Verify**: Never assume code works. Verify with the specific commands below.
3.  **Research & Guidance**:
    - Use **Context7 MCP** for library-specific best practices.
    - Use **Exa/Perplexity** to resolve error messages or finding modern implementation patterns.

## 4. 🤖 Agent Workflow

### Phase 1: Exploration & Context

- [ ] Read `AGENTS.md` (this file).
- [ ] Read the specific folder's `documentation.md`.
- [ ] Explore relevant existing code using `view_file` to match the style.

### Phase 2: Execution

- [ ] Create a checklist in `task.md` (or update the user's task tracker).
- [ ] Implement changes systematically.
- [ ] **Reuse Code**: Check `shared/` directories in both frontend and backend before writing new utilities.

### Phase 3: Verification (CRITICAL)

You must run these commands to verify your work.

**Frontend (`/frontend`)**

```bash
pnpm run build   # MUST PASS: Checks for TypeScript type errors
pnpm run lint    # Optional: Checks for code style issues
```

**Backend (`/backend-ts`)**

```bash
pnpm test        # MUST PASS: Runs unit tests
pnpm run typecheck # MUST PASS: Checks for TypeScript errors
```

> **Failure Protocol**: If verification fails, stop, analyze the error, fix it, and re-verify. Do not proceed until the build/test passes.

### Phase 4: Documentation

- [ ] If you added a new feature, API, or architectural component, **UPDATE** the relevant `documentation.md` file immediately.

## 5. 🔑 Test Credentials

Use these accounts for browser-based testing or login flows.

| Role        | Email                   | Password     |
| :---------- | :---------------------- | :----------- |
| **Teacher** | `namisvilan@gmail.com`  | `Qwerty123!` |
| **Student** | `marfiezeros@gmail.com` | `Qwerty123!` |
