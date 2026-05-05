import type { AssignmentDetail } from "@/data/api/assignment.types"
import type {
  CrossClassAnalysisResponse,
  CrossClassResultDTO,
} from "@/data/api/crossClassPlagiarism.types"
import type {
  AnalyzeResponse,
  PairResponse,
} from "@/business/services/plagiarismService"
import type {
  PdfDocumentDownloadOptions,
  ReportMetadataEntry,
  SummaryMetric,
} from "@/presentation/components/shared/pdf/pdfReportTypes"
import type { SimilarityGraphLayout } from "@/presentation/utils/plagiarismGraphUtils"
import type {
  SimilarityBadgeSeverity,
  SimilaritySignalLevel,
} from "@/presentation/utils/plagiarismSignalUtils"
import type { User } from "@/data/api/auth.types"
import type { FilePair, MatchFragment } from "../types"

export type {
  PdfDocumentDownloadOptions,
  ReportMetadataEntry,
  SummaryMetric,
} from "@/presentation/components/shared/pdf/pdfReportTypes"

export interface SimilarityBadgeValue {
  label: string
  severity: SimilarityBadgeSeverity
}

export interface QualitativeSignalBadgeValue {
  label: string
  level: SimilaritySignalLevel
}

export interface ClassReportPairRow {
  pairLabel: string
  overallSimilarity: SimilarityBadgeValue
  structuralSimilarity: SimilarityBadgeValue
  semanticSimilarity: SimilarityBadgeValue
  overlapSignal: QualitativeSignalBadgeValue
  longestFragmentSignal: QualitativeSignalBadgeValue
}

export interface FragmentEvidenceRow {
  fragmentLabel: string
  explanationLabel: string
  leftRange: string
  rightRange: string
  length: string
}

export interface ClassSimilarityReportData {
  title: string
  reportMetadata: ReportMetadataEntry[]
  summaryMetrics: SummaryMetric[]
  minimumSimilarityPercent: number
  filteredPairRows: ClassReportPairRow[]
  graphLayout: SimilarityGraphLayout | null
  emptyStateMessage: string
}

export interface PairSimilarityReportData {
  title: string
  reportMetadata: ReportMetadataEntry[]
  summaryMetrics: SummaryMetric[]
  fragmentRows: FragmentEvidenceRow[]
  emptyStateMessage: string
  leftFileName: string
  rightFileName: string
  leftStudentName: string
  rightStudentName: string
  leftCode: string
  rightCode: string
  leftFragmentRanges: { start: number; end: number }[]
  rightFragmentRanges: { start: number; end: number }[]
  fragments: MatchFragment[]
}

export interface ClassSimilarityReportBuilderOptions {
  assignment: AssignmentDetail | null
  teacher: User | null
  results: AnalyzeResponse
  minimumSimilarityPercent: number
  showSingletons: boolean
  downloadedAt?: Date
}

export interface PairSimilarityReportBuilderOptions {
  assignment: AssignmentDetail | null
  teacher: User | null
  results: AnalyzeResponse
  selectedPair: PairResponse
  pairDetails: FilePair
  minimumSimilarityPercent: number
  downloadedAt?: Date
}

export type SimilarityReportDocumentDownloadOptions = PdfDocumentDownloadOptions

export type DiffLineKind = "unchanged" | "added" | "removed"

export interface DiffLine {
  kind: DiffLineKind
  text: string
  lineNumber?: number
}

export interface LineDiff {
  left: DiffLine[]
  right: DiffLine[]
}

export interface TextSegment {
  text: string
  isHighlighted: boolean
}

export interface SideBySideProps {
  leftStudentName: string
  leftFileName: string
  leftCode: string
  leftHighlightRanges?: { start: number; end: number }[]
  rightStudentName: string
  rightFileName: string
  rightCode: string
  rightHighlightRanges?: { start: number; end: number }[]
  fragments?: MatchFragment[]
}

export const CLASS_REPORT_TABLE_HEADERS = [
  "Student Pair",
  "Overall Similarity",
  "Structural Similarity",
  "Semantic Similarity",
  "Total Overlap",
  "Longest Fragment",
] as const

export interface CrossClassReportBuilderOptions {
  report: CrossClassAnalysisResponse
  teacher: User | null
  minimumSimilarityPercent: number
  downloadedAt?: Date
}

export interface CrossClassPairReportBuilderOptions {
  report: CrossClassAnalysisResponse
  teacher: User | null
  selectedResult: CrossClassResultDTO
  pairDetails: FilePair
  downloadedAt?: Date
}

export interface CrossClassReportPairRow {
  pairLabel: string
  class1Label: string
  class2Label: string
  overallSimilarity: SimilarityBadgeValue
  structuralSimilarity: SimilarityBadgeValue
  semanticSimilarity: SimilarityBadgeValue
}

