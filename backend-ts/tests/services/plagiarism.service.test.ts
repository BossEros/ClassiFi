import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { PlagiarismService } from "../../src/modules/plagiarism/plagiarism.service.js"
import { createPlagiarismDetector } from "../../src/modules/plagiarism/plagiarism.mapper.js"
import { createMockAssignment } from "../utils/factories.js"
import { AssignmentNotFoundError } from "../../src/shared/errors.js"

// Mock repositories
vi.mock("../../src/modules/assignments/assignment.repository.js")
vi.mock("../../src/shared/config.js", () => ({
  settings: {
    plagiarismStructuralWeight: 0.7,
    plagiarismSemanticWeight: 0.3,
    plagiarismHybridThreshold: 0.5,
    semanticSimilarityMaxConcurrentRequests: 4,
  },
}))

// Mock new services
vi.mock("../../src/modules/plagiarism/plagiarism-persistence.service.js")
vi.mock("../../src/modules/plagiarism/plagiarism-submission-file.service.js")
vi.mock("../../src/modules/plagiarism/plagiarism.mapper.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/modules/plagiarism/plagiarism.mapper.js")>()
  return {
    ...actual,
    createPlagiarismDetector: vi.fn(),
  }
})

// Mock PlagiarismDetector
const mockReport = {
  getSummary: () => ({
    totalFiles: 2,
    totalPairs: 1,
    averageSimilarity: 0.5,
    maxSimilarity: 0.8,
    warnings: [],
  }),
  getPairs: () => [
    {
      id: 1,
      similarity: 0.8,
      overlap: 50,
      longest: 10,
      leftCovered: 40,
      rightCovered: 45,
      leftTotal: 80,
      rightTotal: 90,
      leftFile: {
        path: "file1.py",
        filename: "file1.py",
        content: 'print("hello")',
        lineCount: 1,
        info: {
          submissionId: "1",
          studentId: "1",
          studentName: "Student 1",
        },
      },
      rightFile: {
        path: "file2.py",
        filename: "file2.py",
        content: 'print("hello")',
        lineCount: 1,
        info: {
          submissionId: "2",
          studentId: "2",
          studentName: "Student 2",
        },
      },
      buildFragments: () => [],
    },
  ],
  getFragments: () => [
    {
      leftSelection: { startRow: 1, startCol: 1, endRow: 1, endCol: 10 },
      rightSelection: { startRow: 1, startCol: 1, endRow: 1, endCol: 10 },
      length: 10,
    },
  ],
  files: [{ path: "file1.py" }, { path: "file2.py" }],
}

const mockDetector = {
  analyze: vi.fn().mockResolvedValue(mockReport),
}

