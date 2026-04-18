import React, { useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowRight, ArrowUp, CircleHelp } from "lucide-react"
import type { PairResponse } from "@/business/services/plagiarismService"
import type { ScoringWeights } from "@/data/api/plagiarism.types"
import { SimilarityBadge } from "./SimilarityBadge"
import { Select } from "@/presentation/components/ui/Select"
import { TablePaginationFooter } from "@/presentation/components/ui/TablePaginationFooter"
import {
  getPairOverallSimilarityRatio,
  getThresholdQualifiedPairs,
  normalizeSimilarityToRatio,
} from "@/presentation/utils/plagiarismClusterUtils"
import { SIMILARITY_GRAPH_DEFAULT_THRESHOLD_PERCENT } from "@/presentation/utils/plagiarismGraphUtils"
import {
  getNormalizedLongestRatio,
  getNormalizedOverlapRatio,
  getSignalLevel,
  type SimilaritySignalLevel,
} from "@/presentation/utils/plagiarismSignalUtils"

type SortKey =
  | "similarity"
  | "structuralSimilarity"
  | "semanticSimilarity"
  | "overlap"
  | "longest"
type SortOrder = "asc" | "desc"

interface PairwiseTriageTableProps {
  /** Pairwise similarity results for the assignment. */
  pairs: PairResponse[]
  /** Triggered when a row or compare action is selected. */
  onPairSelect: (pair: PairResponse) => void
  /** Optional callback triggered when minimum similarity threshold changes. */
  onMinimumSimilarityPercentChange?: (minimumSimilarityPercent: number) => void
  /** Optional externally controlled minimum similarity threshold. */
  minimumSimilarityPercent?: number
  /** Controls whether the local threshold dropdown is shown. */
  showThresholdControl?: boolean
  /** Optional loading state while pair data is fetched. */
  isLoading?: boolean
  /** Optional selected pair id for row highlighting. */
  selectedPairId?: number | null
  /** Optional scoring weights from the backend to display dynamic weight labels. */
  scoringWeights?: ScoringWeights
  /** Optional active graph filter summary shown above the table. */
  filterSummary?: string | null
  /** Optional callback that resets the active graph filter. */
  onClearFilter?: () => void
}

const similarityThresholdOptions = [
  { value: "0", label: "All similarities" },
  { value: "70", label: "70% and above" },
  { value: "75", label: "75% and above" },
  { value: "85", label: "85% and above" },
  { value: "90", label: "90% and above" },
  { value: "95", label: "95% and above" },
]

const SortIndicator: React.FC<{
  column: SortKey
  currentSort: SortKey
  sortOrder: SortOrder
}> = ({ column, currentSort, sortOrder }) => {
  if (currentSort !== column) return null

  return sortOrder === "desc" ? (
    <ArrowDown className="inline h-4 w-4 text-teal-600" aria-hidden="true" />
  ) : (
    <ArrowUp className="inline h-4 w-4 text-teal-600" aria-hidden="true" />
  )
}

function getPairStudentNames(pair: PairResponse): {
  left: string
  right: string
} {
  return {
    left: pair.leftFile.studentName?.trim() || "Unknown Student",
    right: pair.rightFile.studentName?.trim() || "Unknown Student",
  }
}


function getPairStructuralSimilarityRatio(pair: PairResponse): number {
  return normalizeSimilarityToRatio(pair.structuralScore)
}

function getPairSemanticSimilarityRatio(pair: PairResponse): number {
  return normalizeSimilarityToRatio(pair.semanticScore)
}

function formatSimilarityPercentLabel(similarityRatio: number): string {
  return `${(similarityRatio * 100).toFixed(0)}%`
}

function getSignalLabel(level: SimilaritySignalLevel): string {
  switch (level) {
    case "high":
      return "High"
    case "medium":
      return "Medium"
    default:
      return "Low"
  }
}

function getSignalBadgeClassName(level: SimilaritySignalLevel): string {
  switch (level) {
    case "high":
      return "border border-rose-200 bg-rose-50 text-rose-700"
    case "medium":
      return "border border-amber-200 bg-amber-50 text-amber-700"
    default:
      return "border border-emerald-200 bg-emerald-50 text-emerald-700"
  }
}

