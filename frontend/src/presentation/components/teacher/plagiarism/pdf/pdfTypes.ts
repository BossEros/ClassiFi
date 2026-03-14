import type { DocumentProps } from "@react-pdf/renderer"
import type { ReactElement } from "react"
import type { AssignmentDetail } from "@/business/models/assignment/types"
import type {
  AnalyzeResponse,
  PairResponse,
} from "@/business/services/plagiarismService"
import type { User } from "@/shared/types/auth"
import type { FilePair, MatchFragment } from "../types"
import type { SimilarityGraphLayout } from "@/presentation/utils/plagiarismGraphUtils"
import type {
  SimilarityBadgeSeverity,
  SimilaritySignalLevel,
} from "@/presentation/utils/plagiarismSignalUtils"

// ─── Value Object Types ────────────────────────────────────────────────────────

export interface ReportMetadataEntry {
  label: string
  value: string
}

export interface SummaryMetric {
  label: string
  value: string
}

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
  leftRange: string
  rightRange: string
  length: string
}

// ─── Report Data Shapes ────────────────────────────────────────────────────────

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

// ─── Builder Options ───────────────────────────────────────────────────────────

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

// ─── Download Options ──────────────────────────────────────────────────────────

export interface SimilarityReportDocumentDownloadOptions {
  document: ReactElement<DocumentProps>
  fileName: string
}

// ─── Diff Types ────────────────────────────────────────────────────────────────

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

// ─── Code View Props ───────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

export const CLASS_REPORT_TABLE_HEADERS = [
  "Student Pair",
  "Overall Similarity",
  "Structural Similarity",
  "Semantic Similarity",
  "Total Overlap",
  "Longest Fragment",
] as const
