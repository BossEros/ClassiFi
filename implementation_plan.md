# Implementation Plan - ClassiFi One-Page App Summary PDF

## Goal

Create a single-page PDF that summarizes the ClassiFi application using only repository evidence, with a clean layout that stays within one printed page.

## Scope

- `implementation_plan.md`
- `task.md`
- `frontend/scripts/generate_classifi_app_summary_pdf.mjs`
- `output/pdf/classifi-app-summary.pdf`
- `tmp/pdfs/classifi-app-summary.png`

## Execution Steps

1. Update local tracking:
   - Add a focused checklist entry in `task.md`.
2. Gather repo evidence:
   - Use `README.md`, `frontend/documentation.md`, `backend-ts/documentation.md`, package scripts, and entry-point files to extract the requested summary content.
3. Generate artifact:
   - Create a scripted one-page HTML layout and export it to PDF.
   - Capture a screenshot for visual verification.
4. Verify:
   - Confirm the generated PDF is one page.
   - Review the screenshot for overflow or legibility issues and regenerate if needed.

## Risks and Mitigations

- Risk: Content could overflow past one page.
  - Mitigation: Use a compact two-column layout, controlled font sizes, and screenshot verification before delivery.
- Risk: Python-based PDF tooling is unavailable in this environment.
  - Mitigation: Use Playwright with local Edge to print a browser-rendered page to PDF.

## Deliverables

- One-page app summary PDF under `output/pdf/`
- Verification screenshot under `tmp/pdfs/`
# Implementation Plan - Settings Page Light Mode Alignment

## Goal

Bring the shared settings page into the same light-mode system used by the updated submission overview and similarity analysis pages while preserving all current account-management behavior.

## Scope

- `frontend/src/presentation/pages/shared/SettingsPage.tsx`
- `frontend/src/presentation/components/ui/Toggle.tsx`
- `task.md`

## Execution Steps

1. Update local tracking:
   - Add a focused checklist entry in `task.md`.
2. Extend the shared toggle:
   - Add an opt-in light variant for settings notification controls.
   - Keep the current dark variant as the default to avoid regressions.
3. Refactor the settings experience:
   - Add top-bar breadcrumb context for the settings page.
   - Convert the page shell, cards, read-only fields, and action rows to the light visual language.
   - Convert the avatar, password, and delete-account modals to matching light surfaces and form controls.
4. Verify:
   - Run `frontend`: `npm run build`
   - Fix any issues and re-run until passing.

## Risks and Mitigations

- Risk: Shared toggle styling could regress existing dark surfaces.
  - Mitigation: Use an explicit light variant prop and preserve current defaults.
- Risk: Large inlined modal refactors could create inconsistent states or missed surfaces.
  - Mitigation: Convert each modal shell, form control, and action row systematically using the same light tokens.

## Deliverables

- Light-mode settings page with breadcrumb-aligned header and stronger card hierarchy.
- Light-mode avatar, password, and delete-account modals consistent with the rest of the teacher/shared white-mode UI.
- Successful frontend build verification.

# Implementation Plan - Similarity Analysis Column Sorting

## Goal

Allow teachers to sort pairwise plagiarism results by structural similarity and semantic similarity, matching the existing overall similarity sorting behavior.

## Scope

- `frontend/src/presentation/components/teacher/plagiarism/PairwiseTriageTable.tsx`
- `task.md`

## Execution Steps

1. Update local tracking:
   - Add a focused checklist entry in `task.md`.
2. Extend pairwise sort model:
   - Add `structuralSimilarity` and `semanticSimilarity` sort keys.
   - Reuse existing ascending/descending toggle behavior.
3. Update table headers:
   - Make structural and semantic similarity headers clickable.
   - Show the current sort indicator on those columns.
4. Verify:
   - Run `frontend`: `npm run build`
   - Fix any issues and re-run until passing.

## Deliverables

- Sortable structural similarity column.
- Sortable semantic similarity column.
- Successful frontend build verification.

# Implementation Plan - Similarity Analysis Results Light Mode Alignment

## Goal

Bring the teacher similarity analysis results experience into the same light-mode system as the submission overview while preserving all plagiarism-review behavior.

## Scope

- `frontend/src/presentation/pages/teacher/SimilarityResultsPage.tsx`
- `frontend/src/presentation/components/teacher/plagiarism/PairwiseTriageTable.tsx`
- `frontend/src/presentation/components/teacher/plagiarism/PairComparison.tsx`
- `frontend/src/presentation/components/teacher/plagiarism/PairCodeDiff.tsx`
- `frontend/src/presentation/components/teacher/plagiarism/PairCodeEditor.tsx`
- `frontend/src/presentation/components/teacher/plagiarism/monacoDarkTheme.ts`
- `frontend/src/presentation/components/ui/Select.tsx`
- `task.md`

## Execution Steps

1. Update local tracking:
   - Add a focused checklist entry in `task.md`.
2. Refactor page navigation + shell:
   - Replace the in-page back button with top-bar breadcrumbs.
   - Align empty/error/loading states and summary cards with the light teacher pages.
3. Convert the triage table and controls:
   - Apply the same stronger card/table/header contrast used on the submission overview.
   - Light-align the threshold select, action buttons, and pagination.
4. Refine the comparison section:
   - Make the comparison card, toggle controls, helper text, and close action fit the light system.
   - Light-align Monaco comparison headers and editor chrome while preserving readability.
5. Verify:
   - Run `frontend`: `npm run build`
   - Fix any issues and re-run until passing.

## Risks and Mitigations

- Risk: Monaco theme changes could reduce code readability.
  - Mitigation: Use a dedicated light theme with explicit editor and diff colors instead of generic defaults.
- Risk: Shared `Select` updates could regress dark-mode usage elsewhere.
  - Mitigation: Add an opt-in light variant and keep dark as the default.

## Deliverables

- Breadcrumb-driven similarity results navigation.
- Light-mode similarity summary, pairwise table, and comparison panel.
- Readable light-themed review chrome around plagiarism comparison tools.
- Successful frontend build verification.

# Implementation Plan - Teacher Submission Overview Light Mode Alignment

## Goal

Bring the teacher submission overview page in line with the existing light-mode dashboard patterns without changing behavior or backend logic.

## Scope

- `frontend/src/presentation/pages/teacher/AssignmentSubmissionsPage.tsx`
- `frontend/src/presentation/components/ui/SummaryStatCard.tsx`
- `frontend/src/presentation/components/ui/DropdownMenu.tsx`
- `task.md`

## Execution Steps

1. Update local tracking:
   - Add a focused checklist entry in `task.md`.
2. Refactor page navigation + hierarchy:
   - Replace the in-page back button with top-bar breadcrumbs.
   - Align the page header with the light-mode teacher pages.
3. Convert the submission overview UI to light mode:
   - Update loading/error/empty states, instructions card, table, search, action row, and delete modal.
   - Keep current behavior and data flow unchanged.
4. Refine stats and dropdown presentation:
   - Support light-mode summary stat cards.
   - Use plain colored icons without colored icon backgrounds on this page.
   - Increase dropdown width so `Delete Assignment` remains on one line.
5. Verify:
   - Run `frontend`: `npm run build`
   - Fix any issues and re-run until passing.

## Risks and Mitigations

- Risk: Shared component tweaks could regress dark-mode pages.
  - Mitigation: Keep new shared props opt-in with current dark defaults unchanged.
- Risk: Light-mode overrides on shared dark inputs/buttons could become inconsistent.
  - Mitigation: Reuse the same light styling patterns already present in other teacher pages.

## Deliverables

- Breadcrumb-based submission overview navigation in the top bar.
- Light-mode teacher submission overview with readable status/metric treatments.
- Wider action dropdown with single-line destructive label.
- Successful frontend build verification.

# Auth Session Handling Hardening Plan

## Goal
Prevent unnecessary forced logout by handling transient `401` responses with a token refresh + one retry before redirecting to login.

## Scope
- `frontend/src/data/api/apiClient.ts`
- `frontend/src/main.tsx`
- `task.md`

## Execution Steps
1. Create and maintain a checklist in `task.md`.
2. Update API client unauthorized flow:
   - On first `401`, attempt `supabase.auth.refreshSession()`.
   - Retry the original request once when refresh succeeds.
   - Redirect to `/login?expired=true` only when refresh/retry fails.
