# Frontend Refactor Plan: Architecture Boundaries + Type Ownership

## Goal
Complete the frontend architecture audit while preserving existing behavior and keeping role-based presentation structure.

## Hard Constraints
- No behavior changes.
- No API contract changes.
- Refactor via file ownership, imports, and decomposition only.
- Verify each checkpoint with `npm run build` and `npm test`.
- Commit at each stable checkpoint.

## Checkpoint 4: Boundary Fixes and Guardrails
1. Remove `presentation -> data/api/types` direct imports.
2. Remove `shared -> business/presentation` upward imports.
3. Add ESLint import boundary rules to block architectural leaks.
4. Verify and commit.

## Checkpoint 5: Canonical Business Domain Types
1. Define business-owned domain contracts in `src/business/models/**`.
2. Update business services/validation to depend on business models (not data API types).
3. Keep compatibility aliases where needed during transition.
4. Verify and commit.

## Checkpoint 6: Shared Cleanup by Ownership
1. Move business-only utilities into `src/business/**`.
2. Move presentation-only utilities into `src/presentation/**`.
3. Move data-only utility to `src/data/**`.
4. Remove dead utility `scheduleUtils.ts` after confirming no runtime usage.
5. Verify and commit.

## Checkpoint 7: Data API Type Decomposition
1. Split `src/data/api/types.ts` into feature files.
2. Keep `src/data/api/types.ts` as a temporary barrel for migration safety.
3. Update imports progressively to feature type files.
4. Verify and commit.

## Checkpoint 8: Large File Decomposition
1. Decompose large presentation pages/hooks into feature subcomponents/hooks.
2. Preserve route behavior and UI output.
3. Verify and commit.
