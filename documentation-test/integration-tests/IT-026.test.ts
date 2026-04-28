/**
 * IT-026: Reused Similarity Report Returns Structural Semantic And Hybrid Scores
 *
 * Module: Similarity Detection
 * Unit: Get report
 * Date Tested: 4/16/26
 * Description: Verify that a reused similarity report exposes structural, semantic, and hybrid scores for pair review.
 * Expected Result: The report response includes all three scores and a recomputed summary.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-026 Integration Test Pass - Reused Similarity Report Returns Multi-Score Summary
 * Suggested Figure Title (System UI): Similarity Review UI - Pair Table Showing Structural Semantic And Overall Similarity
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { PlagiarismPersistenceService } from "../../backend-ts/src/modules/plagiarism/plagiarism-persistence.service.js"
import { SimilarityRepository } from "../../backend-ts/src/modules/plagiarism/similarity.repository.js"
import { SubmissionRepository } from "../../backend-ts/src/modules/submissions/submission.repository.js"

describe("IT-026: Reused Similarity Report Returns Structural Semantic And Hybrid Scores", () => {
  let plagiarismPersistenceService: PlagiarismPersistenceService
  let mockSimilarityRepo: {
    getReportById: ReturnType<typeof vi.fn>
    getResultsByReport: ReturnType<typeof vi.fn>
  }
  let mockSubmissionRepo: {
    getBatchSubmissionsWithStudents: ReturnType<typeof vi.fn>
    getSubmissionsWithStudentInfo: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockSimilarityRepo = {
      getReportById: vi.fn().mockResolvedValue({
        id: 1,
        assignmentId: 100,
        teacherId: 200,
        totalSubmissions: 2,
        totalComparisons: 1,
        averageSimilarity: "0.0000",
        highestSimilarity: "0.0000",
        generatedAt: new Date("2026-03-20T08:00:00.000Z"),
      }),
      getResultsByReport: vi.fn().mockResolvedValue([
        {
          id: 10,
          reportId: 1,
          submission1Id: 11,
          submission2Id: 12,
          structuralScore: "0.910000",
          semanticScore: "0.830000",
          hybridScore: "0.000000",
          overlap: 18,
          longestFragment: 6,
          leftCovered: 25,
          rightCovered: 22,
          leftTotal: 40,
          rightTotal: 42,
          analyzedAt: new Date("2026-03-20T08:00:00.000Z"),
        },
      ]),
    }

    mockSubmissionRepo = {
      getBatchSubmissionsWithStudents: vi.fn().mockResolvedValue([
        {
          submission: { id: 11, filePath: "left.py", fileName: "left.py", studentId: 1001 },
          studentName: "Left Student",
        },
        {
          submission: { id: 12, filePath: "right.py", fileName: "right.py", studentId: 1002 },
          studentName: "Right Student",
        },
      ]),
      getSubmissionsWithStudentInfo: vi.fn().mockResolvedValue([
        {
          submission: {
            id: 11,
            filePath: "left.py",
            fileName: "left.py",
            studentId: 1001,
            submittedAt: new Date("2026-01-01T10:00:00Z"),
          },
          studentName: "Left Student",
        },
        {
          submission: {
            id: 12,
            filePath: "right.py",
            fileName: "right.py",
            studentId: 1002,
            submittedAt: new Date("2026-01-01T11:00:00Z"),
          },
          studentName: "Right Student",
        },
      ]),
    }

    plagiarismPersistenceService = new PlagiarismPersistenceService(
      mockSimilarityRepo as unknown as SimilarityRepository,
      mockSubmissionRepo as unknown as SubmissionRepository,
    )
  })

  it("should expose structural semantic and hybrid scores for the returned pair", async () => {
    const result = await plagiarismPersistenceService.getReport(1)

    expect(result).not.toBeNull()
    expect(result?.pairs).toHaveLength(1)
    expect(result?.pairs[0].structuralScore).toBe(0.91)
    expect(result?.pairs[0].semanticScore).toBe(0.83)
    expect(result?.pairs[0].hybridScore).toBe(0.886)
    expect(result?.summary.maxSimilarity).toBe(0.886)
  })
})

