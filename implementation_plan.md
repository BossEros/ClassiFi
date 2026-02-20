# Late Submission Toggle Implementation Plan

## Objective

Introduce an explicit teacher decision point for late submissions in coursework creation/editing:

- Show an `Allow late submissions` toggle.
- Display late-penalty customization only when toggle is enabled.
- Persist this policy through API/backend assignment create/update.
- Enforce deadline behavior consistently during submission.

## Scope

### Frontend

- `frontend/presentation/components/forms/coursework/LatePenaltyConfig.tsx`
- `frontend/presentation/pages/CourseworkFormPage.tsx`
- `frontend/presentation/hooks/useCourseworkForm.ts`
- `frontend/shared/types/class.ts`
- `frontend/data/mappers.ts`
- `frontend/business/services/classService.ts`

### Backend

- `backend-ts/src/api/schemas/assignment.schema.ts`
- `backend-ts/src/services/service-dtos.ts`
- `backend-ts/src/services/assignment.service.ts`
- `backend-ts/src/repositories/assignment.repository.ts`
- `backend-ts/src/shared/mappers.ts`
- `backend-ts/src/services/submission.service.ts`

### Tests / Verification

- `frontend/presentation/hooks/useCourseworkForm.test.tsx` (as needed)
- Required verification commands:
  - `frontend`: `npm run build`
  - `backend-ts`: `npm run typecheck`
  - `backend-ts`: `npm test`

## Execution Steps

1. Extend backend assignment contracts (create/update schema + service DTOs) with late submission fields.
2. Persist late fields in assignment repository create/update paths.
3. Expose late fields in assignment DTO mapper responses.
4. Harden submission deadline check to use default late config if late submissions are enabled but config is missing.
5. Update frontend late section UX to explicit `Allow late submissions` toggle with conditional config rendering.
6. Ensure frontend create/update service payloads include late submission fields.
7. Update any failing tests and run required verification commands.
8. Update frontend/backend documentation to reflect the explicit toggle flow.

## Success Criteria

- Teachers explicitly toggle late submissions ON/OFF in coursework form.
- Late config UI is hidden when toggle is OFF and shown when ON.
- Saving coursework correctly persists late submission policy.
- Editing existing coursework hydrates current late policy/config.
- Late submissions after deadline are accepted only when enabled, with penalties applied.
- Required build/typecheck/test commands pass.

---

# Coursework To Assignment Terminology Migration Plan

## Objective

Standardize product terminology end-to-end by replacing `coursework` with
`assignment` across frontend UI, routes/URLs, hooks/components, API-facing
service naming, backend comments/contracts, tests, and documentation.

## Scope

### Frontend

- Rename coursework form module files/folders to assignment naming
- Rename `useCourseworkForm` to `useAssignmentForm`
- Rename `CourseworkFormPage` to `AssignmentFormPage`
- Update class-level routes from `/coursework/...` to `/assignments/...`
- Replace user-facing labels/messages/loading/error copy from coursework to assignment
- Update related unit/e2e tests

### Backend

- Replace remaining `coursework` terminology in comments/contracts/docs where relevant
- Keep assignment behavior unchanged (terminology-only migration)

### Verification

- `frontend`: `npm run build`
- `backend-ts`: `npm run typecheck`
- `backend-ts`: `npm test`

---

# Optional Coursework Deadlines Implementation Plan

## Objective

Allow teachers to create coursework without a deadline by making `deadline` optional across frontend and backend flows.

## Scope

### Frontend

- `frontend/business/validation/assignmentValidation.ts`
- `frontend/presentation/hooks/useCourseworkForm.ts`
- `frontend/presentation/components/forms/coursework/BasicInfoForm.tsx`
- `frontend/data/api/types.ts`
- `frontend/shared/types/class.ts`
- `frontend/shared/utils/dateUtils.ts`
- `frontend/shared/utils/assignmentStatus.ts`
- `frontend/shared/utils/assignmentFilters.ts`
- Dashboard/assignment pages and cards that render deadlines

### Backend

- `backend-ts/src/models/assignment.model.ts`
- `backend-ts/src/api/schemas/assignment.schema.ts`
- `backend-ts/src/services/service-dtos.ts`
- `backend-ts/src/repositories/assignment.repository.ts`
- `backend-ts/src/services/assignment.service.ts`
- `backend-ts/src/shared/mappers.ts`
- Dashboard and gradebook schemas/services/repositories impacted by nullable deadlines

### Tests / Verification

- `frontend/business/validation/assignmentValidation.test.ts`
- `backend-ts/tests/services/teacher-dashboard.service.test.ts`
- Required verification commands:
  - `frontend`: `npm run build`
  - `backend-ts`: `npm run typecheck`
  - `backend-ts`: `npm test`

## Execution Steps

