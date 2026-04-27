import type {
  GradebookAssignment,
  GradebookStudent,
} from "@/data/api/gradebook.types"
import { calculateTeacherGradebookAverage } from "@/presentation/utils/teacherGradebookAverage"

function escapeCsvCell(cellValue: string | number | null): string {
  if (cellValue === null || cellValue === undefined) {
    return ""
  }

  return `"${cellValue.toString().replace(/"/g, '""')}"`
}

/**
 * Builds teacher gradebook CSV content from the already-selected student order.
 *
 * @param assignments - The assignment columns shown in the gradebook.
 * @param students - The ordered student rows to export.
 * @returns The full CSV document content.
 */
export function buildTeacherGradebookCsvContent(
  assignments: GradebookAssignment[],
  students: GradebookStudent[],
): string {
  const headers = [
    "Student Name",
    "Email",
    "Status",
    ...assignments.map(
      (assignment) => `${assignment.name} (/${assignment.totalScore})`,
    ),
    "Average",
  ]

  const rows = students.map((student) => {
    const gradeValues = assignments.map((assignment) => {
      const matchingGradeEntry = student.grades.find(
        (gradeEntry) => gradeEntry.assignmentId === assignment.id,
      )

      return matchingGradeEntry?.grade !== null &&
        matchingGradeEntry?.grade !== undefined
        ? matchingGradeEntry.grade.toString()
        : ""
    })

    const average = calculateTeacherGradebookAverage(
      assignments,
      student.grades,
    )

    return [
      student.name,
      student.email,
      student.isActive ? "Active" : "Inactive",
      ...gradeValues,
      average !== null ? average.toString() : "",
    ]
  })

  return [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ].join("\n")
}

/**
 * Downloads a teacher gradebook CSV using the caller-provided student order.
 *
 * @param assignments - The assignment columns shown in the gradebook.
 * @param students - The ordered student rows to export.
 * @param fileName - The target CSV file name.
 */
export function downloadTeacherGradebookCsvFile(
  assignments: GradebookAssignment[],
  students: GradebookStudent[],
  fileName: string,
): void {
  const csvContent = buildTeacherGradebookCsvContent(assignments, students)
  const csvBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const downloadUrl = window.URL.createObjectURL(csvBlob)
  const downloadLinkElement = document.createElement("a")

  downloadLinkElement.href = downloadUrl
  downloadLinkElement.download = fileName

  document.body.appendChild(downloadLinkElement)
  downloadLinkElement.click()
  document.body.removeChild(downloadLinkElement)
  window.URL.revokeObjectURL(downloadUrl)
}