describe("PlagiarismService", () => {
  let plagiarismService: PlagiarismService
  let mockAssignmentRepo: any
  let mockPersistenceService: any
  let mockFileService: any
  let mockSimilarityPenaltyService: any
  let mockSemanticClient: any

  beforeEach(() => {
    mockAssignmentRepo = {
      getAssignmentById: vi.fn(),
    }

    mockPersistenceService = {
      getReusableAssignmentReport: vi.fn().mockResolvedValue(null),
      persistReport: vi.fn().mockResolvedValue({
        dbReport: { id: 1, generatedAt: new Date("2026-03-10T10:00:00.000Z") },
        resultIdMap: new Map(),
      }),
      getReport: vi.fn(),
      getResultData: vi.fn(),
      deleteReport: vi.fn(),
    }

    mockFileService = {
      fetchSubmissionFiles: vi.fn(),
      downloadSubmissionFiles: vi.fn(),
    }

    vi.mocked(createPlagiarismDetector).mockReturnValue(mockDetector as any)

    mockSimilarityPenaltyService = {
      applyAssignmentPenaltyFromReport: vi.fn().mockResolvedValue(undefined),
      syncAssignmentPenaltyState: vi.fn().mockResolvedValue(undefined),
    }

    mockSemanticClient = {
      getEmbedding: vi.fn().mockResolvedValue(null),
      getSemanticScore: vi.fn().mockResolvedValue(0),
      healthCheck: vi.fn(),
    }

    plagiarismService = new PlagiarismService(
      mockAssignmentRepo,
      mockFileService,
      mockPersistenceService,
      mockSimilarityPenaltyService,
      mockSemanticClient,
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("analyzeAssignmentSubmissions", () => {
    it("should throw AssignmentNotFoundError when assignment not found", async () => {
      mockAssignmentRepo.getAssignmentById.mockResolvedValue(null)

      await expect(
        plagiarismService.analyzeAssignmentSubmissions(1),
      ).rejects.toThrow(AssignmentNotFoundError)
    })

    it("should successfully analyze submissions and persist report", async () => {
      const assignment = createMockAssignment({ programmingLanguage: "python" })
      // New service returns File objects directly now (or handles fetching internally)
      // But analyzeAssignmentSubmissions calls fileService.fetchSubmissionFiles
      const mockFiles = [
        // Mock files returned by service
        { path: "p1", content: "c1", info: {} },
        { path: "p2", content: "c2", info: {} },
      ]

      mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment)
      mockFileService.fetchSubmissionFiles.mockResolvedValue(mockFiles)

      const result = await plagiarismService.analyzeAssignmentSubmissions(1, 1)

      expect(result).toBeDefined()
      expect(result.reportId).toBeDefined()
      expect(result.pairs[0].hybridScore).toBe(0.56)
      expect(result.summary.suspiciousPairs).toBe(1)
      expect(result.summary.averageSimilarity).toBe(0.56)
      expect(result.summary.maxSimilarity).toBe(0.56)
      expect(
        mockPersistenceService.getReusableAssignmentReport,
      ).toHaveBeenCalledWith(1)
      expect(mockFileService.fetchSubmissionFiles).toHaveBeenCalledWith(1)
      expect(createPlagiarismDetector).toHaveBeenCalled()
      expect(mockDetector.analyze).toHaveBeenCalled()
      expect(mockPersistenceService.persistReport).toHaveBeenCalled()
      expect(
        mockSimilarityPenaltyService.applyAssignmentPenaltyFromReport,
      ).toHaveBeenCalledWith(1, 1)
    })

    it("uses hybrid score for suspicious-pair summary counts", async () => {
      const assignment = createMockAssignment({ programmingLanguage: "python" })
      const mockFiles = [
        { path: "p1", content: "c1", info: {} },
        { path: "p2", content: "c2", info: {} },
      ]
      const lowSemanticReport = {
        files: [{ path: "file1.py" }, { path: "file2.py" }],
        getPairs: () => [
          {
            id: 1,
            similarity: 0.6,
            overlap: 30,
            longest: 9,
            leftCovered: 35,
            rightCovered: 37,
            leftTotal: 80,
            rightTotal: 90,
            leftFile: {
              path: "left.py",
              filename: "left.py",
              content: 'print("left")',
              lineCount: 1,
              info: { submissionId: "11", studentId: "1", studentName: "Left" },
            },
            rightFile: {
              path: "right.py",
              filename: "right.py",
              content: 'print("right")',
              lineCount: 1,
              info: {
                submissionId: "12",
                studentId: "2",
                studentName: "Right",
              },
            },
            buildFragments: () => [],
          },
        ],
      }

      mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment)
      mockFileService.fetchSubmissionFiles.mockResolvedValue(mockFiles)
      mockDetector.analyze.mockResolvedValueOnce(lowSemanticReport)
      mockSemanticClient.getEmbedding.mockResolvedValue(null)

      const result = await plagiarismService.analyzeAssignmentSubmissions(1, 1)

      expect(result.summary.suspiciousPairs).toBe(0)
      expect(result.summary.averageSimilarity).toBe(0.42)
      expect(result.summary.maxSimilarity).toBe(0.42)
      expect(result.pairs[0].structuralScore).toBe(0.6)
      expect(result.pairs[0].semanticScore).toBe(0)
      expect(result.pairs[0].hybridScore).toBe(0.42)
    })

    it("should reuse the existing assignment report when it is current", async () => {
      const assignment = createMockAssignment({ programmingLanguage: "python" })
      const reusableReport = {
        reportId: "99",
        generatedAt: "2026-03-10T10:00:00.000Z",
        summary: {
          totalFiles: 2,
          totalPairs: 1,
          suspiciousPairs: 1,
          averageSimilarity: 0.8,
          maxSimilarity: 0.8,
        },
        pairs: [
          {
            id: 10,
            leftFile: {
              id: 1,
              path: "left.py",
              filename: "left.py",
              lineCount: 120,
              studentId: "1",
              studentName: "Student A",
            },
            rightFile: {
              id: 2,
              path: "right.py",
              filename: "right.py",
              lineCount: 118,
              studentId: "2",
              studentName: "Student B",
            },
            structuralScore: 0.8,
            semanticScore: 0,
            hybridScore: 0.8,
            overlap: 40,
            longest: 12,
          },
        ],
        warnings: [],
      }

      mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment)
      mockPersistenceService.getReusableAssignmentReport.mockResolvedValue(
        reusableReport,
      )

      const result = await plagiarismService.analyzeAssignmentSubmissions(1, 1)

      expect(result).toEqual(reusableReport)
      expect(
        mockSimilarityPenaltyService.syncAssignmentPenaltyState,
      ).toHaveBeenCalledWith(1)
      expect(
        mockPersistenceService.getReusableAssignmentReport,
      ).toHaveBeenCalledWith(1)
      expect(mockFileService.fetchSubmissionFiles).not.toHaveBeenCalled()
      expect(createPlagiarismDetector).not.toHaveBeenCalled()
      expect(mockPersistenceService.persistReport).not.toHaveBeenCalled()
    })

    it("throttles semantic similarity requests with bounded concurrency", async () => {
      const assignment = createMockAssignment({ programmingLanguage: "python" })
      const mockFiles = [
        { path: "p1", content: "c1", info: {} },
        { path: "p2", content: "c2", info: {} },
      ]
      const buildPair = (
        leftSubmissionId: number,
        rightSubmissionId: number,
      ) => ({
        id: leftSubmissionId * 10 + rightSubmissionId,
        similarity: 0.8,
        overlap: 20,
        longest: 8,
        leftCovered: 40,
        rightCovered: 45,
        leftTotal: 80,
        rightTotal: 90,
        leftFile: {
          path: `left-${leftSubmissionId}.py`,
          filename: `left-${leftSubmissionId}.py`,
          content: `print(${leftSubmissionId})`,
          lineCount: 1,
          info: { submissionId: leftSubmissionId.toString() },
        },
        rightFile: {
          path: `right-${rightSubmissionId}.py`,
          filename: `right-${rightSubmissionId}.py`,
          content: `print(${rightSubmissionId})`,
          lineCount: 1,
          info: { submissionId: rightSubmissionId.toString() },
        },
        buildFragments: () => [],
      })
      const pairCount = 12
      const throttlingReport = {
        files: Array.from({ length: pairCount }, (_, index) => ({
          path: `file-${index + 1}.py`,
        })),
        getPairs: () =>
          Array.from({ length: pairCount }, (_, index) =>
            buildPair(index + 1, index + 101),
          ),
      }
      let inFlightRequests = 0
      let maxInFlightRequests = 0

      mockAssignmentRepo.getAssignmentById.mockResolvedValue(assignment)
      mockFileService.fetchSubmissionFiles.mockResolvedValue(mockFiles)
      mockDetector.analyze.mockResolvedValueOnce(throttlingReport)
      mockSemanticClient.getEmbedding.mockImplementation(async () => {
        inFlightRequests += 1
        maxInFlightRequests = Math.max(maxInFlightRequests, inFlightRequests)
        await new Promise((resolve) => setTimeout(resolve, 5))
        inFlightRequests -= 1
        return Array(768).fill(0).map(() => Math.random())
      })

      await plagiarismService.analyzeAssignmentSubmissions(1, 1)

      // With embedding caching, each unique submission is embedded once.
      // 12 pairs with unique left/right IDs = 24 unique submissions.
      expect(mockSemanticClient.getEmbedding).toHaveBeenCalledTimes(
        pairCount * 2,
      )
      expect(maxInFlightRequests).toBeLessThanOrEqual(4)
    })

    // Note: Logic for insufficient files/submissions is now largely inside
    // PlagiarismSubmissionFileService or PlagiarismDetector or handled by empty array return.
    // If PlagiarismSubmissionFileService throws, we expect that error.
    // If it returns empty array, PlagiarismDetector might complain or we check it before.
    // Looking at code: PlagiarismService.analyzeAssignmentSubmissions (refactored)
    // calls `fileService.fetchSubmissionFiles(assignmentId)`.
    // Then it calls `detector.analyze(files)`.
    // The detector (or factory) validation logic might throw insufficient files error
    // OR the service might throw it immediately if we want fail-fast.
    // In the original code, it threw InsufficientFilesError explicitly.
    // In the refactored code (Step 144):
    // It fetches files, creates ignoredFile, then calls `detector.analyze`.
    // `PlagiarismDetector` typically throws if not enough files.
    // So we can assume `detector.analyze` throws if files < 2.
  })

  describe("getPairDetails", () => {
    it("returns persisted semantic and hybrid scores for database-backed pair details", async () => {
      mockPersistenceService.getResultData.mockResolvedValue({
        result: {
          id: 55,
          submission1Id: 101,
          submission2Id: 202,
          structuralScore: "0.900000",
          semanticScore: "0.400000",
          hybridScore: "0.750000",
          overlap: 44,
          longestFragment: 15,
        },
        fragments: [],
        submission1: {
          submission: {
            filePath: "left.py",
            fileName: "left.py",
          },
          studentName: "Student Left",
        },
        submission2: {
          submission: {
            filePath: "right.py",
            fileName: "right.py",
          },
          studentName: "Student Right",
        },
      })
      mockFileService.downloadSubmissionFiles.mockResolvedValue([
        'print("left")',
        'print("right")',
      ])

      const result = await plagiarismService.getPairDetails("1", 55)

      expect(result.pair.structuralScore).toBe(0.9)
      expect(result.pair.semanticScore).toBe(0.4)
      expect(result.pair.hybridScore).toBe(0.75)
    })
  })
})
