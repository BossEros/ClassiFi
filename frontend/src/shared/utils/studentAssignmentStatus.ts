import type { Task } from "@/data/api/class.types"
import { isAssignmentSubmissionOpen } from "@/shared/utils/assignmentSubmissionWindow"

export type StudentAssignmentStatusFilter =
  | "all"
  | "pending"
  | "finished"
  | "missed"

/**
 * Returns whether a student assignment belongs in the `Finished` bucket.
 *
 * @param assignment - Student assignment row data.
 * @returns True when the student has already submitted.
 */
export function isStudentAssignmentFinished(assignment: Task): boolean {
  return assignment.hasSubmitted === true
}

/**
 * Returns whether a student assignment belongs in the `Missed` bucket.
 *
 * @param assignment - Student assignment row data.
 * @param currentDate - Optional clock override for tests.
 * @returns True when the student has not submitted and the submission window is closed.
 */
export function isStudentAssignmentMissed(
  assignment: Task,
  currentDate: Date = new Date(),
): boolean {
  if (isStudentAssignmentFinished(assignment)) {
    return false
  }

  return !isAssignmentSubmissionOpen(assignment, currentDate)
}

/**
 * Returns whether a student assignment belongs in the `Pending` bucket.
 *
 * @param assignment - Student assignment row data.
 * @param currentDate - Optional clock override for tests.
 * @returns True when the student has not submitted and can still submit.
 */
export function isStudentAssignmentPending(
  assignment: Task,
  currentDate: Date = new Date(),
): boolean {
  if (isStudentAssignmentFinished(assignment)) {
    return false
  }

  return isAssignmentSubmissionOpen(assignment, currentDate)
}

/**
 * Returns whether a student assignment matches the selected status filter.
 *
 * @param assignment - Student assignment row data.
 * @param filter - Selected student status filter.
 * @param currentDate - Optional clock override for tests.
 * @returns True when the assignment belongs in the selected bucket.
 */
export function matchesStudentAssignmentStatusFilter(
  assignment: Task,
  filter: StudentAssignmentStatusFilter,
  currentDate: Date = new Date(),
): boolean {
  switch (filter) {
    case "all":
      return true
    case "pending":
      return isStudentAssignmentPending(assignment, currentDate)
    case "finished":
      return isStudentAssignmentFinished(assignment)
    case "missed":
      return isStudentAssignmentMissed(assignment, currentDate)
    default:
      return true
  }
}

/**
 * Calculates student status counts for a pre-filtered assignment list.
 *
 * @param assignments - Assignment rows after applying non-status filters.
 * @param currentDate - Optional clock override for tests.
 * @returns Counts for student status chips.
 */
export function calculateStudentAssignmentStatusCounts(
  assignments: Task[],
  currentDate: Date = new Date(),
): Record<StudentAssignmentStatusFilter, number> {
  return {
    all: assignments.length,
    pending: assignments.filter((assignment) =>
      isStudentAssignmentPending(assignment, currentDate),
    ).length,
    finished: assignments.filter(isStudentAssignmentFinished).length,
    missed: assignments.filter((assignment) =>
      isStudentAssignmentMissed(assignment, currentDate),
    ).length,
  }
}
