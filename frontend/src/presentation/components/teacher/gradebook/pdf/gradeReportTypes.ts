import type { ReactElement } from "react"
import type { DocumentProps } from "@react-pdf/renderer"
import type { ClassGradebook } from "@/shared/types/gradebook"

// ─── Value Object Types ────────────────────────────────────────────────────────

export interface ReportMetadataEntry {
  label: string
  value: string
}

export interface SummaryMetric {
  label: string
  value: string
}

export interface GradeReportStudentRow {
  studentName: string
  grades: GradeReportGradeCell[]
  average: string
}

export interface GradeReportGradeCell {
  assignmentName: string
  score: string
  percentage: number
  totalScore: number
}

// ─── Report Data Shape ─────────────────────────────────────────────────────────

export interface GradeReportData {
  title: string
  reportMetadata: ReportMetadataEntry[]
  summaryMetrics: SummaryMetric[]
  assignmentNames: string[]
  studentRows: GradeReportStudentRow[]
}

// ─── Builder Options ───────────────────────────────────────────────────────────

export interface GradeReportBuilderOptions {
  gradebook: ClassGradebook
  className?: string
  classCode?: string
  teacherName?: string
  downloadedAt?: Date
}

// ─── Download Options ──────────────────────────────────────────────────────────

export interface GradeReportDocumentDownloadOptions {
  document: ReactElement<DocumentProps>
  fileName: string
}
