import type { AssignmentDetail } from "@/business/models/assignment/types"
import type {
  AnalyzeResponse,
  PairResponse,
} from "@/business/services/plagiarismService"
import type { User } from "@/shared/types/auth"

import {
  buildSimilarityGraphData,
  layoutSimilarityGraph,
  type SimilarityGraphLayout,
} from "@/presentation/utils/plagiarismGraphUtils"
import { getPairOverallSimilarityRatio } from "@/presentation/utils/plagiarismClusterUtils"
import {
  getNormalizedLongestRatio,
  getNormalizedOverlapRatio,
} from "@/presentation/utils/plagiarismSignalUtils"
import type {
  ClassSimilarityReportBuilderOptions,
  ClassSimilarityReportData,
  PairSimilarityReportBuilderOptions,
  PairSimilarityReportData,
  ReportMetadataEntry,
} from "./pdfTypes"
import {
  buildQualitativeSignalValue,
  buildSimilarityBadgeValue,
  buildTeacherDisplayName,
  formatCodeRange,
  formatDateTimeValue,
  formatPercent,
  getPairLabel,
  getThresholdFilteredPairs,
} from "./pdfUtils"

// ─── Shared Metadata Builder ───────────────────────────────────────────────────

export function buildSharedReportMetadata({
  assignment,
  teacher,
  results,
  downloadedAt,
  minimumSimilarityPercent,
  includeThreshold,
}: {
  assignment: AssignmentDetail | null
  teacher: User | null
  results: AnalyzeResponse
  downloadedAt: Date
  minimumSimilarityPercent: number
  includeThreshold: boolean
}): ReportMetadataEntry[] {
  const metadata: ReportMetadataEntry[] = [
    { label: "Teacher", value: buildTeacherDisplayName(teacher) },
    { label: "Class", value: assignment?.className || "Unknown Class" },
    {
      label: "Assignment",
      value: assignment?.assignmentName || "Unknown Assignment",
    },
    { label: "Report ID", value: results.reportId },
    {
      label: "Report Generated",
      value: formatDateTimeValue(downloadedAt.toISOString()),
    },
  ]

  if (includeThreshold) {
    metadata.push({
      label: "Similarity Threshold",
      value: `${minimumSimilarityPercent}% and above`,
    })
  }

  return metadata
}

// ─── Graph Layout Builder ──────────────────────────────────────────────────────

export function buildClassReportGraphLayout(
  results: AnalyzeResponse,
  minimumSimilarityPercent: number,
  showSingletons: boolean,
): SimilarityGraphLayout | null {
  const graphData = buildSimilarityGraphData(
    results.submissions,
    results.pairs,
    minimumSimilarityPercent,
  )
  const graphLayout = layoutSimilarityGraph(graphData, {
    width: 490,
    height: 260,
    showSingletons,
  })

  const hasVisibleNodes = graphLayout.nodes.some((node) => node.isVisible)

  if (!hasVisibleNodes) {
    return null
  }

  return graphLayout
}

// ─── Class Report Builder ──────────────────────────────────────────────────────

/**
 * Builds the evidence-focused class report payload used by the PDF document.
 *
 * @param options - Assignment, teacher, report, and threshold context.
 * @returns Threshold-aware class report data ready for rendering.
 */