3. Add startup session/store synchronization:
   - During app bootstrap, read current Supabase session.
   - Clear stale local auth user state if no active session is present.
4. Run frontend verification:
   - `npm run build`
5. If verification fails, fix and re-run until passing.

## Risks and Mitigations
- Risk: Infinite retry loop on repeated `401`.
  - Mitigation: Guard with a single retry flag.
- Risk: Stale local auth store surviving browser refresh.
  - Mitigation: Explicit startup sync against Supabase session.

## Deliverables
- Hardened `401` handling with silent refresh + single retry.
- Startup auth state synchronization between Supabase session and local store.
- Successful frontend build.
# Implementation Plan - Calendar Event Contrast Update

## Scope

Improve calendar event readability by replacing bright event backgrounds with darker, contrast-safe surfaces while preserving class color identity.

1. Add a reusable style helper for calendar event cards.
2. Apply the helper to month, week, and day event renderers.
3. Verify with frontend build: npm run build.

## Execution Checklist

- [x] Add shared calendar event style helper that derives dark backgrounds from class colors.
- [x] Update month-view event style getters (`CalendarPage`, `ClassCalendarTab`) to use helper output.
- [x] Update custom week/day event card inline styles to use helper output.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Teacher Assignment Timeline Filters

## Scope

Add teacher-side assignment filters in class detail while reusing existing assignment grouping/filter infrastructure:

1. Extend reusable filter primitives to support teacher timeline filters (`All`, `Current & Upcoming`, `Past`).
2. Wire teacher and student filters separately in class detail state without regressing student behavior.
3. Render filtered assignment sections in teacher assignments tab with existing `AssignmentSection`.
4. Verify frontend build/tests and update frontend docs for the new teacher filter behavior.

## Execution Checklist

- [x] 1. Shared filter model updates
  - [x] Add teacher filter type/counts in `assignmentFilters` utilities.
  - [x] Add helper(s) to derive teacher filter counts and timeline groupings.
  - [x] Update `assignmentFilters` unit tests.
- [x] 2. Reusable filter bar updates
  - [x] Extend `AssignmentFilterBar` to support student mode and teacher timeline mode.
  - [x] Update `AssignmentFilterBar` tests for both modes.
- [x] 3. Teacher class detail wiring
  - [x] Add teacher assignment filter state in `ClassDetailPage`.
  - [x] Pass teacher filter + counts + grouped data to `AssignmentsTabContent`.
  - [x] Update `AssignmentsTabContent` rendering for teacher-filtered sections.
- [x] 4. Verification & docs
  - [x] Run `frontend`: `npm run build`.
  - [x] Run targeted tests for updated files.
  - [x] Update `frontend/documentation.md` assignment filter notes.

# Implementation Plan - Remove Gradebook Class Statistics (YAGNI)

## Scope

Remove class statistics from the gradebook feature end-to-end and rebalance the UI:

1. Backend gradebook module:
   - Remove class statistics endpoint contract and route.
   - Remove statistics service and repository logic.
2. Frontend gradebook data flow:
   - Remove class statistics types, repository/service methods, and hook state.
   - Remove statistics panel rendering entirely.
3. Frontend gradebook UI polish:
   - Let the student gradebook table section occupy full available width.
   - Remove redundant class name subtitle under the `Gradebook` heading.
4. Verification:
   - Frontend build must pass.
   - Backend typecheck and tests must pass.

## Execution Checklist

- [ ] 1. Backend contract removal
  - [ ] Delete `/gradebook/classes/:classId/statistics` route handler.
  - [ ] Remove `ClassStatisticsResponseSchema` from gradebook schemas.
  - [ ] Remove `getClassStatistics()` from `GradebookService`.
  - [ ] Remove `ClassStatistics` type + `getClassStatistics()` query in gradebook repository.
  - [ ] Update backend gradebook service tests.
- [ ] 2. Frontend data-flow cleanup
  - [ ] Remove `ClassStatistics` type from shared/api exports.
  - [ ] Remove repository method `getStatisticsForClassId`.
  - [ ] Remove service method `getClassStatistics`.
  - [ ] Remove hook state/fetch logic for statistics in `useClassGradebook`.
  - [ ] Update frontend gradebook service/repository tests.
- [ ] 3. Frontend UI cleanup
  - [ ] Remove `StatisticsPanel` usage and file.
  - [ ] Update `GradebookContent` layout to full-width student gradebook card.
  - [ ] Remove `classDisplayName` subtitle below `Gradebook`.
  - [ ] Update `GradebookPage` and `ClassDetailPage` props accordingly.
- [ ] 4. Verification
  - [x] Run `frontend`: `npm run build`.
  - [ ] Run `backend-ts`: `npm run typecheck`.
  - [ ] Run `backend-ts`: `npm test`.

# Implementation Plan - Frontend/Backend Dead Code Cleanup

## Scope

Remove confirmed dead code with zero runtime references across frontend and backend, while avoiding speculative removals.

1. Verify zero-reference candidates with codebase-wide search.
2. Delete unused files/components/hooks/pages in frontend.
3. Remove unused backend helper exports and dead module file.
4. Re-run required frontend/backend verification commands.

## Execution Checklist

- [x] Verify candidates with `rg` across frontend/backend runtime source paths.
- [x] Remove dead frontend files with no runtime import chain.
- [x] Remove dead backend module/helper exports with no runtime references.
- [x] Update local task tracker checklist.
- [x] Run `frontend`: `npm run build`.
- [x] Run `backend-ts`: `npm run typecheck`.
- [x] Run `backend-ts`: `npm test`.

# Implementation Plan - Teacher Assignment Card Callback Cleanup

## Scope

Align assignment list code with current UX decision: no edit/delete controls on teacher assignment cards.

1. Remove unused edit/delete callback props across card/section/tab/page.
2. Remove dead class-detail delete-assignment modal wiring tied to card actions.
3. Update tests and frontend docs to match the new behavior.
4. Run frontend verification.

## Execution Checklist

- [x] Remove `onEdit`/`onDelete` props from assignment card and callers.
- [x] Remove unused class-detail assignment management state/handlers/modal.
- [x] Update assignment card/section tests to remove stale action-button assertions.
- [x] Update frontend docs for teacher assignment management flow.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Dependency-Level Dead Code Pass

## Scope

Audit package usage and stale module entry points after recent refactors.

1. Verify dependency usage in frontend/backend via repository search.
2. Remove only high-confidence dead code (unused barrel entry files).
3. Re-run required verification commands.

## Execution Checklist

- [x] Audit frontend package usage (runtime + dev tooling) and verify active references.
- [x] Audit backend package usage (runtime + dev tooling) and verify active references.
- [x] Remove unused backend barrel entry files with zero imports.
- [x] Run `frontend`: `npm run build`.
- [x] Run `backend-ts`: `npm run typecheck`.
- [x] Run `backend-ts`: `npm test`.

# Implementation Plan - Auth Cross-Tab Sync and Assignment Action Role Gate

## Scope

Address review findings by syncing auth state across tabs and restricting assignment management actions by role.

1. Add `storage` event synchronization in auth store.
2. Restrict assignment edit/delete menu visibility and handlers to teacher/admin users.
3. Verify frontend build.

## Execution Checklist

- [x] Add cross-tab auth rehydration in `useAuthStore` from `storage` events.
- [x] Add safety guard to avoid duplicate `storage` listeners in browser runtime.
- [x] Gate assignment action dropdown and delete modal rendering to teacher/admin users.
- [x] Add defensive role checks in assignment edit/delete handlers.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Teacher Submissions Collapsible Instructions and Stats Cards

## Scope

Upgrade the teacher assignment submissions page UI while reusing existing patterns:

1. Reuse a shared stat card component pattern from similarity results.
2. Make assignment instructions collapsible with a right-side chevron affordance.
3. Add a new `Missing` metric derived from class roster count minus submitted count.
4. Keep architecture boundaries intact by using Business services (`classService`, `assignmentService`) from Presentation.
5. Verify frontend build after changes.

## Execution Checklist

- [x] Create reusable summary stat card component for icon + label + value cards.
- [x] Refactor similarity results summary cards to use the reusable component.
- [x] Update shared `CollapsibleInstructions` interaction to right-chevron collapsible header behavior.
- [x] Replace inline instructions block in `AssignmentSubmissionsPage` with `CollapsibleInstructions`.
- [x] Fetch class roster count via `getClassStudents` and compute `missing` submissions.
- [x] Replace submissions stats single-card layout with individual icon stat cards (Total, On Time, Late, Missing).
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Teacher Submissions Table View

