# Codebase Inconsistencies Report

This document outlines technical debt and inconsistencies identified across the `frontend` and `backend-ts` projects.

## 1. Dependency Inconsistencies

There are significant version mismatches between the frontend and backend, with the frontend configuration often referencing non-existent or "future" versions of packages.

| Package | Frontend Version | Backend Version | Notes |
| :--- | :--- | :--- | :--- |
| **TypeScript** | `~5.9.3` | `^5.7.2` | Frontend version 5.9.3 does not exist (Current stable is ~5.7). |
| **ESLint** | `^9.39.1` | `^9.17.0` | ESLint 9.39 does not exist (Current stable is ~9.17). |
| **Vitest** | `^4.0.18` | `^4.0.17` | Vitest 4.x does not exist (Current stable is ~2.1). |
| **Prettier** | `3.8.1` | `3.8.1` | Prettier 3.8 does not exist (Current stable is ~3.4). |
| **React** | `^19.2.0` | N/A | React 19 is currently in Beta/RC, but 19.2.0 is specific/future. |
| **Vite** | `^7.2.2` | N/A | Vite 7 does not exist (Vite 6 was recently released). |

**Impact:** The frontend environment may fail to install or behave unpredictably if these non-existent versions are strictly requested.

## 2. Project Structure & Architecture

The two projects follow different architectural patterns and directory structures, increasing cognitive load for full-stack development.

| Feature | Frontend | Backend |
| :--- | :--- | :--- |
| **Root Source** | No `src/` directory. Root contains `business`, `data`, `presentation`. | Uses `src/` directory. |
| **Architecture** | **Clean Architecture** (Separated by domain/layer at root). | **Layered/MVC** (`api`, `services`, `models` inside `src`). |

## 3. File Naming & Conventions

File naming conventions for data models and types are inconsistent.

| Feature | Frontend | Backend |
| :--- | :--- | :--- |
| **Model Files** | `camelCase.ts` (e.g., `auth.ts`) in `shared/types`. | `kebab-case.model.ts` (e.g., `user.model.ts`) in `src/models`. |
| **Model Definition** | Uses TypeScript `interface`. | Uses Drizzle ORM schema definitions + type inference. |

## 4. Package Management

**Violation:** The project documentation mandates the use of `pnpm`, but `package-lock.json` (npm lockfile) exists in both project roots.

- `frontend/package-lock.json`
- `backend-ts/package-lock.json`

**Impact:** Potential for split brain dependencies if developers accidentally use `npm install` instead of `pnpm install`.

## 5. Environment Variables

Naming conventions for similar services differ slightly.

- **Frontend:** `VITE_SUPABASE_URL` (Required for Vite)
- **Backend:** `SUPABASE_URL`

## Recommendations

1.  **Normalize Dependencies:** Downgrade Frontend dependencies to real, stable versions matching the Backend where possible.
2.  **Enforce Package Manager:** Delete `package-lock.json` files and ensure `pnpm-lock.yaml` is the source of truth.
3.  **Standardize Conventions:** While architectural differences might be intentional, file naming conventions (kebab-case vs camelCase) should ideally be consistent where possible.
