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

# Automatic Similarity Analysis (No New Tables)

- [x] Confirm backend architecture guidance in `backend-ts/documentation.md`
- [x] Design no-new-table automation flow (debounce + reconciliation)
- [x] Add config flags for automatic similarity scheduling
- [x] Add submission repository snapshot helper for reconciliation
- [x] Implement plagiarism auto-analysis service with in-memory scheduling
- [x] Integrate automatic scheduling into `SubmissionService.submitAssignment`
- [x] Wire service in DI container and app lifecycle start/stop
- [x] Add/adjust backend unit tests for new behavior
- [x] Update `backend-ts/documentation.md` for automated similarity flow
- [x] Run `npm run typecheck`
- [x] Run `npm test`

# P1 Badge: Decouple Feedback Save From Notification Delivery Failures

- [x] Confirm backend architecture guidance in `backend-ts/documentation.md`
- [x] Locate `saveTeacherFeedback` and compare with resilient grade override notification flow
- [x] Update `SubmissionService.saveTeacherFeedback` to make notification delivery best-effort
- [x] Add/adjust unit tests for `saveTeacherFeedback` notification failure behavior
- [x] Verify feedback route finding in `submission.controller.ts` and apply fix only where needed
- [x] Update controller tests for role message, feedback trimming, and whitespace-only rejection
- [x] Run `npm run typecheck`
- [x] Run `npm test`

# Service Validation: Teacher Feedback Input Guardrails

- [x] Verify finding in `submission.service.ts` and confirm missing service-level validation
- [x] Add `saveTeacherFeedback` validation for trimmed `teacherName` and `feedback`
- [x] Enforce non-empty and max-length constraints before repository save/notification flow
- [x] Throw `BadRequestError` for invalid service input
- [x] Add service unit tests for trim/empty/max-length validation paths
- [x] Run `npm run typecheck`
- [x] Run `npm test`
