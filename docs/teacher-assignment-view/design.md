# Teacher Assignment Detail View — Design Document

> **Feature**: Teacher's view when clicking an assignment card (with or without submissions)
> **Created**: 2026-02-24
> **Status**: Draft
> **Author**: AI-Assisted Design (based on LMS research)

---

## 1. Problem Statement

When a teacher clicks on an assignment card in ClassiFi, they need a dedicated view that
gives them at-a-glance insight into the state of submissions and allows them to quickly
navigate, grade, and manage student work. Currently, the teacher is routed to the same
`AssignmentDetailPage` as students (with a small `TeacherSubmissionListCard` in the sidebar),
and a separate `AssignmentSubmissionsPage` exists but only shows submission cards in a grid.

Neither view provides a holistic teacher-oriented experience.

---

## 2. Research Summary (Industry Standards)

Analysis of five major LMS platforms revealed consistent patterns for the teacher's
assignment view. The following table summarizes the key elements every platform provides:

| Element                        | Google Classroom | Canvas LMS | Moodle | Blackboard | MS Teams |
| ------------------------------ | :--------------: | :--------: | :----: | :--------: | :------: |
| Assignment metadata at top     |        ✅        |     ✅     |   ✅   |     ✅     |    ✅    |
| Summary statistics bar         |        ✅        |     ✅     |   ✅   |     ✅     |    ✅    |
| Student list grouped by status |        ✅        |     ✅     |   ✅   |     ✅     |    ✅    |
| Late submission indicator      |        ✅        |     ✅     |   ✅   |     ✅     |    ✅    |
| Missing/not submitted tracking |        ✅        |     ✅     |   ✅   |     ✅     |    ✅    |
| Quick inline grading           |        ✅        |     ✅     |   ✅   |     ✅     |    ✅    |
| Search/filter submissions      |        ✅        |     ✅     |   ✅   |     ✅     |    ✅    |
| Navigate between submissions   |        ✅        |     ✅     |   ✅   |     ✅     |    ✅    |
| Bulk actions                   |        ✅        |     ✅     |   ❌   |     ❌     |    ✅    |

### Key UX Patterns to Adopt

1. **Two-zone layout**: Assignment info on top, submission management below.
2. **Status-grouped student list**: Group or tab students by "Submitted", "Late", "Missing".
3. **Summary stats bar**: `Submitted: X | Late: Y | Missing: Z | Graded: W` at a glance.
4. **Color-coded status badges**: Green (on time), Yellow/Orange (late), Red (missing), Blue (graded).
5. **Click-to-grade flow**: Clicking a student row/card opens their submission for review.
6. **Search & filter**: By student name, by status.

---

## 3. Current State Analysis

### Existing Pages

| Page                        | File                                          | Purpose                                                                                                      |
| --------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `AssignmentDetailPage`      | `pages/shared/AssignmentDetailPage.tsx`       | Shared page for both students and teachers. Teacher sees a small `TeacherSubmissionListCard` in the sidebar. |
| `AssignmentSubmissionsPage` | `pages/teacher/AssignmentSubmissionsPage.tsx` | Teacher-only page showing submissions in a card grid. Has stats bar and search.                              |

### Existing Components

| Component                   | File                                                               | Purpose                                                                            |
| --------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `TeacherSubmissionListCard` | `components/shared/assignmentDetail/TeacherSubmissionListCard.tsx` | Minimal list of submissions (name, file, date). No status differentiation.         |
| `SubmissionCard`            | `components/shared/dashboard/SubmissionCard.tsx`                   | Visual card with avatar, status badge, time ago, file info, "View Details" button. |
| `AssignmentSubmissionForm`  | `components/shared/assignmentDetail/AssignmentSubmissionForm.tsx`  | Student file upload form.                                                          |
| `AssignmentTestResultsCard` | `components/shared/assignmentDetail/AssignmentTestResultsCard.tsx` | Test results display.                                                              |

### Existing Types

| Type               | File                                  | Key Fields                                                                                                                         |
| ------------------ | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `Submission`       | `shared/types/submission.ts`          | `id`, `assignmentId`, `studentId`, `fileName`, `fileSize`, `submissionNumber`, `submittedAt`, `isLatest`, `studentName?`, `grade?` |
| `AssignmentDetail` | `business/models/assignment/types.ts` | `id`, `classId`, `assignmentName`, `instructions`, `deadline`, `totalScore`, `testCases`, etc.                                     |

### Gaps Identified

1. **No "Missing" status tracking** — The current system only knows about students who _have_ submitted. There is no API or data for students who are enrolled but haven't submitted.
2. **No status differentiation** — `TeacherSubmissionListCard` shows all submissions as "Submitted" (green) regardless of whether they are late.
3. **No grading interface** — No inline grade editing from the submissions list.
4. **No filter by status** — `AssignmentSubmissionsPage` only filters by student name.
5. **No "Graded" vs "Not Graded" distinction** — The `grade` field exists on `Submission` but is not surfaced in the teacher's list views.

---

## 4. Proposed Design

### 4.1 Page Structure (Teacher Assignment Detail View)