function formatWeightPercent(weight: number): string {
  return `${Math.round(weight * 100)}%`
}

function getOverallSimilarityTooltipText(scoringWeights?: ScoringWeights): string {
  const structuralLabel = scoringWeights ? formatWeightPercent(scoringWeights.structuralWeight) : "70%"
  const semanticLabel = scoringWeights ? formatWeightPercent(scoringWeights.semanticWeight) : "30%"

  return `Overall Similarity = ${structuralLabel} Structural + ${semanticLabel} Semantic. This hybrid score combines both analyses to produce a single confidence metric.`
}

function getStructuralSimilarityTooltipText(): string {
  return "Structural Similarity measures how closely two code files share the same code structure using k-gram fingerprinting (Winnowing algorithm). It detects copied patterns, renamed variables, and reordered statements."
}

function getSemanticSimilarityTooltipText(): string {
  return "Semantic Similarity uses AI (GraphCodeBERT) to detect meaning-level similarity. It catches code that solves problems the same way even if written with different syntax or structure."
}

function getTotalOverlapTooltipText(): string {
  return "Total Overlap shows the raw overlap value stored for the pair, alongside a normalized signal level that makes short and long submissions easier to compare fairly."
}

function getLongestFragmentTooltipText(): string {
  return "Longest Fragment shows the raw longest matched fragment for the pair, alongside a normalized signal level that highlights unusually large uninterrupted matches."
}

function getSignalBadgeTooltip(
  metricName: string,
  level: SimilaritySignalLevel,
): string {
  return `${metricName}: ${getSignalLabel(level)}. This level is computed behind the scenes using length-aware normalization so short and long submissions are compared more fairly.`
}

interface QualitativeSignalBadgeProps {
  level: SimilaritySignalLevel
  tooltipText: string
}

function QualitativeSignalBadge({
  level,
  tooltipText,
}: QualitativeSignalBadgeProps) {
  return (
    <span
      title={tooltipText}
      className={`inline-flex min-w-20 items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${getSignalBadgeClassName(level)}`}
    >
      {getSignalLabel(level)}
    </span>
  )
}

/**
 * Teacher-first pairwise triage table.
 * Supports fast filtering and ranking before opening code comparison details.
 */
