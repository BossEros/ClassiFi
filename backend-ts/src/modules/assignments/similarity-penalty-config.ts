export interface SimilarityPenaltyBand {
  minHybridScore: number
  penaltyPercent: number
}

export interface SimilarityPenaltyConfig {
  warningThreshold: number
  deductionBands: SimilarityPenaltyBand[]
  maxPenaltyPercent: number
  applyHighestPairOnly: boolean
}

export const DEFAULT_SIMILARITY_PENALTY_CONFIG: SimilarityPenaltyConfig = {
  warningThreshold: 0.75,
  deductionBands: [
    { minHybridScore: 0.85, penaltyPercent: 5 },
    { minHybridScore: 0.9, penaltyPercent: 10 },
    { minHybridScore: 0.95, penaltyPercent: 20 },
  ],
  maxPenaltyPercent: 20,
  applyHighestPairOnly: true,
}

export function cloneDefaultSimilarityPenaltyConfig(): SimilarityPenaltyConfig {
  return structuredClone(DEFAULT_SIMILARITY_PENALTY_CONFIG)
}

export function normalizeSimilarityPenaltyConfig(
  similarityPenaltyConfig: SimilarityPenaltyConfig | null | undefined,
): SimilarityPenaltyConfig {
  const sourceConfig =
    similarityPenaltyConfig ?? DEFAULT_SIMILARITY_PENALTY_CONFIG

  const deductionBands = [...sourceConfig.deductionBands]
    .map((deductionBand) => ({
      minHybridScore: Math.min(1, Math.max(0, deductionBand.minHybridScore)),
      penaltyPercent: Math.min(100, Math.max(0, deductionBand.penaltyPercent)),
    }))
    .sort(
      (leftDeductionBand, rightDeductionBand) =>
        leftDeductionBand.minHybridScore - rightDeductionBand.minHybridScore,
    )

  const normalizedConfig: SimilarityPenaltyConfig = {
    warningThreshold: Math.min(1, Math.max(0, sourceConfig.warningThreshold)),
    deductionBands,
    maxPenaltyPercent: Math.min(
      100,
      Math.max(0, sourceConfig.maxPenaltyPercent),
    ),
    applyHighestPairOnly: sourceConfig.applyHighestPairOnly !== false,
  }

  return normalizedConfig
}