## Scope

Replace teacher submissions card grid with a table layout that matches the visual language of Student Originality Overview, while preserving existing behavior and reusing current utilities.

1. Build a dedicated submissions table component with columns:
   - Student Name
   - Status
   - Submission Time
   - Grade
   - Action (`View Details`)
2. Reuse existing logic helpers for status/time/grade formatting.
3. Add pagination (10 rows/page) with range summary and page controls.
4. Keep action routing consistent with current `View Details` behavior.
5. Verify frontend build.

## Execution Checklist

- [x] Add `AssignmentSubmissionsTable` component in teacher submissions UI.
- [x] Reuse `isLateSubmission`, `formatDateTime`, and grade formatting/color helpers in the table.
- [x] Add page state and slicing in `AssignmentSubmissionsPage` for 10 rows/page.
- [x] Replace card-based submissions rendering with table rendering + pagination footer.
- [x] Update frontend documentation for submissions table/pagination behavior.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Teacher Submissions Avatar Hydration Fix

## Scope

Ensure teacher submissions table loads real student profile photos (when available) instead of always rendering initials:

1. Reuse existing class roster fetch (`getClassStudents`) already present on the page.
2. Build a `studentId -> avatarUrl` lookup map in page state.
3. Pass avatar lookup to `AssignmentSubmissionsTable` and feed it into shared `Avatar`.
4. Verify frontend build.

## Execution Checklist

- [x] Build avatar lookup from class roster data in `AssignmentSubmissionsPage`.
- [x] Pass avatar lookup map into `AssignmentSubmissionsTable`.
- [x] Render avatar `src` from lookup with fallback initials retained.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Teacher Review Test Results Focus

## Scope

Refocus teacher submission review to prioritize actionable testing data:

1. Remove teacher submission-history list card from assignment detail review UI.
2. Route selected submission from teacher submissions table into assignment detail.
3. Fetch and display test results for the selected teacher submission in review.
4. Verify frontend build.

## Execution Checklist

- [x] Pass `submissionId` in teacher submissions `View Details` navigation.
- [x] Load selected-submission test results in assignment detail data hook for teacher/admin.
- [x] Remove `TeacherSubmissionListCard` usage (and dead component file).
- [x] Keep teacher status/preview/download panel bound to selected submission when provided.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Role-Aware Hidden Test Case Visibility

## Scope

Ensure hidden test cases are only hidden for student viewers:

1. Add role-aware visibility control to test results card.
2. Show hidden test cases and results for teacher/admin viewers.
3. Keep hidden masking behavior unchanged for students.
4. Verify frontend build.

## Execution Checklist

- [x] Add `showHiddenCases` prop to `AssignmentTestResultsCard`.
- [x] Update results/test-case filtering to honor role-aware visibility.
- [x] Pass `showHiddenCases={isTeacher}` from assignment detail page.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Hidden Test Details Data Fix

## Scope

Fix missing hidden-case input/expected/actual data in teacher submission review:

1. Extend backend test-results endpoint with optional `includeHiddenDetails`.
2. Include hidden-case fields in service mapping when flag is enabled.
3. Update frontend repository/service to request hidden details in teacher mode.
4. Verify frontend build and backend typecheck/tests.

## Execution Checklist

- [x] Add `TestResultsQuerySchema` with `includeHiddenDetails` query support.
- [x] Pass query flag through submissions controller to `CodeTestService.getTestResults`.
- [x] Return hidden-case details in backend result mapping when flag is true.
- [x] Add frontend repository/service support for `includeHiddenDetails`.
- [x] Request hidden details in teacher assignment detail data flow.
- [x] Run `frontend`: `npm run build`.
- [x] Run `backend-ts`: `npm run typecheck`.
- [x] Run `backend-ts`: `npm test`.

# Implementation Plan - Test Result Output Stacking

## Scope

Prevent visual ambiguity in expected vs actual output rendering:

1. Replace side-by-side expected/actual layout with vertical stacking.
2. Keep existing data and status rendering behavior unchanged.
3. Verify frontend build.

## Execution Checklist

- [x] Update `AssignmentTestResultsCard` to render expected output above actual output.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Single-Use Component Inlining and Deletion

## Scope

Inline selected single-use wrapper components into their direct parent components and then remove dead files in two ordered deletion phases to reduce component-file volume safely.

1. Inline component JSX from items `5-10` into their apparent parent components.
2. Delete components `1-5` first.
3. Verify build still passes before deleting the remaining inlined component files.
4. Delete remaining files from items `5-10`.
5. Re-run frontend verification.

## Execution Checklist

- [x] Inline `InstructorInfo` + `ScheduleInfo` into `ClassHeader`.
- [x] Inline `DateBlock` + `GradeDisplay` + `StatusBadge` into `AssignmentCard`.
- [x] Inline `NavItem` into `Sidebar`.
- [x] Update/remove affected tests for deleted component files.
- [x] Delete components `1-5` in requested order group.
- [x] Run `frontend`: `npm run build`.
- [x] Delete remaining inlined component files from items `5-10`.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Frontend Component Test Signal Pruning

## Scope

Audit presentation-layer component tests and remove only low-signal coverage while preserving behavior-critical tests.

1. Classify component tests by user-facing behavioral value.
2. Delete only confirmed low-signal tests with minimal regression impact.
3. Re-verify frontend build and test suite.

## Execution Checklist

- [ ] Audit `frontend/src/presentation/components/**/*test.tsx` for behavior coverage signal.
- [x] Audit `frontend/src/presentation/components/**/*test.tsx` for behavior coverage signal.
- [x] Remove only low-signal component tests.
- [x] Run `frontend`: `npm run build`.
- [x] Run `frontend`: `npm test`.

# Implementation Plan - High-Signal Unit Coverage Hardening

## Scope

Raise unit-test confidence by prioritizing behavior-critical coverage (business logic, validation, service/repository contracts) and avoiding low-signal UI-only assertions.

1. Audit tests for correctness against expected product behavior.
2. Add missing high-signal tests on critical branches.
3. Enforce strict coverage thresholds on high-signal layers.
4. Keep low-signal tests out of the required quality gate.
5. Re-verify frontend/backend required commands.

## Execution Checklist

- [x] Audit current unit tests for implementation-coupled expectations.
- [x] Add/adjust frontend high-signal tests for auth and validation branches.
- [x] Add/adjust backend high-signal tests for auth contracts and service branches.
- [x] Enforce `100%` thresholds on high-signal targets in Vitest configuration.
- [x] Remove/de-prioritize low-signal component-only tests from coverage goals.
- [x] Run `frontend`: `npm run build`.
- [x] Run `backend-ts`: `npm run typecheck`.
- [x] Run `backend-ts`: `npm test`.

# Implementation Plan - Teacher Similarity View Simplification

## Scope

Refine the teacher similarity analysis view to focus on actionable signals and align search UX with submissions view.

1. Remove `Report ID` from the similarity results header.
2. Remove the `Total Pairs` summary card.
3. Make the student originality search bar match the submissions-view search input sizing and styling.
4. Move the student originality search bar into the card header, right-aligned beside the overview text.
5. Verify frontend build/tests.

## Execution Checklist

- [x] Remove `Report ID` from `SimilarityResultsPage` header.
- [x] Remove `Total Pairs` summary card and adjust summary grid layout.
- [x] Update `StudentSummaryTable` search input to match submissions-view search pattern and placeholder.
- [x] Move student originality search UI into the overview header area (right side).
- [x] Run `frontend`: `npm run build`.
- [x] Run `frontend`: `npm test`.

# Implementation Plan - Student Originality Pagination Alignment

## Scope

Align student originality table pagination with the teacher submissions table pagination UI and improve header-to-table spacing.

1. Reuse the same pagination UI/behavior pattern used by teacher submissions.
2. Keep student originality filtering/sorting intact while applying shared pagination.
3. Add clearer spacing between the originality header/search block and table.
4. Verify frontend build/tests.

## Execution Checklist

- [x] Extract/introduce shared submissions-style table pagination component.
- [x] Reuse shared pagination in `AssignmentSubmissionsTable`.
- [x] Apply shared pagination in `StudentSummaryTable` with submissions-matched page size.
- [x] Increase spacing between originality header/search block and table.
- [x] Run `frontend`: `npm run build`.
- [x] Run `frontend`: `npm test`.

