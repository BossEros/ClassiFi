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

  /** Raw files returned by fileService (before classId tagging) */
  const leftFile = {
    path: "submissions/101.py",
    content: "print('left')",
    info: { submissionId: "101", studentId: "60" },
  }

  const rightFile = {
    path: "submissions/201.py",
    content: "print('right')",
    info: { submissionId: "201", studentId: "61" },
  }

  /**
   * The detector sees File objects that the service tagged with classId.
   * We replicate that tagging here so extractCrossClassPairs works correctly.
   */
  const taggedLeftFile = {
    path: "submissions/101.py",
    content: "print('left')",
    info: { submissionId: "101", studentId: "60", classId: "43" },
  }

  const taggedRightFile = {
    path: "submissions/201.py",
    content: "print('right')",
    info: { submissionId: "201", studentId: "61", classId: "44" },
  }

  const mockPair = {
    leftFile: taggedLeftFile,
    rightFile: taggedRightFile,
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
  let mockSubmissionRepo: {
    getSubmissionWithStudent: ReturnType<typeof vi.fn>
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
        { id: 1886, submission1Id: 101, submission2Id: 201 },
      ]),
      createFragments: vi.fn().mockResolvedValue([]),
    }

    mockAssignmentRepo = {
      getAssignmentById: vi
        .fn()
        .mockImplementation(async (assignmentId: number) => {
          if (assignmentId === 104) return sourceAssignment
          if (assignmentId === 114) return matchedAssignment

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

    mockSubmissionRepo = {
      getSubmissionWithStudent: vi.fn().mockResolvedValue(null),
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
          if (assignmentId === 104) return [leftFile]
          if (assignmentId === 114) return [rightFile]

          return []
        }),
    }

    mockSemanticClient = {
      getSemanticScore: vi.fn().mockResolvedValue(0.83),
    }
  })

  function createService(): CrossClassSimilarityService {
    return new CrossClassSimilarityService(
      mockAssignmentRepo as never,
      mockClassRepo as never,
      mockSubmissionRepo as never,
      mockSimilarityRepo as never,
      mockDetectorFactory as never,
      mockFileService as never,
      mockSemanticClient as never,
    )
  }

  it("runs a full cross-class analysis and returns a report with results", async () => {
    const service = createService()

    const result = await service.analyzeCrossClassSimilarity(104, 47)

    expect((db.transaction as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1)
    expect(repoWithTransactionContext.createReport).toHaveBeenCalledTimes(1)
    expect(repoWithTransactionContext.createResults).toHaveBeenCalledTimes(1)
    expect(result.reportId).toBe(400)
    expect(result.results).toHaveLength(1)
    expect(result.results[0].student1Name).toBe("John Doe")
    expect(result.results[0].student2Name).toBe("Jane Smith")
  })

  it("returns an empty response when no matching assignments are found", async () => {
    mockAssignmentRepo.getAssignmentsByClassIds.mockResolvedValue([sourceAssignment])
    const service = createService()

    const result = await service.analyzeCrossClassSimilarity(104, 47)

    expect(result.reportId).toBe(0)
    expect(result.results).toHaveLength(0)
    expect(result.matchedAssignments).toHaveLength(0)
  })

  it("returns an empty response when fewer than two files are collected", async () => {
    mockFileService.fetchSubmissionFiles.mockResolvedValue([])
    const service = createService()

    const result = await service.analyzeCrossClassSimilarity(104, 47)

    expect(result.reportId).toBe(0)
    expect(result.results).toHaveLength(0)
  })

  it("skips detector pairs where both files belong to the same class", async () => {
    const sameClassPair = {
      ...mockPair,
      leftFile: { ...taggedLeftFile, info: { ...taggedLeftFile.info, classId: "43" } },
      rightFile: { ...taggedRightFile, info: { ...taggedRightFile.info, classId: "43" } },
    }

    mockDetectorFactory.create.mockReturnValue({
      analyze: vi.fn().mockResolvedValue({
        getPairs: () => [sameClassPair],
        getFragments: () => [],
      }),
    })

    const service = createService()

    const result = await service.analyzeCrossClassSimilarity(104, 47)

    expect(result.reportId).toBe(0)
    expect(result.results).toHaveLength(0)
  })

  it("skips pairs with missing submission IDs", async () => {
    const missingIdPair = {
      ...mockPair,
      leftFile: {
        ...taggedLeftFile,
        info: { ...taggedLeftFile.info, submissionId: undefined },
      },
    }

    mockDetectorFactory.create.mockReturnValue({
      analyze: vi.fn().mockResolvedValue({
        getPairs: () => [missingIdPair],
        getFragments: () => [],
      }),
    })

    const service = createService()

    const result = await service.analyzeCrossClassSimilarity(104, 47)

    expect(result.reportId).toBe(0)
    expect(result.results).toHaveLength(0)
  })

  it("sets semantic score to 0 for pairs below the structural threshold", async () => {
    const lowSimilarityPair = {
      ...mockPair,
      similarity: 0.1,
    }

    mockDetectorFactory.create.mockReturnValue({
      analyze: vi.fn().mockResolvedValue({
        getPairs: () => [lowSimilarityPair],
        getFragments: () => [],
      }),
    })

    const service = createService()
    await service.analyzeCrossClassSimilarity(104, 47)

    expect(mockSemanticClient.getSemanticScore).not.toHaveBeenCalled()
  })

  it("calls semantic scoring for pairs above the structural threshold", async () => {
    const service = createService()
    await service.analyzeCrossClassSimilarity(104, 47)

    expect(mockSemanticClient.getSemanticScore).toHaveBeenCalledTimes(1)
    expect(mockSemanticClient.getSemanticScore).toHaveBeenCalledWith(
      "print('left')",
      "print('right')",
    )
  })
})
