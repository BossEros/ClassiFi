# Frontend Zod + React Hook Form Migration Tracker

Related plan: `implementation_plan.md`

## Current Status

- Overall progress: `20%`
- Current phase: `Phase 1 - Auth Flow Migration`
- Last updated: `2026-02-22`

## Execution Checklist

## Phase 0: Foundation and Baseline Safety

- [x] Create shared RHF+Zod utility hook (`useZodForm`) in Presentation shared hooks
- [x] Create shared form error mapping helpers (if needed for UI compatibility)
- [x] Define schema folder structure and naming conventions
- [x] Add/adjust test helpers for form validation and submit behavior
- [x] Run verification gate (`frontend build` + `frontend tests`)

## Phase 1: Auth Flow Migration

- [ ] Migrate `frontend/src/presentation/components/auth/forms/LoginForm.tsx`
- [ ] Migrate `frontend/src/presentation/components/auth/forms/RegisterForm.tsx`
- [ ] Migrate `frontend/src/presentation/components/auth/forms/ForgotPasswordForm.tsx`
- [ ] Migrate `frontend/src/presentation/pages/auth/ResetPasswordPage.tsx`
- [ ] Add/update auth form tests
- [ ] Run verification gate (`frontend build` + `frontend tests`)

## Phase 2: Class Management Forms

- [ ] Migrate `frontend/src/presentation/pages/teacher/ClassFormPage.tsx`
- [ ] Migrate `frontend/src/presentation/components/student/forms/JoinClassModal.tsx`
- [ ] Migrate `frontend/src/presentation/components/admin/AdminCreateClassModal.tsx`
- [ ] Align class validation rules with Zod schemas (no behavior change)
- [ ] Add/update class form tests
- [ ] Run verification gate (`frontend build` + `frontend tests`)

## Phase 3: Assignment Authoring Forms

- [ ] Refactor `frontend/src/presentation/hooks/teacher/useAssignmentForm.ts` for RHF integration
- [ ] Migrate `frontend/src/presentation/pages/teacher/AssignmentFormPage.tsx`
- [ ] Migrate assignment subforms and test case modal components
- [ ] Add Zod schemas for assignment, schedule, late penalties, and attempts
- [ ] Add/update assignment form tests
- [ ] Run verification gate (`frontend build` + `frontend tests`)

## Phase 4: Remaining Modals and Admin/Settings Forms

- [ ] Migrate admin user modals
- [ ] Migrate settings/password modal forms
- [ ] Migrate grade override form modal
- [ ] Add/update tests for migrated modals
- [ ] Run verification gate (`frontend build` + `frontend tests`)

## Phase 5: Cleanup and Documentation

- [ ] Remove/deprecate superseded imperative validators where safe
- [ ] Remove duplicate validation logic after migration completion
- [ ] Update `frontend/documentation.md` with final RHF+Zod pattern
- [ ] Run final verification gate (`frontend build` + `frontend tests`)
- [ ] Run backend safety checks (`backend-ts typecheck` + `backend-ts tests`)

## Verification Log

- [x] 2026-02-22: Baseline frontend `npm run build`
- [x] 2026-02-22: Baseline frontend `npm test -- --run`
- [x] 2026-02-22: Baseline backend `npm run typecheck`
- [x] 2026-02-22: Baseline backend `npm test`
- [x] 2026-02-22: Phase 0 frontend `npm run build`
- [x] 2026-02-22: Phase 0 frontend `npm test -- --run`
- [x] 2026-02-22: Phase 0 backend `npm run typecheck`
- [x] 2026-02-22: Phase 0 backend `npm test`

## Notes

- Preserve current UX behavior and response handling in every migrated form.
- Keep backend as final validation authority; frontend validation is an early guardrail.
- Do not bypass clean architecture boundaries during migration.
