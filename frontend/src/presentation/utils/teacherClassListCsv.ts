import type { EnrolledStudent } from "@/data/api/class.types"

function escapeCsvCell(cellValue: string | number | null | undefined): string {
  if (cellValue === null || cellValue === undefined) {
    return ""
  }

  return `"${cellValue.toString().replace(/"/g, '""')}"`
}

function formatRosterDate(dateValue: string): string {
  const parsedDate = new Date(dateValue)

  if (Number.isNaN(parsedDate.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsedDate)
}

function getStudentDisplayName(student: EnrolledStudent): string {
  return student.fullName || `${student.firstName} ${student.lastName}`.trim()
}

/**
 * Builds teacher class-list CSV content from the currently selected roster.
 *
 * @param students - The ordered roster rows to export.
 * @returns The full CSV document content.
 */
export function buildTeacherClassListCsvContent(
  students: EnrolledStudent[],
): string {
  const headers = ["Student Name", "Email", "Status", "Enrolled At"]
  const rows = students.map((student) => [
    getStudentDisplayName(student),
    student.email,
    student.isActive ? "Active" : "Inactive",
    formatRosterDate(student.enrolledAt),
  ])

  return [
    headers.map(escapeCsvCell).join(","),
    ...rows.map((row) => row.map(escapeCsvCell).join(",")),
  ].join("\n")
}

/**
 * Downloads a teacher class-list CSV using the caller-provided student order.
 *
 * @param students - The ordered roster rows to export.
 * @param fileName - The target CSV file name.
 */
export function downloadTeacherClassListCsvFile(
  students: EnrolledStudent[],
  fileName: string,
): void {
  const csvContent = buildTeacherClassListCsvContent(students)
  const csvBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const downloadUrl = window.URL.createObjectURL(csvBlob)
  const downloadLinkElement = document.createElement("a")

  try {
    downloadLinkElement.href = downloadUrl
    downloadLinkElement.download = fileName
    document.body.appendChild(downloadLinkElement)
    downloadLinkElement.click()
  } finally {
    downloadLinkElement.remove()
    window.URL.revokeObjectURL(downloadUrl)
  }
}
