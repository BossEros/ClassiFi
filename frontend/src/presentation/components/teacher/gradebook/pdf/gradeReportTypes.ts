import type { ClassGradebook } from "@/data/api/gradebook.types"
import type { ReportMetadataEntry, SummaryMetric } from "@/presentation/components/shared/pdf/pdfReportTypes"

export type {
  PdfDocumentDownloadOptions,
  ReportMetadataEntry,
  SummaryMetric,
} from "@/presentation/components/shared/pdf/pdfReportTypes"

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

export interface GradeReportData {
  title: string
  reportMetadata: ReportMetadataEntry[]
  summaryMetrics: SummaryMetric[]
  assignmentNames: string[]
  studentRows: GradeReportStudentRow[]
}

export interface GradeReportBuilderOptions {
  gradebook: ClassGradebook
  className?: string
  classCode?: string
  teacherName?: string
  downloadedAt?: Date
}
