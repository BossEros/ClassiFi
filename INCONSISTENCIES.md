# Codebase Inconsistencies Report

## 1. Package Manager Conflict
- **Requirement:** The project requires `pnpm` as the package manager (as per user instruction and `.npmrc` usage).
- **Current State:**
  - `package-lock.json` files exist in both `frontend/` and `backend-ts/` directories, indicating `npm` was previously used.
  - `pnpm-lock.yaml` was missing (until generated during diagnosis).
- **Documentation:** Both `README.md` and `AGENTS.md` explicitly instruct users to use `npm install` and other `npm` commands, creating a conflict with the required workflow.

## 2. Dependency Anomalies
The project uses dependency versions that appear to be "future" or non-standard releases relative to the current public ecosystem, though they resolve in this environment's registry.

### Frontend (`frontend/package.json`)
- **TypeScript:** `~5.9.3` (Current stable: ~5.7)
- **Vite:** `^7.2.2` (Current stable: ~6.0)
- **React:** `^19.2.0` (React 19 is currently RC/Beta)
- **Tailwind CSS:** `^4.1.18` (v4 is currently in Beta)
- **Vitest:** `^4.0.18` (Current stable: ~2.1)
- **ESLint:** `^9.39.1` (Current stable: ~9.17)

### Backend (`backend-ts/package.json`)
- **Fastify:** `^5.7.1` (v5 is current)
- **Vitest:** `^4.0.17`
- **Peer Dependency Issues:**
  - `tree-sitter-c` expects `tree-sitter@^0.22.1` but `0.25.0` is installed.
  - `tree-sitter-java` expects `tree-sitter@^0.21.1` but `0.25.0` is installed.

## 3. Documentation Mismatches
- **Stack Versioning:** `README.md` documents the stack as "React 19 + TypeScript 5.9", "Vite 7", "Tailwind CSS 4". While this matches `package.json`, it references versions that do not match standard public releases, potentially causing confusion or setup issues in standard environments.
- **Commands:** All documentation uses `npm run ...` syntax, ignoring `pnpm`.

## Recommended Actions
1. **Standardize on pnpm:**
   - Remove `package-lock.json` files.
   - Update `README.md` and `AGENTS.md` to reference `pnpm`.
2. **Review Dependencies:**
   - Confirm if "future" versions are intentional (e.g., using a custom registry or nightly builds).
   - If portability is required, downgrade to current stable versions (e.g., Vite 6, TS 5.7).
   - Fix `tree-sitter` peer dependency warnings in backend.
