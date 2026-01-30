# Codebase Inconsistencies Report

This document outlines inconsistencies found in the codebase as of the current state.

## 1. Package Manager Conflict
- **Issue**: The user instructions mandate the use of `pnpm` (version 10.28.0), but the codebase is configured for `npm`.
- **Evidence**:
  - `frontend/package-lock.json` and `backend-ts/package-lock.json` exist.
  - `backend-ts/.npmrc` exists.
  - `AGENTS.md` and `README.md` explicitly instruct to use `npm` or `yarn`.
  - The project does not contain `pnpm-lock.yaml` files.
- **Impact**: Using `pnpm` without migration might ignore lockfile versions or cause installation issues.

## 2. Dependency Version Anomalies
- **Issue**: `package.json` files in both frontend and backend define dependencies with non-existent or future versions.
- **Evidence**:
  - **Frontend**:
    - `react`: `^19.2.0` (React 19 is not stable yet, usually requires "canary" or "rc" tags).
    - `vite`: `^7.2.2` (Current stable is v5/v6).
    - `typescript`: `~5.9.3` (Current stable is ~5.3/5.4).
    - `tailwindcss`: `^4.1.18` (v4 is in beta/alpha).
    - `eslint`: `^9.39.1` (v9 is current, but .39 seems high).
  - **Backend**:
    - `fastify`: `^5.7.1` (Current stable is v4, v5 is in development).
    - `zod`: `^4.3.6` (Current stable is v3).
- **Impact**: `npm install` or `pnpm install` will likely fail if these versions do not exist in the registry.

## 3. Documentation vs. Reality (Frontend Structure)
- **Issue**: Provided memory context claimed `frontend/src` exists and contains legacy components.
- **Evidence**:
  - `list_files frontend/` shows no `src` directory.
  - The structure follows Clean Architecture (`presentation`, `business`, `data`) at the `frontend/` root, which matches `frontend/documentation.md`.
- **Impact**: Agents relying on memory might look for files that do not exist.

## 4. Unresolved Technical Debt (Linting)
- **Issue**: Presence of error logs indicates unresolved linting/type-checking issues.
- **Evidence**:
  - `frontend/lint-errors.txt`
  - `frontend/remaining-errors.txt`
  - `backend-ts/backend-lint.txt`
- **Impact**: Code quality issues might be present.
