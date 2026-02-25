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
  - [ ] Run `frontend`: `npm run build`.
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
