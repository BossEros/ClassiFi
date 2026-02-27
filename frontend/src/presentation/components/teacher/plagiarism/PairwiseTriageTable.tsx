import React, { useEffect, useMemo, useState } from "react"
import { ArrowDown, ArrowUp, CircleHelp } from "lucide-react"
import type { PairResponse } from "@/business/services/plagiarismService"
import { SimilarityBadge } from "./SimilarityBadge"
import { Select } from "@/presentation/components/ui/Select"
import { TablePaginationFooter } from "@/presentation/components/ui/TablePaginationFooter"

type SortKey = "similarity" | "overlap" | "longest"
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
    <ArrowDown className="inline h-4 w-4 text-teal-400" aria-hidden="true" />
  ) : (
    <ArrowUp className="inline h-4 w-4 text-teal-400" aria-hidden="true" />
  )
}

function getPairStudentNames(pair: PairResponse): { left: string; right: string } {
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
      return "bg-red-500/20 text-red-300"
    case "medium":
      return "bg-amber-500/20 text-amber-300"
    default:
      return "bg-emerald-500/20 text-emerald-300"
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

function QualitativeSignalBadge({ level, tooltipText }: QualitativeSignalBadgeProps) {
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
        case "overlap":
          comparisonValue =
            getNormalizedOverlapRatio(leftPair) - getNormalizedOverlapRatio(rightPair)
          break
        case "longest":
          comparisonValue =
            getNormalizedLongestRatio(leftPair) - getNormalizedLongestRatio(rightPair)
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

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedPairs.length / itemsPerPage))

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
          <h2 className="text-xl font-bold text-white mb-1">Pairwise Comparison</h2>
          <p className="text-sm text-slate-400">
            Review high-similarity student pairs and open code comparison details.
          </p>
        </div>

        <div className="w-full sm:w-52 xl:w-52">
          <Select
            aria-label="Minimum similarity threshold"
            options={similarityThresholdOptions}
            value={String(minimumSimilarityPercent)}
            onChange={(selectedValue) => {
              setMinimumSimilarityPercent(Number(selectedValue))
              setCurrentPage(1)
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400">Loading pairs...</div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#2A2F3E] backdrop-blur-md">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Student Pair
                  </th>
                  <th
                    onClick={() => handleSort("similarity")}
                    className="px-6 py-4 text-center text-sm font-semibold text-slate-300 cursor-pointer hover:text-white transition-colors select-none"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>Similarity</span>
                      <SortIndicator
                        column="similarity"
                        currentSort={sortKey}
                        sortOrder={sortOrder}
                      />
                    </span>
                  </th>
                  <th
                    onClick={() => handleSort("overlap")}
                    className="px-6 py-4 text-center text-sm font-semibold text-slate-300 cursor-pointer hover:text-white transition-colors select-none"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>Total Shared Chunks</span>
                      <span
                        title={getTotalSharedChunksTooltipText()}
                        aria-label={getTotalSharedChunksTooltipText()}
                        className="text-slate-400"
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
                    className="px-6 py-4 text-center text-sm font-semibold text-slate-300 cursor-pointer hover:text-white transition-colors select-none"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>Longest Continuous Shared Block</span>
                      <span
                        title={getLongestContinuousSharedBlockTooltipText()}
                        aria-label={getLongestContinuousSharedBlockTooltipText()}
                        className="text-slate-400"
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
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedPairs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      No pairs match the current filters.
                    </td>
                  </tr>
                ) : (
                  paginatedPairs.map((pair) => {
                    const pairStudentNames = getPairStudentNames(pair)
                    const similarity = getPairSimilarityRatio(pair)
                    const isSelectedPair = pair.id === selectedPairId
                    const overlapSignalLevel = getSignalLevel(getNormalizedOverlapRatio(pair))
                    const longestSignalLevel = getSignalLevel(getNormalizedLongestRatio(pair))

                    return (
                      <tr
                        key={pair.id}
                        className={`border-b border-white/5 transition-all duration-200 cursor-pointer ${
                          isSelectedPair ? "bg-teal-500/10" : "hover:bg-white/5"
                        }`}
                        onClick={() => onPairSelect(pair)}
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm text-white font-medium">
                            {pairStudentNames.left} vs {pairStudentNames.right}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <SimilarityBadge
                              similarity={similarity}
                              size="small"
                              showLabel={false}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-300">
                          <QualitativeSignalBadge
                            level={overlapSignalLevel}
                            tooltipText={getSignalBadgeTooltip(
                              "Total Shared Chunks",
                              overlapSignalLevel,
                            )}
                          />
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-300">
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
                            className="px-3 py-1.5 text-xs font-medium text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-lg transition-all duration-200"
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
