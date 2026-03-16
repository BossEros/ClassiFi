import type { StudentClassGrades } from "@/shared/types/gradebook"
import type { StudentGradeReportBuilderOptions, StudentGradeReportData, StudentGradeReportRow, ReportMetadataEntry, SummaryMetric } from "./studentGradeReportTypes"

// ─── Date Formatter ────────────────────────────────────────────────────────────

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function formatDateTimeValue(value: string | null): string {
  if (!value) return "N/A"

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) return "N/A"

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate)
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function calculateAverage(classGrades: StudentClassGrades): number | null {
  const gradedAssignments = classGrades.assignments.filter(
    (assignment) => assignment.grade !== null && assignment.totalScore > 0,
  )

  if (gradedAssignments.length === 0) return null

  const totalPercentage = gradedAssignments.reduce((sum, assignment) => {
    return sum + (((assignment.grade ?? 0) / assignment.totalScore) * 100)
  }, 0)

  return Math.round(totalPercentage / gradedAssignments.length)
}

// ─── Builder ───────────────────────────────────────────────────────────────────

/**
 * Builds the precomputed data needed to render the student grade report PDF document.
 *
 * @param options - Student grades data and metadata.
 * @returns A fully resolved StudentGradeReportData object for the document component.
 */
export function buildStudentGradeReportData(options: StudentGradeReportBuilderOptions): StudentGradeReportData {
  const { classGrades, studentName, downloadedAt } = options
  const generatedAt = downloadedAt ?? new Date()

  const title = `Grade Report — ${classGrades.className}`

  const average = calculateAverage(classGrades)
  const gradedCount = classGrades.assignments.filter((a) => a.grade !== null).length
  const pendingCount = classGrades.assignments.filter((a) => a.grade === null && a.submittedAt !== null).length
  const notSubmittedCount = classGrades.assignments.filter((a) => a.submittedAt === null).length
  const totalAssignments = classGrades.assignments.length

  const reportMetadata: ReportMetadataEntry[] = [
    { label: "Student", value: studentName || "N/A" },
    { label: "Class", value: classGrades.className },
    { label: "Teacher", value: classGrades.teacherName },
    { label: "Total Assignments", value: String(totalAssignments) },
    { label: "Generated At", value: formatDateTime(generatedAt) },
  ]

  const summaryMetrics: SummaryMetric[] = [
    { label: "Average", value: average !== null ? `${average}%` : "N/A" },
    { label: "Graded", value: `${gradedCount}/${totalAssignments}` },
    { label: "Pending Review", value: String(pendingCount) },
    { label: "Not Submitted", value: String(notSubmittedCount) },
  ]

  const assignmentRows: StudentGradeReportRow[] = classGrades.assignments.map((assignment) => {
    const hasGrade = assignment.grade !== null
    const hasSubmission = Boolean(assignment.submittedAt)
    const percentage = hasGrade && assignment.totalScore > 0
      ? ((assignment.grade ?? 0) / assignment.totalScore) * 100
      : 0

    let status: StudentGradeReportRow["status"] = "not-submitted"

    if (hasGrade) {
      status = "graded"
    } else if (hasSubmission) {
      status = "pending"
    }

    return {
      assignmentName: assignment.assignmentName,
      totalScore: assignment.totalScore,
      grade: hasGrade ? `${assignment.grade}/${assignment.totalScore}` : "-",
      percentage: hasGrade ? `${Math.round(percentage)}%` : "-",
      status,
      deadline: formatDateTimeValue(assignment.deadline),
      submittedAt: formatDateTimeValue(assignment.submittedAt),
      isLate: assignment.isLate ?? false,
      penaltyApplied: assignment.penaltyApplied ?? 0,
      feedback: assignment.feedback,
      isOverridden: assignment.isOverridden,
    }
  })

  return {
    title,
    reportMetadata,
    summaryMetrics,
    assignmentRows,
  }
}
