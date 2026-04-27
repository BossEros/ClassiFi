import type {
  GradebookAssignment,
  GradebookStudent,
} from "@/data/api/gradebook.types"
import { calculateTeacherGradebookAverage } from "@/presentation/utils/teacherGradebookAverage"

export type TeacherGradebookSortOption = "rank" | "name"

const studentNameCollator = new Intl.Collator(undefined, {
  sensitivity: "base",
  numeric: true,
})

function getSortableLastName(studentName: string): string {
  const trimmedStudentName = studentName.trim()

  if (!trimmedStudentName) {
    return ""
  }

  const nameParts = trimmedStudentName.split(/\s+/)

  return nameParts[nameParts.length - 1] ?? trimmedStudentName
}

function compareStudentNames(
  leftStudentName: string,
  rightStudentName: string,
): number {
  return studentNameCollator.compare(leftStudentName, rightStudentName)
}

function compareStudentLastNames(
  leftStudentName: string,
  rightStudentName: string,
): number {
  const lastNameComparison = studentNameCollator.compare(
    getSortableLastName(leftStudentName),
    getSortableLastName(rightStudentName),
  )

  if (lastNameComparison !== 0) {
    return lastNameComparison
  }

  return compareStudentNames(leftStudentName, rightStudentName)
}

/**
 * Sorts teacher gradebook rows using the selected teacher-facing ordering mode.
 *
 * Rank order matches the current-standing semantics used throughout the teacher
 * gradebook: active students first, then higher displayed averages, then name.
 * Name order is a plain alphabetical listing by student name.
 *
 * @param assignments - The class assignments used to compute current-standing averages.
 * @param students - The gradebook rows that should be ordered for display/export.
 * @param sortOption - The selected teacher-facing sort mode.
 * @returns A new student array ordered for the selected mode.
 */
export function sortTeacherGradebookStudents(
  assignments: GradebookAssignment[],
  students: GradebookStudent[],
  sortOption: TeacherGradebookSortOption,
): GradebookStudent[] {
  if (sortOption === "name") {
    return [...students].sort((leftStudent, rightStudent) =>
      compareStudentLastNames(leftStudent.name, rightStudent.name),
    )
  }

  return [...students].sort((leftStudent, rightStudent) => {
    if (leftStudent.isActive !== rightStudent.isActive) {
      return leftStudent.isActive ? -1 : 1
    }

    const leftAverage = calculateTeacherGradebookAverage(
      assignments,
      leftStudent.grades,
    )
    const rightAverage = calculateTeacherGradebookAverage(
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

    return compareStudentNames(leftStudent.name, rightStudent.name)
  })
}
