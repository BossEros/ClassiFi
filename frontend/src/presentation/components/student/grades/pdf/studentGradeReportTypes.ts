import type { ReactElement } from "react"
import type { DocumentProps } from "@react-pdf/renderer"
import type { StudentClassGrades } from "@/shared/types/gradebook"

// ─── Value Object Types ────────────────────────────────────────────────────────

export interface ReportMetadataEntry {
  label: string
  value: string
}

export interface SummaryMetric {
  label: string
  value: string
}

export interface StudentGradeReportRow {
  assignmentName: string
  totalScore: number
  grade: string
  percentage: string
  status: "graded" | "pending" | "not-submitted"
  deadline: string
  submittedAt: string
  isLate: boolean
  penaltyApplied: number
  feedback: string | null
  isOverridden: boolean
}

// ─── Report Data Shape ─────────────────────────────────────────────────────────

export interface StudentGradeReportData {
  title: string
  reportMetadata: ReportMetadataEntry[]
  summaryMetrics: SummaryMetric[]
  assignmentRows: StudentGradeReportRow[]
}

// ─── Builder Options ───────────────────────────────────────────────────────────

export interface StudentGradeReportBuilderOptions {
  classGrades: StudentClassGrades
  studentName?: string
  downloadedAt?: Date
}

// ─── Download Options ──────────────────────────────────────────────────────────

export interface StudentGradeReportDocumentDownloadOptions {
  document: ReactElement<DocumentProps>
  fileName: string
}
