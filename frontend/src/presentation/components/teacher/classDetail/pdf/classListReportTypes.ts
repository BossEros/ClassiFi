import type { EnrolledStudent } from "@/data/api/class.types"
import type {
  ReportMetadataEntry,
  SummaryMetric,
} from "@/presentation/components/shared/pdf/pdfReportTypes"

export interface ClassListReportStudentRow {
  studentName: string
  email: string
  statusLabel: "Active" | "Inactive"
  isActive: boolean
  enrolledAt: string
}

export interface ClassListReportData {
  title: string
  reportMetadata: ReportMetadataEntry[]
  summaryMetrics: SummaryMetric[]
  studentRows: ClassListReportStudentRow[]
}

export interface ClassListReportBuilderOptions {
  students: EnrolledStudent[]
  className?: string
  classCode?: string
  teacherName?: string
  rosterScopeLabel: string
  downloadedAt?: Date
}
