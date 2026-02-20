# Task Checklist

- [x] Read project-level and architecture documentation (`AGENTS.md`, `frontend/documentation.md`, `backend-ts/documentation.md`)
- [x] Locate run-test toast bug source and verify API/frontend contract mismatch
- [x] Normalize frontend test-result mapping to support current and legacy summary fields
- [x] Update related frontend type definitions and unit tests
- [x] Run required frontend verification command (`npm run build`)

## User-Friendly Error Messages

- [x] Trace where technical status codes leak into user-facing messages
- [x] Add centralized sanitization for user-facing API errors
- [x] Remove status suffixes from assignment submission error responses
- [x] Update tests for sanitized user-friendly messaging
- [x] Run frontend verification (`npm run build`)

## Modal Focus Blur

- [x] Audit modal layering and dashboard top navbar stacking context
- [x] Standardize modal overlay z-index above app chrome (including navbar)
- [x] Run frontend verification (`npm run build`)

## Late Submission Toggle

- [x] Read and trace current late-submission flow across frontend form, API contracts, and backend submission logic
- [x] Add explicit teacher-facing "Allow late submissions" toggle and only show late config customization when enabled
- [x] Persist late submission settings through assignment create/update backend pipeline
- [x] Return late submission settings in assignment DTOs for edit-mode hydration
- [x] Harden submission deadline handling to respect enabled late submissions with safe default config fallback
- [x] Run required verification (`frontend: npm run build`, `backend-ts: npm run typecheck`, `backend-ts: npm test`)
- [x] Update relevant architecture documentation (`frontend/documentation.md`, `backend-ts/documentation.md`)

## Coursework Basic Info Form Consistency

- [x] Remove left-side icons from Programming Language and Total Score labels for cleaner alignment
- [x] Add required red asterisk indicators to Deadline Date and Deadline Time
- [x] Add required red asterisk indicators to Release Date and Release Time when scheduled release is enabled
- [x] Extend shared `DatePicker` and `TimePicker` components with reusable `required` label support
- [x] Run required frontend verification (`npm run build`)

## Optional Coursework Deadlines

- [x] Review current frontend and backend deadline requirements end-to-end
- [x] Make assignment deadline optional in backend model, schemas, DTOs, repositories, and services
- [x] Make deadline optional in frontend types, validation, form state, and create/update payload mapping
- [x] Update dashboard/assignment/gradebook mapping and display logic to handle `null` deadlines cleanly
- [x] Update affected unit tests for optional deadline behavior
- [x] Run required verification (`frontend: npm run build`, `backend-ts: npm run typecheck`, `backend-ts: npm test`)
- [x] Update architecture docs (`frontend/documentation.md`, `backend-ts/documentation.md`)

## Coursework Creation Defaults

- [x] Disable `Allow students to resubmit` by default for new coursework
- [x] Remove default `Total Score` value and keep the field empty with placeholder
- [x] Remove default deadline time fallback (`11:59 PM`) and show `Pick a time` until selected
- [x] Keep scheduled release date defaulted to today, but keep release time empty (`Pick a time`) until selected
- [x] Add/create-form validation so `Total Score` remains required before submit
- [x] Update and align affected frontend tests

## Coursework Form Field Colors

- [x] Update deadline date and deadline time input field color to `#1A2130`
- [x] Apply the same `#1A2130` color to coursework title, description, programming language, and total score fields
- [x] Run required frontend verification (`npm run build`)

## Submission Settings Max Attempts

- [x] Apply `#1A2130` color styling to the `Max Attempts` input field
- [x] Reduce `Max Attempts` input size for numeric-only entry and align layout with the `Allow students to resubmit` card style
- [x] Run required frontend verification (`npm run build`)

## Submission Settings UI Polish

- [x] Refine `Max Attempts` row layout for cleaner visual hierarchy and consistency with surrounding cards
- [x] Keep compact numeric input sizing while improving spacing and helper text presentation
- [x] Run required frontend verification (`npm run build`)

## Coursework Label Color Consistency

- [x] Set Coursework form labels to white for title, description, programming language, and total score
- [x] Set deadline/release date-time labels to white on the Coursework form
- [x] Set `Template Code` and `Test Cases` section headings to white
- [x] Run required frontend verification (`npm run build`)

## Remove Grace Period From Late Submissions

- [x] Read required architecture docs and locate all `gracePeriod` usages in frontend/backend
- [x] Remove `gracePeriodHours` from late-penalty domain/API types while keeping `rejectAfterHours` and `tiers`
- [x] Update backend penalty computation and validation to no longer depend on a grace period
- [x] Remove grace period controls and messaging from coursework late-penalty UI
- [x] Update affected frontend/backend tests
- [x] Run required verification (`frontend: npm run build`, `backend-ts: npm run typecheck`, `backend-ts: npm test`)
- [x] Update documentation to reflect the new late-penalty behavior

## Coursework To Assignment Terminology Migration

- [x] Rename coursework form module paths/files to assignment naming
- [x] Rename `useCourseworkForm` -> `useAssignmentForm` and related types/usages
- [x] Rename `CourseworkFormPage` -> `AssignmentFormPage` and route references
- [x] Update class-level URLs from `/dashboard/classes/:classId/coursework/...` to `/dashboard/classes/:classId/assignments/...`
- [x] Replace remaining user-facing `Coursework` labels/messages/loading copy with `Assignment` or `Assignments` as appropriate
- [x] Update test references (unit/e2e) for renamed UI text and URLs
- [x] Run verification (`frontend: npm run build`, `backend-ts: npm run typecheck`, `backend-ts: npm test`)

## Rename Late Submission Boolean Naming

