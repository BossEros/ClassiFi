import type { PairResponse } from "@/business/services/plagiarismService"
import { normalizeSimilarityToRatio } from "@/presentation/utils/plagiarismClusterUtils"

export type SimilarityBadgeSeverity = "low" | "medium" | "high"
export type SimilaritySignalLevel = "low" | "medium" | "high"

/**
 * Maps a similarity score to the same badge severity thresholds used in the UI.
 *
 * @param similarity - Raw similarity value that may be a ratio or percentage.
 * @returns Badge severity bucket for green, amber, or red presentation.
 */
export function getSimilarityBadgeSeverity(
  similarity: number,
): SimilarityBadgeSeverity {
  const normalizedSimilarity = normalizeSimilarityToRatio(similarity)

  if (normalizedSimilarity >= 0.75) {
    return "high"
  }

  if (normalizedSimilarity >= 0.5) {
    return "medium"
  }

  return "low"
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

/**
 * Normalizes pair overlap against the combined submission size.
 *
 * @param pair - Pairwise similarity result.
 * @returns Ratio between 0 and 1 for qualitative overlap scoring.
 */
export function getNormalizedOverlapRatio(pair: PairResponse): number {
  const leftLineCount = getSafeLineCount(pair.leftFile.lineCount)
  const rightLineCount = getSafeLineCount(pair.rightFile.lineCount)
  const combinedLineCount = leftLineCount + rightLineCount

  return clampToUnitRange(pair.overlap / combinedLineCount)
}

/**
 * Normalizes the longest fragment against the shorter submission.
 *
 * @param pair - Pairwise similarity result.
 * @returns Ratio between 0 and 1 for qualitative longest-fragment scoring.
 */
export function getNormalizedLongestRatio(pair: PairResponse): number {
  const leftLineCount = getSafeLineCount(pair.leftFile.lineCount)
  const rightLineCount = getSafeLineCount(pair.rightFile.lineCount)
  const shorterSubmissionLineCount = Math.min(leftLineCount, rightLineCount)

  return clampToUnitRange(pair.longest / shorterSubmissionLineCount)
}

/**
 * Maps a normalized signal value to the same low/medium/high buckets used in the UI.
 *
 * @param value - Normalized ratio between 0 and 1.
 * @returns Qualitative signal level.
 */
export function getSignalLevel(value: number): SimilaritySignalLevel {
  if (value >= 0.5) {
    return "high"
  }

  if (value >= 0.2) {
    return "medium"
  }

  return "low"
}
