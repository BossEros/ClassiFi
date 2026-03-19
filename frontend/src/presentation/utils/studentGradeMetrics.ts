import type { StudentGradeEntry } from "@/shared/types/gradebook"

export interface StudentGradeSummaryMetrics {
  currentGrade: number | null
  countedAssignmentCount: number
  gradedCount: number
  overdueMissingCount: number
  pendingReviewCount: number
  notSubmittedCount: number
  totalAssignments: number
}

function isGradePublished(assignment: StudentGradeEntry): boolean {
  return assignment.grade !== null && assignment.grade !== undefined
}

function isValidDeadlineDate(deadline: string | null): deadline is string {
  if (!deadline) {
    return false
  }

  return !Number.isNaN(new Date(deadline).getTime())
}

function isOverdueMissingAssignment(
  assignment: StudentGradeEntry,
  currentDate: Date,
): boolean {
  if (assignment.submittedAt !== null) {
    return false
  }

  if (!isValidDeadlineDate(assignment.deadline)) {
    return false
  }

  return new Date(assignment.deadline).getTime() < currentDate.getTime()
}

/**
 * Calculates student-facing summary metrics for a set of assignment grades.
 *
 * Current grade is points-based rather than average-based. It includes:
 * graded assignments with their earned points and overdue missing assignments
 * as zero-point entries. Pending-review work and future assignments are
 * excluded until they become countable.
 *
 * @param assignments - The assignment grade entries to summarize.
 * @param currentDate - The point-in-time used to determine whether assignments are overdue.
 * @returns Student-facing summary metrics used by grade cards and reports.
 */
export function calculateStudentGradeSummaryMetrics(
  assignments: StudentGradeEntry[],
  currentDate: Date = new Date(),
): StudentGradeSummaryMetrics {
  let earnedPoints = 0
  let possiblePoints = 0
  let countedAssignmentCount = 0
  let gradedCount = 0
  let overdueMissingCount = 0
  let pendingReviewCount = 0
  let notSubmittedCount = 0

  for (const assignment of assignments) {
    const hasPublishedGrade = isGradePublished(assignment)
    const hasSubmission = assignment.submittedAt !== null
    const isOverdueMissing = isOverdueMissingAssignment(assignment, currentDate)

    if (hasPublishedGrade) {
      gradedCount += 1
    }

    if (!hasSubmission) {
      notSubmittedCount += 1
    }

    if (!hasPublishedGrade && hasSubmission) {
      pendingReviewCount += 1
    }

    if (isOverdueMissing) {
      overdueMissingCount += 1
    }

    if (!hasPublishedGrade && !isOverdueMissing) {
      continue
    }

    if (assignment.totalScore <= 0) {
      continue
    }

    countedAssignmentCount += 1
    possiblePoints += assignment.totalScore

    if (hasPublishedGrade) {
      earnedPoints += assignment.grade ?? 0
    }
  }

  const currentGrade =
    possiblePoints > 0 ? Math.round((earnedPoints / possiblePoints) * 100) : null

  return {
    currentGrade,
    countedAssignmentCount,
    gradedCount,
    overdueMissingCount,
    pendingReviewCount,
    notSubmittedCount,
    totalAssignments: assignments.length,
  }
}
