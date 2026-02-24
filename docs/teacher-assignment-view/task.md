# Teacher Assignment Detail View — Task Tracker

> **Feature**: Teacher's Assignment Detail View (Submissions Overview)
> **Created**: 2026-02-24
> **Last Updated**: 2026-02-24
> **Reference**: [design.md](./design.md) | [implementation.md](./implementation.md)

---

## Legend

- ⬜ Not Started
- 🔲 In Progress
- ✅ Done
- ⏸️ Blocked
- 🚫 Cancelled / Descoped

---

## Phase 1: Data Foundation (Backend + Types)

> **Goal**: Build the API endpoint and type system to provide submission overview data.

| #    | Task                                                              | Status | Notes                                          |
| ---- | ----------------------------------------------------------------- | ------ | ---------------------------------------------- |
| 1.1  | Investigate `class_members` table structure for enrolled students | ⬜     | Need to verify column names and relationships  |
| 1.2  | Create `GET /api/assignments/:id/submission-overview` endpoint    | ⬜     | Backend route, controller, service, repository |
| 1.3  | Write SQL query to JOIN submissions with enrolled students        | ⬜     | Must include students with no submissions      |
| 1.4  | Calculate stats (on time, late, missing, graded) server-side      | ⬜     | Avoids redundant computation on frontend       |
| 1.5  | Add authorization check (teacher/admin only)                      | ⬜     | Reuse existing auth middleware pattern         |
| 1.6  | Write backend unit tests for the new endpoint                     | ⬜     | —                                              |
| 1.7  | Define `SubmissionOverviewResponse` type in `shared/types/`       | ⬜     | `EnrolledStudentStatus`, `SubmissionStats`     |
| 1.8  | Add `getSubmissionOverview()` to `assignmentRepository.ts`        | ⬜     | Frontend data layer                            |
| 1.9  | Add `getSubmissionOverview()` to `assignmentService.ts`           | ⬜     | Frontend business layer                        |
| 1.10 | Add API response type mapping in `data/api/assignment.types.ts`   | ⬜     | —                                              |

---

## Phase 2: Enhanced Submissions Page (Frontend)

> **Goal**: Build the new teacher-oriented submissions view with stats, filters, and student rows.

| #   | Task                                                        | Status | Notes                                                            |
| --- | ----------------------------------------------------------- | ------ | ---------------------------------------------------------------- |
| 2.1 | Create `useSubmissionOverview` hook                         | ⬜     | Data fetching, filtering, search, stats computation              |
| 2.2 | Create `SubmissionStatsBar` component                       | ⬜     | 5-column stat cards (Total, On Time, Late, Missing, Graded)      |
| 2.3 | Create `SubmissionFilterTabs` component                     | ⬜     | Pill-style tabs: All, Submitted, Late, Missing, Graded           |
| 2.4 | Create `StudentSubmissionRow` component                     | ⬜     | Row with avatar, status badge, file info, grade, actions         |
| 2.5 | Rewrite `AssignmentSubmissionsPage.tsx`                     | ⬜     | Integrate new hook + components, replace card grid with row list |
| 2.6 | Wire "View" button to navigate to student submission detail | ⬜     | Navigate to `AssignmentDetailPage?studentId=X` or similar        |
| 2.7 | Implement empty states for each filter tab                  | ⬜     | E.g., "No late submissions 🎉", "No missing students"            |
| 2.8 | Ensure "Check Similarities" functionality is preserved      | ⬜     | Move button, keep existing logic                                 |

---

## Phase 3: Collapsible Instructions & Polish

> **Goal**: Add collapsible instructions and ensure visual consistency.

| #   | Task                                                                 | Status | Notes                                                   |
| --- | -------------------------------------------------------------------- | ------ | ------------------------------------------------------- |
| 3.1 | Create `CollapsibleInstructions` component                           | ⬜     | Show/hide toggle, preview first 2 lines, reusable       |
| 3.2 | Integrate `CollapsibleInstructions` into `AssignmentSubmissionsPage` | ⬜     | Replace static instructions card                        |
| 3.3 | Verify color consistency across all status badges                    | ⬜     | Green, Yellow, Red, Gray, Blue tokens                   |
| 3.4 | Add hover states and transitions on submission rows                  | ⬜     | Consistent with ClassiFi's existing card hover patterns |
| 3.5 | Responsive layout testing (mobile + tablet)                          | ⬜     | Stats stack vertically, rows adapt                      |
| 3.6 | Loading skeleton states                                              | ⬜     | Shimmer/skeleton for stats and rows while loading       |

