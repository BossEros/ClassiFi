# Implementation Plan: Shared Layer Decomposition

## Goal
Reduce mixed concerns in `src/shared` by colocating feature-specific mappers/guards/helpers inside their owning modules while keeping true infrastructure concerns in `src/shared`.

## Scope
- Replace `src/shared/mappers.ts` with module-local mapper files:
  - `src/modules/users/user.mapper.ts`
  - `src/modules/classes/class.mapper.ts`
  - `src/modules/assignments/assignment.mapper.ts`
  - `src/modules/submissions/submission.mapper.ts`
  - `src/modules/dashboard/dashboard.mapper.ts`
  - `src/modules/plagiarism/plagiarism.mapper.ts`
  - `src/modules/gradebook/gradebook.mapper.ts`
- Replace `src/shared/guards.ts` with:
  - `src/modules/classes/class.guard.ts`
  - `src/modules/notifications/notification.guard.ts`
- Move feature helpers out of `src/shared/utils.ts`:
  - `generateUniqueClassCode` -> `src/modules/classes/class-code.util.ts`
  - `formatAssignmentDueDate` -> `src/modules/assignments/assignment-deadline.util.ts`
- Update all import sites in source and tests.
- Keep infrastructure files in `src/shared` unchanged (`config`, `database`, `logger`, `container`, `di/tokens`, `transaction`, `supabase`, etc.).

## Non-Goals
- No business logic or API behavior changes.
- No DI token key renames.
- No database schema changes.

## Steps
1. Create module-local mapper, guard, and helper files.
2. Update imports in services/controllers/repositories/tests.
3. Delete obsolete shared files (`mappers.ts`, `guards.ts`).
4. Update architecture documentation for the new boundary.
5. Run backend verification (`npm run typecheck`, `npm test`) and fix regressions.

## Risks and Mitigation
- Risk: missing import rewires after file split.
- Mitigation: run grep checks for stale paths and execute full typecheck + test suite.
