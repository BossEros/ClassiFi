/**
 * IT-029: Cross-Class Similarity Result Details Include Submission Timestamps
 *
 * Module: Similarity Detection
 * Unit: Get cross-class result details
 * Date Tested: 4/16/26
 * Description: Verify that cross-class comparison details include both students and submission timestamps.
 * Expected Result: Left and right result details expose student identity and submission time context.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-029 Integration Test Pass - Cross-Class Result Details Include Submission Timestamps
 * Suggested Figure Title (System UI): Cross-Class Similarity UI - Comparison Panel Showing Student Names And Submission Times
 */ 

import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../../backend-ts/src/shared/database.js", () => ({
  db: {
    transaction: vi.fn(async (callback: (transaction: unknown) => Promise<unknown>) =>
      callback({}),
    ),
  },
}))

vi.mock("../../backend-ts/src/modules/plagiarism/plagiarism.mapper.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../backend-ts/src/modules/plagiarism/plagiarism.mapper.js")>()
  return {
    ...actual,
    createPlagiarismDetector: vi.fn(),
  }
})

import { CrossClassSimilarityService } from "../../backend-ts/src/modules/plagiarism/cross-class-similarity.service.js"

describe("IT-029: Cross-Class Similarity Result Details Include Submission Timestamps", () => {
  let crossClassSimilarityService: CrossClassSimilarityService
  let mockSimilarityRepo: {
    getResultWithFragments: ReturnType<typeof vi.fn>
    getReportById: ReturnType<typeof vi.fn>
    getCrossClassResultsWithContext: ReturnType<typeof vi.fn>
  }
  let mockSubmissionRepo: {
    getSubmissionWithStudent: ReturnType<typeof vi.fn>
  }
  let mockFileService: {
    fetchSubmissionFiles: ReturnType<typeof vi.fn>
    downloadSubmissionFiles: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockSimilarityRepo = {
      getResultWithFragments: vi.fn().mockResolvedValue({
        result: {
          id: 1886,
          reportId: 400,
          submission1Id: 101,
          submission2Id: 201,
          structuralScore: "0.9100",
          semanticScore: "0.8300",
          hybridScore: "0.8860",
          overlap: 18,
          longestFragment: 6,
        },
        fragments: [],
      }),
      getReportById: vi.fn().mockResolvedValue({
        id: 400,
        assignmentId: 104,
        teacherId: 47,
        reportType: "cross-class",
      }),
      getCrossClassResultsWithContext: vi.fn().mockResolvedValue([
        {
          result: {
            id: 1886,
            reportId: 400,
            submission1Id: 101,
            submission2Id: 201,
            structuralScore: "0.9100",
            semanticScore: "0.8300",
            hybridScore: "0.8860",
            overlap: 18,
            longestFragment: 6,
          },
          submission1StudentName: "John Doe",
          submission1SubmittedAt: new Date("2026-03-31T09:00:00.000Z"),
          submission2StudentName: "Jane Smith",
          submission2SubmittedAt: new Date("2026-03-31T10:30:00.000Z"),
          submission1ClassName: "BSCS 3A",
          submission2ClassName: "BSCS 3B",
          submission1ClassCode: "3A",
          submission2ClassCode: "3B",
          submission1AssignmentName: "FizzBuzz",
          submission2AssignmentName: "FizzBuzz",
        },
      ]),
    }

    mockSubmissionRepo = {
      getSubmissionWithStudent: vi.fn().mockImplementation(async (submissionId: number) => {
        if (submissionId === 101) {
          return {
            submission: {
              id: 101,
              filePath: "submissions/101.py",
              submittedAt: new Date("2026-03-31T09:00:00.000Z"),
            },
            studentName: "John Doe",
            className: "BSCS 3A",
            assignmentName: "FizzBuzz",
          }
        }

        return {
          submission: {
            id: 201,
            filePath: "submissions/201.py",
            submittedAt: new Date("2026-03-31T10:30:00.000Z"),
          },
          studentName: "Jane Smith",
          className: "BSCS 3B",
          assignmentName: "FizzBuzz",
        }
      }),
    }

    mockFileService = {
      fetchSubmissionFiles: vi.fn(),
      downloadSubmissionFiles: vi
        .fn()
        .mockResolvedValue(["print('left')", "print('right')"]),
    }

    crossClassSimilarityService = new CrossClassSimilarityService(
      { getAssignmentById: vi.fn(), getAssignmentsByClassIds: vi.fn() } as never,
      { getClassesByTeacher: vi.fn() } as never,
      mockSubmissionRepo as never,
      mockSimilarityRepo as never,
      mockFileService as never,
      { getEmbedding: vi.fn() } as never,
    )
  })

  it("should return submission timestamps with both compared files", async () => {
    const result = await crossClassSimilarityService.getResultDetails(1886, 47)

    expect(result.leftFile.studentName).toBe("John Doe")
    expect(result.leftFile.submittedAt).toBe("2026-03-31T09:00:00.000Z")
    expect(result.rightFile.studentName).toBe("Jane Smith")
    expect(result.rightFile.submittedAt).toBe("2026-03-31T10:30:00.000Z")
  })
})
