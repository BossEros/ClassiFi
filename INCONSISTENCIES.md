# Codebase Inconsistencies Report

This document outlines inconsistencies, errors, and technical debt identified in the codebase as of Jan 2025.

## 1. Critical Dependency Anomalies

Both `frontend` and `backend-ts` `package.json` files contain dependency versions that do not exist or are far in the future, suggesting an invalid generation or modification event.

**Frontend (`frontend/package.json`):**
- `typescript`: `~5.9.3` (Current stable: ~5.4)
- `vite`: `^7.2.2` (Current stable: ~5.x, v6 is upcoming)
- `prettier`: `3.8.1` (Current stable: ~3.2)
- `eslint`: `^9.39.1` (Current stable: ~9.x)
- `@types/node`: `^25.0.10` (Current LTS: v20/v22)

**Backend (`backend-ts/package.json`):**
- `typescript`: `^5.7.2` (Plausible but higher than current stable)
- `prettier`: `3.8.1` (Invalid)
- `eslint`: `^9.17.0` (Valid)
- `@types/node`: `^25.0.10` (Invalid)

## 2. Package Manager Conflict

- **Guideline**: `AGENTS.md` and project rules explicitly mandate `pnpm`.
- **Reality**: Both `frontend` and `backend-ts` contain `package-lock.json` files, indicating usage of `npm`. No `pnpm-lock.yaml` is present.
- **Impact**: Potential dependency resolution issues and violation of project standards.

## 3. Backend Linting Gap

- **Frontend**: Contains `eslint.config.js` (Flat Config) and a `lint` script.
- **Backend**:
    - Has `eslint` listed in `devDependencies`.
    - **Missing**: No `.eslintrc` or `eslint.config.js` file found.
    - **Missing**: No `lint` script in `package.json`.
- **Impact**: Backend code quality is not enforced via linting.

## 4. Architectural Structure

- **Frontend**: Follows Clean Architecture with root-level directories (`business`, `data`, `presentation`).
- **Backend**: Uses a `src/` directory containing the layers (`api`, `services`, `repositories`).
- **Inconsistency**: While both follow layered architecture, the directory structure differs (Root vs `src`).

## 5. TypeScript Configuration

- **Frontend**:
    - `baseUrl`: `.`
    - Paths: `@/*` maps to `./*`
- **Backend**:
    - `baseUrl`: `./src`
    - Paths: `@/*` maps to `./*` (relative to src), plus explicit aliases (`@api/*`, `@services/*`, etc.).

## 6. Legacy References

- `AGENTS.md` refers to `backend-ts/documentation.md` and `frontend/documentation.md`, which exist, but the rules regarding verification commands (e.g., `npm run build` vs `pnpm`) are inconsistent with the mandated package manager.
