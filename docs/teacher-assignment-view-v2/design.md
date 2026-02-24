# Teacher Assignment View Design

Project: ClassiFi  
Scope: Teacher experience when opening an assignment card  
Created: 2026-02-24  
Status: Draft v1

## 1. Context

Teachers need a focused assignment workspace, not a student-oriented detail page.  
The page should answer three questions quickly:

1. Who submitted?
2. Who is late or missing?
3. What needs grading right now?

## 2. Goals

1. Show submission health at a glance.
2. Let teachers filter to actionable groups: `Needs grading`, `Late`, `Missing`.
3. Support fast drill-down into an individual submission review flow.
4. Keep compatibility with existing ClassiFi services and components.

## 3. Non-Goals (v1)

1. Bulk grading and bulk messaging.
2. Rubric authoring workflow changes.
3. Full plagiarism redesign.
4. Major backend schema changes.

## 4. Primary User Flow

1. Teacher opens class.
2. Teacher clicks assignment card.
3. Teacher lands on `Assignment Submissions` overview.
4. Teacher filters to `Needs grading`.
5. Teacher opens a specific submission.
6. Teacher reviews file, checks tests, assigns score/feedback.
7. Teacher returns to overview and continues.

## 5. Screen Architecture

## 5.1 Screen A: Assignment Submissions Overview

Recommended route: `/dashboard/assignments/:assignmentId/submissions`

Sections:

1. Header: assignment title, due date, attempts, quick actions.
2. Instructions block: collapsible.
3. Stats strip:
   - Total students
   - Submitted on time
   - Late
   - Missing
   - Graded
   - Needs grading
4. Filters and search:
   - Tabs: `All`, `Needs grading`, `Late`, `Missing`, `Graded`
   - Search by student name
5. Student rows/cards:
   - Student identity
   - Submission status
   - Timestamp and late delta
   - Grade summary
   - Actions: `View`, `Grade`, `Download`

## 5.2 Screen B: Submission Review

Recommended route: `/dashboard/assignments/:assignmentId/submissions/:submissionId`

Sections:

1. Submission metadata (student, attempt number, submitted time, status).
2. Code/file preview.
3. Test results (if assignment has test cases).
4. Grade + feedback controls.
5. Attempt history for same student.
6. Navigation actions: `Previous`, `Next`, `Back to list`.

## 6. Status Model

Each student belongs to exactly one submission state for the current assignment:

1. `missing`
   - enrolled student with no submission
2. `submitted_on_time`
   - latest submission exists and `submittedAt <= deadline`
3. `submitted_late`
   - latest submission exists and `submittedAt > deadline`
4. `needs_grading`
   - latest submission exists and `grade` is null
5. `graded`
   - latest submission exists and `grade` is not null

Notes:

1. `needs_grading` and `graded` are grading states that can overlap with on-time/late timing.
2. UI filters should allow both timing and grading dimensions.

## 7. Data Requirements

Current data already available:

1. Assignment detail via `getAssignmentById`.
2. Submission list via `getAssignmentSubmissions`.
3. Class roster via `getClassStudents`.

Derived data needed in UI:

1. `submittedStudentIds`
2. `missingStudents` (roster minus submissions)
3. `isLate` per submission
4. `isNeedsGrading` per submission
5. Counts for stats strip

Optional backend enhancement (future):

1. Single endpoint returning merged roster + submission overview.

## 8. Component Mapping (Target)

Reuse:

1. `AssignmentSubmissionsPage` as base overview page.
2. `SubmissionCard` visual patterns.
3. Existing code preview modal/hooks.
4. Existing grade override service flow.

Add:

1. `SubmissionStatsBar`
2. `SubmissionFilterTabs`
3. `TeacherSubmissionTableRow` or upgraded `SubmissionCard`
4. `SubmissionReviewPage` (new page)

## 9. UX States

Required states:

1. Loading (skeleton rows + stats placeholders)
2. Error (retry action)
3. Empty class roster
4. No submissions yet
5. Filter has zero results

Copy guidance:

1. Be explicit: `No submissions yet`, `No late submissions`, `No students need grading`.
2. Keep action hints present: `Change filter`, `Clear search`, `Refresh`.

## 10. Accessibility and Interaction Rules

1. Keyboard-navigable filter tabs and row actions.
2. Status conveyed by text and icon, not color only.
3. Focus ring visibility on all actionable controls.
4. Date/time shown as both relative and exact tooltip.

## 11. Acceptance Criteria

1. Teacher can identify missing students without leaving assignment page.
2. Teacher can isolate `Needs grading` in one click.
3. Teacher can open a specific submission from overview.
4. Late indicators are visible in both overview and review pages.
5. No regression for student assignment submission flow.

## 12. Open Questions

1. Should grading happen inline on overview rows or only in review page?
2. Should `Missing` count ignore students who joined after due date?
3. Should `Needs grading` include manually excused submissions?
4. Should we support teacher notes separate from student-visible feedback?
