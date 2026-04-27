## Deactivate Account Authentication Slice

### Goal
Use the existing `users.is_active` column to block inactive users from authentication. Self-service account deletion was initially converted to deactivation, then superseded by the Settings Account Status Slice below so only administrators can deactivate accounts.

### Implementation Steps
1. Add a backend inactive-account guard that keeps pending teacher approval distinct from deactivated student/admin accounts.
2. Apply the guard to login and token verification so both new logins and existing sessions are blocked.
3. Replace self-service account deletion with a non-destructive path, then supersede it by blocking self-service deactivation after the policy decision to require admin handling.
4. Update frontend auth handling to clear the Supabase/local session after deactivated-account login rejection.
5. Update settings modal copy and validation from delete/`DELETE` to deactivate/`DEACTIVATE`.
6. Add focused backend and frontend tests, then run required verification commands.

### Expected Result
- Inactive teachers still see the pending approval message.
- Inactive students/admins see `Your account has been deactivated. Please contact an administrator.`
- Self-service account action deactivates the current account and signs the user out.
- Historical academic records are preserved.

## Admin User Deactivation Slice

### Goal
Change the admin user action from destructive deletion to account deactivation using the existing `users.is_active` column.

### Implementation Steps
1. Reuse the admin user lookup and teacher assigned-class guard.
2. Change the admin user service action to set `isActive` to `false` instead of calling the physical account deletion path.
3. Keep the existing `DELETE /admin/users/:id` route for API compatibility, but return deactivation copy.
4. Update the admin user modal, menu action, confirmation text, and success/error copy from delete/`DELETE` to deactivate/`DEACTIVATE`.
5. Add/update backend and frontend unit coverage for the new deactivation behavior.
6. Run required backend and frontend verification commands.

### Expected Result
- Admin-triggered user removal preserves user rows, enrollments, submissions, grades, avatars, files, and Supabase Auth users.
- Deactivated students/admins cannot log in because the authentication guard blocks inactive accounts.
- Teacher accounts with assigned classes remain blocked from the action until classes are reassigned.

## Settings Account Status Slice

### Goal
Remove self-service account deactivation from student and teacher settings so only administrators can deactivate accounts.

### Implementation Steps
1. Replace the settings deactivation danger zone with an informational Account Status card.
2. Keep admin user management as the only visible deactivation workflow.
3. Block `DELETE /user/me` on the backend so self-service deactivation cannot be triggered manually.
4. Update service tests and documentation to reflect admin-managed deactivation.
5. Run required backend and frontend verification commands.

### Expected Result
- Students and teachers cannot deactivate their own accounts from settings.
- Manual calls to the self-service account endpoint are rejected.
- Users are told to contact a teacher or system administrator for account assistance.

## Teacher Account Deletion Safety Plan

### Goal
Prevent destructive teacher account deletion from removing classes, assignments, submissions, and related academic records.

### Scope
- Backend teacher account deletion guardrails
- Admin user list data needed for deletion decisions
- Teacher settings UI changes
- Admin delete-user modal behavior changes
- Tests and documentation updates

### Implementation Steps
1. Inspect current backend user deletion and teacher class ownership flows.
2. Add a backend domain rule that blocks deleting a teacher account while the teacher still owns classes.
3. Expose assigned class counts in admin user responses so the frontend can provide proactive guardrails.
4. Remove or hide teacher self-service account deletion in settings.
5. Update the admin delete-user modal to block teacher deletion when assigned classes remain and direct admins to reassign classes first.
6. Update tests for backend service logic and frontend repository/service typing where needed.
7. Update project documentation to reflect the new deletion policy.
8. Run required verification commands for frontend and backend.

### Expected Result
- Teachers cannot delete their own accounts.
- Admins cannot delete teacher accounts while classes remain assigned.
- Admin UI clearly instructs admins to reassign classes before deletion.

## Inactive Student Roster And Gradebook Status Slice

### Goal
Support deactivated students consistently by exposing active/inactive roster status from the backend, adding `Active` and `Inactive` filters in the teacher class list, and preserving inactive students in the teacher gradebook with clear status indicators.

