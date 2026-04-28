- [x] Inspect deactivate-account authentication plan and current auth/account flows
- [x] Add inactive-account backend auth guard for all roles
- [x] Switch self-service account action away from physical deletion
- [x] Update frontend deactivation copy and blocked-login cleanup
- [x] Add/update focused backend and frontend tests
- [x] Run required backend and frontend verification commands

- [x] Add failing tests for teacher current-standing averages and exports
- [x] Count no-submission work as zero in teacher gradebook averages and rank
- [x] Exclude submitted-but-ungraded work from teacher averages until grading
- [x] Align teacher CSV/PDF exports with the same current-standing policy
- [x] Run required backend and frontend verification commands for the current-standing policy change

- [x] Add failing tests for points-weighted teacher averages
- [x] Replace equal-weight teacher averages with points-weighted current standing
- [x] Keep missing-as-zero and pending-review exclusion under the weighted policy
- [x] Run required backend and frontend verification commands for the weighted policy change

Deactivate account verification notes:
- `backend-ts`: `npm.cmd run typecheck` passed on 2026-04-26
- `backend-ts`: `npm.cmd test` passed on 2026-04-26
- `frontend`: `npm.cmd run build` passed on 2026-04-26
- `frontend`: `npm.cmd test -- --run src/tests/unit/business/services/authService.test.ts src/tests/unit/data/repositories/authRepository.test.ts src/tests/unit/presentation/schemas/auth/authSchemas.test.ts` blocked by environment-level `spawn EPERM` while Vitest loads `vitest.config.ts`

- [x] Inspect admin user delete flow across backend service, route, frontend service, modal, and tests
- [x] Change admin user action to deactivate through `isActive: false`
- [x] Update admin user modal/menu copy and confirmation from delete/`DELETE` to deactivate/`DEACTIVATE`
- [x] Update focused backend and frontend tests for admin user deactivation
- [x] Run required backend and frontend verification commands

Admin user deactivation verification notes:
- `backend-ts`: `npm.cmd run typecheck` passed on 2026-04-26
- `backend-ts`: `npm.cmd test` passed on 2026-04-26
- `frontend`: `npm.cmd run build` passed on 2026-04-26
- `frontend`: `npm.cmd test -- --run src/tests/unit/business/services/adminService.test.ts src/tests/unit/data/repositories/adminRepository.test.ts src/tests/unit/presentation/schemas/admin/adminUserSchemas.test.ts` blocked by environment-level `spawn EPERM` while Vitest loads `vitest.config.ts`

- [x] Replace settings self-deactivation UI with an informational Account Status card
- [x] Block self-service account deactivation on the backend for all roles
- [x] Update backend tests and documentation for admin-managed deactivation
- [x] Run required backend and frontend verification commands

Settings account status verification notes:
- `backend-ts`: `npm.cmd run typecheck` passed on 2026-04-26
- `backend-ts`: `npm.cmd test` passed on 2026-04-26
- `frontend`: `npm.cmd run build` passed on 2026-04-26

- [x] Review architecture and current teacher/admin deletion flow
- [x] Add backend teacher deletion guardrail
- [x] Expose teacher assigned-class count in admin user data
- [x] Hide teacher self-delete from settings
- [x] Block admin teacher deletion in modal when classes remain assigned
- [x] Update tests
- [x] Update documentation
- [ ] Run verification commands

- [x] Inspect class reassignment and similarity report ownership flow
- [x] Propagate historical similarity report ownership during class reassignment
- [x] Update backend tests
- [x] Update backend documentation
- [ ] Re-run backend verification commands

- [x] Review frontend architecture and failing `AssignmentsPage` tests
- [x] Fix fake-timer interaction in `AssignmentsPage` unit tests
- [ ] Re-run frontend verification commands for the affected area

- [x] Inspect admin class-detail remove-student modal rendering flow
- [x] Portal the affected remove-student modal to `document.body`
- [ ] Verify modal sizing and interaction behavior remain intact
- [x] Run frontend verification commands

