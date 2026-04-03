import { beforeEach, describe, expect, it, vi } from "vitest"

import * as crossClassPlagiarismService from "@/business/services/crossClassPlagiarismService"
import * as crossClassRepository from "@/data/repositories/crossClassPlagiarismRepository"
import type { CrossClassAnalysisResponse } from "@/data/api/crossClassPlagiarism.types"

vi.mock("@/data/repositories/crossClassPlagiarismRepository")

describe("crossClassPlagiarismService", () => {
  const mockAnalysisResponse: CrossClassAnalysisResponse = {
    reportId: 400,
    generatedAt: "2026-03-31T18:48:09.347Z",
    sourceAssignment: {
      id: 104,
      name: "FizzBuzz",
      className: "BSCS 3A",
    },
    matchedAssignments: [
      {
        id: 114,
        name: "FizzBuzz",
        className: "BSCS 3B",
        classCode: "CS3B",
        nameSimilarity: 1,
      },
    ],
    summary: {
      totalSubmissions: 7,
      totalComparisons: 10,
      flaggedPairs: 4,
      averageSimilarity: 0.52,
      maxSimilarity: 0.99,
    },
    results: [
      {
        id: 1886,
        submission1Id: 101,
        submission2Id: 201,
        student1Name: "John Doe",
        student2Name: "Jane Smith",
        class1Name: "BSCS 3A",
        class1Code: "CS3A",
        class2Name: "BSCS 3B",
        class2Code: "CS3B",
        assignment1Name: "FizzBuzz",
        assignment2Name: "FizzBuzz",
        structuralScore: 0.92,
        semanticScore: 0.95,
        hybridScore: 0.93,
        overlap: 41,
        longestFragment: 16,
        isFlagged: true,
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("analyzeCrossClassSimilarity", () => {
    it("returns cross-class analysis results for a valid assignment", async () => {
      vi.mocked(crossClassRepository.analyzeCrossClassSimilarity).mockResolvedValue({
        data: mockAnalysisResponse,
        status: 200,
      })

      const result =
        await crossClassPlagiarismService.analyzeCrossClassSimilarity(104)

      expect(
        crossClassRepository.analyzeCrossClassSimilarity,
      ).toHaveBeenCalledWith(104)
      expect(result.reportId).toBe(400)
      expect(result.results).toHaveLength(1)
    })

    it("deduplicates concurrent analysis requests for the same assignment", async () => {
      let resolveAnalysisPromise!: (value: {
        data: CrossClassAnalysisResponse
        status: number
      }) => void

      vi.mocked(crossClassRepository.analyzeCrossClassSimilarity).mockReturnValue(
        new Promise((resolve) => {
          resolveAnalysisPromise = resolve
        }),
      )

      const firstAnalysisPromise =
        crossClassPlagiarismService.analyzeCrossClassSimilarity(104)
      const secondAnalysisPromise =
        crossClassPlagiarismService.analyzeCrossClassSimilarity(104)

      expect(
        crossClassRepository.analyzeCrossClassSimilarity,
      ).toHaveBeenCalledTimes(1)

      resolveAnalysisPromise({
        data: mockAnalysisResponse,
        status: 200,
      })

      const [firstResult, secondResult] = await Promise.all([
        firstAnalysisPromise,
        secondAnalysisPromise,
      ])

      expect(firstResult).toEqual(mockAnalysisResponse)
      expect(secondResult).toEqual(mockAnalysisResponse)
    })

    it("throws an error for an invalid assignment ID", async () => {
      await expect(
        crossClassPlagiarismService.analyzeCrossClassSimilarity(0),
      ).rejects.toThrow("Invalid assignment ID")
    })
  })
})