1. Make backend `assignment.deadline` nullable and propagate nullable typing through API contracts and service/repository DTOs.
2. Ensure create/update controller/service paths accept `deadline: null` and preserve correct partial-update semantics.
3. Update mapper and response schemas so missing deadlines are represented as `null` consistently.
4. Remove frontend "deadline required" validation and allow empty deadline input in create/update flows.
5. Update UI and helper utilities to gracefully render and sort assignments with no deadline.
6. Update tests that assumed deadline was required or serialized as an empty string.
7. Run required build/typecheck/tests and fix regressions.

## Success Criteria

- Teachers can create/edit coursework with no deadline.
- Backend stores and returns `deadline` as `null` when omitted.
- Frontend validation no longer blocks submission without a deadline.
- UI renders "No deadline" where applicable and avoids invalid date behavior.
- Required verification commands pass.

---

# Coursework Creation Defaults Plan

## Objective

Adjust create-coursework defaults to avoid prefilled values and make initial form state explicit for teachers.

## Execution Steps

1. Set `allowResubmission` initial value to `false`.
2. Set `totalScore` initial value to empty (`null`) and keep placeholder-only display.
3. Remove deadline time fallback (`23:59`) so time input starts empty with `Pick a time`.
4. Add `totalScore` required validation for create/update submit path.
5. Update related hook tests for new defaults.
6. Run frontend build verification.

---

# Remove Grace Period From Late Submissions Plan

## Objective

Remove the late-submission grace period feature entirely while preserving late submission support through:
- `rejectAfterHours`
- penalty `tiers`

Penalty tiers will apply immediately after the deadline instead of after a grace window.

## Scope

### Frontend

- `frontend/shared/types/gradebook.ts`
- `frontend/data/api/types.ts`
- `frontend/business/services/gradebookService.ts`
- `frontend/presentation/components/forms/coursework/LatePenaltyConfig.tsx`
- `frontend/presentation/hooks/useCourseworkForm.ts`
- Related frontend tests

### Backend

- `backend-ts/src/models/assignment.model.ts`
- `backend-ts/src/api/schemas/assignment.schema.ts`
- `backend-ts/src/api/schemas/gradebook.schema.ts`
- `backend-ts/src/services/latePenalty.service.ts`
- Related service/repository DTOs and tests

### Verification

---

# Rename Late Submission Boolean Field Plan

## Objective

Improve semantic clarity by renaming the late-submission enablement field end-to-end:
- `latePenaltyEnabled` -> `allowLateSubmissions`
- `late_penalty_enabled` -> `allow_late_submissions`

## Scope

### Backend

- `backend-ts/src/models/assignment.model.ts`
- `backend-ts/src/repositories/assignment.repository.ts`
- `backend-ts/src/services/service-dtos.ts`
- `backend-ts/src/api/schemas/assignment.schema.ts`
- `backend-ts/src/services/assignment.service.ts`
- `backend-ts/src/services/submission.service.ts`
- `backend-ts/src/shared/mappers.ts`
- Related tests and factories

### Frontend

- `frontend/data/api/types.ts`
- `frontend/data/api/database.types.ts`
- `frontend/data/mappers.ts`
- `frontend/shared/types/class.ts`
- `frontend/business/services/classService.ts`
- `frontend/presentation/hooks/useAssignmentForm.ts`
- `frontend/presentation/pages/AssignmentFormPage.tsx`
- Related tests

## Execution Steps

1. Rename model and DB column identifier in backend assignment schema.
2. Propagate field rename through repository DTOs and service DTOs.
3. Update API request/response schema contracts and mapper output.
4. Update submission-deadline enforcement to read `allowLateSubmissions`.
5. Propagate rename through frontend API/domain types and form payload mapping.
6. Update affected tests.
7. Run required build/typecheck/tests and resolve regressions.

---

# Rename Assignment Description To Instructions Plan

## Objective

Standardize assignment terminology by renaming assignment content fields end-to-end:
- `description` -> `instructions`
- `descriptionImageUrl` -> `instructionsImageUrl`
- `descriptionImageAlt` -> `instructionsImageAlt`

And DB columns:
- `description` -> `instructions`
- `description_image_url` -> `instructions_image_url`
- `description_image_alt` -> `instructions_image_alt`

## Scope

### Backend

- `backend-ts/src/models/assignment.model.ts`
- `backend-ts/src/repositories/assignment.repository.ts`
- `backend-ts/src/services/service-dtos.ts`
- `backend-ts/src/services/assignment.service.ts`
- `backend-ts/src/services/class.service.ts`
- `backend-ts/src/services/interfaces/storage.interface.ts`
- `backend-ts/src/services/storage.service.ts`
- `backend-ts/src/shared/mappers.ts`
- `backend-ts/src/api/schemas/assignment.schema.ts`
- `backend-ts/src/api/schemas/admin.schema.ts` (assignment list schema)
- `backend-ts/src/services/admin/admin-class.service.ts`
- Related tests/docs

### Frontend

