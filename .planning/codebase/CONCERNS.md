# ClassiFi Concerns and Risk Map

## 1) In-memory job scheduling can drop work on process restart
- Notification retries rely on `setTimeout` in application memory, so pending retries are lost after restart/deploy (`backend-ts/src/modules/notifications/notification-queue.service.ts`).
- Automatic plagiarism analysis scheduling uses in-memory `Map`/`Set` plus `setInterval`; scheduled analysis is not durable across instance crashes (`backend-ts/src/modules/plagiarism/plagiarism-auto-analysis.service.ts`).
- Impact: eventually-consistent workflows (email delivery retries, similarity reconciliation) can silently miss work after downtime.
- Priority: High.

## 2) Large "god files" increase change risk and review difficulty
- Several frontend files are very large and span multiple concerns:
- `frontend/src/presentation/pages/admin/AdminUsersPage.tsx` (~1412 lines)
- `frontend/src/presentation/pages/shared/SettingsPage.tsx` (~1361 lines)
- `frontend/src/presentation/components/teacher/forms/assignment/AssignmentFormContent.tsx` (~1349 lines)
- `frontend/src/presentation/pages/admin/AdminClassesPage.tsx` (~1149 lines)
- Impact: higher regression probability, harder test targeting, and slower onboarding.
- Priority: High.

## 3) Sensitive internal failure reasons can be exposed to clients
- Error classes embed raw low-level reasons in user-facing messages:
- `UploadFailedError` composes `"File upload failed: ${reason}"` (`backend-ts/src/shared/errors.ts`).
- `FileDownloadError` composes `"Failed to download file ...: ${reason}"` (`backend-ts/src/shared/errors.ts`).
- A caught storage failure passes `error.message` directly into `UploadFailedError` (`backend-ts/src/modules/submissions/submission.service.ts`).
- Impact: infrastructure/storage details may leak through API responses.
- Priority: High.

## 4) Observability/noise risk from extensive production `console.*` usage in frontend
- Many UI/service modules log errors/warnings directly with `console.error`/`console.warn`/`console.log`, e.g.:
- `frontend/src/business/services/calendarService.ts`
- `frontend/src/presentation/pages/teacher/ClassDetailPage.tsx`
- `frontend/src/data/api/supabaseAuthAdapter.ts`
- Impact: noisy logs, accidental exposure of payload details in browser/devtools, and inconsistent telemetry strategy.
- Priority: Medium.

## 5) Test suite has known unclosed debt and blind spots
- Known TODO remains in test code around complex transaction mocking (`backend-ts/tests/repositories/submission.repository.test.ts`).
- Frontend E2E setup defines only Chromium (`frontend/playwright.config.ts`), so cross-browser issues (Firefox/WebKit) are not covered.
- Backend testing is strong in unit tests but still heavily mock-driven, with limited full-stack DB+HTTP integration scenarios (`backend-ts/tests/integration`).
- Impact: contract/integration regressions can slip through.
- Priority: Medium.

## 6) External dependency resilience may mask outages rather than surface them
- Semantic similarity client falls back to `0` score after retries/failures (`backend-ts/src/modules/plagiarism/semantic-similarity.client.ts`).
- Judge0 execution failure paths can return generic internal-error outcomes without persistent alerting (`backend-ts/src/services/judge0.service.ts`).
- Impact: degraded behavior may appear as valid output instead of explicit operational incident.
- Priority: Medium.

## 7) Architecture pressure around large generated/contract files
- `frontend/src/data/api/database.types.ts` is large and central to many data-layer contracts.
- Combined with heavy page/service files, this creates broad change blast radius for schema or API envelope changes.
- Impact: routine backend schema evolution can trigger widespread frontend churn.
- Priority: Medium.

## Recommended Next Focus
- Introduce durable background jobs for retries/reconciliation (DB-backed queue + worker process).
- Split top frontend files into feature subcomponents/hooks with explicit boundaries.
- Replace user-facing raw infrastructure error reasons with safe generic messages while preserving structured internal logs.
- Expand E2E matrix beyond Chromium and add one real HTTP+DB backend integration path for critical flows.
