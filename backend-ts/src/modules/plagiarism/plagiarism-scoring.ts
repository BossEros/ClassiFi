import { settings } from "@/shared/config.js"

/** Normalized submission-pair identity used across persistence and response mapping. */
export interface NormalizedSubmissionPair {
  submission1Id: number
  submission2Id: number
  pairKey: string
  isSwapped: boolean
}

/** Score breakdown for a single plagiarism pair. */
export interface PairSimilarityScoreBreakdown {
  structuralScore: number
  semanticScore: number
  hybridScore: number
  isSuspicious: boolean
}

/** Hybrid-score summary for an analyzed assignment report. */
export interface PairSimilaritySummary {
  suspiciousPairs: number
  averageSimilarity: number
  maxSimilarity: number
}

/**
 * Normalize submission identifiers into ascending order for stable pair keys.
 *
 * @param leftSubmissionId - The first submission identifier.
 * @param rightSubmissionId - The second submission identifier.
 * @returns A normalized pair identity with ascending submission IDs.
 */
export function normalizeSubmissionPair(
  leftSubmissionId: number,
  rightSubmissionId: number,
): NormalizedSubmissionPair {
  const isSwapped = leftSubmissionId > rightSubmissionId
  const [submission1Id, submission2Id] = isSwapped
    ? [rightSubmissionId, leftSubmissionId]
    : [leftSubmissionId, rightSubmissionId]

  return {
    submission1Id,
    submission2Id,
    pairKey: `${submission1Id}-${submission2Id}`,
    isSwapped,
  }
}

/**
 * Compute the weighted hybrid similarity score for a plagiarism pair.
 *
 * @param structuralScore - The structural similarity score in the range `[0, 1]`.
 * @param semanticScore - The semantic similarity score in the range `[0, 1]`.
 * @returns The configured hybrid similarity score clamped to `[0, 1]`.
 */
export function calculateHybridSimilarityScore(
  structuralScore: number,
  semanticScore: number,
): number {
  const weightedHybridScore =
    settings.plagiarismStructuralWeight * structuralScore +
    settings.plagiarismSemanticWeight * semanticScore
  const clampedHybridScore = Math.min(1, Math.max(0, weightedHybridScore))

  return Number(clampedHybridScore.toFixed(6))
}

/**
 * Determine whether a hybrid similarity score should be flagged as suspicious.
 *
 * @param hybridScore - The hybrid similarity score to evaluate.
 * @returns `true` when the score reaches the configured suspicious threshold.
 */
export function isSuspiciousHybridSimilarity(hybridScore: number): boolean {
  return hybridScore >= settings.plagiarismHybridThreshold
}

/**
 * Build the full score breakdown for a plagiarism pair.
 *
 * @param structuralScore - The structural similarity score in the range `[0, 1]`.
 * @param semanticScore - The semantic similarity score in the range `[0, 1]`.
 * @returns The structural, semantic, hybrid, and suspicious-flag breakdown.
 */
export function buildPairSimilarityScoreBreakdown(
  structuralScore: number,
  semanticScore: number,
): PairSimilarityScoreBreakdown {
  const hybridScore = calculateHybridSimilarityScore(
    structuralScore,
    semanticScore,
  )

  return {
    structuralScore,
    semanticScore,
    hybridScore,
    isSuspicious: isSuspiciousHybridSimilarity(hybridScore),
  }
}

/**
 * Summarize a set of pair score breakdowns for report-level metadata.
 *
 * @param pairScoreBreakdowns - The score breakdowns to summarize.
 * @returns The suspicious-pair count, average hybrid score, and maximum hybrid score.
 */
export function summarizePairSimilarityScores(
  pairScoreBreakdowns: ReadonlyArray<PairSimilarityScoreBreakdown>,
): PairSimilaritySummary {
  if (pairScoreBreakdowns.length === 0) {
    return {
      suspiciousPairs: 0,
      averageSimilarity: 0,
      maxSimilarity: 0,
    }
  }

  const suspiciousPairs = pairScoreBreakdowns.filter(
    (pairScoreBreakdown) => pairScoreBreakdown.isSuspicious,
  ).length
  const totalHybridScore = pairScoreBreakdowns.reduce(
    (sum, pairScoreBreakdown) => sum + pairScoreBreakdown.hybridScore,
    0,
  )
  const maxHybridScore = pairScoreBreakdowns.reduce(
    (currentMax, pairScoreBreakdown) =>
      Math.max(currentMax, pairScoreBreakdown.hybridScore),
    0,
  )

  return {
    suspiciousPairs,
    averageSimilarity: Number(
      (totalHybridScore / pairScoreBreakdowns.length).toFixed(6),
    ),
    maxSimilarity: Number(maxHybridScore.toFixed(6)),
  }
}

/**
 * Format a similarity score as a fixed-point string for database storage.
 *
 * @param score - The similarity score to format.
 * @param decimals - Number of decimal places (6 for pair-level, 4 for report-level).
 * @returns A fixed-point string with the specified precision.
 */
export function formatSimilarityScore(score: number, decimals: number): string {
  return score.toFixed(decimals)
}
