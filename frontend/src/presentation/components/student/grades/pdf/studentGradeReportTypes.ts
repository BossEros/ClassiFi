import type { StudentClassGrades } from "@/data/api/gradebook.types"
import type { ReportMetadataEntry, SummaryMetric } from "@/presentation/components/shared/pdf/pdfReportTypes"

export type {
  PdfDocumentDownloadOptions,
  ReportMetadataEntry,
  SummaryMetric,
} from "@/presentation/components/shared/pdf/pdfReportTypes"

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

export interface StudentGradeReportData {
  title: string
  reportMetadata: ReportMetadataEntry[]
  summaryMetrics: SummaryMetric[]
  assignmentRows: StudentGradeReportRow[]
}

export interface StudentGradeReportBuilderOptions {
  classGrades: StudentClassGrades
  studentName?: string
  downloadedAt?: Date
}

