export interface RankableGradebookAssignment {
  id: number
  totalScore: number
}

export interface RankableGradebookGrade {
  assignmentId: number
  submissionId: number | null
  grade: number | null
}

export interface RankableGradebookStudent {
  id: number
  name: string
  isActive: boolean
  grades: RankableGradebookGrade[]
}

export interface StudentRankResult {
  rank: number
  totalStudents: number
  percentile: number
}

/**
 * Calculates the rounded average percentage shown in the teacher gradebook.
 *
 * @param assignments - The class assignments that define each score denominator.
 * @param grades - The student's grade entries for those assignments.
 * @returns The rounded average percentage, or `null` when the student has no graded work yet.
 */
export function calculateStudentAveragePercentage(
  assignments: RankableGradebookAssignment[],
  grades: RankableGradebookGrade[],
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

/**
 * Sorts teacher gradebook students by active status, displayed average rank, then name.
 *
 * @param assignments - The class assignments that define each score denominator.
 * @param students - The gradebook students to order.
 * @returns A new array ordered for teacher gradebook display and export.
 */
export function sortGradebookStudentsByRank<TStudent extends RankableGradebookStudent>(
  assignments: RankableGradebookAssignment[],
  students: TStudent[],
): TStudent[] {
  return [...students].sort((leftStudent, rightStudent) => {
    if (leftStudent.isActive !== rightStudent.isActive) {
      return leftStudent.isActive ? -1 : 1
    }

    const leftAverage = calculateStudentAveragePercentage(
      assignments,
      leftStudent.grades,
    )
    const rightAverage = calculateStudentAveragePercentage(
      assignments,
      rightStudent.grades,
    )

    if (leftAverage === null && rightAverage !== null) {
      return 1
    }

    if (leftAverage !== null && rightAverage === null) {
      return -1
    }

    if (
      leftAverage !== null &&
      rightAverage !== null &&
      leftAverage !== rightAverage
    ) {
      return rightAverage - leftAverage
    }

    return leftStudent.name.localeCompare(rightStudent.name, undefined, {
      sensitivity: "base",
    })
  })
}

/**
 * Computes a student's class rank from the same ordering rules used by the teacher gradebook.
 *
 * @param assignments - The class assignments that define each score denominator.
 * @param students - The full class gradebook student list.
 * @param studentId - The student whose rank should be returned.
 * @returns Rank details for graded active students, or `null` when no rank should be shown yet.
 */
export function getStudentRankFromGradebook(
  assignments: RankableGradebookAssignment[],
  students: RankableGradebookStudent[],
  studentId: number,
): StudentRankResult | null {
  const rankedStudents = sortGradebookStudentsByRank(assignments, students).filter(
    (student) =>
      student.isActive &&
      calculateStudentAveragePercentage(assignments, student.grades) !== null,
  )

  const targetStudentIndex = rankedStudents.findIndex(
    (student) => student.id === studentId,
  )
  if (targetStudentIndex === -1) {
    return null
  }

  const targetStudentAverage = calculateStudentAveragePercentage(
    assignments,
    rankedStudents[targetStudentIndex].grades,
  )
  if (targetStudentAverage === null) {
    return null
  }

  let computedRank = 1
  let previousAverage = calculateStudentAveragePercentage(
    assignments,
    rankedStudents[0].grades,
  )

  for (let studentIndex = 1; studentIndex <= targetStudentIndex; studentIndex++) {
    const currentAverage = calculateStudentAveragePercentage(
      assignments,
      rankedStudents[studentIndex].grades,
    )

    if (currentAverage !== previousAverage) {
      computedRank = studentIndex + 1
      previousAverage = currentAverage
    }
  }

  const totalStudents = rankedStudents.length
  const percentile = Math.round((computedRank / totalStudents) * 100)

  return {
    rank: computedRank,
    totalStudents,
    percentile,
  }
}
