import type { Assignment } from "@/data/api/class.types"

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000
const DEFAULT_LATE_SUBMISSION_REJECT_AFTER_HOURS = 120

/**
 * Returns the latest timestamp when a student can still submit an assignment.
 *
 * @param assignment - Assignment row data that may include late-submission settings.
 * @returns The final submission timestamp, or null when the assignment has no closing boundary.
 */
export function getAssignmentSubmissionCloseDate(
  assignment: Assignment,
): Date | null {
  if (!assignment.deadline) {
    return null
  }

  const deadlineDate = new Date(assignment.deadline)

  if (!assignment.allowLateSubmissions) {
    return deadlineDate
  }

  const rejectAfterHours = assignment.latePenaltyConfig
    ? assignment.latePenaltyConfig.rejectAfterHours
    : DEFAULT_LATE_SUBMISSION_REJECT_AFTER_HOURS

  if (rejectAfterHours === null) {
    return null
  }

  return new Date(
    deadlineDate.getTime() + rejectAfterHours * MILLISECONDS_PER_HOUR,
  )
}

/**
 * Returns whether the assignment is still open for student submission.
 *
 * @param assignment - Assignment row data that may include late-submission settings.
 * @param currentDate - Optional clock override for tests.
 * @returns True when the student can still submit the assignment.
 */
export function isAssignmentSubmissionOpen(
  assignment: Assignment,
  currentDate: Date = new Date(),
): boolean {
  const closeDate = getAssignmentSubmissionCloseDate(assignment)

  if (!closeDate) {
    return true
  }

  return currentDate <= closeDate
}