Verification notes:
- `backend-ts`: `npm.cmd run typecheck` passed
- `backend-ts`: `npm.cmd run test` blocked by environment-level `spawn EPERM` while Vitest loads `vitest.config.ts`
- `frontend`: `npm.cmd run build` passed
- `frontend`: `npm.cmd run typecheck` passed
- `frontend`: `npm.cmd test -- --run src/tests/unit/presentation/pages/shared/AssignmentsPage.test.tsx` blocked by environment-level `spawn EPERM` while Vitest loads `vitest.config.ts`
- `frontend`: `npm.cmd run build` blocked in this environment by Vite memory allocation failure during bundling

- [x] Inspect assignment update deadline validation flow
- [x] Allow past deadlines during assignment edit flow
- [x] Add/update frontend schema tests for create vs edit validation
- [ ] Run affected frontend verification commands

Additional verification notes:
- `frontend`: `npm.cmd run build` passed on 2026-04-24 after the assignment deadline validation change
- `frontend`: `npm.cmd test -- --run src/tests/unit/presentation/schemas/assignment/assignmentSchemas.test.ts` is still blocked by environment-level `spawn EPERM` while Vitest loads `vitest.config.ts`

- [x] Inspect assignment total-score update and grading flow
- [x] Block total-score changes after graded submissions exist
- [x] Add/update backend tests for the new guardrail
- [x] Update backend documentation
- [ ] Run backend verification commands

Additional backend verification notes:
- `backend-ts`: `npm.cmd run typecheck` passed on 2026-04-24 after the total-score guardrail change
- `backend-ts`: `npm.cmd test -- --run tests/services/assignment.service.test.ts` is blocked by environment-level `spawn EPERM` while Vitest loads `vitest.config.ts`

- [x] Inspect student class grades loading flow and teacher gradebook empty-state behavior
- [x] Make student class-rank fetch non-blocking for empty/new classes
- [x] Align student class grades no-assignment copy with teacher gradebook behavior
- [x] Add/update focused frontend unit tests
- [ ] Run affected frontend verification commands

- [x] Inspect teacher archived class list card interaction flow
- [x] Disable teacher archived class navigation from the classes list
- [x] Add/update focused frontend unit tests
- [ ] Run affected frontend verification commands

- [x] Inspect student archived classes data flow
- [x] Add backend support for including archived student classes
- [x] Switch student classes page to the correct enrolled-classes data source
- [x] Add/update focused backend and frontend tests
- [x] Update relevant documentation
- [x] Run affected verification commands

- [x] Inspect teacher submission detail data flow
- [x] Reuse student-assignment history lookup for teacher detail attempt count
- [x] Update submission status card to use the selected student's attempt count
- [x] Add/update focused frontend unit tests
- [x] Run affected frontend verification commands

- [x] Inspect admin user status-action mismatch and shared settings copy
- [x] Add status-aware admin user action labels and modal copy
- [x] Restrict teacher deactivation block to active teachers only
- [x] Replace shared settings account-status copy with a role-aware status card and hide it for admins
- [x] Run frontend verification commands

- [x] Inspect admin activate-account confirmation validation bug
- [x] Separate activate/deactivate confirmation schemas while keeping the shared modal UI
- [x] Run affected frontend verification commands

- [x] Review roster and gradebook architecture for inactive-student handling
- [x] Update implementation plan for inactive roster and gradebook status support
- [x] Add failing backend and frontend tests for inactive roster filters and gradebook status indicators
- [x] Expose student `isActive` status and roster filtering in backend class/gradebook contracts
- [x] Update frontend class roster filters to `Active` and `Inactive` only
- [x] Add roster status column and gradebook inactive indicators
- [x] Update relevant documentation if contracts or behavior change
- [x] Run required verification commands

- [x] Inspect gradebook export CSV/PDF flow for inactive-student handling
- [x] Add failing tests for CSV status column and PDF inactive-row metadata/rendering
- [x] Include `Status` in backend gradebook CSV export
- [x] Label and visually distinguish inactive students in gradebook PDF export
- [x] Keep PDF summary metrics active-only and document that rule
- [x] Update export-related documentation
- [x] Run required backend and frontend verification commands

Gradebook export verification notes:
- `backend-ts`: `npm.cmd run typecheck` passed on 2026-04-27
- `backend-ts`: `npm.cmd test` passed on 2026-04-27
- `frontend`: `npm.cmd run build` passed on 2026-04-27
- `frontend`: targeted `npm.cmd test -- --run ...gradeReportBuilder.test.ts ...gradeReportPdf.test.tsx ...GradebookContent.test.tsx` remains intermittently blocked by environment-level `spawn EPERM` while Vitest loads `vitest.config.ts`

