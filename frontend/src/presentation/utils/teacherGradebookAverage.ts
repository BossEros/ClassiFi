import type { GradebookAssignment, GradeEntry } from "@/data/api/gradebook.types"

/**
 * Calculates the teacher-facing current standing average for a student's gradebook row.
 *
 * Policy:
 * - graded submissions count with their earned percentage
 * - missing submissions count as zero
 * - submitted work awaiting grading is excluded until a grade exists
 *
 * @param assignments - The class assignments used as the denominator source.
 * @param grades - The student's grade entries for those assignments.
 * @returns The rounded current-standing average percentage, or `null` when nothing is countable yet.
 */
export function calculateTeacherGradebookAverage(
  assignments: GradebookAssignment[],
  grades: GradeEntry[],
): number | null {
  let earnedPoints = 0
  let possiblePoints = 0

  for (const assignment of assignments) {
    if (assignment.totalScore <= 0) {
      continue
    }

    const matchingGradeEntry = grades.find(
      (gradeEntry) => gradeEntry.assignmentId === assignment.id,
    )

    if (!matchingGradeEntry || matchingGradeEntry.submissionId === null) {
      possiblePoints += assignment.totalScore
      continue
    }

    if (matchingGradeEntry.grade === null) {
      continue
    }

    possiblePoints += assignment.totalScore
    earnedPoints += matchingGradeEntry.grade
  }

  if (possiblePoints === 0) {
    return null
  }

  return Math.round((earnedPoints / possiblePoints) * 100)
}
