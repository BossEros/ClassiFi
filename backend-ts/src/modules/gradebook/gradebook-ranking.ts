export interface RankableGradebookAssignment {
  id: number
  totalScore: number
}

export interface RankableGradebookGrade {
  assignmentId: number
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
  const gradedPercentages = grades.reduce<number[]>(
    (collectedPercentages, gradeEntry) => {
      if (gradeEntry.grade === null) {
        return collectedPercentages
      }

      const matchingAssignment = assignments.find(
        (assignment) => assignment.id === gradeEntry.assignmentId,
      )
      if (!matchingAssignment || matchingAssignment.totalScore <= 0) {
        return collectedPercentages
      }

      collectedPercentages.push(
        (gradeEntry.grade / matchingAssignment.totalScore) * 100,
      )

      return collectedPercentages
    },
    [],
  )

  if (gradedPercentages.length === 0) {
    return null
  }

  const totalPercentage = gradedPercentages.reduce(
    (sum, percentage) => sum + percentage,
    0,
  )

  return Math.round(totalPercentage / gradedPercentages.length)
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
