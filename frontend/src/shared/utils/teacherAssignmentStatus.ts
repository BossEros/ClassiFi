import type { Task } from "@/data/api/class.types"
import {
  getAssignmentSubmissionCloseDate,
  isAssignmentSubmissionOpen,
} from "@/shared/utils/assignmentSubmissionWindow"

export type TeacherAssignmentStatusFilter =
  | "all"
  | "pending"
  | "closed"
  | "no-submissions"

/**
 * Returns the latest timestamp when students can still submit to an assignment.
 *
 * @param assignment - Teacher assignment row data.
 * @returns The close timestamp, or null when the assignment has no close boundary.
 */
export function getTeacherAssignmentCloseDate(assignment: Task): Date | null {
  return getAssignmentSubmissionCloseDate(assignment)
}

/**
 * Returns whether the assignment is still open for student submission.
 *
 * @param assignment - Teacher assignment row data.
 * @param currentDate - Optional clock override for tests.
 * @returns True when students can still submit.
 */
export function isTeacherAssignmentOpen(
  assignment: Task,
  currentDate: Date = new Date(),
): boolean {
  return isAssignmentSubmissionOpen(assignment, currentDate)
}

/**
 * Returns whether the assignment should appear in the teacher `Closed` bucket.
 *
 * @param assignment - Teacher assignment row data.
 * @param currentDate - Optional clock override for tests.
 * @returns True when student submissions are no longer accepted.
 */
export function isTeacherAssignmentClosed(
  assignment: Task,
  currentDate: Date = new Date(),
): boolean {
  return !isTeacherAssignmentOpen(assignment, currentDate)
}

/**
 * Returns whether the assignment should appear in the teacher `Pending` bucket.
 *
 * @param assignment - Teacher assignment row data.
 * @param currentDate - Optional clock override for tests.
 * @returns True when the assignment is still open and not every student has submitted.
 */
export function isTeacherAssignmentPending(
  assignment: Task,
  currentDate: Date = new Date(),
): boolean {
  if (!isTeacherAssignmentOpen(assignment, currentDate)) {
    return false
  }

  const submittedCount = assignment.submissionCount ?? assignment.submittedCount ?? 0
  const totalStudents = assignment.studentCount ?? 0

  return submittedCount < totalStudents
}

/**
 * Returns whether the assignment should appear in the teacher `No Submissions` bucket.
 *
 * @param assignment - Teacher assignment row data.
 * @param currentDate - Optional clock override for tests.
 * @returns True when the assignment is still open and nobody has submitted yet.
 */
export function hasTeacherAssignmentNoSubmissions(
  assignment: Task,
  currentDate: Date = new Date(),
): boolean {
  if (!isTeacherAssignmentOpen(assignment, currentDate)) {
    return false
  }

  const submittedCount = assignment.submissionCount ?? assignment.submittedCount ?? 0

  return submittedCount === 0
}

/**
 * Returns whether an assignment matches the requested teacher status filter.
 *
 * @param assignment - Teacher assignment row data.
 * @param filter - Selected teacher status filter.
 * @param currentDate - Optional clock override for tests.
 * @returns True when the assignment belongs in the selected bucket.
 */
export function matchesTeacherAssignmentStatusFilter(
  assignment: Task,
  filter: TeacherAssignmentStatusFilter,
  currentDate: Date = new Date(),
): boolean {
  switch (filter) {
    case "all":
      return true
    case "pending":
      return isTeacherAssignmentPending(assignment, currentDate)
    case "closed":
      return isTeacherAssignmentClosed(assignment, currentDate)
    case "no-submissions":
      return hasTeacherAssignmentNoSubmissions(assignment, currentDate)
    default:
      return true
  }
}

/**
 * Calculates teacher status counts for a pre-filtered assignment list.
 *
 * @param assignments - Assignment rows after applying non-status filters.
 * @param currentDate - Optional clock override for tests.
 * @returns Counts for teacher status chips.
 */
export function calculateTeacherAssignmentStatusCounts(
  assignments: Task[],
  currentDate: Date = new Date(),
): Record<TeacherAssignmentStatusFilter, number> {
  return {
    all: assignments.length,
    pending: assignments.filter((assignment) =>
      isTeacherAssignmentPending(assignment, currentDate),
    ).length,
    closed: assignments.filter((assignment) =>
      isTeacherAssignmentClosed(assignment, currentDate),
    ).length,
    "no-submissions": assignments.filter((assignment) =>
      hasTeacherAssignmentNoSubmissions(assignment, currentDate),
    ).length,
  }
}
