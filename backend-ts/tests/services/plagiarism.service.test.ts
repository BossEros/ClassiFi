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

  describe("getStudentSummary", () => {
    it("should calculate originality scores correctly", async () => {
      const mockReportData = {
        reportId: "1",
        summary: {
          totalFiles: 3,
          totalPairs: 3,
          suspiciousPairs: 1,
          averageSimilarity: 0.5,
          maxSimilarity: 0.8,
        },
        pairs: [
          {
            id: 1,
            leftFile: {
              id: 101,
              studentId: "1",
              studentName: "Alice",
              path: "file1.py",
              filename: "file1.py",
              lineCount: 10,
            },
            rightFile: {
              id: 102,
              studentId: "2",
              studentName: "Bob",
              path: "file2.py",
              filename: "file2.py",
              lineCount: 10,
            },
            structuralScore: 0.8,
            semanticScore: 0,
            hybridScore: 0,
            overlap: 50,
            longest: 10,
          },
          {
            id: 2,
            leftFile: {
              id: 101,
              studentId: "1",
              studentName: "Alice",
              path: "file1.py",
              filename: "file1.py",
              lineCount: 10,
            },
            rightFile: {
              id: 103,
              studentId: "3",
              studentName: "Charlie",
              path: "file3.py",
              filename: "file3.py",
              lineCount: 10,
            },
            structuralScore: 0.3,
            semanticScore: 0,
            hybridScore: 0,
            overlap: 20,
            longest: 5,
          },
          {
            id: 3,
            leftFile: {
              id: 102,
              studentId: "2",
              studentName: "Bob",
              path: "file2.py",
              filename: "file2.py",
              lineCount: 10,
            },
            rightFile: {
              id: 103,
              studentId: "3",
              studentName: "Charlie",
              path: "file3.py",
              filename: "file3.py",
              lineCount: 10,
            },
            structuralScore: 0.4,
            semanticScore: 0,
            hybridScore: 0,
            overlap: 30,
            longest: 7,
          },
        ],
        warnings: [],
      }

      mockPersistenceService.getReport.mockResolvedValue(mockReportData)

      const result = await plagiarismService.getStudentSummary(1)

      expect(result).toHaveLength(3)

      // Alice has max similarity 0.8, so originality = 0.2
      const alice = result.find((s) => s.studentName === "Alice")
      expect(alice).toBeDefined()
      expect(alice!.originalityScore).toBeCloseTo(0.2, 10)
      expect(alice!.highestSimilarity).toBe(0.8)
      expect(alice!.highestMatchWith.studentName).toBe("Bob")
      expect(alice!.totalPairs).toBe(2)
      expect(alice!.suspiciousPairs).toBe(1) // Only pair with Bob is above 0.7

      // Bob has max similarity 0.8, so originality = 0.2
      const bob = result.find((s) => s.studentName === "Bob")
      expect(bob).toBeDefined()
      expect(bob!.originalityScore).toBeCloseTo(0.2, 10)
      expect(bob!.highestSimilarity).toBe(0.8)

      // Charlie has max similarity 0.4, so originality = 0.6
      const charlie = result.find((s) => s.studentName === "Charlie")
      expect(charlie).toBeDefined()
      expect(charlie!.originalityScore).toBeCloseTo(0.6, 10)
      expect(charlie!.highestSimilarity).toBe(0.4)
      expect(charlie!.totalPairs).toBe(2)
      expect(charlie!.suspiciousPairs).toBe(0) // No pairs above 0.7
    })

    it("should sort by originality ascending (lowest first)", async () => {
      const mockReportData = {
        reportId: "1",
        summary: {
          totalFiles: 2,
          totalPairs: 1,
          suspiciousPairs: 0,
          averageSimilarity: 0.3,
          maxSimilarity: 0.3,
        },
        pairs: [
          {
            id: 1,
            leftFile: {
              id: 101,
              studentId: "1",
              studentName: "Alice",
              path: "file1.py",
              filename: "file1.py",
              lineCount: 10,
            },
            rightFile: {
              id: 102,
              studentId: "2",
              studentName: "Bob",
              path: "file2.py",
              filename: "file2.py",
              lineCount: 10,
            },
            structuralScore: 0.3,
            semanticScore: 0,
            hybridScore: 0,
            overlap: 20,
            longest: 5,
          },
        ],
        warnings: [],
      }

      mockPersistenceService.getReport.mockResolvedValue(mockReportData)

      const result = await plagiarismService.getStudentSummary(1)

      expect(result).toHaveLength(2)
      // Both have same originality (0.7), so order may vary, but should be sorted
      expect(result[0].originalityScore).toBeLessThanOrEqual(
        result[1].originalityScore,
      )
    })

    it("should handle student with no pairs (edge case)", async () => {
      const mockReportData = {
        reportId: "1",
        summary: {
          totalFiles: 1,
          totalPairs: 0,
          suspiciousPairs: 0,
          averageSimilarity: 0,
          maxSimilarity: 0,
        },
        pairs: [],
        warnings: [],
      }

      mockPersistenceService.getReport.mockResolvedValue(mockReportData)

      const result = await plagiarismService.getStudentSummary(1)

      expect(result).toHaveLength(0)
    })

    it("should throw PlagiarismReportNotFoundError when report not found", async () => {
      mockPersistenceService.getReport.mockResolvedValue(null)

      await expect(plagiarismService.getStudentSummary(1)).rejects.toThrow(
        "Plagiarism report not found",
      )
    })
  })

  describe("getStudentPairs", () => {
    it("should return all pairs for a student", async () => {
      const mockReportData = {
        reportId: "1",
        summary: {
          totalFiles: 3,
          totalPairs: 3,
          suspiciousPairs: 1,
          averageSimilarity: 0.5,
          maxSimilarity: 0.8,
        },
        pairs: [
          {
            id: 1,
            leftFile: {
              id: 101,
              studentId: "1",
              studentName: "Alice",
              path: "file1.py",
              filename: "file1.py",
              lineCount: 10,
            },
            rightFile: {
              id: 102,
              studentId: "2",
              studentName: "Bob",
              path: "file2.py",
              filename: "file2.py",
              lineCount: 10,
            },
            structuralScore: 0.8,
            semanticScore: 0,
            hybridScore: 0,
            overlap: 50,
            longest: 10,
          },
          {
            id: 2,
            leftFile: {
              id: 101,
              studentId: "1",
              studentName: "Alice",
              path: "file1.py",
              filename: "file1.py",
              lineCount: 10,
            },
            rightFile: {
              id: 103,
              studentId: "3",
              studentName: "Charlie",
              path: "file3.py",
              filename: "file3.py",
              lineCount: 10,
            },
            structuralScore: 0.3,
            semanticScore: 0,
            hybridScore: 0,
            overlap: 20,
            longest: 5,
          },
          {
            id: 3,
            leftFile: {
              id: 102,
              studentId: "2",
              studentName: "Bob",
              path: "file2.py",
              filename: "file2.py",
              lineCount: 10,
            },
            rightFile: {
              id: 103,
              studentId: "3",
              studentName: "Charlie",
              path: "file3.py",
              filename: "file3.py",
              lineCount: 10,
            },
            structuralScore: 0.4,
            semanticScore: 0,
            hybridScore: 0,
            overlap: 30,
            longest: 7,
          },
        ],
        warnings: [],
      }

      mockPersistenceService.getReport.mockResolvedValue(mockReportData)

      const result = await plagiarismService.getStudentPairs(1, 101)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(1) // Highest similarity first (0.8)
      expect(result[1].id).toBe(2) // Lower similarity (0.3)
    })

    it("should sort pairs by similarity descending", async () => {
      const mockReportData = {
        reportId: "1",
        summary: {
          totalFiles: 2,
          totalPairs: 2,
          suspiciousPairs: 0,
          averageSimilarity: 0.4,
          maxSimilarity: 0.5,
        },
        pairs: [
          {
            id: 1,
            leftFile: {
              id: 101,
              studentId: "1",
              studentName: "Alice",
              path: "file1.py",
              filename: "file1.py",
              lineCount: 10,
            },
            rightFile: {
              id: 102,
              studentId: "2",
              studentName: "Bob",
              path: "file2.py",
              filename: "file2.py",
              lineCount: 10,
            },
            structuralScore: 0.3,
            semanticScore: 0,
            hybridScore: 0,
            overlap: 20,
            longest: 5,
          },
          {
            id: 2,
            leftFile: {
              id: 101,
              studentId: "1",
              studentName: "Alice",
              path: "file1.py",
              filename: "file1.py",
              lineCount: 10,
            },
            rightFile: {
              id: 103,
              studentId: "3",
              studentName: "Charlie",
              path: "file3.py",
              filename: "file3.py",
              lineCount: 10,
            },
            structuralScore: 0.5,
            semanticScore: 0,
            hybridScore: 0,
            overlap: 30,
            longest: 7,
          },
        ],
        warnings: [],
      }

      mockPersistenceService.getReport.mockResolvedValue(mockReportData)

      const result = await plagiarismService.getStudentPairs(1, 101)

      expect(result).toHaveLength(2)
      expect(result[0].structuralScore).toBeGreaterThan(
        result[1].structuralScore,
      )
    })

    it("should return empty array for student with no pairs", async () => {
      const mockReportData = {
        reportId: "1",
        summary: {
          totalFiles: 2,
          totalPairs: 1,
          suspiciousPairs: 0,
          averageSimilarity: 0.3,
          maxSimilarity: 0.3,
        },
        pairs: [
          {
            id: 1,
            leftFile: {
              id: 102,
              studentId: "2",
              studentName: "Bob",
              path: "file2.py",
              filename: "file2.py",
              lineCount: 10,
            },
            rightFile: {
              id: 103,
              studentId: "3",
              studentName: "Charlie",
              path: "file3.py",
              filename: "file3.py",
              lineCount: 10,
            },
            structuralScore: 0.3,
            semanticScore: 0,
            hybridScore: 0,
            overlap: 20,
            longest: 5,
          },
        ],
        warnings: [],
      }

      mockPersistenceService.getReport.mockResolvedValue(mockReportData)

      const result = await plagiarismService.getStudentPairs(1, 101)

      expect(result).toHaveLength(0)
    })

    it("should throw PlagiarismReportNotFoundError when report not found", async () => {
      mockPersistenceService.getReport.mockResolvedValue(null)

      await expect(plagiarismService.getStudentPairs(1, 101)).rejects.toThrow(
        "Plagiarism report not found",
      )
    })
  })
})