# Implementation Plan - Student Originality Column Cleanup

## Scope

Refine the Student Originality Overview table by removing low-value columns and improving action-column alignment.

1. Remove the `Total Pairs` column.
2. Keep `Actions` and align its header/cells with button content.
3. Verify frontend build/tests.

## Execution Checklist

- [x] Remove `Total Pairs` header and row cells in `StudentSummaryTable`.
- [x] Center `Actions` header/cells so header alignment matches button content.
- [x] Run `frontend`: `npm run build`.
- [x] Run `frontend`: `npm test`.

# Implementation Plan - High-Signal Unit Coverage Expansion (Checkpoint 2)

## Scope

Expand strict high-signal unit coverage beyond auth-only paths by adding behavior-critical tests in validation, mapping, and repository layers:

1. Add missing tests for submission file validation rules.
2. Add tests for class payload type-guard and mapping behavior.
3. Add repository tests for avatar upload flow and error handling.
4. Enforce `100%` per-file coverage for the newly gated files.
5. Re-verify frontend coverage and build.

## Execution Checklist

- [x] Add tests for `submissionFileValidation` edge cases and expected acceptance paths.
- [x] Add tests for `classMappers` type-guard/map behavior.
- [x] Add tests for `userRepository` avatar upload success/failure/edge paths.
- [x] Fix unsafe old-avatar deletion edge case (skip empty avatar path removal).
- [x] Extend frontend `vitest` strict coverage include set for added high-signal files.
- [x] Run focused frontend coverage for the strict-gated high-signal files.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Backend High-Signal Coverage Expansion (Checkpoint 3)

## Scope

Expand strict backend unit coverage from auth-only contracts to additional behavior-critical schema/util modules:

1. Add tests for class schema validation rules and coercion contracts.
2. Add tests for submission schema response/query/param contracts.
3. Add tests for unique class-code generation retry behavior.
4. Extend backend strict coverage gate with these modules.
5. Re-verify backend typecheck/tests.

## Execution Checklist

- [x] Add tests for `class.schema` validation and coercion behavior.
- [x] Add tests for `submission.schema` response/query/param behavior.
- [x] Add tests for `class-code.util` uniqueness/retry behavior.
- [x] Extend backend `vitest` strict coverage include set for added high-signal files.
- [x] Run focused backend coverage for the strict-gated files.
- [x] Run `backend-ts`: `npm run typecheck`.
- [x] Run `backend-ts`: `npm test`.

# Implementation Plan - Backend High-Signal Coverage Expansion (Checkpoint 4)

## Scope

Expand strict backend coverage into user-account lifecycle and notification-preference behavior:

1. Add user-service tests covering account deletion safety branches.
2. Add notification-preference service tests for defaults, updates, and enabled-channel resolution.
3. Add notification-preference schema contract tests.
4. Extend backend strict coverage gate for these modules.
5. Re-verify backend typecheck/tests.

## Execution Checklist

- [x] Add tests for `user.service` account deletion and avatar update flows.
- [x] Add tests for `notification-preference.service` default/update/channel logic.
- [x] Add tests for `notification-preference.schema` request/response contracts.
- [x] Extend backend `vitest` strict coverage include set for added high-signal files.
- [x] Run focused backend coverage for the strict-gated files.
- [x] Run `backend-ts`: `npm run typecheck`.
- [x] Run `backend-ts`: `npm test`.

# Implementation Plan - Backend Schema Contract Expansion (Checkpoint 5)

## Scope

Expand strict coverage for additional request/response contract files and enforce correct notification query boolean parsing:

1. Add dedicated tests for assignment schema contracts.
2. Add dedicated tests for notification schema + DTO query parsing.
3. Fix incorrect boolean coercion for `unreadOnly` query (`"false"` previously parsed as `true`).
4. Extend strict backend coverage include set for these schema modules.
5. Re-verify backend typecheck/tests.

## Execution Checklist

- [x] Add tests for `assignment.schema` request/response/param contracts.
- [x] Add tests for `notification.schema` type/response/query/DTO behavior.
- [x] Fix notification query boolean parsing to handle string booleans safely.
- [x] Extend backend `vitest` strict coverage include set for added schema modules.
- [x] Run focused backend coverage for strict-gated files.
- [x] Run `backend-ts`: `npm run typecheck`.
- [x] Run `backend-ts`: `npm test`.

# Implementation Plan - Frontend Validation Contract Expansion (Checkpoint 6)

## Scope

Expand strict frontend coverage from auth-focused files to additional validation contract modules:

1. Add/adjust tests to fully cover assignment validation branch paths.
2. Add/adjust tests to fully cover class validation branch paths.
3. Extend frontend strict coverage include set for assignment/class/common validation modules.
4. Re-verify frontend strict coverage and build.

## Execution Checklist

- [x] Add branch-complete tests for `assignmentValidation`.
- [x] Add branch-complete tests for `classValidation`.
- [x] Extend frontend `vitest` strict coverage include set for `assignmentValidation`, `classValidation`, and `commonValidation`.
- [x] Run focused frontend coverage for strict-gated files.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Frontend Unit Test Centralization (Checkpoint 7)

## Scope

Centralize scattered frontend unit tests into a single tree under `src/tests/unit` to match backend test organization and improve maintainability:

1. Move all frontend unit test files from feature folders into `src/tests/unit` with layer-based grouping.
2. Rewrite moved test imports to stable `@/` aliases so tests continue resolving source modules correctly.
3. Restrict Vitest discovery to centralized unit test paths.
4. Re-verify frontend build and unit tests.

## Execution Checklist

- [x] Move frontend unit test files into `src/tests/unit/**`.
- [x] Rewrite affected relative imports in moved tests to `@/` aliases.
- [x] Update Vitest `include` patterns to run centralized unit tests only.
- [x] Run `frontend`: `npm run build`.
- [x] Run `frontend`: `npm test -- --run`.
- [x] Update frontend documentation to codify centralized unit test location.

# Implementation Plan - Cross-Repo Test Policy Sync (Checkpoint 8)

## Scope

Synchronize frontend, backend, and root-level test-location conventions so centralized test structure is enforced and documented consistently:

1. Enforce frontend test TypeScript project scope to `src/tests/**`.
2. Enforce backend Vitest discovery to `backend-ts/tests/**`.
3. Update frontend/backend/root documentation to reflect centralized test policy.
4. Re-verify frontend and backend required quality commands.

## Execution Checklist

- [x] Update frontend test config scope in `tsconfig.test.json`.
- [x] Update backend Vitest include scope in `backend-ts/vitest.config.ts`.
- [x] Update documentation in `frontend/documentation.md`, `backend-ts/documentation.md`, and `README.md`.
- [x] Run `frontend`: `npm run build`.
- [x] Run `frontend`: `npm test -- --run`.
- [x] Run `backend-ts`: `npm run typecheck`.
- [x] Run `backend-ts`: `npm test`.

# Implementation Plan - Similarity Pairwise Triage First Flow

## Scope

Shift teacher similarity review from student-drilldown-first to pairwise-triage-first for lower-friction investigation:

1. Replace student-level overview/drilldown UI with a single assignment-level pairwise triage table.
2. Preserve existing code comparison detail panel (`Compare Code`) and detail fetch flow.
3. Keep class-level summary stat cards and warnings at top-level.
4. Remove no-longer-used student-centric presentation components and exports.
5. Verify frontend build.

## Execution Checklist

- [x] Add a dedicated pairwise triage table component:
  - [x] Search by student name
  - [x] Similarity threshold filter (default high-similarity)
  - [x] Sortable similarity/overlap/longest columns
  - [x] Pagination + compare action
- [x] Refactor `SimilarityResultsPage`:
  - [x] Remove student summary/pairs state and API calls from page flow
  - [x] Render class-level metrics + pairwise triage as primary surface
  - [x] Keep existing code comparison panel behavior
- [x] Remove obsolete student-centric table/detail components and index exports
- [x] Update `task.md` tracking and frontend documentation for the new flow
- [x] Run `frontend`: `npm run build`

# Implementation Plan - Pairwise Metric Clarity and Qualitative Signals

## Scope

Improve teacher readability in pairwise plagiarism triage by replacing technical metric labels and raw counts with clear language and qualitative severity signals.

