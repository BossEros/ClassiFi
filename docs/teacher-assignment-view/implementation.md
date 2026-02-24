# Teacher Assignment Detail View — Implementation Plan

> **Feature**: Teacher's Assignment Detail View (Submissions Overview)
> **Created**: 2026-02-24
> **Status**: Not Started
> **Reference**: [design.md](./design.md)

---

## Overview

This plan details the implementation steps to enhance the teacher's assignment detail view
in ClassiFi. The work is organized into **phases** with clear frontend and backend tasks.

---

## Architecture Context

ClassiFi follows a **layered architecture** on the frontend:

```
Pages (presentation/pages/)
  └─ Components (presentation/components/)
       └─ Hooks (presentation/hooks/)
            └─ Services (business/services/)
                 └─ Repositories (data/repositories/)
                      └─ API Types (data/api/)
```

All changes must respect this layering. New features flow:
**Types → API/Repository → Service → Hook → Component → Page**.

---

## Phase 1: Data Foundation (Backend + Types)

### 1.1 Add "Enrolled Students Without Submissions" Endpoint

**Goal**: Enable the frontend to know which students are "Missing" (enrolled but no submission).

**Files to modify/create**:

- `backend-ts/src/modules/submissions/submission.controller.ts` — Add new route
- `backend-ts/src/modules/submissions/submission.service.ts` — Add query logic
- `backend-ts/src/modules/submissions/submission.repository.ts` — Add DB query

**Approach**:

- New endpoint: `GET /api/assignments/:assignmentId/submission-overview`
- Returns:
  ```json
  {
    "submissions": [...],
    "enrolledStudents": [...],
    "stats": {
      "totalEnrolled": 30,
      "totalSubmitted": 23,
      "onTime": 18,
      "late": 5,
      "missing": 7,
      "graded": 10
    }
  }
  ```
- This endpoint joins `class_members` with `submissions` to identify missing students.

**Validation**: Only teachers of the class and admins can access this endpoint.

### 1.2 Update Frontend Types

**Files to create/modify**:

- `frontend/src/shared/types/submission.ts` — Add `SubmissionOverviewResponse` type
- `frontend/src/data/api/assignment.types.ts` — Add API response type mapping

**New types**:

```typescript
interface EnrolledStudentStatus {
  studentId: number
  studentName: string
  status: "submitted" | "late" | "missing" | "not_submitted"
  submission: Submission | null
}

interface SubmissionStats {
  totalEnrolled: number
  totalSubmitted: number
  onTime: number
  late: number
  missing: number
  graded: number
}

interface SubmissionOverviewResponse {
  submissions: Submission[]
  enrolledStudents: EnrolledStudentStatus[]
  stats: SubmissionStats
}
```

### 1.3 Add Repository & Service Methods

**Files to modify**:

- `frontend/src/data/repositories/assignmentRepository.ts` — Add `getSubmissionOverview()`
- `frontend/src/business/services/assignmentService.ts` — Add `getSubmissionOverview()`

---

## Phase 2: Enhanced AssignmentSubmissionsPage

### 2.1 Create `useSubmissionOverview` Hook

**File to create**:

- `frontend/src/presentation/hooks/teacher/useSubmissionOverview.ts`

**Responsibilities**:

- Fetch submission overview data on mount
- Compute filtered lists based on active filter tab
- Handle search query filtering
- Expose stats, filtered list, loading/error states

**Hook signature**:

```typescript
function useSubmissionOverview(assignmentId: string | undefined): {
  overview: SubmissionOverviewResponse | null
  filteredStudents: EnrolledStudentStatus[]
  activeFilter: SubmissionFilter
  searchQuery: string
  isLoading: boolean
  error: string | null
  setActiveFilter: (filter: SubmissionFilter) => void
  setSearchQuery: (query: string) => void
  refresh: () => void
}
```

### 2.2 Create `SubmissionFilterTabs` Component

**File to create**:

- `frontend/src/presentation/components/teacher/submissions/SubmissionFilterTabs.tsx`

**Props**:

```typescript
interface SubmissionFilterTabsProps {
  activeFilter: SubmissionFilter
  onFilterChange: (filter: SubmissionFilter) => void
  stats: SubmissionStats
}
```

**Design**: Horizontal pill-style tabs showing count in each tab:

- `All (30)` | `Submitted (18)` | `Late (5)` | `Missing (7)` | `Graded (10)`

### 2.3 Create `SubmissionStatsBar` Component

**File to create**:

- `frontend/src/presentation/components/teacher/submissions/SubmissionStatsBar.tsx`

**Props**:

```typescript
interface SubmissionStatsBarProps {
  stats: SubmissionStats
}
```

**Design**: Five stat cards in a row (Total, On Time, Late, Missing, Graded) with
color-coded numbers and icons.

### 2.4 Create `StudentSubmissionRow` Component

**File to create**:

- `frontend/src/presentation/components/teacher/submissions/StudentSubmissionRow.tsx`

**Props**:

```typescript
interface StudentSubmissionRowProps {
  student: EnrolledStudentStatus
  deadline: Date | null
  onViewSubmission: (submissionId: number) => void
}
```

**Design**: Horizontal row with avatar, name, status badge, file info, timestamp,
grade display, and action buttons.

### 2.5 Rewrite `AssignmentSubmissionsPage`

**File to modify**:

- `frontend/src/presentation/pages/teacher/AssignmentSubmissionsPage.tsx`

**Changes**:

