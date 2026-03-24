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

# Semantic Score Zero + Duplicate Similarity Report Investigation

- [x] Inspect plagiarism semantic-scoring pipeline and report persistence flow
- [x] Add semantic client timeout/retry hardening to reduce false `0` semantic scores
- [x] Add assignment-level DB lock during report persistence to avoid concurrent duplicate reports
- [x] Add/update backend unit tests for semantic client and repository lock behavior
- [x] Run backend typecheck verification
- [x] Run backend tests verification

# Notification Delivery + Precision/Validation/Docs Verification

- [x] Verify each reported finding against current backend code and documentation
- [x] Move transaction-sensitive notification emails to post-commit delivery without adding a new table
- [x] Wrap grade/feedback notification write flows in shared transactions
- [x] Escape fallback notification HTML and sanitize notification email subjects
- [x] Restore plagiarism score precision and remove defaulted similarity counters
- [x] Align test-case name validation with the 255-character model constraint
- [x] Fix the stale notification ERD connector and update notification delivery docs
- [x] Run `npm run typecheck`
- [ ] Run `npm test`

# Registration Foreign-Key Sync Failure

- [x] Confirm backend architecture guidance in `backend-ts/documentation.md`
- [x] Trace the `/auth/register` flow across controller, service, repository, and Supabase adapter
- [x] Add a Supabase auth lookup helper for newly created users
- [x] Retry local user creation on `fk_users_supabase_user_id` sync races
- [x] Add/update backend auth service regression tests
- [x] Run `npm run typecheck`
- [ ] Run `npm test`

# Configurable Hybrid Similarity Weighting

- [x] Confirm backend architecture guidance in `backend-ts/documentation.md`
- [x] Inspect current plagiarism scoring, persistence, and sorting behavior
- [x] Add configurable structural and semantic similarity weights in backend config
- [x] Default the backend to `70%` structural and `30%` semantic weighting
- [x] Update plagiarism flagging, summaries, and repository sorting to follow hybrid score
- [x] Add/update focused backend tests for configurable weighting and hybrid-based ordering
- [x] Update backend documentation and `.env.example` for the new scoring settings
- [x] Run `npm run typecheck`
- [ ] Run `npm test`

# Hosted Email Confirmation Redirects

- [x] Confirm backend auth redirect behavior and existing frontend confirmation route
- [x] Pass the frontend confirmation redirect URL into Supabase signup
- [x] Reuse the auth redirect URL builder for password reset links
- [x] Add/update backend auth service regression tests
- [x] Update backend documentation and env guidance
- [x] Run `npm run typecheck`
- [ ] Run `npm test`

# Submission Attempt Numbering Regression

- [x] Confirm backend architecture guidance in `backend-ts/documentation.md`
- [x] Trace submission numbering across `SubmissionService`, repository persistence, and storage path generation
- [x] Update the next-attempt calculation to use the highest previous `submissionNumber`
- [x] Reuse `StorageService.uploadSubmission(...)` to avoid duplicated submission path construction
- [x] Add regression coverage for repeated resubmissions after cleanup
- [x] Run `npm run typecheck`
- [ ] Run `npm test`

# Reused Similarity Report Score Recalculation

- [x] Confirm backend architecture guidance in `backend-ts/documentation.md`
- [x] Trace how pairwise overall similarity is built for reused plagiarism reports
- [x] Recompute reused-report hybrid scores from structural and semantic scores
- [x] Rebuild reused-report summary metrics and pair ordering from recalculated hybrid scores
- [x] Add regression coverage for stale persisted hybrid values
- [x] Run `npm run typecheck`
- [ ] Run `npm test`
