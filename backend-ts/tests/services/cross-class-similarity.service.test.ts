import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../../src/shared/database.js", () => ({
  db: {
    transaction: vi.fn(async (callback: (transaction: unknown) => Promise<unknown>) =>
      callback({}),
    ),
  },
}))

vi.mock("../../src/modules/plagiarism/plagiarism.mapper.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/modules/plagiarism/plagiarism.mapper.js")>()
  return {
    ...actual,
    createPlagiarismDetector: vi.fn(),
  }
})

import { CrossClassSimilarityService } from "../../src/modules/plagiarism/cross-class-similarity.service.js"
import { createPlagiarismDetector } from "../../src/modules/plagiarism/plagiarism.mapper.js"
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
      },
      submission1StudentName: "John Doe",
      submission1SubmittedAt: new Date("2026-03-31T09:00:00.000Z"),
      submission2StudentName: "Jane Smith",
      submission2SubmittedAt: new Date("2026-03-31T10:30:00.000Z"),
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
    getLatestSubmissionSnapshotsByAssignmentIds: ReturnType<typeof vi.fn>
  }
  let mockSimilarityRepo: {
    withContext: ReturnType<typeof vi.fn>
    getCrossClassResultsWithContext: ReturnType<typeof vi.fn>
    getLatestCrossClassReport: ReturnType<typeof vi.fn>
    deleteCrossClassReportsExcept: ReturnType<typeof vi.fn>
    getResultWithFragments: ReturnType<typeof vi.fn>
    getReportById: ReturnType<typeof vi.fn>
  }
  let mockFileService: {
    fetchSubmissionFiles: ReturnType<typeof vi.fn>
    downloadSubmissionFiles: ReturnType<typeof vi.fn>
  }
  let mockSemanticClient: {
    getEmbedding: ReturnType<typeof vi.fn>
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
      getSubmissionWithStudent: vi
        .fn()
        .mockImplementation(async (submissionId: number) => {
          if (submissionId === 101) {
            return {
              submission: {
                filePath: "submissions/101.py",
              },
            }
          }

          if (submissionId === 201) {
            return {
              submission: {
                filePath: "submissions/201.py",
              },
            }
          }

          return null
        }),
      getLatestSubmissionSnapshotsByAssignmentIds: vi.fn().mockResolvedValue([]),
    }

    mockSimilarityRepo = {
      withContext: vi.fn().mockReturnValue(repoWithTransactionContext),
      getCrossClassResultsWithContext: vi
        .fn()
        .mockResolvedValue(mockCrossClassResultWithContext),
      getLatestCrossClassReport: vi.fn().mockResolvedValue(null),
      deleteCrossClassReportsExcept: vi.fn().mockResolvedValue(0),
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
    }

    vi.mocked(createPlagiarismDetector).mockReturnValue({
      analyze: vi.fn().mockResolvedValue({
        getPairs: () => [mockPair],
        getFragments: () => [],
      }),
    } as never)

    mockFileService = {
      fetchSubmissionFiles: vi
        .fn()
        .mockImplementation(async (assignmentId: number) => {
          if (assignmentId === 104) return [leftFile]
          if (assignmentId === 114) return [rightFile]

          return []
        }),
      downloadSubmissionFiles: vi
        .fn()
        .mockResolvedValue(["print('left')", "print('right')"]),
    }

    mockSemanticClient = {
      getEmbedding: vi.fn().mockImplementation(async (code: string) => {
        // Return deterministic embeddings that produce cosine similarity ~0.83
        // when compared. Use code content to differentiate vectors.
        const base = Array(768).fill(0.5)
        if (code.includes("left")) {
          base[0] = 1.0
          base[1] = 0.3
        } else {
          base[0] = 0.8
          base[1] = 1.0
        }

        return base
      }),
    }
  })

  function createService(): CrossClassSimilarityService {
    return new CrossClassSimilarityService(
      mockAssignmentRepo as never,
      mockClassRepo as never,
      mockSubmissionRepo as never,
      mockSimilarityRepo as never,
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

    vi.mocked(createPlagiarismDetector).mockReturnValue({
      analyze: vi.fn().mockResolvedValue({
        getPairs: () => [sameClassPair],
        getFragments: () => [],
      }),
    } as never)

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

    vi.mocked(createPlagiarismDetector).mockReturnValue({
      analyze: vi.fn().mockResolvedValue({
        getPairs: () => [missingIdPair],
        getFragments: () => [],
      }),
    } as never)

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

    vi.mocked(createPlagiarismDetector).mockReturnValue({
      analyze: vi.fn().mockResolvedValue({
        getPairs: () => [lowSimilarityPair],
        getFragments: () => [],
      }),
    } as never)

    const service = createService()
    await service.analyzeCrossClassSimilarity(104, 47)

    expect(mockSemanticClient.getEmbedding).not.toHaveBeenCalled()
  })

  it("calls semantic scoring for pairs above the structural threshold", async () => {
    const service = createService()
    await service.analyzeCrossClassSimilarity(104, 47)

    // With embedding caching, each unique submission is embedded once.
    // Two submissions (101 and 201) → 2 embedding calls.
    expect(mockSemanticClient.getEmbedding).toHaveBeenCalledTimes(2)
  })

  it("includes submission timestamps in cross-class result details", async () => {
    const service = createService()

    const result = await service.getResultDetails(1886, 47)

    expect(mockSimilarityRepo.getResultWithFragments).toHaveBeenCalledWith(1886)
    expect(result.leftFile.studentName).toBe("John Doe")
    expect(result.leftFile.submittedAt).toBe("2026-03-31T09:00:00.000Z")
    expect(result.rightFile.studentName).toBe("Jane Smith")
    expect(result.rightFile.submittedAt).toBe("2026-03-31T10:30:00.000Z")
  })
})