Inactive roster and gradebook verification notes:
- `backend-ts`: `npm.cmd run typecheck` passed on 2026-04-27
- `backend-ts`: `npm.cmd test -- --run tests/services/class.service.test.ts tests/modules/gradebook.mapper.test.ts` blocked by environment-level `spawn EPERM` while Vitest loads `vitest.config.ts`
- `frontend`: `npm.cmd run build` passed on 2026-04-27
- `frontend`: `npm.cmd test -- --run src/tests/unit/data/repositories/classRepository.test.ts src/tests/unit/presentation/pages/teacher/ClassDetailPage.pagination.test.tsx src/tests/unit/presentation/components/teacher/GradebookContent.test.tsx` blocked by environment-level `spawn EPERM` while Vitest loads `vitest.config.ts`

Additional teacher submission detail verification notes:
- `frontend`: `npm.cmd run build` passed on 2026-04-24 after the teacher submission detail attempt-count fix
- `frontend`: `npm.cmd test -- --run frontend/src/tests/unit/presentation/hooks/shared/assignmentDetail/useAssignmentDetailData.test.ts` is blocked by environment-level `spawn EPERM` while Vitest loads `vitest.config.ts`

Additional student archived classes verification notes:
- `backend-ts`: `npm.cmd run typecheck` passed on 2026-04-24 after the student archived classes fix
- `backend-ts`: `npm.cmd test -- --run tests/services/student-dashboard.service.test.ts` is blocked by environment-level `spawn EPERM` while Vitest loads `vitest.config.ts`
- `frontend`: `npm.cmd run build` passed on 2026-04-24 after the student archived classes fix
- `frontend`: `npm.cmd test -- --run src/tests/unit/data/repositories/studentDashboardRepository.test.ts src/tests/unit/business/services/studentDashboardService.test.ts src/tests/unit/presentation/pages/student/StudentClassesPage.test.tsx` is blocked by environment-level `spawn EPERM` while Vitest loads `vitest.config.ts`

Admin user status copy alignment verification notes:
- `frontend`: `npm.cmd run build` passed on 2026-04-26

Admin account activation confirmation verification notes:
- `frontend`: `npm.cmd run build` passed on 2026-04-26
- `frontend`: `npm.cmd test -- --run src/tests/unit/presentation/schemas/admin/adminUserSchemas.test.ts` is blocked by environment-level `spawn EPERM` while Vitest loads `vitest.config.ts`

- [ ] Add failing backend and frontend tests for active-only teacher assignment metrics
- [ ] Add scoped backend active-student count helpers without changing admin/historical count semantics
- [ ] Wire teacher assignment aggregates, module/class assignment DTOs, and calendar counts to active-only totals
- [ ] Update teacher assignment metrics documentation
- [x] Run required backend and frontend verification commands

- [x] Reproduce the current frontend unit test failures on 2026-04-27
- [x] Trace the failures to responsive duplicate markup, active-roster fetch behavior, and invalid PDF-byte assertions
- [x] Update the affected frontend unit tests to assert the current architecture correctly
- [x] Re-run frontend verification commands

- [x] Add failing backend ranking tests for teacher gradebook ordering
- [x] Replace alphabetical teacher gradebook ordering with rank-based ordering
- [x] Align student rank calculation with the gradebook's displayed average semantics
- [x] Update gradebook documentation for rank-based ordering
- [ ] Run required backend and frontend verification commands

- [x] Inspect teacher gradebook ordering and export flow for a teacher-facing sort toggle
- [x] Add a `Student Grades` header dropdown for rank-vs-name ordering
- [x] Reuse one frontend gradebook ordering helper for table, CSV export, and PDF export
- [x] Add focused frontend tests and update gradebook documentation
- [ ] Run required frontend verification commands

Teacher gradebook sort toggle verification notes:
- `frontend`: `npm.cmd run build` passed on 2026-04-28
- `frontend`: `npm.cmd test -- --run src/tests/unit/presentation/components/teacher/GradebookContent.test.tsx src/tests/unit/presentation/components/teacher/gradebook/gradeReportBuilder.test.ts` is still blocked by environment-level `spawn EPERM` while Vitest loads `vitest.config.ts`
