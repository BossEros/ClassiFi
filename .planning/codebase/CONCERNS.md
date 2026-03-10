# Codebase Concerns

**Analysis Date:** 2026-03-08
**Scope:** `frontend/`, `backend-ts/`, test and architecture artifacts

## Executive Summary

The codebase is functional and currently healthy in CI-like checks (`frontend` build + tests, `backend-ts` typecheck + tests), but it carries significant maintainability and operational risk in five areas:

1. Very large frontend page/components and inlined UI logic that increase regression risk.
2. Fragile in-memory background processing for notifications and plagiarism automation.
3. Security hardening gaps (error exposure model, missing rate limiting, client-side auth state trust surface).
4. Performance pressure from heavy frontend bundle composition and polling patterns.
5. Known test and coverage blind spots around concurrency-sensitive repository behavior.

## Confirmed Baseline

- `backend-ts`: `npm run typecheck` passed.
- `backend-ts`: `npm test` passed (`470 passed`, `1 skipped`).
- `frontend`: `npm run build` passed.
- `frontend`: `npm test -- --run` passed (`1008 passed`).

## High-Priority Concerns

### 1) Frontend Monolith Components (Technical Debt / Regression Risk)

**Evidence**
- Extremely large presentation files:
  - `frontend/src/presentation/pages/admin/AdminUsersPage.tsx` (1413 lines)
  - `frontend/src/presentation/pages/shared/SettingsPage.tsx` (1351 lines)
  - `frontend/src/presentation/components/teacher/forms/assignment/BasicInfoForm.tsx` (1334 lines)
  - Several more in the 600-1100 line range.
- `BasicInfoForm.tsx` contains explicit inlining markers for previously separate components.

**Risk**
- High change coupling and higher bug probability from unrelated edits.
- Harder test isolation and slower onboarding for contributors.
- Weak adherence to SRP despite architecture intent.

**Recommendation**
- Break large page/components into feature-local presentational and hook units.
- Re-extract inlined modals/list/editor blocks into separate components.
- Set a soft guardrail (for example, 300-400 LOC per component file, exceptions documented).

### 2) In-Memory Background Workflows (Fragile Ops Behavior)

**Evidence**
- Notification retries rely on in-process `setTimeout` scheduling:
  - `backend-ts/src/modules/notifications/notification-queue.service.ts`
- Auto plagiarism analysis uses in-memory timers/sets and interval reconciliation:
  - `backend-ts/src/modules/plagiarism/plagiarism-auto-analysis.service.ts`
- Ad-hoc plagiarism reports are in-memory map with TTL cleanup:
  - `backend-ts/src/modules/plagiarism/plagiarism.service.ts`

**Risk**
- Jobs/timers disappear on process restart or deployment.
- Multi-instance deployment can cause uneven processing or duplicate attempts.
- Hard to reason about delivery guarantees and operational observability.

**Recommendation**
- Move retry/scheduling to durable queue semantics (DB-backed queue or dedicated worker service).
- Persist scheduled auto-analysis intents with idempotent processing keys.
- Keep in-memory maps only as short-lived cache, not source of truth.

### 3) Error Exposure and Security Hardening Gaps

**Evidence**
- Global error handler returns `error.message` to clients for all failures:
  - `backend-ts/src/api/middlewares/error-handler.ts`
- Stack traces are returned in development responses.
- No rate limiting middleware detected on auth/public endpoints.

**Risk**
- Internal exception messages can leak implementation details in production if non-domain errors bubble up.
- Auth endpoints are vulnerable to brute-force/enumeration pressure without throttling.

**Recommendation**
- Return generic message for unexpected 5xx errors; keep details in logs only.
- Add endpoint-level or global rate limiting (especially `/auth/login`, `/auth/register`, `/auth/forgot-password`).
- Add security middleware baseline (headers/hardening policy) and document threat assumptions.

### 4) Frontend Runtime Performance Pressure (Bundle + Polling)

**Evidence**
- Frontend build emits very large assets:
  - Main bundle: `dist/assets/index-*.js` ~5.63 MB (pre-gzip)
  - Monaco worker bundles include multi-MB assets (`ts.worker` ~7.0 MB, css/html/json workers also large)
- Notification polling every 30s in UI:
  - `frontend/src/presentation/components/shared/dashboard/NotificationBadge.tsx`

