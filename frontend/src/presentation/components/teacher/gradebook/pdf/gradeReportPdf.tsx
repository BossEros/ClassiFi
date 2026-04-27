/**
 * gradeReportPdf.tsx
 *
 * Entry point for the grade report PDF module.
 * Composes the Document root, grade table components, and
 * re-exports all public symbols for the GradebookContent caller.
 *
 * Reuses shared PDF infrastructure (styles, layout components)
 * from the plagiarism report module for consistent branding.
 */

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { pdfStyles, C } from "../../plagiarism/pdf/pdfStyles"
import {
  ReportHeader,
  SectionTitle,
  MetadataGrid,
  MetricRow,
  DocumentFooter,
} from "../../plagiarism/pdf/pdfComponents"
import type { GradeReportData, GradeReportStudentRow } from "./gradeReportTypes"

export type { GradeReportData } from "./gradeReportTypes"
export { buildGradeReportData } from "./gradeReportBuilder"

const gradeStyles = StyleSheet.create({
  table: {
    border: `1 solid ${C.border}`,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: C.headerBg,
    borderBottom: `1 solid ${C.border}`,
  },
  headerCell: {
    paddingTop: 6,
    paddingRight: 4,
    paddingBottom: 6,
    paddingLeft: 4,
    borderRight: `1 solid ${C.border}`,
    justifyContent: "center",
  },
  headerCellLast: {
    borderRightWidth: 0,
  },
  headerText: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: C.inkMid,
    textTransform: "uppercase",
    textAlign: "center",
    lineHeight: 1.3,
  },
  headerTextLeft: {
    textAlign: "left",
  },
  row: {
    flexDirection: "row",
    borderBottom: `1 solid ${C.borderLight}`,
    backgroundColor: C.white,
  },
  rowAlternate: {
    backgroundColor: C.rowAlt,
  },
  inactiveRow: {
    backgroundColor: "#fff7ed",
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  cell: {
    paddingTop: 5,
    paddingRight: 4,
    paddingBottom: 5,
    paddingLeft: 4,
    borderRight: `1 solid ${C.borderLight}`,
    justifyContent: "center",
  },
  cellLast: {
    borderRightWidth: 0,
  },
  studentNameText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
  },
  inactiveStudentNameText: {
    color: "#9a3412",
  },
  statusText: {
    marginTop: 2,
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  activeStatusText: {
    color: C.inkLight,
  },
  inactiveStatusText: {
    color: "#b45309",
  },
  gradeText: {
    fontSize: 8,
    color: C.inkMid,
    textAlign: "center",
  },
  gradeTextHigh: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.lowText,
    textAlign: "center",
  },
  gradeTextMid: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.medText,
    textAlign: "center",
  },
  gradeTextLow: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.highText,
    textAlign: "center",
  },
  averageText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  noDataText: {
    fontSize: 8,
    color: C.inkLight,
    textAlign: "center",
  },
})

function getGradeTextStyle(percentage: number) {
  if (percentage >= 75) return gradeStyles.gradeTextHigh
  if (percentage >= 60) return gradeStyles.gradeTextMid

  return gradeStyles.gradeTextLow
}

function getAverageColor(averageStr: string): string {
  const value = parseInt(averageStr, 10)

  if (isNaN(value)) return C.inkLight
  if (value >= 75) return C.lowText
  if (value >= 60) return C.medText

  return C.highText
}

