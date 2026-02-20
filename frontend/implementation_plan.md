# Frontend Refactor Plan: Role-Based Presentation Structure

## Goal
Refactor frontend folder organization to improve discoverability and maintainability while preserving behavior.

## Constraints
- No feature or behavior changes.
- Refactor should be import/path and file organization only.
- Verify after each checkpoint with `npm run build`.
- Commit progress at each stable checkpoint.

## Target Structure (Phase 1 Scope)
- Introduce `src/app/routes/*` route modules.
- Group pages by role in `src/presentation/pages/{auth,student,teacher,admin,shared}`.
- Move toast context to `src/presentation/context/ToastContext.tsx`.

## Checkpoints
1. Add planning files and route modules.
2. Move pages to role-based folders and update imports.
3. Move `ToastContext` to presentation layer and update imports.
4. Run `npm run build` and fix any path/type issues.
5. Commit checkpoint.

## Out of Scope for Checkpoint 1
- Full component and hook role grouping.
- Splitting `src/data/api/types.ts`.
- Shared utility/type ownership cleanup.