- [x] Rename backend/domain/API field from `latePenaltyEnabled` to `allowLateSubmissions`
- [x] Rename DB column mapping from `late_penalty_enabled` to `allow_late_submissions`
- [x] Propagate naming update across frontend types, form payloads, and mappers
- [x] Update affected tests/docs
- [x] Run verification (`frontend: npm run build`, `backend-ts: npm run typecheck`, `backend-ts: npm test`)

## Rename Assignment Description To Instructions

- [x] Rename assignment domain/API fields from `description*` to `instructions*`
- [x] Rename assignment DB column mappings (`description*`) to `instructions*`
- [x] Propagate naming updates across frontend assignment types/hooks/components/pages
- [x] Update admin assignment payloads/views to use `instructions`
- [x] Update affected tests/docs
- [x] Run verification (`frontend: npm run build`, `backend-ts: npm run typecheck`, `backend-ts: npm test`)

## Remove Assignment Instructions Image Alt

- [x] Remove `instructionsImageAlt` from backend assignment model/repository/service/DTO/schema layers
- [x] Remove `instructionsImageAlt` from frontend types/services/hooks/pages/components
- [x] Add database migration to drop `assignments.instructions_image_alt`
- [x] Update affected docs
- [x] Run verification (`frontend: npm run build`, `backend-ts: npm run typecheck`, `backend-ts: npm test`)

## Frontend `src` Migration

- [x] Read architecture docs and confirm current frontend structure
- [x] Move app source folders/files (`business`, `data`, `presentation`, `shared`, `main.tsx`, `index.css`) into `frontend/src`
- [x] Move frontend tests into `frontend/src/tests` and keep test imports working
- [x] Update `index.html`, Vite/TypeScript/Vitest/Playwright paths and aliases for `src`
- [x] Update `frontend/documentation.md` structure references to `src`
- [x] Run verification (`frontend: npm run build`, `frontend: npm test`)

## Backend Architecture Consistency Refactor

- [x] Create phased implementation plan and checkpoint strategy
- [x] Phase 1: Add centralized DI tokens and migrate backend DI usage to token constants
- [x] Phase 1: Run verification (`backend-ts: npm run typecheck`, `backend-ts: npm test`)
- [x] Phase 1: Commit checkpoint
- [x] Phase 2: Add naming consistency wrappers for non-kebab-case service/repository files
- [x] Phase 2: Run verification (`backend-ts: npm run typecheck`, `backend-ts: npm test`)
- [x] Phase 2: Commit checkpoint
- [x] Phase 3: Extract dashboard query-heavy reads into dedicated query repository (non-breaking service API)
- [x] Phase 3: Run verification (`backend-ts: npm run typecheck`, `backend-ts: npm test`)
- [x] Phase 3: Commit checkpoint
- [x] Update `backend-ts/documentation.md` with repository categories (Entity vs Query) and module guidance

## Backend Module-Folder Migration (Phase 4)

- [x] Add Phase 4 scope to implementation plan
- [x] Move real controller/service/repository/model/schema files into `backend-ts/src/modules/*`
- [x] Rewire API v1 route imports to module entry points
- [x] Run verification (`backend-ts: npm run typecheck`, `backend-ts: npm test`)
- [x] Commit Phase 4 checkpoint

## Backend Module-Folder Migration (Phase 4, Item 3)

- [x] Move enrollment repository/model to `src/modules/enrollments`
- [x] Split `src/services/service-dtos.ts` into module-local DTO files
- [x] Move `services/admin/admin.types.ts` to `src/modules/admin/admin.types.ts`
- [x] Move `services/notification/types.ts` to `src/modules/notifications/notification.types.ts`
- [x] Run verification (`backend-ts: npm run typecheck`, `backend-ts: npm test`, `backend-ts: npm run lint`)
- [x] Commit Item 3 checkpoint

## React Router Route Group Runtime Fix

- [x] Inspect frontend route-group composition and identify invalid `<Routes>` children
- [x] Refactor route-group exports to route-element fragments (non-component usage inside `<Routes>`)
- [x] Update app route mounting to inject route-element fragments directly
- [ ] Run required frontend verification (`npm run build`)

## Legacy Coursework Redirect Cleanup

- [x] Audit references for `LegacyCourseworkNewRedirect` and `LegacyCourseworkEditRedirect`
- [x] Confirm no active internal callers or UI links target `/coursework/*` routes
- [x] Remove legacy redirect components and teacher route entries
- [ ] Run required frontend verification (`npm run build`)

## SRP Refactor Checkpoints (Assignment Detail + Calendar Service)

- [x] Read project/frontend architecture docs and inspect current `AssignmentDetailPage` + `calendarService` responsibilities
- [x] Checkpoint 1: Extract assignment data/auth loading orchestration into `useAssignmentDetailData`
- [x] Checkpoint 1: Run frontend verification (`npm run build` blocked by pre-existing unrelated test-module path issues; validated with `npx tsc -p tsconfig.app.json`) and commit
- [x] Checkpoint 2: Extract submission flow and test polling logic into dedicated hook
- [x] Checkpoint 2: Run frontend verification (`npm run build` still blocked by pre-existing unrelated test-module path issues; validated with `npx tsc -p tsconfig.app.json`) and commit
- [ ] Checkpoint 3: Extract preview/download modal actions into dedicated hook and keep page composition-focused
- [ ] Checkpoint 3: Run frontend verification (`npm run build`) and commit
- [ ] Checkpoint 4: Extract calendar date/color and class mapping utilities from `calendarService`
- [ ] Checkpoint 4: Run frontend verification (`npm run build`) and commit