export function PairwiseTriageTable({
  pairs,
  onPairSelect,
  onMinimumSimilarityPercentChange,
  minimumSimilarityPercent,
  showThresholdControl = true,
  isLoading = false,
  selectedPairId,
  scoringWeights,
  filterSummary,
  onClearFilter,
}: PairwiseTriageTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("similarity")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [internalMinimumSimilarityPercent, setInternalMinimumSimilarityPercent] =
    useState(SIMILARITY_GRAPH_DEFAULT_THRESHOLD_PERCENT)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const isControlledThreshold = typeof minimumSimilarityPercent === "number"
  const effectiveMinimumSimilarityPercent =
    minimumSimilarityPercent ?? internalMinimumSimilarityPercent

  const thresholdQualifiedPairs = useMemo(
    () => getThresholdQualifiedPairs(pairs, effectiveMinimumSimilarityPercent),
    [effectiveMinimumSimilarityPercent, pairs],
  )

  const filteredAndSortedPairs = useMemo(() => {
    return [...thresholdQualifiedPairs].sort((leftPair, rightPair) => {
      let comparisonValue = 0

      switch (sortKey) {
        case "similarity":
          comparisonValue =
            getPairOverallSimilarityRatio(leftPair) -
            getPairOverallSimilarityRatio(rightPair)
          break
        case "structuralSimilarity":
          comparisonValue =
            getPairStructuralSimilarityRatio(leftPair) -
            getPairStructuralSimilarityRatio(rightPair)
          break
        case "semanticSimilarity":
          comparisonValue =
            getPairSemanticSimilarityRatio(leftPair) -
            getPairSemanticSimilarityRatio(rightPair)
          break
        case "overlap":
          comparisonValue =
            getNormalizedOverlapRatio(leftPair) -
            getNormalizedOverlapRatio(rightPair)
          break
        case "longest":
          comparisonValue =
            getNormalizedLongestRatio(leftPair) -
            getNormalizedLongestRatio(rightPair)
          break
      }

      return sortOrder === "desc" ? -comparisonValue : comparisonValue
    })
  }, [sortKey, sortOrder, thresholdQualifiedPairs])

  useEffect(() => {
    if (!onMinimumSimilarityPercentChange || isControlledThreshold) {
      return
    }

    onMinimumSimilarityPercentChange(effectiveMinimumSimilarityPercent)
  }, [effectiveMinimumSimilarityPercent, isControlledThreshold, onMinimumSimilarityPercentChange])

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedPairs.length / itemsPerPage),
  )

  const effectiveCurrentPage = Math.min(currentPage, totalPages)

  const paginatedPairs = useMemo(() => {
    const startIndex = (effectiveCurrentPage - 1) * itemsPerPage
    return filteredAndSortedPairs.slice(startIndex, startIndex + itemsPerPage)
  }, [effectiveCurrentPage, filteredAndSortedPairs])

  const handleSort = (selectedSortKey: SortKey) => {
    if (sortKey === selectedSortKey) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
      return
    }

    setSortKey(selectedSortKey)
    setSortOrder("desc")
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="mb-1 text-xl font-semibold text-slate-900">
            Pairwise Comparison
          </h2>
          <p className="text-sm text-slate-500">
            {showThresholdControl
              ? "Review high-similarity student pairs and open code comparison details."
              : `Review high-similarity student pairs using the shared ${effectiveMinimumSimilarityPercent}% graph threshold.`}
          </p>
          {filterSummary ? (
            <div className="mt-3 inline-flex flex-wrap items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm text-teal-800">
              <span>{filterSummary}</span>
              {onClearFilter ? (
                <button
                  type="button"
                  onClick={onClearFilter}
                  className="font-semibold text-teal-700 underline-offset-2 transition-colors hover:text-teal-900 hover:underline"
                >
                  Show all pairs
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {showThresholdControl && (
          <div className="w-full sm:w-52 xl:w-52">
            <Select
              aria-label="Minimum similarity threshold"
              options={similarityThresholdOptions}
              value={String(effectiveMinimumSimilarityPercent)}
              variant="light"
              onChange={(selectedValue) => {
                setInternalMinimumSimilarityPercent(Number(selectedValue))
                setCurrentPage(1)
              }}
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-500">Loading pairs...</div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-2xl border border-slate-300 bg-white shadow-md shadow-slate-200/80">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-200/85">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                    Student Pair
                  </th>
                  <th
                    onClick={() => handleSort("similarity")}
                    className="cursor-pointer select-none px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 transition-colors hover:text-slate-900"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>Overall Similarity</span>
                      <span
                        title={getOverallSimilarityTooltipText(scoringWeights)}
                        aria-label={getOverallSimilarityTooltipText(scoringWeights)}
                        className="text-slate-500"
                      >
                        <CircleHelp className="h-3.5 w-3.5" />
                      </span>
                      <SortIndicator
                        column="similarity"
                        currentSort={sortKey}
                        sortOrder={sortOrder}
                      />
                    </span>
                  </th>
                  <th
                    onClick={() => handleSort("structuralSimilarity")}
                    className="cursor-pointer select-none px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 transition-colors hover:text-slate-900"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>Structural Similarity</span>
                      <span
                        title={getStructuralSimilarityTooltipText()}
                        aria-label={getStructuralSimilarityTooltipText()}
                        className="text-slate-500"
                      >
                        <CircleHelp className="h-3.5 w-3.5" />
                      </span>
                      <SortIndicator
                        column="structuralSimilarity"
                        currentSort={sortKey}
                        sortOrder={sortOrder}
                      />
                    </span>
                  </th>
                  <th
                    onClick={() => handleSort("semanticSimilarity")}
                    className="cursor-pointer select-none px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 transition-colors hover:text-slate-900"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>Semantic Similarity</span>
                      <span
                        title={getSemanticSimilarityTooltipText()}
                        aria-label={getSemanticSimilarityTooltipText()}
                        className="text-slate-500"
                      >
                        <CircleHelp className="h-3.5 w-3.5" />
                      </span>
                      <SortIndicator
                        column="semanticSimilarity"
                        currentSort={sortKey}
                        sortOrder={sortOrder}
                      />
                    </span>
                  </th>
                  <th
                    onClick={() => handleSort("overlap")}
                    className="cursor-pointer select-none px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 transition-colors hover:text-slate-900"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>Total Overlap</span>
                      <span
                        title={getTotalOverlapTooltipText()}
                        aria-label={getTotalOverlapTooltipText()}
                        className="text-slate-500"
                      >
                        <CircleHelp className="h-3.5 w-3.5" />
                      </span>
                      <SortIndicator
                        column="overlap"
                        currentSort={sortKey}
                        sortOrder={sortOrder}
                      />
                    </span>
                  </th>
                  <th
                    onClick={() => handleSort("longest")}
                    className="cursor-pointer select-none px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 transition-colors hover:text-slate-900"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>Longest Fragment</span>
                      <span
                        title={getLongestFragmentTooltipText()}
                        aria-label={getLongestFragmentTooltipText()}
                        className="text-slate-500"
                      >
                        <CircleHelp className="h-3.5 w-3.5" />
                      </span>
                      <SortIndicator
                        column="longest"
                        currentSort={sortKey}
                        sortOrder={sortOrder}
                      />
                    </span>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedPairs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      No pairs match the current filters.
                    </td>
                  </tr>
                ) : (
                  paginatedPairs.map((pair) => {
                    const pairStudentNames = getPairStudentNames(pair)
                    const overallSimilarity = getPairOverallSimilarityRatio(pair)
                    const structuralSimilarity =
                      getPairStructuralSimilarityRatio(pair)
                    const semanticSimilarity =
                      getPairSemanticSimilarityRatio(pair)
                    const isSelectedPair = pair.id === selectedPairId
                    const overlapSignalLevel = getSignalLevel(
                      getNormalizedOverlapRatio(pair),
                    )
                    const longestSignalLevel = getSignalLevel(
                      getNormalizedLongestRatio(pair),
                    )

                    return (
                      <tr
                        key={pair.id}
                        className={`cursor-pointer border-b border-slate-100 transition-colors duration-200 ${
                          isSelectedPair
                            ? "bg-teal-50 ring-inset"
                            : "hover:bg-slate-50/80"
                        }`}
                        onClick={() => onPairSelect(pair)}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900">
                            {pairStudentNames.left} vs {pairStudentNames.right}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <SimilarityBadge
                              similarity={overallSimilarity}
                              size="small"
                              showLabel={false}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs text-slate-600">
                            {formatSimilarityPercentLabel(
                              structuralSimilarity,
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs text-slate-600">
                            {formatSimilarityPercentLabel(semanticSimilarity)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-600">
                          <QualitativeSignalBadge
                            level={overlapSignalLevel}
                            tooltipText={getSignalBadgeTooltip(
                              "Total Overlap",
                              overlapSignalLevel,
                            )}
                          />
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-600">
                          <QualitativeSignalBadge
                            level={longestSignalLevel}
                            tooltipText={getSignalBadgeTooltip(
                              "Longest Fragment",
                              longestSignalLevel,
                            )}
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={(event) => {
                              event.stopPropagation()
                              onPairSelect(pair)
                            }}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-indigo-700 active:bg-indigo-800"
                          >
                            Compare
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <TablePaginationFooter
            currentPage={effectiveCurrentPage}
            totalPages={totalPages}
            totalItems={filteredAndSortedPairs.length}
            itemsPerPage={itemsPerPage}
            variant="light"
            onPageChange={(nextPage) =>
              setCurrentPage(Math.min(nextPage, totalPages))
            }
          />
        </div>
      )}
    </div>
  )
}

export default PairwiseTriageTable

