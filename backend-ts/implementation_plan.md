# Implementation Plan: Automatic Similarity Analysis (No New Tables)

## Goal
Automatically trigger assignment similarity analysis after successful student submissions without introducing a queue table or other schema changes.

## Constraints
- Keep existing Controller-Service-Repository architecture.
- Reuse existing plagiarism analysis and report reuse logic.
- No new database tables or migrations.
- Submission flow must remain successful even when scheduling/analysis fails.

## Approach
1. Add an in-memory automation service in the plagiarism module:
- debounced scheduling per assignment on submission events
- single in-progress guard with one pending rerun flag
- periodic reconciliation cycle that checks existing submissions/reports

2. Integrate scheduling from `SubmissionService` after successful submission creation and grading flow.

3. Reuse existing data sources only:
- `submissions` (latest submissions)
- `similarity_reports` (latest report freshness)

4. Start/stop automation lifecycle from `buildApp` and Fastify `onClose`.

## Implementation Steps
1. Extend config with automation flags (enabled, debounce, reconciliation interval, min submissions).
2. Add submission repository helper for latest submission snapshots by assignment.
3. Implement `PlagiarismAutoAnalysisService` under `src/modules/plagiarism`.
4. Register new service in DI tokens and container.
5. Wire service startup/shutdown in `src/app.ts`.
6. Invoke scheduler from `SubmissionService.submitAssignment` with fail-safe error handling.
7. Add/adjust service unit tests.
8. Update backend documentation with automated similarity behavior and config.
9. Verify with `npm run typecheck` and `npm test`.

## Risks and Mitigation
- Risk: in-memory timers are lost on restart.
- Mitigation: reconciliation cycle catches stale/missing reports and re-triggers analysis.

- Risk: duplicate runs when submissions are frequent.
- Mitigation: per-assignment debounce + in-progress coalescing with single rerun flag.

- Risk: slower submission if analysis is in critical path.
- Mitigation: scheduling only, analysis remains asynchronous and non-blocking for submit response.

---

# Implementation Plan: Decouple Feedback Save From Notification Delivery

## Goal
Ensure `saveTeacherFeedback` returns success once feedback persistence succeeds, even if downstream notification delivery fails.

## Constraints
- Keep Controller-Service-Repository boundaries intact.
- Preserve existing notification payload content.
- Match resilience behavior already used by grade override flow.

## Approach
1. Keep feedback write as the critical path (`submissionRepo.saveTeacherFeedback`).
2. Send feedback notification as best-effort async work.
3. Catch and log notification errors without rethrowing.
4. Add service unit test to assert notification failures do not fail save.

## Verification
1. Run `npm run typecheck` in `backend-ts`.
2. Run `npm test` in `backend-ts`.

---

# Implementation Plan - Test Case Edit/Delete Route Contract Fix

## Goal
Restore teacher test case edit and delete actions by aligning backend route registration with the documented and frontend-used `/test-cases/:testCaseId` API contract.

## Approach
1. Split test-case CRUD routes from code-preview routes so each can be mounted under the correct prefix.
2. Register CRUD routes under `/test-cases` and keep code-preview routes under `/code`.
3. Add focused backend controller coverage for the new route group.
4. Re-run backend verification commands.

## Verification
1. Run `npm run typecheck` in `backend-ts`.
2. Run `npm test` in `backend-ts`.

---

# Implementation Plan - Registration Foreign-Key Sync Failure

## Goal
Fix the registration flow so `/auth/register` no longer fails when local `users.supabase_user_id` insertion races the underlying Supabase `auth.users` record availability.

## Constraints
- Preserve the existing controller-service-repository architecture.
- Keep the current self-registration UX and avoid changing frontend behavior unless required.
- Reuse the existing Supabase auth adapter instead of duplicating auth client logic.

## Approach
1. Add a service-role lookup helper to the Supabase auth adapter so the backend can verify when a newly created auth user is available.
2. Harden `AuthService.registerUser` to retry local user creation when it encounters the specific `fk_users_supabase_user_id` foreign-key violation.
3. Add a focused regression test that simulates the first insert failing with `23503` and succeeding after the auth record becomes visible.
4. Re-run backend verification commands.

## Verification
1. Run `npm run typecheck` in `backend-ts`.
2. Run `npm test` in `backend-ts`.

---

# Implementation Plan - Semantic Score Zero Investigation + Duplicate Report Race Guard

## Scope

Investigate why semantic scores are `0` for some similarity results and harden report generation consistency when concurrent analyses occur.

1. Improve semantic-sidecar reliability in backend client calls (timeout/retry behavior and observability).
2. Prevent concurrent assignment report writes from leaving multiple reports for the same assignment.
3. Add regression-focused backend unit coverage.
4. Re-run required backend verification commands.

## Execution Checklist

- [x] Add semantic client resilience settings (timeout and retries) to config.
- [x] Update `SemanticSimilarityClient` to retry transient failures before falling back to `0`.
- [x] Add assignment-scoped DB transaction lock before report persistence/delete-old flow.
- [x] Add/adjust tests for semantic client behavior and assignment lock usage.
- [x] Run `backend-ts`: `npm run typecheck`.
- [x] Run `backend-ts`: `npm test`.

---

# Implementation Plan - Notification Outbox, Precision Restoration, and Validation Drift

## Goal
Verify the reported backend findings against the current codebase, then fix only the issues that are still present across notifications, plagiarism persistence, test-case validation, and backend documentation.

## Constraints
- Keep the existing controller-service-repository architecture intact.
- Reuse existing escaping/template utilities instead of duplicating them.
- Keep notification writes transaction-safe when paired with grade/feedback mutations.
- Update backend documentation when the runtime model changes.

## Approach
1. Move email delivery out of transaction-sensitive notification write flows without introducing a new table.
2. Wrap grade override, grade publish, and teacher feedback flows in transactions so the primary write and in-app notification persist atomically.
3. Send email only after the write transaction commits, using the existing email service and user preference checks.
4. Restore plagiarism score precision in the affected Drizzle models and align the stale persistence comment.
5. Fix the test-case request schemas so validation matches the 255-character database column.
6. Correct the stale ERD notification connector and update the notification-delivery documentation to reflect the no-new-table delivery model.

## Verification
1. Run `npm run typecheck` in `backend-ts`.
2. Run `npm test` in `backend-ts`.
