# Codebase Inconsistency Report

This document outlines structural, configuration, and tooling inconsistencies identified in the ClassiFi codebase.

## 1. Package Manager Mismatch
- **Issue:** The project explicitly requires `pnpm`, but `package-lock.json` files (artifacts of `npm`) were present in both `frontend/` and `backend-ts/` directories.
- **Resolution:** `package-lock.json` files have been deleted. `AGENTS.md` and `frontend/documentation.md` have been updated to reference `pnpm` commands.

## 2. Backend Linting Configuration
- **Issue:** The `backend-ts` project has `eslint` installed (`^9.17.0`) but lacks an ESLint configuration file (e.g., `eslint.config.js` or `.eslintrc`).
- **Impact:** There is no `lint` script in `backend-ts/package.json`, and running `eslint .` would likely fail or produce inconsistent results.
- **Recommendation:** Initialize an ESLint configuration for the backend, preferably matching the flat config style used in the frontend, and add a `lint` script.

## 3. Frontend Project Structure
- **Issue:** The `frontend` directory follows a Clean Architecture structure (`presentation`, `business`, `data`), but also contains a sibling `src` directory (`frontend/src`).
- **Detail:** `frontend/src` currently contains `components/plagiarism`.
- **Impact:** This violates the Clean Architecture organization and creates ambiguity about where new feature components should be placed.
- **Recommendation:** Move `frontend/src/components/plagiarism` to `frontend/presentation/components/plagiarism` (or `frontend/business/plagiarism` if it contains logic) and remove the `src` directory.

## 4. TypeScript Version Mismatch
- **Issue:** Inconsistent TypeScript versions between projects.
  - `frontend`: `~5.9.3`
  - `backend-ts`: `^5.7.2`
- **Impact:** Potential discrepancies in type checking behavior or available language features.
- **Recommendation:** Align both projects to the same TypeScript version (preferably the latest stable version).

## 5. Script Naming
- **Issue:** `frontend` uses `lint` script, while `backend-ts` does not have one.
- **Recommendation:** Standardize `scripts` in `package.json` across both projects (e.g., `build`, `lint`, `test`, `format`).