1. Rename `Overlap` to `Total Shared Chunks`.
2. Rename `Longest Match` to `Longest Continuous Shared Block`.
3. Add plain-language hover tooltips explaining both columns.
4. Replace raw numeric cells with normalized qualitative badges (`Low`, `Medium`, `High`), computed behind the scenes to keep comparisons fair across short and long submissions.
5. Verify frontend build.

## Execution Checklist

- [x] Update `PairwiseTriageTable` column labels to teacher-friendly names.
- [x] Add hover tooltips with plain-language definitions for both columns.
- [x] Add normalization helpers and qualitative signal-level mapping.
- [x] Replace numeric overlap/longest values with qualitative badges.
- [x] Keep sorting behavior aligned with normalized signal calculations.
- [x] Update `frontend/documentation.md` for the revised pairwise columns.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Calendar Month Event Card Simplification

## Scope

Simplify month-view calendar event cards for both teacher and student flows:

1. Remove class-name/course-code prefix from event cards.
2. Remove teacher submission ratio (`submitted/total`) line from event cards.
3. Keep assignment title as the primary text (plus existing status icon).
4. Verify frontend build.

## Execution Checklist

- [x] Update `CustomEventComponent` to render assignment title only.
- [x] Remove submission ratio rendering from month-view event card content.
- [x] Keep status icon rendering unchanged.
- [x] Update `frontend/documentation.md` for simplified month-view event card content.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Plagiarism Report Reuse (Deduplicate Assignment Checks)

## Scope

Prevent duplicate similarity report creation when teachers repeatedly click `Check Similarities` for the same assignment.

1. Check for latest assignment report before running a new analysis.
2. Reuse the existing report if no newer/latest submissions were added since report generation.
3. Only create a new report when submissions changed.
4. Verify backend type safety and test suite.

## Execution Checklist

- [x] Add repository support for fetching the latest report by assignment.
- [x] Add persistence-layer logic to determine whether an existing report is still current.
- [x] Reuse current report in `PlagiarismService.analyzeAssignmentSubmissions` when eligible.
- [x] Update plagiarism service unit tests for report-reuse behavior.
- [x] Update backend documentation to describe deduplicated assignment analysis checks.
- [x] Run `backend-ts`: `npm run typecheck`.
- [x] Run `backend-ts`: `npm test`.

# Implementation Plan - Similarity Review Label + Report Status Endpoint

## Scope

Improve teacher submissions UX by surfacing whether a reusable similarity report already exists:

1. Add an assignment-level status endpoint for reusable similarity report availability.
2. Update the submissions action button label to `Review Similarities` when a reusable report exists.
3. Keep `Check Similarities` when no reusable report exists.
4. Verify frontend and backend required checks.

## Execution Checklist

- [x] Add backend service/controller/schema support for assignment similarity status lookup.
- [x] Add frontend repository/service types and API call for similarity status.
- [x] Wire status fetch in `AssignmentSubmissionsPage` and toggle button label.
- [x] Run `frontend`: `npm run build`.
- [x] Run `backend-ts`: `npm run typecheck`.
- [x] Run `backend-ts`: `npm test`.

# Implementation Plan - Reused-Report Toast Suppression + Latest-Only Retention

## Scope

Align teacher UX and persistence policy for similarity analysis:

1. Show analysis-complete toast only when a new analysis is actually executed.
2. Suppress analysis toast when an existing report is reused (`Review Similarities` flow).
3. Keep only the latest similarity report per assignment by pruning older reports.
4. Verify frontend/backend required checks.

## Execution Checklist

- [x] Add `isReusedReport` flag to plagiarism analyze responses.
- [x] Use `isReusedReport` in teacher submissions page to conditionally show toast.
- [x] Add repository cleanup method to delete old reports per assignment while keeping latest.
- [x] Enforce cleanup when creating a new report and when reusing an existing report.
- [x] Update relevant docs/tests for the new behavior.
- [x] Run `frontend`: `npm run build`.
- [x] Run `backend-ts`: `npm run typecheck`.
- [x] Run `backend-ts`: `npm test`.

# Implementation Plan - Similarity Page Transition Flicker Fix

## Scope

Smooth the handoff from submissions to similarity results by removing the initial empty-state render flash.

1. Initialize similarity results from navigation state synchronously on first render.
2. Preserve existing state-sync behavior for subsequent location-state updates.
3. Verify frontend build.

## Execution Checklist

- [x] Initialize `results` and `filteredPairCount` from `location.state` in `SimilarityResultsPage`.
- [x] Keep `useEffect` synchronization for navigation-state updates.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Teacher Submission Detail Override Action

## Scope

Restore the missing override-grade action in teacher submission detail view while reusing existing gradebook override UX primitives.

1. Add teacher-only override action in assignment detail submission status card.
2. Reuse existing grade override modal + hook for submit/remove flows.
3. Ensure submission mapping carries feedback/override metadata used by detail view state updates.
4. Verify frontend build.

## Execution Checklist

- [x] Add/track task checklist entries for this fix.
- [x] Wire override modal state/handlers into `AssignmentDetailPage`.
- [x] Render `Override Score` action in teacher submission detail panel.
- [x] Add remove-override path when submission is currently overridden.
- [x] Replace local `any` callback typing with a concrete `Submission` type.
- [x] Map submission feedback/override fields in frontend DTO mapper.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Remove Gradebook Override Capability

## Scope

Remove grade override interactions from the teacher gradebook UI so overrides are only done from submission detail view.

1. Remove gradebook modal/hook wiring for override actions.
2. Convert gradebook table cells to read-only grade display.
3. Update frontend docs to reflect the new gradebook behavior.
4. Verify frontend build.

## Execution Checklist

- [x] Remove override modal state/handlers from `GradebookContent`.
- [x] Remove `onGradeClick` plumbing from `GradebookTable`.
- [x] Make `GradeCell` non-interactive/read-only.
- [x] Update `frontend/documentation.md` gradebook component behavior notes.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Settings Avatar Immediate Refresh Fix

## Scope

Ensure profile-picture updates render immediately across the app without requiring logout/login:

1. Fix avatar URL cache behavior after upload.
2. Keep existing service/store architecture unchanged.
3. Update affected frontend unit tests.
4. Verify frontend build.

## Execution Checklist

- [x] Return and persist a cache-busted avatar URL from `userRepository.uploadUserAvatar`.
- [x] Keep old-avatar cleanup and backend persistence flow intact.
- [x] Update `userRepository` tests for cache-busted URL behavior.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Frontend Icon Policy Standardization

## Scope

Enforce a strict frontend icon policy for consistency:

1. Use `lucide-react` only for frontend UI icons.
2. Replace inline SVG icon exceptions with Lucide equivalents.
3. Standardize icon usage by removing ad-hoc per-instance style overrides.
4. Add lint guardrails to prevent icon drift.
5. Verify frontend build and lint.

## Execution Checklist

- [x] Replace remaining inline SVG icon usage in presentation components with Lucide icons.
- [x] Normalize icon usage by removing inconsistent `strokeWidth` overrides.
- [x] Add ESLint restrictions for disallowed frontend icon-library imports.
- [x] Add ESLint restriction to block inline `<svg>` in presentation components for UI icons.
- [x] Run `frontend`: `npm run build`.
- [x] Run `frontend`: `npm run lint`.

# Implementation Plan - Student Assignment Status Consistency Fix

## Scope

Fix student class-overview status inconsistencies where submitted assignments appeared as `not-started` and late-submitted work displayed as `late` instead of submitted-state labels.

1. Ensure student class-detail assignment requests include `studentId` so backend returns student-specific submission fields.
2. Adjust status precedence so submitted work is never labeled `late`.
3. Align student filter buckets so pending = needs submission, submitted = already submitted.
4. Verify with targeted unit tests and frontend build.

## Execution Checklist

- [x] Thread optional `studentId` through class repository/service assignment fetch methods.
- [x] Pass logged-in student ID from class-detail page when viewer role is student.
- [x] Update assignment status/filter utility logic for submitted-vs-late handling.
- [x] Update targeted unit tests (`assignmentStatus`, `assignmentFilters`, `classRepository`, `classService`).
- [x] Run `frontend`: targeted `vitest` suite for touched modules.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Similarity Comparison Auto-Scroll

## Scope

Improve teacher similarity-review usability by automatically scrolling to the code comparison panel after selecting a pair from the pairwise table.

