/**
 * studentGradeReportPdf.tsx
 *
 * Entry point for the student grade report PDF module.
 * Composes the Document root, assignment table, and
 * re-exports all public symbols.
 *
 * Reuses shared PDF infrastructure (styles, layout components)
 * from the plagiarism report module for consistent branding.
 */

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { pdfStyles, C } from "../../../teacher/plagiarism/pdf/pdfStyles"
import {
  ReportHeader,
  SectionTitle,
  MetadataGrid,
  MetricRow,
  DocumentFooter,
} from "../../../teacher/plagiarism/pdf/pdfComponents"
import type {
  StudentGradeReportData,
  StudentGradeReportRow,
} from "./studentGradeReportTypes"

export type { StudentGradeReportData } from "./studentGradeReportTypes"
export { buildStudentGradeReportData } from "./studentGradeReportBuilder"

const COL = {
  assignment: "28%",
  grade: "14%",
  status: "14%",
  deadline: "22%",
  submitted: "22%",
} as const

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
  assignmentText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
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
  noDataText: {
    fontSize: 8,
    color: C.inkLight,
    textAlign: "center",
  },
  statusGraded: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.lowText,
    textAlign: "center",
  },
  statusPending: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.medText,
    textAlign: "center",
  },
  statusNotSubmitted: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.highText,
    textAlign: "center",
  },
  dateText: {
    fontSize: 7.5,
    color: C.inkMid,
    textAlign: "center",
  },
  penaltyText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.highText,
    textAlign: "center",
  },
  noPenaltyText: {
    fontSize: 7,
    color: C.inkLight,
    textAlign: "center",
  },
  feedbackSection: {
    marginTop: 4,
    paddingTop: 4,
    paddingRight: 8,
    paddingBottom: 4,
    paddingLeft: 8,
    borderTop: `1 solid ${C.borderLight}`,
  },
  feedbackLabel: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: C.inkLight,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  feedbackText: {
    fontSize: 7.5,
    color: C.inkMid,
    lineHeight: 1.4,
  },
  overriddenBadge: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: C.medText,
    textAlign: "center",
    marginTop: 2,
  },
})

function getGradeTextStyle(percentage: string) {
  const value = parseInt(percentage, 10)

  if (isNaN(value)) return gradeStyles.noDataText
  if (value >= 75) return gradeStyles.gradeTextHigh
  if (value >= 60) return gradeStyles.gradeTextMid

  return gradeStyles.gradeTextLow
}

function getStatusStyle(status: StudentGradeReportRow["status"]) {
  switch (status) {
    case "graded":
      return gradeStyles.statusGraded
    case "pending":
      return gradeStyles.statusPending
    default:
      return gradeStyles.statusNotSubmitted
  }
}

function getStatusLabel(status: StudentGradeReportRow["status"]) {
  switch (status) {
    case "graded":
      return "Graded"
    case "pending":
      return "Pending"
    default:
      return "Missing"
  }
}

function StudentGradeTable({ rows }: { rows: StudentGradeReportRow[] }) {
  if (rows.length === 0) {
    return (
      <View style={pdfStyles.emptyState}>
        <Text
          style={{
            fontSize: 9,
            color: C.inkLight,
            fontFamily: "Helvetica-Oblique",
          }}
        >
          No assignments available for this class.
        </Text>
      </View>
    )
  }

  return (
    <View style={gradeStyles.table}>
      <View style={gradeStyles.headerRow} wrap={false}>
        <View style={[gradeStyles.headerCell, { width: COL.assignment }]}>
          <Text style={[gradeStyles.headerText, gradeStyles.headerTextLeft]}>
            Assignment
          </Text>
        </View>
        <View style={[gradeStyles.headerCell, { width: COL.grade }]}>
          <Text style={gradeStyles.headerText}>Grade</Text>
        </View>
        <View style={[gradeStyles.headerCell, { width: COL.status }]}>
          <Text style={gradeStyles.headerText}>Status</Text>
        </View>
        <View style={[gradeStyles.headerCell, { width: COL.deadline }]}>
          <Text style={gradeStyles.headerText}>Deadline</Text>
        </View>
        <View
          style={[
            gradeStyles.headerCell,
            gradeStyles.headerCellLast,
            { width: COL.submitted },
          ]}
        >
          <Text style={gradeStyles.headerText}>Submitted</Text>
        </View>
      </View>

      {rows.map((row, index) => (
        <View key={`row-${index}`} wrap={false}>
          <View
            style={[
              gradeStyles.row,
              index % 2 === 1 ? gradeStyles.rowAlternate : {},
              index === rows.length - 1 && !row.feedback
                ? gradeStyles.rowLast
                : {},
            ]}
          >
            <View style={[gradeStyles.cell, { width: COL.assignment }]}>
              <Text style={gradeStyles.assignmentText}>{row.assignmentName}</Text>
              {row.isOverridden && (
                <Text style={gradeStyles.overriddenBadge}>Adjusted</Text>
              )}
            </View>
            <View style={[gradeStyles.cell, { width: COL.grade }]}>
              <Text
                style={
                  row.grade === "-"
                    ? gradeStyles.noDataText
                    : getGradeTextStyle(row.percentage)
                }
              >
                {row.grade}
              </Text>
            </View>
            <View style={[gradeStyles.cell, { width: COL.status }]}>
              <Text style={getStatusStyle(row.status)}>
                {getStatusLabel(row.status)}
              </Text>
            </View>
            <View style={[gradeStyles.cell, { width: COL.deadline }]}>
              <Text style={gradeStyles.dateText}>{row.deadline}</Text>
            </View>
            <View
              style={[
                gradeStyles.cell,
                gradeStyles.cellLast,
                { width: COL.submitted },
              ]}
            >
              <Text style={gradeStyles.dateText}>{row.submittedAt}</Text>
            </View>
          </View>

          {row.feedback && (
            <View style={gradeStyles.feedbackSection}>
              <Text style={gradeStyles.feedbackLabel}>Teacher Feedback</Text>
              <Text style={gradeStyles.feedbackText}>{row.feedback}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  )
}

/**
 * Student grade report PDF document showing all assignment grades for a class.
 *
 * @param props - Prebuilt report data.
 * @returns React PDF document with student-specific grade information.
 */
export function StudentGradeReportDocument({
  data,
}: {
  data: StudentGradeReportData
}) {
  return (
    <Document title={data.title}>
      <Page size="A4" orientation="landscape" style={pdfStyles.page}>
        <ReportHeader
          title={data.title}
          subtitle="Personal grade summary showing scores, submission status, late penalties, and teacher feedback for each assignment."
        />

        <View style={pdfStyles.section} wrap={false}>
          <SectionTitle title="Report Information" />
          <MetadataGrid entries={data.reportMetadata} />
        </View>

        <View style={pdfStyles.section} wrap={false}>
          <SectionTitle title="Summary" />
          <MetricRow metrics={data.summaryMetrics} />
        </View>

        <View style={pdfStyles.section}>
          <SectionTitle title="Assignment Grades" />
          <StudentGradeTable rows={data.assignmentRows} />
        </View>

        <DocumentFooter />
      </Page>
    </Document>
  )
}