- `frontend/shared/types/class.ts` (assignment fields only)
- `frontend/data/api/types.ts` (assignment-related contracts only)
- `frontend/data/api/database.types.ts` (`assignments` table fields only)
- `frontend/data/mappers.ts`
- `frontend/data/repositories/assignmentRepository.ts`
- `frontend/business/services/classService.ts`
- `frontend/business/validation/assignmentValidation.ts`
- `frontend/presentation/hooks/useAssignmentForm.ts`
- `frontend/presentation/components/forms/assignment/BasicInfoForm.tsx`
- `frontend/presentation/pages/AssignmentDetailPage.tsx`
- `frontend/presentation/pages/AssignmentSubmissionsPage.tsx`
- `frontend/presentation/pages/AdminClassDetailPage.tsx`
- Related tests/docs

## Execution Steps

1. Rename backend model/repository/service/schema/mapper fields for assignment instructions.
2. Rename storage convenience methods and assignment-image naming to instructions terminology.
3. Update admin assignment list contract from `description` to `instructions`.
4. Rename frontend assignment contracts/types/mappers/hooks/components/pages/services/validation.
5. Update affected unit tests and fixtures.
6. Run required verification commands and fix regressions.
7. Provide SQL `ALTER TABLE` statements for production DB column renames.

- `frontend`: `npm run build`
- `backend-ts`: `npm run typecheck`
- `backend-ts`: `npm test`

## Execution Steps

1. Remove `gracePeriodHours` from late-penalty config types/schemas in frontend and backend.
2. Refactor late-penalty service logic to evaluate tiers by total hours late (no grace offset).
3. Update validation rules that currently rely on `gracePeriodHours`.
4. Remove grace-period inputs/copy from coursework form UI and keep only tiers + reject-after behavior.
5. Update and fix all affected tests to the new contract.
6. Run required verification commands and resolve regressions.
7. Update documentation references to grace period.

---

# Remove Assignment Instructions Image Alt Plan

## Objective

Remove unused assignment image-alt support end-to-end:
- API/domain field: `instructionsImageAlt`
- Database column: `assignments.instructions_image_alt`

## Execution Steps

1. Remove `instructionsImageAlt` from backend assignment model, DTOs, repository types, service logic, mappers, and API schemas.
2. Remove `instructionsImageAlt` from frontend shared/API types, services, mappers, form hook state, and assignment pages/components.
3. Add a DB migration to drop `instructions_image_alt`.
4. Update docs that still reference alt metadata.
5. Run required verification commands and fix any regressions.

---

# Frontend `src` Migration Plan

## Objective

Reorganize the frontend to keep application source code under `frontend/src` while preserving current behavior, routes, and build/test output.

## Execution Steps

1. Move application folders (`business`, `data`, `presentation`, `shared`) into `frontend/src`.
2. Move entry/style files (`main.tsx`, `index.css`) into `frontend/src`.
3. Move frontend tests into `frontend/src/tests` so `@/*` alias imports remain consistent.
4. Update `index.html`, Vite, TypeScript, Vitest, and Playwright config paths to match the new structure.
5. Update frontend documentation to describe the `src`-based layout.
6. Run required frontend verification and resolve regressions.

## Verification

- `frontend`: `npm run build`
- `frontend`: `npm test`

---

# Backend Architecture Consistency Refactor Plan

## Objective

Improve backend structure consistency with low-risk, incremental changes:

- Standardize dependency injection using centralized tokens.
- Improve naming consistency for service/repository files.
- Prepare module-first organization without breaking existing imports/behavior.

## Scope

### Backend

- `backend-ts/src/shared/di/tokens.ts` (new)
- `backend-ts/src/shared/container.ts`
- `backend-ts/src/services/**/*.ts` (DI token usage updates)
- `backend-ts/src/repositories/**/*.ts` (naming compatibility phase)
- `backend-ts/documentation.md` (terminology update after structural checkpoints)

## Phase Checkpoints

1. **Phase 1 (Non-breaking DI Standardization)**
   - Add centralized DI token constants.
   - Migrate container registrations and service injections to use those tokens.
   - Keep runtime behavior unchanged.

2. **Phase 2 (Naming Consistency, Non-breaking)**
   - Introduce kebab-case file names for outlier service/repository files.
   - Keep compatibility exports/wrappers so existing imports continue to work.

3. **Phase 3 (Use-case Query Split)**
   - Extract dashboard-heavy read logic into dedicated query repository.
   - Keep service APIs and controller contracts unchanged.

4. **Phase 4 (Module-Folder Migration, Active Structure)**
   - Move real `controller/service/repository/model/schema` implementations into `backend-ts/src/modules/*`.
   - Rewire API v1 routes and DI/test imports to the module-first paths.
   - Keep only minimal shared cross-cutting code in `api`, `services`, `repositories`, and `models`.
   - Update tests/imports to avoid stale pre-module file paths.

## Verification

- `backend-ts`: `npm run typecheck` (required)
- `backend-ts`: `npm test` (required)
