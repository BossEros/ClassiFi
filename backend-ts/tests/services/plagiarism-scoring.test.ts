import { describe, expect, it, vi } from "vitest"

vi.mock("../../src/shared/config.js", () => ({
  settings: {
    plagiarismStructuralWeight: 0.7,
    plagiarismSemanticWeight: 0.3,
    plagiarismHybridThreshold: 0.5,
  },
}))

describe("plagiarism-scoring", () => {
  it("normalizes submission IDs into a stable ascending pair key", async () => {
    const { normalizeSubmissionPair } = await import(
      "../../src/modules/plagiarism/plagiarism-scoring.js"
    )

    expect(normalizeSubmissionPair(22, 11)).toEqual({
      submission1Id: 11,
      submission2Id: 22,
      pairKey: "11-22",
      isSwapped: true,
    })
  })

  it("builds hybrid pair scores using the configured 70/30 weighting", async () => {
    const { buildPairSimilarityScoreBreakdown } = await import(
      "../../src/modules/plagiarism/plagiarism-scoring.js"
    )

    expect(buildPairSimilarityScoreBreakdown(0.9, 0.4)).toEqual({
      structuralScore: 0.9,
      semanticScore: 0.4,
      hybridScore: 0.75,
      isSuspicious: true,
    })
  })

  it("summarizes suspicious count and hybrid metrics from pair scores", async () => {
    const { summarizePairSimilarityScores } = await import(
      "../../src/modules/plagiarism/plagiarism-scoring.js"
    )

    expect(
      summarizePairSimilarityScores([
        {
          structuralScore: 0.9,
          semanticScore: 0.4,
          hybridScore: 0.75,
          isSuspicious: true,
        },
        {
          structuralScore: 0.6,
          semanticScore: 0,
          hybridScore: 0.42,
          isSuspicious: false,
        },
      ]),
    ).toEqual({
      suspiciousPairs: 1,
      averageSimilarity: 0.585,
      maxSimilarity: 0.75,
    })
  })
})
