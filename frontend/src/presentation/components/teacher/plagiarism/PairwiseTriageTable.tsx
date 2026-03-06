import React, { useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, CircleHelp } from "lucide-react"
import type { PairResponse } from "@/business/services/plagiarismService"
import { SimilarityBadge } from "./SimilarityBadge"
import { Select } from "@/presentation/components/ui/Select"
import { TablePaginationFooter } from "@/presentation/components/ui/TablePaginationFooter"

type SortKey =
  | "similarity"
  | "structuralSimilarity"
  | "semanticSimilarity"
  | "overlap"
  | "longest"
type SortOrder = "asc" | "desc"
type SignalLevel = "low" | "medium" | "high"

interface PairwiseTriageTableProps {
  /** Pairwise similarity results for the assignment. */
  pairs: PairResponse[]
  /** Triggered when a row or compare action is selected. */
  onPairSelect: (pair: PairResponse) => void
  /** Optional callback triggered when filtered pair count changes. */
  onFilteredCountChange?: (count: number) => void
  /** Optional callback triggered when minimum similarity threshold changes. */
  onMinimumSimilarityPercentChange?: (minimumSimilarityPercent: number) => void
  /** Optional loading state while pair data is fetched. */
  isLoading?: boolean
  /** Optional selected pair id for row highlighting. */
  selectedPairId?: number | null
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

function normalizeSimilarityToRatio(similarity: number): number {
  if (!Number.isFinite(similarity) || similarity <= 0) {
    return 0
  }

  return similarity > 1 ? similarity / 100 : similarity
}

function getPairSimilarityRatio(pair: PairResponse): number {
  const hybridSimilarity = normalizeSimilarityToRatio(pair.hybridScore)
  if (hybridSimilarity > 0) {
    return hybridSimilarity
  }

  return normalizeSimilarityToRatio(pair.structuralScore)
}

function getPairStructuralSimilarityRatio(pair: PairResponse): number {
  return normalizeSimilarityToRatio(pair.structuralScore)
}

function getPairSemanticSimilarityRatio(pair: PairResponse): number {
  return normalizeSimilarityToRatio(pair.semanticScore)
}

function getSafeLineCount(lineCount: number): number {
  if (!Number.isFinite(lineCount) || lineCount <= 0) {
    return 1
  }

  return lineCount
}

function clampToUnitRange(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0
  }

  return Math.min(value, 1)
}

function getNormalizedOverlapRatio(pair: PairResponse): number {
  const leftLineCount = getSafeLineCount(pair.leftFile.lineCount)
  const rightLineCount = getSafeLineCount(pair.rightFile.lineCount)
  const combinedLength = leftLineCount + rightLineCount

  return clampToUnitRange(pair.overlap / combinedLength)
}

function getNormalizedLongestRatio(pair: PairResponse): number {
  const leftLineCount = getSafeLineCount(pair.leftFile.lineCount)
  const rightLineCount = getSafeLineCount(pair.rightFile.lineCount)
  const shorterSubmissionLength = Math.min(leftLineCount, rightLineCount)

  return clampToUnitRange(pair.longest / shorterSubmissionLength)
}

function getSignalLevel(value: number): SignalLevel {
  if (value >= 0.5) {
    return "high"
  }

  if (value >= 0.2) {
    return "medium"
  }

  return "low"
}

function getSignalLabel(level: SignalLevel): string {
  switch (level) {
    case "high":
      return "High"
    case "medium":
      return "Medium"
    default:
      return "Low"
  }
}

function getSignalBadgeClassName(level: SignalLevel): string {
  switch (level) {
    case "high":
      return "border border-rose-200 bg-rose-50 text-rose-700"
    case "medium":
      return "border border-amber-200 bg-amber-50 text-amber-700"
    default:
      return "border border-emerald-200 bg-emerald-50 text-emerald-700"
  }
}

function getTotalSharedChunksTooltipText(): string {
  return "Total Shared Chunks shows how much shared code appears across both submissions combined. Higher levels indicate more shared material overall."
}

function getLongestContinuousSharedBlockTooltipText(): string {
  return "Longest Continuous Shared Block shows the size of the largest uninterrupted shared section between two submissions. Higher levels indicate a longer direct copied block."
}

function getSignalBadgeTooltip(metricName: string, level: SignalLevel): string {
  return `${metricName}: ${getSignalLabel(level)}. This level is computed behind the scenes using length-aware normalization so short and long submissions are compared more fairly.`
}

interface QualitativeSignalBadgeProps {
  level: SignalLevel
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
  onFilteredCountChange,
  onMinimumSimilarityPercentChange,
  isLoading = false,
  selectedPairId,
}: PairwiseTriageTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("similarity")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [minimumSimilarityPercent, setMinimumSimilarityPercent] = useState(75)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredAndSortedPairs = useMemo(() => {
    const filteredPairs = pairs.filter((pair) => {
      const pairSimilarityPercent = getPairSimilarityRatio(pair) * 100
      return pairSimilarityPercent >= minimumSimilarityPercent
    })

    return [...filteredPairs].sort((leftPair, rightPair) => {
      let comparisonValue = 0

      switch (sortKey) {
        case "similarity":
          comparisonValue =
            getPairSimilarityRatio(leftPair) - getPairSimilarityRatio(rightPair)
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
  }, [pairs, minimumSimilarityPercent, sortKey, sortOrder])

  useEffect(() => {
    if (!onFilteredCountChange) {
      return
    }

    onFilteredCountChange(filteredAndSortedPairs.length)
  }, [filteredAndSortedPairs.length, onFilteredCountChange])

  useEffect(() => {
    if (!onMinimumSimilarityPercentChange) {
      return
    }

    onMinimumSimilarityPercentChange(minimumSimilarityPercent)
  }, [minimumSimilarityPercent, onMinimumSimilarityPercentChange])

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
            Review high-similarity student pairs and open code comparison
            details.
          </p>
        </div>

        <div className="w-full sm:w-52 xl:w-52">
          <Select
            aria-label="Minimum similarity threshold"
            options={similarityThresholdOptions}
            value={String(minimumSimilarityPercent)}
            variant="light"
            onChange={(selectedValue) => {
              setMinimumSimilarityPercent(Number(selectedValue))
              setCurrentPage(1)
            }}
          />
        </div>
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
                      <span>Total Shared Chunks</span>
                      <span
                        title={getTotalSharedChunksTooltipText()}
                        aria-label={getTotalSharedChunksTooltipText()}
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
                      <span>Longest Continuous Shared Block</span>
                      <span
                        title={getLongestContinuousSharedBlockTooltipText()}
                        aria-label={getLongestContinuousSharedBlockTooltipText()}
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
                    const overallSimilarity = getPairSimilarityRatio(pair)
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
                          <div className="flex justify-center">
                            <SimilarityBadge
                              similarity={structuralSimilarity}
                              size="small"
                              showLabel={false}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <SimilarityBadge
                              similarity={semanticSimilarity}
                              size="small"
                              showLabel={false}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-600">
                          <QualitativeSignalBadge
                            level={overlapSignalLevel}
                            tooltipText={getSignalBadgeTooltip(
                              "Total Shared Chunks",
                              overlapSignalLevel,
                            )}
                          />
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-600">
                          <QualitativeSignalBadge
                            level={longestSignalLevel}
                            tooltipText={getSignalBadgeTooltip(
                              "Longest Continuous Shared Block",
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
                            className="inline-flex items-center justify-center rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-sm transition-colors duration-200 hover:border-teal-300 hover:bg-teal-100 hover:text-teal-800"
                          >
                            Compare Code
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