function GradeTable({ data }: { data: GradeReportData }) {
  const assignmentCount = data.assignmentNames.length

  if (data.studentRows.length === 0 || assignmentCount === 0) {
    return (
      <View style={[pdfStyles.emptyState]}>
        <Text
          style={{
            fontSize: 9,
            color: C.inkLight,
            fontFamily: "Helvetica-Oblique",
          }}
        >
          {assignmentCount === 0
            ? "No assignments created for this class."
            : "No students enrolled in this class."}
        </Text>
      </View>
    )
  }

  const studentColWidth = assignmentCount > 5 ? "18%" : "22%"
  const averageColWidth = "10%"
  const remainingWidth =
    assignmentCount > 5 ? (82 - 10) / assignmentCount : (78 - 10) / assignmentCount
  const assignmentColWidth = `${remainingWidth}%`

  return (
    <View style={gradeStyles.table}>
      <View style={gradeStyles.headerRow} wrap={false}>
        <View style={[gradeStyles.headerCell, { width: studentColWidth }]}>
          <Text style={[gradeStyles.headerText, gradeStyles.headerTextLeft]}>
            Student
          </Text>
        </View>
        {data.assignmentNames.map((name, index) => (
          <View
            key={`header-${index}`}
            style={[gradeStyles.headerCell, { width: assignmentColWidth }]}
          >
            <Text style={gradeStyles.headerText}>{name}</Text>
          </View>
        ))}
        <View
          style={[
            gradeStyles.headerCell,
            gradeStyles.headerCellLast,
            { width: averageColWidth },
          ]}
        >
          <Text style={gradeStyles.headerText}>Average</Text>
        </View>
      </View>

      {data.studentRows.map((student, rowIndex) => (
        <GradeTableRow
          key={`row-${rowIndex}`}
          student={student}
          studentColWidth={studentColWidth}
          assignmentColWidth={assignmentColWidth}
          averageColWidth={averageColWidth}
          isAlternate={rowIndex % 2 === 1}
          isLast={rowIndex === data.studentRows.length - 1}
        />
      ))}
    </View>
  )
}

function GradeTableRow({
  student,
  studentColWidth,
  assignmentColWidth,
  averageColWidth,
  isAlternate,
  isLast,
}: {
  student: GradeReportStudentRow
  studentColWidth: string
  assignmentColWidth: string
  averageColWidth: string
  isAlternate: boolean
  isLast: boolean
}) {
  return (
    <View
      style={[
        gradeStyles.row,
        isAlternate ? gradeStyles.rowAlternate : {},
        !student.isActive ? gradeStyles.inactiveRow : {},
        isLast ? gradeStyles.rowLast : {},
      ]}
      wrap={false}
    >
      <View style={[gradeStyles.cell, { width: studentColWidth }]}>
        <Text
          style={[
            gradeStyles.studentNameText,
            !student.isActive ? gradeStyles.inactiveStudentNameText : {},
          ]}
        >
          {student.studentName}
        </Text>
        <Text
          style={[
            gradeStyles.statusText,
            student.isActive
              ? gradeStyles.activeStatusText
              : gradeStyles.inactiveStatusText,
          ]}
        >
          {student.statusLabel}
        </Text>
      </View>
      {student.grades.map((grade, index) => (
        <View
          key={`cell-${index}`}
          style={[gradeStyles.cell, { width: assignmentColWidth }]}
        >
          {grade.score === "-" ? (
            <Text style={gradeStyles.noDataText}>-</Text>
          ) : (
            <Text style={getGradeTextStyle(grade.percentage)}>{grade.score}</Text>
          )}
        </View>
      ))}
      <View
        style={[
          gradeStyles.cell,
          gradeStyles.cellLast,
          { width: averageColWidth },
        ]}
      >
        <Text
          style={[
            gradeStyles.averageText,
            { color: getAverageColor(student.average) },
          ]}
        >
          {student.average}
        </Text>
      </View>
    </View>
  )
}

/**
 * Grade report PDF document for a class gradebook.
 *
 * @param props - Prebuilt report data.
 * @returns React PDF document with class grade information.
 */
export function GradeReportDocument({ data }: { data: GradeReportData }) {
  return (
    <Document title={data.title}>
      <Page
        size="A4"
        orientation={data.assignmentNames.length > 5 ? "landscape" : "portrait"}
        style={pdfStyles.page}
      >
        <ReportHeader
          title={data.title}
          subtitle="Comprehensive grade summary for all enrolled students across all assignments. Inactive students are labeled and highlighted."
        />

        <View style={pdfStyles.section} wrap={false}>
          <SectionTitle title="Report Information" />
          <MetadataGrid entries={data.reportMetadata} />
        </View>

        <View style={pdfStyles.section} wrap={false}>
          <SectionTitle title="Summary Statistics" />
          <MetricRow metrics={data.summaryMetrics} />
        </View>

        <View style={pdfStyles.section}>
          <SectionTitle title="Student Grades" />
          <GradeTable data={data} />
        </View>

        <DocumentFooter />
      </Page>
    </Document>
  )
}
