# Frontend Zod + React Hook Form Migration Plan

## Objective

Refactor frontend form handling to use `react-hook-form` + `zod` in a phased, low-risk way while preserving existing behavior, UI, and service interactions.

## Scope

- In scope:
  - Migrate frontend forms from manual state/error handling to `react-hook-form`.
  - Replace imperative validation functions with Zod schemas at form boundaries.
  - Keep existing service-layer architecture intact (Presentation -> Business -> Data).
  - Preserve current UX behavior, payload shape, navigation, and toast/error messaging.
- Out of scope (initial rollout):
  - Redesigning form UI.
  - Changing backend APIs or backend validation logic.
  - Rewriting non-form state management unrelated to form inputs.

## Constraints and Guardrails

- Preserve behavior exactly unless explicitly approved:
  - Same required/optional field rules.
  - Same submit button disable/loading behavior.
  - Same navigation after success/failure.
  - Same toast and field error messages where practical.
- Keep validation at boundaries:
  - Primary frontend validation in Presentation form schema.
  - Backend remains source of truth for final validation.
- No direct repository/API usage in components.
- No `any`.

## Current Baseline (Observed)

- `react-hook-form`, `@hookform/resolvers`, and `zod` are installed in `frontend/package.json`.
- No current `zod` or `useForm` usage in `frontend/src`.
- Major forms are still manual-state based:
  - Auth: `frontend/src/presentation/components/auth/forms/LoginForm.tsx`
  - Auth: `frontend/src/presentation/components/auth/forms/RegisterForm.tsx`
  - Auth: `frontend/src/presentation/components/auth/forms/ForgotPasswordForm.tsx`
  - Auth: `frontend/src/presentation/pages/auth/ResetPasswordPage.tsx`
  - Teacher: `frontend/src/presentation/pages/teacher/ClassFormPage.tsx`
  - Teacher: `frontend/src/presentation/pages/teacher/AssignmentFormPage.tsx`
  - Teacher hook: `frontend/src/presentation/hooks/teacher/useAssignmentForm.ts`
  - Student: `frontend/src/presentation/components/student/forms/JoinClassModal.tsx`
  - Admin/Settings modals and grade override forms (multiple files)

## Target Architecture

- Form schemas colocated near feature usage:
  - `frontend/src/presentation/schemas/auth/*.ts`
  - `frontend/src/presentation/schemas/class/*.ts`
  - `frontend/src/presentation/schemas/assignment/*.ts`
  - `frontend/src/presentation/schemas/shared/*.ts` (only cross-feature reuse)
- Form state managed by `useForm` and `FormProvider` where needed.
- Validation wiring:
  - `zodResolver(schema)` for submit and blur validation behavior.
  - Use `mode: "onBlur"` where current UX validates on blur.
  - Use `mode: "onSubmit"` where current UX validates only on submit.
- Keep business services unchanged initially; map schema output to existing service payloads.

## Phase Plan

## Phase 0: Foundation and Baseline Safety

- Create reusable form utilities:
  - `frontend/src/presentation/hooks/shared/useZodForm.ts` (thin wrapper around `useForm` with defaults)
  - `frontend/src/presentation/utils/formErrorMap.ts` (normalize Zod issues to existing field error shape if needed)
- Create schema conventions document section in frontend docs.
- Add test helpers for form interaction if needed.
- Verification gate:
  - `frontend`: `npm run build`, `npm test -- --run`

## Phase 1: Auth Flow Migration (Low Blast Radius, High Reuse)

- Migrate:
  - `LoginForm.tsx`
  - `RegisterForm.tsx` (multi-step support with shared schema parts)
  - `ForgotPasswordForm.tsx`
  - `ResetPasswordPage.tsx`
- Keep:
  - Existing button states, password toggle behavior, and callback contracts.
- Add/Update tests for submit and validation error paths.
- Verification gate:
  - Targeted auth tests + `npm run build` + `npm test -- --run`

## Phase 2: Class Management Forms (Foundation for Core Teacher/Student Workflows)

- Migrate:
  - `ClassFormPage.tsx` (create/edit)
  - `JoinClassModal.tsx`
  - `AdminCreateClassModal.tsx`
- Move class-related validation logic from `business/validation/classValidation.ts` into frontend Zod schemas in Presentation layer (or wrap existing rules during transition).
- Preserve schedule/day/time logic and generated code flow.
- Verification gate:
  - Class form/unit tests + `npm run build` + `npm test -- --run`

## Phase 3: Assignment Authoring Forms (Highest Complexity)

- Refactor:
  - `useAssignmentForm.ts` integration with RHF (or replace with RHF-first hook while retaining external contract).
  - `AssignmentFormPage.tsx`, `BasicInfoForm.tsx`, `SubmissionSettings.tsx`, `LatePenaltyConfig.tsx`
  - `TestCaseModal.tsx`
- Add Zod schemas for:
  - Assignment details
  - Scheduling/deadline logic
  - Late penalty configuration and tiers
  - Resubmission/max attempts
- Preserve current payload mapping via `buildAssignmentPayload`.
- Verification gate:
  - Assignment-related tests + `npm run build` + `npm test -- --run`

## Phase 4: Remaining Modals and Admin/Settings Forms

- Migrate remaining forms:
  - `AdminUserModal.tsx`
  - `AdminEditUserModal.tsx`
  - `ChangePasswordModal.tsx`
  - `GradeOverrideModal.tsx`
  - Any remaining submit-based modal forms
- Verification gate:
  - Full frontend build/test

## Phase 5: Cleanup and Consolidation

- Remove or deprecate superseded imperative validators (carefully, with references checked).
- Ensure no duplicate rule definitions between old validators and new schemas.
- Update `frontend/documentation.md` to include:
  - Form architecture pattern
  - Schema colocation rules
  - Standard migration pattern for new forms
- Final verification gate:
  - `frontend`: `npm run build`, `npm test -- --run`
  - `backend-ts`: `npm run typecheck`, `npm test`

## Behavior Preservation Checklist (Applies to Every PR)

- Form submits same payload keys and value transformations.
- Existing toast/error copy is preserved or intentionally documented.
- Existing navigation paths are unchanged.
- Loading states and disabled states are unchanged.
- Field-level validation trigger timing (blur/submit) matches current behavior.
- Accessibility props (`aria-*`, labels, error associations) remain intact.

## Test Strategy

- Unit tests:
  - Schema tests for edge cases.
  - Component tests for validation display and submit flow.
- Regression tests:
  - Preserve key e2e auth/class/assignment flows.
- Command baseline:
  - `frontend`: `npm run build`
  - `frontend`: `npm test -- --run`
  - `backend-ts`: `npm run typecheck`
  - `backend-ts`: `npm test`

## Deliverables

- Migrated forms using RHF + Zod by phase.
- Updated/added tests covering migrated behavior.
- Updated `frontend/documentation.md` describing the finalized pattern.
- `task.md` maintained as living progress tracker.
