import type {
  ClassListReportBuilderOptions,
  ClassListReportData,
  ClassListReportStudentRow,
} from "./classListReportTypes"

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function formatRosterDate(dateValue: string): string {
  const parsedDate = new Date(dateValue)

  if (Number.isNaN(parsedDate.getTime())) {
    return "N/A"
  }

  return formatDate(parsedDate)
}

function getStudentDisplayName(student: {
  firstName: string
  lastName: string
  fullName?: string
}): string {
  return student.fullName || `${student.firstName} ${student.lastName}`.trim()
}

/**
 * Builds the precomputed data needed to render the class-list PDF document.
 *
 * @param options - Roster rows and class metadata.
 * @returns A fully resolved ClassListReportData object for the document component.
 */
export function buildClassListReportData(
  options: ClassListReportBuilderOptions,
): ClassListReportData {
  const {
    students,
    className,
    classCode,
    teacherName,
    rosterScopeLabel,
    downloadedAt,
  } = options
  const generatedAt = downloadedAt ?? new Date()
  const activeStudentCount = students.filter((student) => student.isActive).length
  const inactiveStudentCount = students.length - activeStudentCount
  const title = className ? `Class List - ${className}` : "Class List"

  const studentRows: ClassListReportStudentRow[] = students.map((student) => ({
    studentName: getStudentDisplayName(student),
    email: student.email,
    statusLabel: student.isActive ? "Active" : "Inactive",
    isActive: student.isActive,
    enrolledAt: formatRosterDate(student.enrolledAt),
  }))

  return {
    title,
    reportMetadata: [
      { label: "Class", value: className || "N/A" },
      { label: "Class Code", value: classCode || "N/A" },
      { label: "Teacher", value: teacherName || "N/A" },
      { label: "Roster Scope", value: rosterScopeLabel },
      { label: "Total Students", value: String(students.length) },
      { label: "Generated At", value: formatDateTime(generatedAt) },
    ],
    summaryMetrics: [
      { label: "Active Students", value: String(activeStudentCount) },
      { label: "Inactive Students", value: String(inactiveStudentCount) },
      { label: "Included Students", value: String(students.length) },
    ],
    studentRows,
  }
}
