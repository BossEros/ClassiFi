import type { StudentGradeReportBuilderOptions, StudentGradeReportData, StudentGradeReportRow, ReportMetadataEntry, SummaryMetric } from "./studentGradeReportTypes"
import { calculateStudentGradeSummaryMetrics } from "@/presentation/utils/studentGradeMetrics"

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
  const summaryMetricsData = calculateStudentGradeSummaryMetrics(
    classGrades.assignments,
    generatedAt,
  )

  const title = `Grade Report — ${classGrades.className}`

  const currentGrade = summaryMetricsData.currentGrade
  const gradedCount = summaryMetricsData.gradedCount
  const pendingCount = summaryMetricsData.pendingReviewCount
  const notSubmittedCount = summaryMetricsData.notSubmittedCount
  const totalAssignments = summaryMetricsData.totalAssignments

  const reportMetadata: ReportMetadataEntry[] = [
    { label: "Student", value: studentName || "N/A" },
    { label: "Class", value: classGrades.className },
    { label: "Teacher", value: classGrades.teacherName },
    { label: "Total Assignments", value: String(totalAssignments) },
    { label: "Generated At", value: formatDateTime(generatedAt) },
  ]

  const summaryMetrics: SummaryMetric[] = [
    { label: "Current Grade", value: currentGrade !== null ? `${currentGrade}%` : "N/A" },
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
