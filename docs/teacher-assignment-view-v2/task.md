# Teacher Assignment View Task Board

Project: ClassiFi  
Tracking Folder: `docs/teacher-assignment-view-v2`  
Last Updated: 2026-02-24

## 1. Status Legend

1. `[ ]` Not started
2. `[-]` In progress
3. `[x]` Done
4. `[!]` Blocked

## 2. Milestone Checklist

## M0 - Baseline

- [x] T-000 Create `design.md`
- [x] T-001 Create `implementation.ft`
- [x] T-002 Create `task.md`
- [ ] T-003 Confirm final route strategy for teacher flow
- [ ] T-004 Confirm grading action location (inline or detail page)

## M1 - Data and Status Logic

- [ ] T-100 Add status utility for teacher submission states
- [ ] T-101 Fetch class roster in assignment submissions page
- [ ] T-102 Merge roster with submissions
- [ ] T-103 Compute counts: total, submitted on time, late, missing, graded, needs grading
- [ ] T-104 Add tests for merge and status logic

## M2 - Overview UI

- [ ] T-200 Add stats strip component
- [ ] T-201 Add filter tabs: all, needs grading, late, missing, graded
- [ ] T-202 Keep search working with active filter
- [ ] T-203 Add empty states per filter
- [ ] T-204 Upgrade row/card status labels and grade summary

## M3 - Submission Drill-Down

- [ ] T-300 Add route: `/dashboard/assignments/:assignmentId/submissions/:submissionId`
- [ ] T-301 Create teacher submission review page
- [ ] T-302 Wire `View Details` to selected `submissionId`
- [ ] T-303 Add attempt history section for selected student
- [ ] T-304 Connect grade action from review page

## M4 - Hardening

- [ ] T-400 Error and loading states QA
- [ ] T-401 Mobile and tablet layout checks
- [ ] T-402 Regression check for student assignment detail flow
- [ ] T-403 Confirm no-test-case behavior in teacher views

## M5 - Verification and Release

- [ ] T-500 Run `frontend: npm run build`
- [ ] T-501 Run `backend-ts: npm run typecheck`
- [ ] T-502 Run `backend-ts: npm test`
- [ ] T-503 Final walkthrough with acceptance criteria
- [ ] T-504 Update project docs if route/flow changed

## 3. Current Sprint Plan

Sprint Goal: Establish reliable teacher overview and drill-down flow.

Now:

1. T-003 Confirm route strategy
2. T-100 to T-103 data logic
3. T-200 to T-202 core overview UI

Next:

1. T-300 to T-304 drill-down experience
2. T-400 to T-403 hardening

Later:

1. Bulk grading
2. Bulk messaging
3. Advanced analytics

## 4. Progress Log

| Date | Completed | In Progress | Blocked | Notes |
| --- | --- | --- | --- | --- |
| 2026-02-24 | T-000, T-001, T-002 | None | None | New tracker created in separate folder |

## 5. Blocker Log

| ID | Date | Blocker | Owner | Resolution |
| --- | --- | --- | --- | --- |
| B-001 | - | - | - | - |

## 6. Quick Acceptance Checklist

- [ ] Teachers can see missing students without leaving assignment page.
- [ ] Teachers can isolate needs grading in one click.
- [ ] Teachers can open the exact submission from list view.
- [ ] Late indicators are correct and visible.
- [ ] No regressions in student submission flow.