### Implementation Steps
1. Add failing backend and frontend tests for roster filtering and gradebook status rendering before changing production code.
2. Extend the class student contract to include student active status and a `status` query filter with only `active` and `inactive` values.
3. Reuse enrollment/user joins so the class roster can filter by `users.is_active` without duplicating query logic.
4. Extend the gradebook read model and DTO mapping to expose each student's active status while preserving all historical grade rows.
5. Update frontend class roster types, service/repository calls, and teacher class detail state to support the two filters.
6. Add a visible `Status` column in the class list and inactive badges/row treatment in both class list and gradebook.
7. Update frontend/backend documentation if the contract or screen behavior changes.
8. Run required verification commands for frontend and backend.

### Expected Result
- Teacher class roster defaults to active students and can switch to inactive students only.
- Inactive students are clearly labeled in the roster.
- Teacher gradebook still includes inactive students, with visible inactive status markers.
- Historical grades remain intact while active operational views stay cleaner.
- Backend enforces the same rule regardless of client behavior.

## Admin User Status Copy Alignment

### Goal
Align admin user actions and settings copy with the actual account state so inactive accounts no longer show deactivation actions and admin settings avoid irrelevant account-status messaging.

### Implementation Steps
1. Reuse the existing admin user status-display logic and add a shared status-action mapping for menu labels and modal copy.
2. Switch the admin user action flow from deactivate-only wording to state-aware activation/deactivation wording while preserving the existing teacher assigned-class guard for active teachers only.
3. Update the shared settings page so student and teacher users see a read-only status card, while admins do not see the card at all.
4. Update frontend documentation to reflect the revised user-management action and settings behavior.
5. Run the required frontend verification command.

### Expected Result
- Active users show `Deactivate User`.
- Inactive users show `Activate Account`.
- Active teachers with assigned classes remain blocked from deactivation until classes are reassigned.
- Student and teacher settings show a clearer read-only account status message.
- Admin settings no longer show the account-status card.

## Similarity Report Ownership Follow-up

### Goal
Keep historical similarity report ownership aligned with class ownership after an admin transfers a class to another teacher.

### Implementation Steps
1. Inspect class reassignment and plagiarism report persistence flows.
2. Add a focused similarity repository method that updates stored report ownership for assignments under one class.
3. Execute class-teacher reassignment and report-ownership propagation in one backend transaction.
4. Add backend unit coverage for reassignment behavior.
5. Update backend documentation to describe the propagated ownership rule.
6. Run backend verification commands.

## Admin Class Detail Remove Student Modal Fix

### Goal
Fix the broken admin class-detail remove-student confirmation modal so it renders at the correct width and remains readable.

### Implementation Steps
1. Inspect the admin class-detail student-removal modal implementation.
2. Move the affected modal content into a React portal so layout ancestors cannot constrain the fixed overlay.
3. Keep the existing modal sizing and behavior, but anchor it at the document root.
4. Re-run the required frontend verification command.

### Expected Result
- The remove-student confirmation modal renders centered over the viewport.
- Modal content remains readable on the admin class detail page.
- Existing delete behavior and keyboard dismissal still work.

## Assignment Update Deadline Validation Fix

### Goal
Allow teachers to save edits for assignments whose deadline has already passed without forcing them to move the deadline into the future.

### Implementation Steps
1. Inspect the teacher assignment form validation flow and confirm whether the restriction is frontend or backend enforced.
2. Split create-vs-edit deadline validation so only new assignments require a future deadline.
3. Preserve the real assignment business rule by validating that any provided deadline stays after the scheduled release date.
4. Update frontend unit tests for the schema behavior.
5. Run the affected frontend verification commands.

### Expected Result
- Teachers can update an expired assignment without changing its deadline.
- New assignments still require a future deadline when a deadline is provided.
- Deadline and scheduled date remain logically ordered.

## Assignment Total Score Guardrail

### Goal
Prevent teachers from changing an assignment's total score after graded submissions already exist, avoiding grade/max-score inconsistencies.

### Implementation Steps
1. Inspect the assignment update flow and current submission-grade persistence path.
2. Add a backend business rule that blocks `totalScore` changes when the assignment already has graded submissions.
3. Reuse repository-layer querying instead of adding ad hoc submission scans in the service.
4. Add or extend backend unit tests for the new update restriction.
5. Update backend documentation to record the rule.
6. Run required backend verification commands.

### Expected Result
- `totalScore` can still be edited before grading starts.
- Once graded submissions exist, changing `totalScore` returns a clear conflict error.
- Existing grades and gradebook percentages remain internally consistent.

## Student Class Grades Empty-State Alignment

### Goal
Prevent the student class grades tab from failing when the optional class-rank request has no rank yet, and show the same no-assignments empty state pattern the teacher gradebook uses.

