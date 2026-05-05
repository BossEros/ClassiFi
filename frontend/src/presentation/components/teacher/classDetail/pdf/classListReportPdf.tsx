import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { C, pdfStyles } from "../../plagiarism/pdf/pdfStyles"
import {
  DocumentFooter,
  MetadataGrid,
  MetricRow,
  ReportHeader,
  SectionTitle,
} from "../../plagiarism/pdf/pdfComponents"
import type {
  ClassListReportData,
  ClassListReportStudentRow,
} from "./classListReportTypes"

export type { ClassListReportData } from "./classListReportTypes"
export { buildClassListReportData } from "./classListReportBuilder"

const classListStyles = StyleSheet.create({
  table: {
    border: `1 solid ${C.border}`,
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: C.headerBg,
    borderBottom: `1 solid ${C.border}`,
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
  headerCell: {
    paddingTop: 6,
    paddingRight: 6,
    paddingBottom: 6,
    paddingLeft: 6,
    borderRight: `1 solid ${C.border}`,
  },
  cell: {
    paddingTop: 5,
    paddingRight: 6,
    paddingBottom: 5,
    paddingLeft: 6,
    borderRight: `1 solid ${C.borderLight}`,
  },
  lastCell: {
    borderRightWidth: 0,
  },
  headerText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.inkMid,
    textTransform: "uppercase",
  },
  studentNameText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
  },
  inactiveStudentNameText: {
    color: "#9a3412",
  },
  cellText: {
    fontSize: 8,
    color: C.inkMid,
  },
  statusText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  activeStatusText: {
    color: C.lowText,
  },
  inactiveStatusText: {
    color: "#b45309",
  },
})

const columnWidths = {
  student: "32%",
  email: "34%",
  status: "14%",
  enrolledAt: "20%",
} as const

function HeaderCell({
  children,
  width,
  isLastColumn = false,
}: {
  children: string
  width: string
  isLastColumn?: boolean
}) {
  return (
    <View
      style={[
        classListStyles.headerCell,
        { width },
        ...(isLastColumn ? [classListStyles.lastCell] : []),
      ]}
    >
      <Text style={classListStyles.headerText}>{children}</Text>
    </View>
  )
}

function BodyCell({
  children,
  width,
  isLastColumn = false,
}: {
  children: React.ReactElement
  width: string
  isLastColumn?: boolean
}) {
  return (
    <View
      style={[
        classListStyles.cell,
        { width },
        ...(isLastColumn ? [classListStyles.lastCell] : []),
      ]}
    >
      {children}
    </View>
  )
}

function ClassListTable({ rows }: { rows: ClassListReportStudentRow[] }) {
  return (
    <View style={classListStyles.table}>
      <View style={classListStyles.headerRow} wrap={false}>
        <HeaderCell width={columnWidths.student}>Student</HeaderCell>
        <HeaderCell width={columnWidths.email}>Email Address</HeaderCell>
        <HeaderCell width={columnWidths.status}>Status</HeaderCell>
        <HeaderCell width={columnWidths.enrolledAt} isLastColumn={true}>
          Enrolled At
        </HeaderCell>
      </View>

      {rows.map((student, index) => (
        <View
          key={`${student.email}-${index}`}
          style={[
            classListStyles.row,
            ...(index % 2 === 1 ? [classListStyles.rowAlternate] : []),
            ...(!student.isActive ? [classListStyles.inactiveRow] : []),
            ...(index === rows.length - 1 ? [classListStyles.rowLast] : []),
          ]}
          wrap={false}
        >
          <BodyCell width={columnWidths.student}>
            <Text
              style={[
                classListStyles.studentNameText,
                ...(!student.isActive
                  ? [classListStyles.inactiveStudentNameText]
                  : []),
              ]}
            >
              {student.studentName}
            </Text>
          </BodyCell>
          <BodyCell width={columnWidths.email}>
            <Text style={classListStyles.cellText}>{student.email}</Text>
          </BodyCell>
          <BodyCell width={columnWidths.status}>
            <Text
              style={[
                classListStyles.statusText,
                ...(student.isActive
                  ? [classListStyles.activeStatusText]
                  : [classListStyles.inactiveStatusText]),
              ]}
            >
              {student.statusLabel}
            </Text>
          </BodyCell>
          <BodyCell width={columnWidths.enrolledAt} isLastColumn={true}>
            <Text style={classListStyles.cellText}>{student.enrolledAt}</Text>
          </BodyCell>
        </View>
      ))}
    </View>
  )
}

export function ClassListReportDocument({
  data,
}: {
  data: ClassListReportData
}) {
  return (
    <Document title={data.title}>
      <Page size="A4" style={pdfStyles.page}>
        <ReportHeader
          title={data.title}
          subtitle="Teacher roster export for class list documentation."
        />

        <View style={pdfStyles.section}>
          <SectionTitle title="Class Details" />
          <MetadataGrid entries={data.reportMetadata} />
        </View>

        <View style={pdfStyles.section}>
          <SectionTitle title="Roster Summary" />
          <MetricRow metrics={data.summaryMetrics} />
        </View>

        <View style={pdfStyles.section}>
          <SectionTitle title="Students" />
          <ClassListTable rows={data.studentRows} />
        </View>

        <DocumentFooter />
      </Page>
    </Document>
  )
}
