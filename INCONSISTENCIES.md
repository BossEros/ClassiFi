# Inconsistencies Report

This document records technical inconsistencies, anomalies, and debt found in the codebase.

## 1. Package Manager Conflict
- **Issue**: `AGENTS.md` and `README.md` instruct users/agents to use `npm` (e.g., `npm install`, `npm run`).
- **Reality**: The project environment and user constraints explicitly require `pnpm`. The environment has `pnpm` version 10.28.0 installed.
- **Resolution**: Documentation should be updated to enforce `pnpm`.

## 2. Dependency Version Anomalies
- **Issue**: `package.json` files in both `frontend` and `backend-ts` contain "futuristic" or non-existent dependency versions compared to the current stable ecosystem (as of standard 2024/2025 timelines).
- **Examples**:
  - `react`: `^19.2.0` (Standard stable: 18.x)
  - `vite`: `^7.2.2` (Standard stable: 6.x)
  - `typescript`: `~5.9.3` (Standard stable: 5.7.x)
  - `tailwindcss`: `^4.1.18` (Tailwind 4 is experimental/alpha)
  - `vitest`: `^4.0.18` (Standard stable: 2.x/3.x)
  - `node` types: `^25.0.10` (Standard stable: 22.x/23.x)
  - `uuid`: `^13.0.0` (Standard stable: 11.x)
- **Impact**: `npm install` or standard `pnpm install` might fail if resolving against a standard public registry that does not contain these versions.

## 3. Missing Documentation Files
- **Issue**: Internal references (memory/context) alluded to an existing `INCONSISTENCIES.md`, but it was not present in the root directory.
- **Resolution**: This file has been created to track these issues.

## 4. Linting & Formatting
- **Issue**: `README.md` mentions "Prettier 3.8", which is ahead of current stable releases (approx 3.4).
- **Status**: Consistent within the repo (dependencies match docs), but inconsistent with external standards.