### Implementation Steps
1. Inspect the student class grades hook and identify whether rank data is required for rendering.
2. Make class-rank fetching non-blocking so the class grades response remains the primary source for the tab.
3. Update the student class grades empty-state copy to match the teacher gradebook behavior for classes with no assignments.
4. Add focused frontend unit coverage for the non-blocking rank fallback.
5. Run the required frontend verification commands.

### Expected Result
- A newly joined student can open the Grades tab without seeing a fatal rank error.
- When the class has no assignments yet, the student sees the student-grade empty state instead of an error.
- Genuine class-grade fetch failures still surface as errors.

## Student Archived Classes Visibility Fix

### Goal
Make archived classes actually appear in the student "My Classes" page when the user selects the archived filter.

### Implementation Steps
1. Inspect the current student classes frontend data source and the backend enrolled-classes endpoint behavior.
2. Extend the student enrolled-classes backend contract with an explicit `includeArchived` flag while preserving current defaults for other consumers.
3. Switch the student classes page to use the enrolled-classes endpoint instead of the dashboard overview payload so the page can request archived data intentionally.
4. Add focused backend and frontend tests for the new query contract and archived-class rendering behavior.
5. Update the relevant documentation for the student enrolled-classes API behavior.
6. Run the required verification commands that are feasible in this environment.

### Expected Result
- The student classes page can show both current and archived classes.
- Other student dashboard consumers keep their active-only behavior unless they explicitly request archived classes.
- The archived filter label and the returned dataset now match.

## Teacher Active-Only Assignment Metrics Slice

### Goal
Make teacher-facing assignment expectation metrics use active students only, while keeping inactive students' historical submissions visible and avoiding global changes to admin or archival counts.

### Implementation Steps
1. Add failing backend and frontend tests that codify active-only expectation metrics for teacher assignment progress.
2. Introduce scoped active-student count helpers in the backend instead of changing the existing all-enrollment count semantics globally.
3. Update teacher assignment aggregates, pending-task aggregates, and module/class assignment DTO flows to use active-student counts.
4. Update frontend consumers that still derive teacher assignment totals from all students, including calendar event counts.
5. Preserve inactive-student submission visibility in teacher submission tables and review flows.
6. Update documentation for the teacher assignment metric rule.
7. Run required verification commands that are feasible in this environment.

### Expected Result
- Teacher `submitted / total`, `missing`, and pending-assignment logic use active students only.
- Inactive students' existing submissions remain visible in teacher review surfaces.
- Admin counts, roster history, and archival reporting keep their current semantics unless explicitly changed elsewhere.

## Gradebook Export Inactive Status Slice

### Goal
Include inactive students in teacher gradebook CSV and PDF exports by default, while clearly labeling their status and visually distinguishing inactive rows in the PDF.

### Implementation Steps
1. Reuse the existing gradebook `isActive` field instead of introducing a second export-only status source.
2. Extend the backend CSV export contract with a `Status` column that outputs `Active` or `Inactive` for every exported student row.
3. Update the frontend grade-report builder and PDF types to carry per-student status metadata into the document.
4. Add explicit inactive labeling plus subtle row highlighting in the PDF so the distinction survives layout changes and is not color-only.
5. Keep PDF summary metrics focused on active students only and add an explanatory note in the document metadata/summary area.
6. Add focused backend and frontend tests before implementation changes, then run the required verification commands.
7. Update relevant frontend/backend documentation to reflect the new export behavior.

### Expected Result
- CSV exports include inactive students and a machine-readable `Status` column.
- PDF exports include inactive students by default, label them explicitly, and use visible but non-alarmist row styling.
- PDF summary metrics remain aligned to active students so current-class reporting is not skewed by inactive records.

## Teacher Submission Detail Attempt Count Fix

### Goal
Show the selected student's attempt count for the current assignment in the teacher submission detail view instead of the assignment-wide latest-submission total.

### Implementation Steps
1. Inspect the shared assignment detail data flow used by the teacher submissions page deep link.
2. Reuse the existing student-assignment submission history service to fetch the selected student's attempt history in teacher review mode.
3. Update the submission status card to display the selected student's assignment attempt count when reviewing a specific submission.
4. Add focused frontend unit coverage for the hook/data flow.
5. Run the affected frontend verification commands.

### Expected Result
- Teacher submission detail shows the selected student's attempt count for that assignment.
- The student assignment detail view keeps its current history behavior.
- Assignment-wide submission totals remain unchanged on the submissions table page.