1. Add a dedicated scroll anchor for the comparison section.
2. Trigger smooth scroll whenever a pair is selected (including repeated selections).
3. Add a focused unit test for row-selection auto-scroll behavior.
4. Verify with targeted tests and frontend build.

## Execution Checklist

- [x] Add comparison-section ref/anchor in `SimilarityResultsPage`.
- [x] Trigger scroll on every pair-selection action.
- [x] Add/update `SimilarityResultsPage` unit test for `scrollIntoView`.
- [x] Run `frontend`: targeted `vitest` for updated page test.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Admin Create Class Full-Page Flow

## Scope

Replace admin class creation modal with a dedicated full-page form that matches teacher create-class UX, while adding teacher search-and-select assignment.

1. Add a dedicated `AdminClassFormPage` with teacher-like layout and schedule/academic sections.
2. Add searchable teacher assignment UI (name/email/id) and bind selected teacher to form validation.
3. Route admin create action to the new page and keep edit modal flow intact.
4. Verify frontend build and update frontend documentation routes.

## Execution Checklist

- [x] Add `adminClassPageFormSchema` and type for page-level admin class creation.
- [x] Create `AdminClassFormPage` mirroring teacher form styling with teacher search-and-select.
- [x] Add admin route `/dashboard/admin/classes/new`.
- [x] Rewire admin classes `Create Class` CTA to navigate to the new route.
- [x] Keep admin class edit modal behavior unchanged.
- [x] Run `frontend`: `npm run build`.
- [x] Update `frontend/documentation.md` route notes.

# Implementation Plan - Admin Top Bar Consistency

## Scope

Apply the shared dashboard top navigation bar to all admin pages so admin UI matches teacher/student layout consistency.

1. Add `useTopBar` wiring to every admin page that renders `DashboardLayout`.
2. Ensure loading/error branches in admin pages also render with the same top bar.
3. Convert `AdminEnrollmentsPage` to use `DashboardLayout` with top bar and retain existing content.
4. Verify frontend build.

## Execution Checklist

- [x] Wire `useTopBar` into `AdminDashboardPage`.
- [x] Wire `useTopBar` into `AdminUsersPage`.
- [x] Wire `useTopBar` into `AdminClassesPage`.
- [x] Wire `useTopBar` into `AdminClassDetailPage` including loading/error branches.
- [x] Refactor `AdminEnrollmentsPage` to use `DashboardLayout` + admin auth guard + top bar.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Admin Class Form Modal Removal (Create/Edit Page Unification)

## Scope

Replace admin class edit modal with route-based full-page flow (same pattern as teacher), and remove legacy admin class create/edit modal implementation.

1. Extend `AdminClassFormPage` to support both create and edit modes.
2. Add admin edit route and navigate table `Edit Class` action to that route.
3. Remove modal usage from `AdminClassesPage` and delete modal component/test files.
4. Verify frontend build.

## Execution Checklist

- [x] Add edit mode behavior in `AdminClassFormPage` using route params + prefilled class data.
- [x] Add admin edit route: `/dashboard/admin/classes/:classId/edit`.
- [x] Rewire class table `Edit Class` action to navigate to admin edit page.
- [x] Remove `AdminCreateClassModal` usage from `AdminClassesPage`.
- [x] Delete legacy `AdminCreateClassModal` component and its unit test file.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Admin Class Archive/Restore Action Consistency

## Scope

Ensure admin class action menu supports both directions of status management:

1. Keep archiving behavior for active classes.
2. Add restore behavior for archived classes.
3. Use clear user-facing labels that match behavior.
4. Verify frontend build.

## Execution Checklist

- [x] Add admin business service method to restore archived classes via existing update contract.
- [x] Update admin class actions menu to conditionally show `Archive Class` or `Restore Class`.
- [x] Wire restore handler in `AdminClassesPage` with success/error toasts and refresh.
- [x] Update class-management helper text to include restore behavior.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Admin Class Detail UX Simplification

## Scope

Refine the admin class detail page into a single, clean student-management view:

1. Remove Students/Assignments tabs and remove assignment content from this page.
2. Improve class header readability and spacing for class metadata.
3. Widen and restyle the student search bar to match admin search UX.
4. Fix action visibility so remove-student control is visible without row hover.
5. Verify frontend build.

## Execution Checklist

- [x] Remove tab state/UI and assignment panel from admin class detail page.
- [x] Redesign class header layout for clearer information hierarchy.
- [x] Restyle and widen student search block.
- [x] Make remove-student action icon visible by default.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Automatic Similarity Report Teacher Attribution

## Scope

Ensure automatically generated similarity reports are attributed to a class teacher instead of storing `teacher_id` as `null`.

1. Add a repository helper to resolve class teacher by assignment ID.
2. Add persistence fallback to resolve `teacherId` when callers do not provide it.
3. Update auto-analysis tests to verify teacher resolution is passed into analysis.
4. Verify backend typecheck and tests.

## Execution Checklist

- [x] Add `SimilarityRepository.getTeacherIdByAssignment`.
- [x] Use fallback teacher resolution in plagiarism report persistence.
- [x] Update `PlagiarismAutoAnalysisService` tests for class teacher resolution.
- [x] Run `backend-ts`: `npm run typecheck`.
- [x] Run `backend-ts`: `npm test`.

# Implementation Plan - Semantic Similarity Throttling

## Scope

Prevent semantic-sidecar overload by replacing unbounded pairwise fan-out with bounded concurrency during assignment similarity analysis.

1. Add bounded concurrency execution in plagiarism semantic scoring.
2. Add a configurable environment setting for semantic max in-flight requests.
3. Add unit coverage validating concurrency cap behavior.
4. Update backend environment/docs and re-run required backend verification.

## Execution Checklist

- [x] Replace `Promise.all` fan-out in semantic scoring with a bounded worker pool.
- [x] Add `SEMANTIC_SIMILARITY_MAX_CONCURRENT_REQUESTS` config support.
- [x] Add/adjust plagiarism service unit tests for bounded semantic concurrency.
- [x] Update backend env example and backend documentation.
- [x] Run `backend-ts`: `npm run typecheck`.
- [x] Run `backend-ts`: `npm test`.

# Implementation Plan - Frontend Single-Use Component Inlining (Next Pass)

## Scope

Continue reducing low-reuse component file count by inlining page-specific components that are only imported once and unlikely to be reused across screens.

1. Inline submissions page-only components into `AssignmentSubmissionsPage`.
2. Inline assignment-detail feedback components into `AssignmentDetailPage`.
3. Remove obsolete component files and stale tests referencing deleted files.
4. Verify frontend build.

## Execution Checklist

- [x] Inline `CollapsibleInstructions` into `AssignmentSubmissionsPage`.
- [x] Inline `AssignmentSubmissionsTable` into `AssignmentSubmissionsPage`.
- [x] Inline `TeacherFeedbackCard` into `AssignmentDetailPage`.
- [x] Inline `SubmissionFeedbackCard` into `AssignmentDetailPage`.
- [x] Delete inlined component files and obsolete unit test import target.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Teacher Similarity Column Breakdown

## Scope

Enhance the teacher pairwise triage table in similarity results:

1. Rename `Similarity` to `Overall Similarity`.
2. Add `Structural Similarity` and `Semantic Similarity` columns immediately after `Overall Similarity`.
3. Render the correct score source per column (`hybridScore`, `structuralScore`, `semanticScore`) using existing similarity formatting.
4. Verify frontend build and sync frontend documentation.

## Execution Checklist

- [x] Update `PairwiseTriageTable` headers and row cells for 3 similarity score columns.
- [x] Keep sort/filter behavior using overall similarity as primary signal.
- [x] Update empty-state table `colSpan` for new column count.
- [x] Run `frontend`: `npm run build`.
- [x] Update `frontend/documentation.md` for revised pairwise column definitions.

# Implementation Plan - Teacher Dashboard and Topbar Visual Formatting

## Scope

Align teacher main dashboard and topbar visuals with the provided mock while preserving existing architecture and class-card shape constraints.

1. Keep class card container shape but add a dashboard-specific visual variant.
2. Refactor teacher dashboard main content layout:
   - Recent Classes row with light cards and view-all action.
   - To-Check table section styled like the reference.
3. Update shared topbar styling to match the light dashboard treatment.
4. Exclude sidebar changes.
5. Verify with frontend build.

