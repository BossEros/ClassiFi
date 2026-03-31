import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../../src/shared/database.js", () => ({
  db: {
    transaction: vi.fn(async (callback: (transaction: unknown) => Promise<unknown>) =>
      callback({}),
    ),
  },
}))

import { CrossClassSimilarityService } from "../../src/modules/plagiarism/cross-class-similarity.service.js"
import { db } from "../../src/shared/database.js"

describe("CrossClassSimilarityService", () => {
  const sourceAssignment = {
    id: 104,
    assignmentName: "FizzBuzz",
    classId: 43,
    programmingLanguage: "python",
  }

  const matchedAssignment = {
    id: 114,
    assignmentName: "FizzBuzz",
    classId: 44,
    programmingLanguage: "python",
  }

  const leftFile = {
    path: "submissions/101.py",
    filename: "101.py",
    content: "print('left')",
    info: {
      submissionId: "101",
      studentId: "60",
    },
  }

  const rightFile = {
    path: "submissions/201.py",
    filename: "201.py",
    content: "print('right')",
    info: {
      submissionId: "201",
      studentId: "61",
    },
  }

  const mockPair = {
    leftFile,
    rightFile,
    similarity: 0.91,
    overlap: 18,
    longest: 6,
    leftCovered: 18,
    rightCovered: 17,
    leftTotal: 25,
    rightTotal: 26,
  }

  const mockCrossClassResultWithContext = [
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
        isFlagged: true,
      },
      submission1StudentName: "John Doe",
      submission2StudentName: "Jane Smith",
      submission1ClassName: "BSCS 3A",
      submission2ClassName: "BSCS 3B",
      submission1AssignmentName: "FizzBuzz",
      submission2AssignmentName: "FizzBuzz",
    },
  ]

  let mockAssignmentRepo: {
    getAssignmentById: ReturnType<typeof vi.fn>
    getAssignmentsByClassIds: ReturnType<typeof vi.fn>
  }
  let mockClassRepo: {
    getClassesByTeacher: ReturnType<typeof vi.fn>
  }
  let mockSimilarityRepo: {
    withContext: ReturnType<typeof vi.fn>
    getCrossClassResultsWithContext: ReturnType<typeof vi.fn>
  }
  let mockDetectorFactory: {
    create: ReturnType<typeof vi.fn>
  }
  let mockFileService: {
    fetchSubmissionFiles: ReturnType<typeof vi.fn>
  }
  let mockSemanticClient: {
    getSemanticScore: ReturnType<typeof vi.fn>
  }
  let repoWithTransactionContext: {
    acquireAssignmentReportLock: ReturnType<typeof vi.fn>
    createReport: ReturnType<typeof vi.fn>
    createResults: ReturnType<typeof vi.fn>
    createFragments: ReturnType<typeof vi.fn>
    deleteCrossClassReportsExcept: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.clearAllMocks()

    repoWithTransactionContext = {
      acquireAssignmentReportLock: vi.fn().mockResolvedValue(undefined),
      createReport: vi.fn().mockResolvedValue({
        id: 400,
        assignmentId: 104,
        teacherId: 47,
        reportType: "cross-class",
        matchedAssignmentIds: [104, 114],
        totalSubmissions: 2,
        totalComparisons: 1,
        flaggedPairs: 1,
        averageSimilarity: "0.8860",
        highestSimilarity: "0.8860",
        generatedAt: new Date("2026-03-31T18:48:09.347Z"),
      }),
      createResults: vi.fn().mockResolvedValue([
        {
          id: 1886,
          submission1Id: 101,
          submission2Id: 201,
        },
      ]),
      createFragments: vi.fn().mockResolvedValue([]),
      deleteCrossClassReportsExcept: vi.fn().mockResolvedValue(1),
    }

    mockAssignmentRepo = {
      getAssignmentById: vi
        .fn()
        .mockImplementation(async (assignmentId: number) => {
          if (assignmentId === 104) {
            return sourceAssignment
          }

          if (assignmentId === 114) {
            return matchedAssignment
          }

          return undefined
        }),
      getAssignmentsByClassIds: vi
        .fn()
        .mockResolvedValue([sourceAssignment, matchedAssignment]),
    }

    mockClassRepo = {
      getClassesByTeacher: vi.fn().mockResolvedValue([
        { id: 43, className: "BSCS 3A" },
        { id: 44, className: "BSCS 3B" },
      ]),
    }

    mockSimilarityRepo = {
      withContext: vi.fn().mockReturnValue(repoWithTransactionContext),
      getCrossClassResultsWithContext: vi
        .fn()
        .mockResolvedValue(mockCrossClassResultWithContext),
    }

    mockDetectorFactory = {
      create: vi.fn().mockReturnValue({
        analyze: vi.fn().mockResolvedValue({
          getPairs: () => [mockPair],
          getFragments: () => [],
        }),
      }),
    }

    mockFileService = {
      fetchSubmissionFiles: vi
        .fn()
        .mockImplementation(async (assignmentId: number) => {
          if (assignmentId === 104) {
            return [leftFile]
          }

          if (assignmentId === 114) {
            return [rightFile]
          }

          return []
        }),
    }

    mockSemanticClient = {
      getSemanticScore: vi.fn().mockResolvedValue(0.83),
    }
  })

  it("preserves older cross-class reports after persisting a fresh comparison", async () => {
    const crossClassSimilarityService = new CrossClassSimilarityService(
      mockAssignmentRepo as never,
      mockClassRepo as never,
      mockSimilarityRepo as never,
      mockDetectorFactory as never,
      mockFileService as never,
      mockSemanticClient as never,
    )

    const analysisResult =
      await crossClassSimilarityService.analyzeCrossClassSimilarity(104, 47)

    expect((db.transaction as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1)
    expect(
      repoWithTransactionContext.deleteCrossClassReportsExcept,
    ).not.toHaveBeenCalled()
    expect(analysisResult.reportId).toBe(400)
    expect(analysisResult.results).toHaveLength(1)
  })
})
