import type { GradeReportBuilderOptions, GradeReportData, GradeReportStudentRow, GradeReportGradeCell, ReportMetadataEntry, SummaryMetric } from "./gradeReportTypes"

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

// ─── Builder ───────────────────────────────────────────────────────────────────

/**
 * Builds the precomputed data needed to render the grade report PDF document.
 *
 * @param options - Gradebook data and class metadata.
 * @returns A fully resolved GradeReportData object for the document component.
 */
export function buildGradeReportData(options: GradeReportBuilderOptions): GradeReportData {
  const { gradebook, className, classCode, teacherName, downloadedAt } = options
  const generatedAt = downloadedAt ?? new Date()

  const title = className ? `Grade Report — ${className}` : "Grade Report"

  const reportMetadata: ReportMetadataEntry[] = [
    { label: "Class", value: className || "N/A" },
    { label: "Class Code", value: classCode || "N/A" },
    { label: "Teacher", value: teacherName || "N/A" },
    { label: "Total Assignments", value: String(gradebook.assignments.length) },
    { label: "Total Students", value: String(gradebook.students.length) },
    { label: "Generated At", value: formatDateTime(generatedAt) },
  ]

  const allAverages: number[] = []
  const studentRows: GradeReportStudentRow[] = gradebook.students.map((student) => {
    const grades: GradeReportGradeCell[] = gradebook.assignments.map((assignment) => {
      const gradeEntry = student.grades.find((g) => g.assignmentId === assignment.id)
      const hasGrade = gradeEntry && gradeEntry.grade !== null && gradeEntry.submissionId

      if (!hasGrade) {
        return {
          assignmentName: assignment.name,
          score: "-",
          percentage: 0,
          totalScore: assignment.totalScore,
        }
      }

      const grade = gradeEntry.grade as number
      const percentage = assignment.totalScore > 0 ? (grade / assignment.totalScore) * 100 : 0

      return {
        assignmentName: assignment.name,
        score: `${grade}/${assignment.totalScore}`,
        percentage,
        totalScore: assignment.totalScore,
      }
    })

    const validGrades = grades.filter((g) => g.score !== "-")
    let average = "-"

    if (validGrades.length > 0) {
      const avgValue = validGrades.reduce((sum, g) => sum + g.percentage, 0) / validGrades.length
      average = `${Math.round(avgValue)}%`
      allAverages.push(avgValue)
    }

    return {
      studentName: student.name,
      grades,
      average,
    }
  })

  const classAverage = allAverages.length > 0
    ? `${Math.round(allAverages.reduce((sum, v) => sum + v, 0) / allAverages.length)}%`
    : "N/A"

  const highestAverage = allAverages.length > 0 ? `${Math.round(Math.max(...allAverages))}%` : "N/A"
  const lowestAverage = allAverages.length > 0 ? `${Math.round(Math.min(...allAverages))}%` : "N/A"

  const summaryMetrics: SummaryMetric[] = [
    { label: "Students", value: String(gradebook.students.length) },
    { label: "Assignments", value: String(gradebook.assignments.length) },
    { label: "Class Average", value: classAverage },
    { label: "Highest Average", value: highestAverage },
    { label: "Lowest Average", value: lowestAverage },
  ]

  const assignmentNames = gradebook.assignments.map((a) => a.name)

  return {
    title,
    reportMetadata,
    summaryMetrics,
    assignmentNames,
    studentRows,
  }
}