- Replace local `useState` + `useEffect` data fetching with `useSubmissionOverview` hook
- Replace the card grid with `StudentSubmissionRow` list
- Add `SubmissionFilterTabs` between stats and the list
- Add `SubmissionStatsBar` above the filter tabs
- Make instructions section collapsible
- Keep "Check Similarities" button
- Keep search functionality

---

## Phase 3: Collapsible Instructions & Polish

### 3.1 Create `CollapsibleInstructions` Component

**File to create**:

- `frontend/src/presentation/components/shared/assignmentDetail/CollapsibleInstructions.tsx`

**Props**:

```typescript
interface CollapsibleInstructionsProps {
  instructions: string
  instructionsImageUrl?: string | null
  assignmentName: string
  defaultExpanded?: boolean
}
```

**Design**: Card that shows a preview of the first 2 lines by default, with a
"Show more / Show less" toggle. Reusable on both the teacher and student views.

### 3.2 Polish and Visual Consistency

- Ensure all status badges use consistent color tokens
- Add hover states on submission rows
- Add empty state for each filter tab (e.g., "No late submissions 🎉")
- Responsive layout: stack stats vertically on mobile

---

## Phase 4: Testing

### 4.1 Unit Tests

| Test File                                                      | Tests                                            |
| -------------------------------------------------------------- | ------------------------------------------------ |
| `hooks/teacher/useSubmissionOverview.test.ts`                  | Data fetching, filtering, search, error handling |
| `components/teacher/submissions/SubmissionFilterTabs.test.tsx` | Tab click, active state, count display           |
| `components/teacher/submissions/SubmissionStatsBar.test.tsx`   | Correct stat rendering                           |
| `components/teacher/submissions/StudentSubmissionRow.test.tsx` | Status badge, late indicator, grade display      |

### 4.2 Integration Tests

| Test File                                          | Tests                                                      |
| -------------------------------------------------- | ---------------------------------------------------------- |
| `pages/teacher/AssignmentSubmissionsPage.test.tsx` | Full page render, filter interaction, search, empty states |

### 4.3 Manual QA Checklist

- [ ] Page loads with correct stats for an assignment with mixed submissions
- [ ] "Missing" shows enrolled students who haven't submitted
- [ ] Late submissions show the correct "X hours/days late" indicator
- [ ] Filters work correctly (Each tab shows the right students)
- [ ] Search filters within the active tab
- [ ] Empty states display correctly for each filter
- [ ] "View" button navigates to the correct student's submission detail
- [ ] "Check Similarities" button works as before
- [ ] Page is responsive on tablet and mobile widths
- [ ] Loading and error states display correctly

---

## Phase 5: Future Enhancements (Not in v1)

These are documented for future sprints:

| Enhancement              | Description                                     | Priority |
| ------------------------ | ----------------------------------------------- | -------- |
| Inline grading           | Edit grade directly from the submission row     | High     |
| Bulk actions             | Select multiple students, return/grade in bulk  | Medium   |
| Grade export             | Download grades as CSV                          | Medium   |
| "Next student" nav       | Navigate between submissions in the detail view | Medium   |
| Grade distribution chart | Visual histogram/pie chart of grades            | Low      |
| Notification/email       | Email students from the list                    | Low      |
| Submission history       | View previous attempts per student              | Low      |

---

## File Inventory

### New Files

| Path                                                                                       | Type             | Phase |
| ------------------------------------------------------------------------------------------ | ---------------- | ----- |
| `frontend/src/shared/types/submissionOverview.ts`                                          | Type definitions | 1     |
| `frontend/src/presentation/hooks/teacher/useSubmissionOverview.ts`                         | Custom hook      | 2     |
| `frontend/src/presentation/components/teacher/submissions/SubmissionFilterTabs.tsx`        | Component        | 2     |
| `frontend/src/presentation/components/teacher/submissions/SubmissionStatsBar.tsx`          | Component        | 2     |
| `frontend/src/presentation/components/teacher/submissions/StudentSubmissionRow.tsx`        | Component        | 2     |
| `frontend/src/presentation/components/shared/assignmentDetail/CollapsibleInstructions.tsx` | Component        | 3     |
| `backend-ts/src/modules/submissions/submission-overview.route.ts` (or similar)             | API route        | 1     |

### Modified Files

| Path                                                                    | Change        | Phase |
| ----------------------------------------------------------------------- | ------------- | ----- |
| `frontend/src/presentation/pages/teacher/AssignmentSubmissionsPage.tsx` | Major rewrite | 2     |
| `frontend/src/data/repositories/assignmentRepository.ts`                | Add method    | 1     |
| `frontend/src/business/services/assignmentService.ts`                   | Add method    | 1     |
| `frontend/src/data/api/assignment.types.ts`                             | Add types     | 1     |
| `backend-ts/src/modules/submissions/submission.controller.ts`           | Add route     | 1     |
| `backend-ts/src/modules/submissions/submission.service.ts`              | Add method    | 1     |

---

## Dependencies

- No new npm packages required
- Existing lucide-react icons cover all needed icons
- Existing UI components (Card, Button, Input, Avatar) are reusable
- Existing `SubmissionCard` can be referenced for design patterns but will be replaced
  by the new `StudentSubmissionRow` component for this page

---

## Risk Assessment

| Risk                                                                               | Mitigation                                             |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Backend endpoint for enrolled students may be slow for large classes               | Use efficient SQL JOIN query, consider pagination      |
| "Missing" status requires class enrollment data which may not be readily available | Verify `class_members` table structure before starting |
| Breaking existing `AssignmentSubmissionsPage` during rewrite                       | Keep old code in a branch, test thoroughly             |
| Scope creep into inline grading                                                    | Explicitly marked as Phase 5, not v1                   |
