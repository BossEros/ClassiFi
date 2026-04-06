import { describe, expect, it } from "vitest"
import type { PairResponse } from "@/data/api/plagiarism.types"
import {
  buildSimilarityClusters,
  getPairOverallSimilarityRatio,
} from "@/presentation/utils/plagiarismClusterUtils"

function createPair(
  id: number,
  leftSubmissionId: number,
  leftStudentName: string,
  rightSubmissionId: number,
  rightStudentName: string,
  hybridScore: number,
  structuralScore = hybridScore,
): PairResponse {
  return {
    id,
    leftFile: {
      id: leftSubmissionId,
      path: `${leftStudentName}.py`,
      filename: `${leftStudentName}.py`,
      lineCount: 20,
      studentName: leftStudentName,
    },
    rightFile: {
      id: rightSubmissionId,
      path: `${rightStudentName}.py`,
      filename: `${rightStudentName}.py`,
      lineCount: 20,
      studentName: rightStudentName,
    },
    structuralScore,
    semanticScore: 0,
    hybridScore,
    overlap: 10,
    longest: 5,
  }
}

describe("plagiarismClusterUtils", () => {
  it("builds a connected cluster from transitive high-similarity pairs", () => {
    const pairs = [
      createPair(1, 1, "Alice", 2, "Bob", 0.96),
      createPair(2, 2, "Bob", 3, "Cara", 0.94),
      createPair(3, 1, "Alice", 4, "Dina", 0.52),
    ]

    const clusters = buildSimilarityClusters(pairs, 90)

    expect(clusters).toHaveLength(1)
    expect(clusters[0].clusterId).toBe(1)
    expect(clusters[0].submissionCount).toBe(3)
    expect(clusters[0].pairCount).toBe(2)
    expect(clusters[0].members.map((member) => member.studentName)).toEqual([
      "Alice",
      "Bob",
      "Cara",
    ])
    expect(clusters[0].pairs.map((pair) => pair.id)).toEqual([1, 2])
    expect(clusters[0].maxSimilarity).toBeCloseTo(0.96)
    expect(clusters[0].averageSimilarity).toBeCloseTo(0.95)
  })

  it("falls back to structural similarity when hybrid similarity is unavailable", () => {
    const pair = createPair(1, 10, "Eli", 11, "Finn", 0, 0.91)

    expect(getPairOverallSimilarityRatio(pair)).toBeCloseTo(0.91)
    expect(buildSimilarityClusters([pair], 90)).toHaveLength(1)
  })

  it("sorts larger clusters before smaller ones", () => {
    const pairs = [
      createPair(1, 1, "Alice", 2, "Bob", 0.97),
      createPair(2, 2, "Bob", 3, "Cara", 0.95),
      createPair(3, 4, "Dina", 5, "Eli", 0.98),
    ]

    const clusters = buildSimilarityClusters(pairs, 90)

    expect(clusters).toHaveLength(2)
    expect(clusters[0].members.map((member) => member.studentName)).toEqual([
      "Alice",
      "Bob",
      "Cara",
    ])
    expect(clusters[1].members.map((member) => member.studentName)).toEqual([
      "Dina",
      "Eli",
    ])
  })
})
