# Shared Layer Refactor Task Checklist

- [x] Confirm backend architecture guidance in `backend-ts/documentation.md`
- [x] Map all imports of `src/shared/mappers.ts`, `src/shared/guards.ts`, and feature-specific helpers in `src/shared/utils.ts`
- [x] Create module-local mapper files for users, classes, assignments, submissions, dashboard, plagiarism, and gradebook
- [x] Create module-local guard files for classes and notifications
- [x] Move feature-specific helpers out of `src/shared/utils.ts` into module-local helper files
- [x] Update all affected imports in source files and tests
- [x] Remove obsolete `src/shared/mappers.ts` and `src/shared/guards.ts`
- [x] Update `backend-ts/documentation.md` to reflect shared-vs-module boundaries
- [x] Run `npm run typecheck`
- [x] Run `npm test`