## Execution Checklist

- [x] Add dashboard variant to shared `ClassCard` for teacher dashboard usage.
- [x] Restyle `TeacherDashboardPage` headings, section wrappers, and to-check table.
- [x] Ensure assignment-name column does not render avatars.
- [x] Restyle topbar and notification trigger for light-mode appearance.
- [x] Run `frontend`: `npm run build`.
# Implementation Plan - Light Classes Pages + Shared UI Theme Tokens

## Scope

Align classes pages to the same light dashboard visual language and introduce a central source of truth for color/text styling tokens.

1. Create shared UI theme token constants for dashboard/class surfaces and filter controls.
2. Apply the shared tokens to teacher classes page.
3. Apply the shared tokens to student classes page.
4. Update class filters to use the shared light token set.
5. Verify frontend build.

## Execution Checklist

- [ ] Add `dashboardTheme` and `classFiltersTheme` constants.
- [ ] Convert teacher classes page to light dashboard palette.
- [ ] Convert student classes page to light dashboard palette.
- [ ] Update `ClassFilters` control styles to consume shared theme constants.
- [ ] Run `frontend`: `npm run build`.
# Implementation Plan - Academic Calendar Light Mode Conversion

## Scope

Convert calendar experience from dark surfaces to the shared light dashboard visual language, including page shell, calendar grid, toolbars, modals, and related interaction elements.

1. Introduce centralized calendar theme tokens for consistent colors/typography.
2. Update calendar page and inline filter dropdown to light surfaces.
3. Update shared calendar components (toolbars, event component, day/week views, event style mapping).
4. Convert event details modal to light mode.
5. Update calendar CSS files (`CalendarPage.css`, `CustomDayView.css`, `CustomWeekView.css`) for light grid/backgrounds.
6. Apply same light conversion to class detail calendar tab flow.
7. Verify frontend build.

## Execution Checklist

- [ ] Add shared calendar theme constants.
- [ ] Convert `CalendarPage` shell, filters, loading/error states, and containers to light mode.
- [ ] Convert `ClassCalendarTab` shell, loading/error states, and containers to light mode.
- [ ] Convert `CustomToolbar` and `CustomViewToolbar` to light mode.
- [ ] Convert `CustomEventComponent` and `eventStyle` to light-mode event cards.
- [ ] Convert `EventDetailsModal` to light mode.
- [ ] Update `CalendarPage.css`, `CustomDayView.css`, and `CustomWeekView.css` for light theme.
- [ ] Run `frontend`: `npm run build`.

# Implementation Plan - Auth Palette Rebalance

## Scope

Rework login and registration visual balance to reduce eye strain while keeping brand continuity with the sidebar.

1. Introduce shared auth theme tokens for page background, card surface, and field treatments.
2. Apply the softer palette to login page content and actions.
3. Apply the same palette to registration flow steps and controls.
4. Verify frontend build.

## Execution Checklist

- [x] Add shared auth theme constants for balanced dark/light auth surfaces.
- [x] Update `LoginPage` to use the new card/input/background palette.
- [x] Update `RegisterPage` to use the same palette across all steps.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Auth Visual Polish Follow-Up

## Scope

Refine auth usability after the palette pass.

1. Fix leading field icon visibility in auth forms.
2. Make selected registration role cards more obvious and readable.
3. Convert forgot/reset password pages to the same shared auth palette.
4. Verify frontend build.

## Execution Checklist

- [x] Fix email/password icon visibility in auth forms.
- [x] Increase selected-state clarity in registration role cards.
- [x] Apply shared auth palette to forgot password page.
- [x] Apply shared auth palette to reset password page and state screens.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Student Class Overview Light Mode

## Scope

Convert the student-facing class overview page to the shared light dashboard visual system while preserving existing behavior.

1. Identify the shared class-detail components currently forcing dark surfaces.
2. Add student-only light variants for header, tabs, assignment list, student list, pagination, and leave-class modal.
3. Wire the student class-detail route to use the light variants without changing teacher behavior.
4. Verify frontend build.

## Execution Checklist

- [x] Add student light-mode styling support to shared class-detail components.
- [x] Update `ClassDetailPage` student view shell, states, and leave modal to light mode.
- [x] Keep teacher class-detail visuals unchanged.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Teacher Class Overview Light Mode

## Scope

Extend the shared class-detail light visual system to the teacher-facing class overview so both roles use the same palette and interaction surfaces without changing behavior.

1. Convert the remaining teacher-only class-detail shells and modals to the light system.
2. Add light-mode support to the gradebook tab so teacher-specific content matches the rest of the page.
3. Keep the dedicated gradebook page on its existing default styling unless a light variant is explicitly passed.
4. Verify frontend build.

## Execution Checklist

- [x] Convert teacher-only class-detail modals and page shell remnants to light mode.
- [x] Add light-mode styling support to `GradebookContent`.
- [x] Wire teacher class-detail tabs to the shared light variant.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Class Overview Layout Refresh

## Scope

Refactor the class overview page layout to match the provided reference while preserving all existing behavior and shared data flow.

1. Replace the in-page back button with shared top-bar breadcrumbs (`Classes > Class Name`).
2. Reformat the light-mode class header into a plain overview section without a visible outer card.
3. Restyle the class-detail tabs to the compact segmented control used in the reference.
4. Remove the central wrapper around tabs/content so each tab panel sits as its own section.
5. Verify the frontend build.

## Execution Checklist

- [x] Update the top bar breadcrumb wiring for class detail.
- [x] Refactor `ClassHeader` light variant to the plain overview layout.
- [x] Restyle `ClassTabs` light variant to the segmented layout.
- [x] Remove the central tab/content wrapper from `ClassDetailPage`.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Class Overview Tab Clarity Polish

## Scope

Improve tab affordance and assignment visibility in the class overview without changing behavior.

1. Make the segmented tabs read clearly as interactive controls with stronger selected state and separators.
2. Rework the assignments panel hierarchy so the title and primary action share the top row, with filters below.
3. Increase assignment card contrast against the page background.
4. Verify the frontend build.

## Execution Checklist

- [x] Restyle light-mode `ClassTabs` for stronger affordance and separation.
- [x] Update `AssignmentsTabContent` header hierarchy.
- [x] Strengthen `AssignmentCard` light-mode contrast.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Class Overview Content Polish

## Scope

Polish clarity within the class overview content panels without changing behavior.

1. Normalize section heading scale between Assignments, Enrolled Students, and Gradebook.
2. Strengthen the selected state for assignment filter buttons.
3. Improve visibility of the student search field and role badge.
4. Emphasize the destructive remove-student action visually.
5. Verify the frontend build.

## Execution Checklist

- [x] Normalize section heading styling across assignments, students, and grades.
- [x] Strengthen active filter button styling in `AssignmentFilterBar`.
- [x] Improve student search input and role badge visibility.
- [x] Make the remove-student action read as destructive.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Gradebook Contrast Polish

## Scope

Improve grade readability in the light-mode gradebook by refining score badge colors without changing any grade logic or behavior.

1. Update light-mode grade badge colors for stronger text/background contrast.
2. Apply the same readability treatment to average badges.
3. Verify the frontend build.

## Execution Checklist

- [x] Refine light-mode `GradeCell` badge colors.
- [x] Refine light-mode average badge colors.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Class Header Information Hierarchy Polish

## Scope

Refine the class header to better match common LMS information hierarchy patterns while preserving the same data and behavior.

1. Promote the class title as the primary anchor.
2. Keep the class actions on the same row as the title.
3. Move the schedule directly below the title as high-frequency context.
4. Push class code, year/semester, and instructor into a quieter secondary metadata row.
5. Extend the accent bar to span the full header height.
6. Verify the frontend build.

## Execution Checklist

- [x] Restructure the light-mode `ClassHeader` content hierarchy.
- [x] Make the accent bar span the full height of the header.
- [x] Keep copy-code and action behavior unchanged.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Assignment Overview Light Mode

## Scope

Convert the shared assignment overview page to the same light visual system used across the dashboard while preserving the existing teacher and student behavior.

1. Replace the in-page back button with top-bar breadcrumbs (`Classes > Class > Assignment`).
2. Convert the assignment overview shell, header, states, and supporting surfaces to light mode.
3. Add light-mode support to assignment-specific cards and modals used on the page without changing logic.
4. Verify the frontend build.

## Execution Checklist

