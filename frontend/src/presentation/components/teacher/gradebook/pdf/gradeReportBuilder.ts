import type {
  GradeReportBuilderOptions,
  GradeReportData,
  GradeReportStudentRow,
  GradeReportGradeCell,
  ReportMetadataEntry,
  SummaryMetric,
} from "./gradeReportTypes"
import { calculateTeacherGradebookAverage } from "@/presentation/utils/teacherGradebookAverage"

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

/**
 * Builds the precomputed data needed to render the grade report PDF document.
 *
 * @param options - Gradebook data and class metadata.
 * @returns A fully resolved GradeReportData object for the document component.
 */
export function buildGradeReportData(
  options: GradeReportBuilderOptions,
): GradeReportData {
  const { gradebook, className, classCode, teacherName, downloadedAt } = options
  const generatedAt = downloadedAt ?? new Date()
  const activeStudentCount = gradebook.students.filter(
    (student) => student.isActive,
  ).length
  const inactiveStudentCount = gradebook.students.length - activeStudentCount

  const title = className ? `Grade Report - ${className}` : "Grade Report"

  const reportMetadata: ReportMetadataEntry[] = [
    { label: "Class", value: className || "N/A" },
    { label: "Class Code", value: classCode || "N/A" },
    { label: "Teacher", value: teacherName || "N/A" },
    { label: "Total Assignments", value: String(gradebook.assignments.length) },
    { label: "Total Students", value: String(gradebook.students.length) },
    {
      label: "Summary Scope",
      value: "Summary metrics include active students only",
    },
    { label: "Generated At", value: formatDateTime(generatedAt) },
  ]

  const activeStudentAverages: number[] = []
  const studentRows: GradeReportStudentRow[] = gradebook.students.map(
    (student) => {
      const grades: GradeReportGradeCell[] = gradebook.assignments.map(
        (assignment) => {
          const gradeEntry = student.grades.find(
            (grade) => grade.assignmentId === assignment.id,
          )
          const hasGrade =
            gradeEntry && gradeEntry.grade !== null && gradeEntry.submissionId

          if (!hasGrade) {
            return {
              assignmentName: assignment.name,
              score: "-",
              percentage: 0,
              totalScore: assignment.totalScore,
            }
          }

          const gradeValue = gradeEntry.grade as number
          const percentage =
            assignment.totalScore > 0
              ? (gradeValue / assignment.totalScore) * 100
              : 0

          return {
            assignmentName: assignment.name,
            score: `${gradeValue}/${assignment.totalScore}`,
            percentage,
            totalScore: assignment.totalScore,
          }
        },
      )

      let average = "-"
      const averageValue = calculateTeacherGradebookAverage(
        gradebook.assignments,
        student.grades,
      )

      if (averageValue !== null) {
        average = `${averageValue}%`

        if (student.isActive) {
          activeStudentAverages.push(averageValue)
        }
      }

      return {
        studentName: student.name,
        statusLabel: student.isActive ? "Active" : "Inactive",
        isActive: student.isActive,
        grades,
        average,
      }
    },
  )

  const classAverage =
    activeStudentAverages.length > 0
      ? `${Math.round(
          activeStudentAverages.reduce((sum, value) => sum + value, 0) /
            activeStudentAverages.length,
        )}%`
      : "N/A"

  const highestAverage =
    activeStudentAverages.length > 0
      ? `${Math.round(Math.max(...activeStudentAverages))}%`
      : "N/A"

  const lowestAverage =
    activeStudentAverages.length > 0
      ? `${Math.round(Math.min(...activeStudentAverages))}%`
      : "N/A"

  const summaryMetrics: SummaryMetric[] = [
    { label: "Active Students", value: String(activeStudentCount) },
    { label: "Inactive Students", value: String(inactiveStudentCount) },
    { label: "Assignments", value: String(gradebook.assignments.length) },
    { label: "Class Average", value: classAverage },
    { label: "Highest Average", value: highestAverage },
    { label: "Lowest Average", value: lowestAverage },
  ]

  return {
    title,
    reportMetadata,
    summaryMetrics,
    assignmentNames: gradebook.assignments.map((assignment) => assignment.name),
    studentRows,
  }
}