When a teacher clicks an assignment card, they should be routed to the
`AssignmentSubmissionsPage` (enhanced). The page layout:

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Class                                                │
│                                                                 │
│  Assignment Title                                   [Edit] btn  │
│  📅 Due Feb 28, 2026 11:59 PM  |  🔄 Unlimited Attempts        │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ INSTRUCTIONS (collapsible)                                  ││
│  │ "Write a Python function that..."                           ││
│  │ [image if any]                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐      │
│  │ Total    │ On Time  │ Late     │ Missing  │ Graded   │      │
│  │  30      │   18     │    5     │    7     │   10     │      │
│  │ students │  ✅ grn  │  ⚠️ ylw │  ❌ red  │  📝 blu  │      │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘      │
│                                                                 │
│  ┌──────────────┬─────────────────────────────────────┐        │
│  │ [All] [Submitted] [Late] [Missing] [Graded]        │        │
│  │                                     🔍 Search...   │        │
│  ├────────────────────────────────────────────────────┤        │
│  │                                                    │        │
│  │  ┌────────────────────────────────────────────┐    │        │
│  │  │ 👤 Juan Dela Cruz          ✅ On Time      │    │        │
│  │  │ main.py (2.1 KB) • Feb 24, 2026 10:30 AM  │    │        │
│  │  │ Grade: 85/100      [View] [Grade]          │    │        │
│  │  └────────────────────────────────────────────┘    │        │
│  │                                                    │        │
│  │  ┌────────────────────────────────────────────┐    │        │
│  │  │ 👤 Maria Santos            ⚠️ Late         │    │        │
│  │  │ solution.py (1.8 KB) • Feb 25 (1 day late) │    │        │
│  │  │ Grade: —           [View] [Grade]          │    │        │
│  │  └────────────────────────────────────────────┘    │        │
│  │                                                    │        │
│  │  ┌────────────────────────────────────────────┐    │        │
│  │  │ 👤 Pedro Reyes             ❌ Missing       │    │        │
│  │  │ No submission                              │    │        │
│  │  └────────────────────────────────────────────┘    │        │
│  │                                                    │        │
│  └────────────────────────────────────────────────────┘        │
│                                                                 │
│  [🔍 Check Similarities]                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Status Definitions

| Status            | Condition                                        | Badge Color           | Icon          |
| ----------------- | ------------------------------------------------ | --------------------- | ------------- |
| **On Time**       | `submittedAt <= deadline`                        | Green (`green-400`)   | `CheckCircle` |
| **Late**          | `submittedAt > deadline`                         | Yellow (`yellow-400`) | `AlertCircle` |
| **Missing**       | Enrolled student, no submission, past deadline   | Red (`red-400`)       | `XCircle`     |
| **Not Submitted** | Enrolled student, no submission, before deadline | Gray (`gray-400`)     | `Clock`       |
| **Graded**        | Has a `grade` value (not null)                   | Blue (`blue-400`)     | `Award`       |

### 4.3 Submission Row/Card Design

Each submission row should display:

1. **Student avatar + name** — Left-aligned, bold
2. **Status badge** — Color-coded pill (see table above)
3. **File info** — File name, file size (for submitted students)
4. **Submission timestamp** — Relative time + absolute on hover
5. **Late indicator** — "X hours/days late" (if applicable)
6. **Grade** — Editable score display, e.g., `85 / 100` or `—` if ungraded
7. **Actions** — "View Code", "Grade" buttons

### 4.4 Statistics Summary Bar

Five stat cards in a horizontal row:

| Stat                    | Calculation                                              |
| ----------------------- | -------------------------------------------------------- |
| **Total Students**      | All enrolled students in the class                       |
| **Submitted (On Time)** | Submissions where `submittedAt <= deadline`              |
| **Late**                | Submissions where `submittedAt > deadline`               |
| **Missing**             | `totalEnrolled - totalSubmissions` (only after deadline) |
| **Graded**              | Submissions where `grade !== null`                       |

### 4.5 Filter Tabs

Horizontal tab bar with pill-style tabs:

- **All** — Shows all enrolled students (submitted + missing)
- **Submitted** — Only students who have submitted (on time)
- **Late** — Only late submissions
- **Missing** — Only students who haven't submitted
- **Graded** — Only submissions with a grade

### 4.6 Click-to-View Flow

When the teacher clicks on a submitted student's row:

1. Navigate to `AssignmentDetailPage` with `?studentId={id}` query param
2. The detail page shows the student's submitted code, test results, and grading tools
3. Alternatively (future enhancement): Open a side panel / slide-over for inline review

### 4.7 Similarity Check

- "Check Similarities" button remains at the bottom of the page
- Disabled when `totalSubmissions < 2`
- Shows loading state while analyzing

---

## 5. Design Principles

1. **Information Hierarchy**: Most important info (stats) at top, actionable list below
2. **Progressive Disclosure**: Instructions are collapsible to save space
3. **Consistency**: Reuse existing `SubmissionCard` component patterns and ClassiFi's dark theme
4. **Feedback**: Show clear loading/empty/error states
5. **Accessibility**: Keyboard navigable, semantic HTML, aria labels on interactive elements

---

## 6. Out of Scope (v1)

These features are noted for future iterations:

- [ ] Inline grade editing (edit grade directly from the list)
- [ ] Bulk return / bulk grade
- [ ] Export grades as CSV
- [ ] "Save and Next" navigation between submissions
- [ ] Grade distribution chart/histogram
- [ ] Email/notify students from the list
- [ ] Resubmission tracking (previous attempts viewer)
