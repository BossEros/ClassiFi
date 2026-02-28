# Implementation Plan - Calendar Event Contrast Update

## Scope

Improve calendar event readability by replacing bright event backgrounds with darker, contrast-safe surfaces while preserving class color identity.

1. Add a reusable style helper for calendar event cards.
2. Apply the helper to month, week, and day event renderers.
3. Verify with frontend build.

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