---

## Phase 4: Testing

> **Goal**: Ensure correctness, resilience, and regressions are caught.

| #   | Task                                                 | Status | Notes                                      |
| --- | ---------------------------------------------------- | ------ | ------------------------------------------ |
| 4.1 | Unit test: `useSubmissionOverview` hook              | ⬜     | Fetch, filter, search, error, loading      |
| 4.2 | Unit test: `SubmissionFilterTabs`                    | ⬜     | Active state, click handler, count display |
| 4.3 | Unit test: `SubmissionStatsBar`                      | ⬜     | Correct numbers and colors                 |
| 4.4 | Unit test: `StudentSubmissionRow`                    | ⬜     | Status variants, late indicator, grade     |
| 4.5 | Integration test: `AssignmentSubmissionsPage`        | ⬜     | Full render, user interactions             |
| 4.6 | Manual QA: Complete checklist from implementation.md | ⬜     | —                                          |
| 4.7 | Run `npm run build` to verify no type/build errors   | ⬜     | —                                          |
| 4.8 | Run existing test suite to verify no regressions     | ⬜     | —                                          |

---

## Phase 5: Future Enhancements (Backlog)

> **Goal**: Track future improvements that are out of scope for v1.

| #   | Enhancement                                   | Status | Priority | Notes                                      |
| --- | --------------------------------------------- | ------ | -------- | ------------------------------------------ |
| 5.1 | Inline grade editing from submission row      | ⬜     | High     | Input field in the row, save on blur/enter |
| 5.2 | Bulk select + return/grade                    | ⬜     | Medium   | Checkbox per row, bulk action bar          |
| 5.3 | Export grades as CSV                          | ⬜     | Medium   | Download button in stats area              |
| 5.4 | "Next student" navigation in detail view      | ⬜     | Medium   | Arrow buttons to cycle through submissions |
| 5.5 | Grade distribution chart                      | ⬜     | Low      | Histogram or pie chart in stats            |
| 5.6 | Email/notify students from list               | ⬜     | Low      | Bulk or individual                         |
| 5.7 | Submission history (previous attempts viewer) | ⬜     | Low      | Dropdown in row to see all attempts        |

---

## Progress Summary

| Phase                    | Tasks  | Done  | Progress |
| ------------------------ | ------ | ----- | -------- |
| Phase 1: Data Foundation | 10     | 0     | 0%       |
| Phase 2: Enhanced Page   | 8      | 0     | 0%       |
| Phase 3: Polish          | 6      | 0     | 0%       |
| Phase 4: Testing         | 8      | 0     | 0%       |
| **Total (v1)**           | **32** | **0** | **0%**   |

---

## Session Log

Track what was done in each working session:

### Session 1 — 2026-02-24

- ✅ Researched 5 major LMS platforms (Google Classroom, Canvas, Moodle, Blackboard, MS Teams)
- ✅ Created design document (`design.md`)
- ✅ Created implementation plan (`implementation.md`)
- ✅ Created task tracker (`task.md`)
- ⬜ Next: Start Phase 1.1 — Investigate `class_members` table structure

---

## Quick Reference

### Key Files

| File                                                                                         | Purpose                        |
| -------------------------------------------------------------------------------------------- | ------------------------------ |
| `frontend/src/presentation/pages/teacher/AssignmentSubmissionsPage.tsx`                      | Main page to rewrite           |
| `frontend/src/presentation/components/shared/dashboard/SubmissionCard.tsx`                   | Existing card (reference)      |
| `frontend/src/presentation/components/shared/assignmentDetail/TeacherSubmissionListCard.tsx` | Existing list (to be replaced) |
| `frontend/src/shared/types/submission.ts`                                                    | Current submission types       |
| `frontend/src/business/models/assignment/types.ts`                                           | Current assignment types       |

### Key Routes

| Route                                              | Page                                  |
| -------------------------------------------------- | ------------------------------------- |
| `/dashboard/assignments/:assignmentId`             | `AssignmentDetailPage` (shared)       |
| `/dashboard/assignments/:assignmentId/submissions` | `AssignmentSubmissionsPage` (teacher) |
| `/dashboard/assignments/:assignmentId/similarity`  | `SimilarityResultsPage` (teacher)     |