- [x] Wire assignment detail breadcrumbs through the shared top bar.
- [x] Convert `AssignmentDetailPage` shell and panels to the light visual system.
- [x] Add light-mode support to assignment overview components and modals.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Assignment Overview UI Polish

## Scope

Polish the light-mode assignment overview for clarity and readability without changing any behavior.

1. Remove the redundant class-name line from the assignment overview body.
2. Strengthen assignment metadata pills and add a total-score pill.
3. Add clearer section icons for instructions, submission status, and submit assignment.
4. Improve the visibility of the empty-state and hidden-case icons.
5. Verify the frontend build.

## Execution Checklist

- [x] Remove the redundant class-name line from the assignment overview body.
- [x] Strengthen metadata pill contrast and add total-score metadata.
- [x] Add icons to section headers in the assignment overview flow.
- [x] Refine the no-submission and hidden-case icon treatments.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Create Assignment Light Mode

## Scope

Convert the teacher create/edit assignment page and its local form components to the shared light dashboard system without changing any behavior.

1. Replace the in-page back button with clickable top-bar breadcrumbs.
2. Convert the create/edit assignment page shell, error banner, and action area to light mode.
3. Convert the assignment form sections, toggles, template-code area, test-case section, and related modals to light mode.
4. Remove required-field asterisks in this flow and label optional fields explicitly instead.
5. Verify the frontend build.

## Execution Checklist

- [x] Wire create/edit assignment breadcrumbs through the shared top bar.
- [x] Convert `AssignmentFormPage` shell and actions to the light visual system.
- [x] Convert assignment form section components and local modals to light mode.
- [x] Replace required asterisks with explicit optional labels where appropriate.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Student Class Grades Tab

## Scope

Replace the student class-detail grades placeholder with a personal performance view rather than the teacher gradebook matrix.

1. Add a student-focused grades tab component scoped to the current class.
2. Reuse the existing student gradebook hook and data model for current-class grades.
3. Show summary metrics and assignment-level grade details without any class ranking.
4. Update frontend documentation and verify with a frontend build.

## Execution Checklist

- [x] Add a reusable student class grades tab component for the class overview page.
- [x] Render class average, graded count, pending review count, and not-submitted count.
- [x] Show assignment rows with score, feedback, late-penalty, and adjusted-state context.
- [x] Replace the student `Grades Coming Soon` placeholder in `ClassDetailPage`.
- [x] Update `frontend/documentation.md` for the new student grades-tab behavior.
- [x] Run `frontend`: `npm run build`.

# Implementation Plan - Assignment Form Card Emphasis

## Scope

Increase the visual separation of the teacher assignment authoring sections so major cards read clearly against the page background.

1. Add a shared visual treatment for assignment-form section cards.
2. Apply it to `Basic Information`, `Submission Settings`, `Late Submissions`, and the action card.
3. Preserve existing form behavior and input density.
4. Verify with a frontend build.

## Execution Checklist

- [x] Add shared section-card styling for the teacher assignment form.
- [x] Apply the stronger card treatment to the three major form sections.
- [x] Apply the same elevated treatment to the create/save and cancel action card.
- [x] Run `frontend`: `npm run build`.


# Implementation Plan - Admin Dashboard Light Mode

## Goal

Apply the same light dashboard visual system used by the similarity analysis results and other white-mode pages to the admin dashboard without changing behavior or data flow.

## Scope

- `frontend/src/presentation/pages/admin/AdminDashboardPage.tsx`
- `implementation_plan.md`
- `task.md`

## Execution Steps

1. Update local tracking:
   - Add a focused checklist entry in `task.md`.
2. Refactor the admin dashboard shell:
   - Convert the header, refresh action, loading state, and error state to the light palette.
3. Convert dashboard content:
   - Rework summary cards, recent activity, and quick actions to use white surfaces, slate text, and light hover states consistent with the existing white-mode pages.
4. Verify:
   - Run `frontend`: `npm run build`
   - Fix any issues and re-run until passing.

## Deliverables

- Light-mode admin dashboard page aligned with the existing white-mode dashboard system.
- Successful frontend build verification.

# Implementation Plan - Admin Users Page Light Mode

## Goal

Apply the same light dashboard visual system used by the teacher similarity analysis results to the admin users page, with special focus on the table shell, header-row color, and surrounding controls.

## Scope

- `frontend/src/presentation/pages/admin/AdminUsersPage.tsx`
- `implementation_plan.md`
- `task.md`

## Execution Steps

1. Update local tracking:
   - Add a focused checklist entry in `task.md`.
2. Refactor the admin users shell:
   - Convert the page header, refresh action, add-user action, and filter controls to the light palette.
3. Convert the users table system:
   - Match the table container and header-row styling to the similarity results table.
   - Align rows, badges, empty state, pagination, and action dropdown with the same white-mode color system.
4. Verify:
   - Run `frontend`: `npm run build`
   - Fix any issues and re-run until passing.

## Deliverables

- Light-mode admin users page aligned with the existing white-mode table system.
- Successful frontend build verification.

# Implementation Plan - Admin Users Page Light Mode Follow-up

## Goal
Complete the light-mode pass for the admin users management flow by aligning all admin modals and removing the visible outer filter wrapper around search and role controls.

## Execution Steps

1. Convert the delete, edit, and create user modals to the same white-mode surface system.
2. Remove the visible filter wrapper while keeping the search and role controls individually styled.
3. Verify with frontend build: npm run build.
pm run build.



# Implementation Plan - Admin Users Page Interaction Polish

## Goal
Improve admin users page control affordance by making the search and role controls pop more, increasing hover-state clarity in dropdowns, and adding explicit pointer cursors to key clickable actions.

## Execution Steps

1. Increase elevation and border contrast on the search input and role filter trigger.
2. Strengthen hover styles for role filter choices and row action dropdown items.
3. Add pointer cursors to prominent clickable controls and verify with frontend build.


# Implementation Plan - Admin Classes Page Light Mode Alignment

## Goal
Apply the same applicable admin users management UI refinements to the admin class management list page: light-mode surfaces, stronger control elevation, clearer hover states, improved dropdown affordance, and aligned destructive modal styling.

## Execution Steps

1. Convert the class management header, error state, and primary actions to the light admin control system.
2. Restyle the class filters and table shell to match the admin users and teacher light-mode table treatment.
3. Align the row action dropdown and delete-class modal with the same hover, cursor, and light-surface patterns used on admin users.
4. Verify with frontend build: npm run build.


# Implementation Plan - Admin Refresh And Divider Consistency

## Goal
Reduce redundant dashboard card copy, improve row separation clarity where it felt too subtle, and standardize the refresh control across the admin dashboard, users, and classes pages.

## Execution Steps

1. Remove the redundant helper text beneath the admin dashboard stat cards.
2. Strengthen visible row separators in recent activity and the admin users table.
3. Replace the icon-only refresh controls on admin users and classes with the same labeled refresh button used on the admin dashboard.
4. Verify with frontend build: npm run build.


# Implementation Plan - Admin User Modal Polish

## Goal
Refine the admin user create, edit, and delete modals by removing the outer glow, improving form label hierarchy, fixing placeholder presentation, and making button icons/cursor affordances consistent with the rest of the admin interface.

## Execution Steps

1. Remove the colored modal glow and keep the dialog containers clean and natural.
2. Increase field-label emphasis over placeholder text in the create and edit forms.
3. Standardize button icon placement, cursor-pointer affordances, and destructive delete-flow button treatment.
4. Verify with frontend build: npm run build.


# Implementation Plan - Admin Delete Class Modal Polish

# Implementation Plan - Admin Table Separator And Class Academic Info Polish

# Implementation Plan - Admin Dashboard Stat Icon And Quick Actions Spacing Polish

# Implementation Plan - Admin Class Detail Top Bar And Light Mode

# Implementation Plan - Admin Enrollment Management Light Mode

# Implementation Plan - Frontend Dead Code Audit And Cleanup

## Goal
Audit the frontend after the dark-to-light refactor and remove only the code that is provably unused, with special attention to old theme artifacts, stale UI components, and orphaned barrel exports.

## Execution Steps

1. Scan frontend files and imports to identify zero-inbound modules and barrel-only leftovers.
2. Confirm each candidate with direct reference searches before deleting anything.
3. Remove the confirmed dead files and trim unused exports from still-live modules.
4. Verify with frontend build: npm run build.
