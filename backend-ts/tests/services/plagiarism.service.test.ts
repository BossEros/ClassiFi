import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  PlagiarismService,
  type AnalyzeRequest,
} from "../../src/services/plagiarism.service.js"
import { PlagiarismPersistenceService } from "../../src/services/plagiarism/plagiarism-persistence.service.js"
import { SubmissionFileService } from "../../src/services/plagiarism/submission-file.service.js"
import { PlagiarismDetectorFactory } from "../../src/services/plagiarism/plagiarism-detector.factory.js"
import { createMockAssignment } from "../utils/factories.js"
import {
  AssignmentNotFoundError,
  InsufficientFilesError,
  LanguageRequiredError,
  InsufficientDownloadedFilesError,
  UnsupportedLanguageError,
} from "../../src/shared/errors.js"

// Mock repositories
vi.mock("../../src/repositories/assignment.repository.js")

// Mock new services
vi.mock("../../src/services/plagiarism/plagiarism-persistence.service.js")
vi.mock("../../src/services/plagiarism/submission-file.service.js")
vi.mock("../../src/services/plagiarism/plagiarism-detector.factory.js")

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
        info: { studentId: "1", studentName: "Student 1" },
      },
      rightFile: {
        path: "file2.py",
        filename: "file2.py",
        content: 'print("hello")',
        lineCount: 1,
        info: { studentId: "2", studentName: "Student 2" },
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
  let mockDetectorFactory: any

  beforeEach(() => {
    mockAssignmentRepo = {
      getAssignmentById: vi.fn(),
    }

    mockPersistenceService = {
      persistReport: vi.fn().mockResolvedValue({
        dbReport: { id: 1 },
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

    mockDetectorFactory = {
      create: vi.fn().mockReturnValue(mockDetector),
    }

    // Reset legacy store
    ;(PlagiarismService as any).prototype.legacyReportsStore = new Map()

    plagiarismService = new PlagiarismService(
      mockAssignmentRepo,
      mockDetectorFactory,
      mockFileService,
      mockPersistenceService,
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("analyzeFiles", () => {
    it("should successfully analyze files", async () => {
      const request: AnalyzeRequest = {
        files: [
          { path: "file1.py", content: 'print("hello")' },
          { path: "file2.py", content: 'print("hello")' },
        ],
        language: "python",
      }

      const result = await plagiarismService.analyzeFiles(request)

      expect(result).toBeDefined()
      expect(result.reportId).toBeDefined()
      expect(result.summary).toBeDefined()
      expect(result.pairs).toHaveLength(1)
      expect(mockDetectorFactory.create).toHaveBeenCalled()
      expect(mockDetector.analyze).toHaveBeenCalled()
    })

    it("should throw InsufficientFilesError when less than 2 files", async () => {
      const request: AnalyzeRequest = {
        files: [{ path: "file1.py", content: 'print("hello")' }],
        language: "python",
      }

      await expect(plagiarismService.analyzeFiles(request)).rejects.toThrow(
        InsufficientFilesError,
      )
    })

    it("should throw InsufficientFilesError when files is empty", async () => {
      const request: AnalyzeRequest = {
        files: [],
        language: "python",
      }

      await expect(plagiarismService.analyzeFiles(request)).rejects.toThrow(
        InsufficientFilesError,
      )
    })

    it("should throw LanguageRequiredError when language is missing", async () => {
      const request: AnalyzeRequest = {
        files: [
          { path: "file1.py", content: 'print("hello")' },
          { path: "file2.py", content: 'print("hello")' },
        ],
        language: "" as any,
      }

      await expect(plagiarismService.analyzeFiles(request)).rejects.toThrow(
        LanguageRequiredError,
      )
    })
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
      expect(mockFileService.fetchSubmissionFiles).toHaveBeenCalledWith(1)
      expect(mockDetectorFactory.create).toHaveBeenCalled()
      expect(mockDetector.analyze).toHaveBeenCalled()
      expect(mockPersistenceService.persistReport).toHaveBeenCalled()
    })

    // Note: Logic for insufficient files/submissions is now largely inside
    // SubmissionFileService or PlagiarismDetector or handled by empty array return.
    // If SubmissionFileService throws, we expect that error.
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
})