**Risk**
- Slower cold start/TTI for users on weak networks/devices.
- Ongoing polling overhead scales with active sessions/tabs.

**Recommendation**
- Lazy-load heavy editor paths and Monaco language/workers only where needed.
- Route-level code splitting for large admin/teacher pages.
- Move notification updates toward server push or adaptive backoff polling.

## Medium-Priority Concerns

### 5) Test Coverage Blind Spot: Skipped Concurrency-Sensitive Repository Test

**Evidence**
- Skipped backend test with explicit TODO:
  - `backend-ts/tests/repositories/submission.repository.test.ts`
  - `it.skip("should create submission with correct submission number", ...)`

**Risk**
- Submission numbering/transaction behavior is correctness-critical and can regress silently.
- Existing skip reason indicates unresolved complexity in DB transaction mocking.

**Recommendation**
- Replace skip with focused integration test using real transaction behavior.
- Add a concurrent submission test for same `(assignmentId, studentId)` path.

### 6) Potential Submission Number Race Surface (Service/Repository Contract Fragility)

**Evidence**
- Service computes `submissionNumber` from pre-fetched history length:
  - `backend-ts/src/modules/submissions/submission.service.ts`
- Repository enforces unique `(assignmentId, studentId, submissionNumber)` and uses transaction lock:
  - `backend-ts/src/modules/submissions/submission.model.ts`
  - `backend-ts/src/modules/submissions/submission.repository.ts`

**Risk**
- Under concurrent requests, precomputed number can collide before insert path resolves.
- Collision currently manifests as DB failure path unless gracefully retried/remapped.

**Recommendation**
- Compute next submission number inside the transaction.
- Add deterministic retry for unique-constraint conflict with bounded attempts.

### 7) Logging Noise and Inconsistent Client Logging Strategy

**Evidence**
- Extensive `console.error`/`console.warn` usage across presentation/business code.
- Auth adapter logs auth state changes directly:
  - `frontend/src/data/api/supabaseAuthAdapter.ts`
- Test runs produce high stderr noise from expected failure-path logs.

**Risk**
- Harder signal/noise ratio in debugging and monitoring.
- Potential accidental leakage of sensitive runtime context in browser console.

**Recommendation**
- Introduce centralized frontend logger with environment-aware verbosity.
- Suppress expected test-path logging via logger test mode.
- Remove or gate auth lifecycle console logs in production builds.

## Low-Priority Concerns

### 8) Strict Environment Requirements Increase Local Setup Friction

**Evidence**
- Config validation requires both SendGrid and SMTP credentials at startup:
  - `backend-ts/src/shared/config.ts`

**Risk**
- Local/dev workflows can fail early even when email is not being exercised.
- Raises onboarding and CI environment complexity.

**Recommendation**
- Make provider-specific credentials conditional on enabled provider.
- Keep strong validation but align required fields with active runtime mode.

### 9) Client-Side Auth/User State Stored in `localStorage`

**Evidence**
- Zustand auth store persists user object in `localStorage`:
  - `frontend/src/shared/store/useAuthStore.ts`
- API client clears local user state on 401 while token/session remains managed by Supabase.

**Risk**
- Local `user` data can be tampered with client-side, causing UI-level role/state inconsistencies.
- Potential confusion bugs even if backend authorization still blocks protected actions.

**Recommendation**
- Treat local user data as cache only; re-hydrate authoritative user profile from server/session on app bootstrap.
- Minimize role-critical decisions purely from local storage snapshots.

## Strengths Worth Preserving

- Architecture boundaries are largely respected (presentation does not directly import repositories/API internals in inspected paths).
- Strong automated test footprint with high pass counts and broad domain coverage.
- Backend module layout and DI boundaries are coherent and explicit.

## Suggested Remediation Order

1. Split largest frontend monolith files and restore component boundaries.
2. Harden backend error response strategy and add auth rate limiting.
3. Move timer-based background workflows to durable queue patterns.
4. Address submission concurrency test gap and in-transaction numbering strategy.
5. Reduce bundle weight with lazy loading/code splitting and rationalized Monaco loading.
6. Standardize logging strategy across frontend/backend and tests.

---

*This concern report is based on direct repository inspection plus successful local verification runs on 2026-03-08.*