export function buildClassSimilarityReportData(
  options: ClassSimilarityReportBuilderOptions,
): ClassSimilarityReportData {
  const downloadedAt = options.downloadedAt ?? new Date()
  const filteredPairs = getThresholdFilteredPairs(
    options.results.pairs,
    options.minimumSimilarityPercent,
  )
  const graphLayout = buildClassReportGraphLayout(
    options.results,
    options.minimumSimilarityPercent,
    options.showSingletons,
  )

  return {
    title: "Class Similarity Analysis Report",
    reportMetadata: buildSharedReportMetadata({
      assignment: options.assignment,
      teacher: options.teacher,
      results: options.results,
      downloadedAt,
      minimumSimilarityPercent: options.minimumSimilarityPercent,
      includeThreshold: true,
    }),
    summaryMetrics: [
      {
        label: "Submissions",
        value: String(options.results.submissions.length),
      },
      { label: "Suspicious Pairs", value: String(filteredPairs.length) },
      {
        label: "Average Similarity",
        value: formatPercent(options.results.summary.averageSimilarity),
      },
      {
        label: "Max Similarity",
        value: formatPercent(options.results.summary.maxSimilarity),
      },
    ],
    minimumSimilarityPercent: options.minimumSimilarityPercent,
    filteredPairRows: filteredPairs.map((pair: PairResponse) => ({
      pairLabel: getPairLabel(pair),
      overallSimilarity: buildSimilarityBadgeValue(
        getPairOverallSimilarityRatio(pair),
      ),
      structuralSimilarity: buildSimilarityBadgeValue(pair.structuralScore),
      semanticSimilarity: buildSimilarityBadgeValue(pair.semanticScore),
      overlapSignal: buildQualitativeSignalValue(
        getNormalizedOverlapRatio(pair),
      ),
      longestFragmentSignal: buildQualitativeSignalValue(
        getNormalizedLongestRatio(pair),
      ),
    })),
    graphLayout,
    emptyStateMessage:
      "No pairs met the active threshold when this report was generated.",
  }
}

// ─── Pair Report Builder ───────────────────────────────────────────────────────

/**
 * Builds the evidence-focused pairwise report payload used by the PDF document.
 *
 * @param options - Assignment, teacher, report, selected pair, and fetched code details.
 * @returns Pair report data ready for rendering.
 */
export function buildPairSimilarityReportData(
  options: PairSimilarityReportBuilderOptions,
): PairSimilarityReportData {
  const downloadedAt = options.downloadedAt ?? new Date()

  return {
    title: "Pairwise Similarity Evidence Report",
    reportMetadata: [
      ...buildSharedReportMetadata({
        assignment: options.assignment,
        teacher: options.teacher,
        results: options.results,
        downloadedAt,
        minimumSimilarityPercent: options.minimumSimilarityPercent,
        includeThreshold: false,
      }),
      {
        label: "Left Submission",
        value: `${options.selectedPair.leftFile.studentName || "Unknown Student"} — ${options.pairDetails.leftFile.filename}`,
      },
      {
        label: "Right Submission",
        value: `${options.selectedPair.rightFile.studentName || "Unknown Student"} — ${options.pairDetails.rightFile.filename}`,
      },
    ],
    summaryMetrics: [
      {
        label: "Overall Similarity",
        value: formatPercent(
          getPairOverallSimilarityRatio(options.selectedPair),
        ),
      },
      {
        label: "Structural Similarity",
        value: formatPercent(options.selectedPair.structuralScore),
      },
      {
        label: "Semantic Similarity",
        value: formatPercent(options.selectedPair.semanticScore),
      },
      { label: "Total Overlap", value: String(options.selectedPair.overlap) },
      {
        label: "Longest Fragment",
        value: String(options.selectedPair.longest),
      },
      {
        label: "Matched Fragments",
        value: String(options.pairDetails.fragments.length),
      },
    ],
    fragmentRows: options.pairDetails.fragments.map((fragment, index) => ({
      fragmentLabel: `Fragment ${index + 1}`,
      leftRange: formatCodeRange(
        fragment.leftSelection.startRow,
        fragment.leftSelection.endRow,
      ),
      rightRange: formatCodeRange(
        fragment.rightSelection.startRow,
        fragment.rightSelection.endRow,
      ),
      length: String(fragment.length),
    })),
    emptyStateMessage: "No matched fragments were returned for this pair.",
    leftFileName: options.pairDetails.leftFile.filename,
    rightFileName: options.pairDetails.rightFile.filename,
    leftStudentName:
      options.selectedPair.leftFile.studentName || "Unknown Student",
    rightStudentName:
      options.selectedPair.rightFile.studentName || "Unknown Student",
    leftCode: options.pairDetails.leftFile.content,
    rightCode: options.pairDetails.rightFile.content,
    leftFragmentRanges: options.pairDetails.fragments.map((f) => ({
      start: f.leftSelection.startRow,
      end: f.leftSelection.endRow,
    })),
    rightFragmentRanges: options.pairDetails.fragments.map((f) => ({
      start: f.rightSelection.startRow,
      end: f.rightSelection.endRow,
    })),
  }
}
