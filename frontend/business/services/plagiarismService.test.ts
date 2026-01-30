import { describe, it, expect, vi, beforeEach } from "vitest"

import * as plagiarismService from "@/business/services/plagiarismService"
import * as plagiarismRepository from "@/data/repositories/plagiarismRepository"
import type {
  AnalyzeResponse,
  ResultDetailsResponse,
  StudentSummary,
  PairResponse,
} from "@/data/api/types"

// Mock the repository
vi.mock("@/data/repositories/plagiarismRepository")

describe("plagiarismService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // analyzeAssignmentSubmissions Tests
  // ============================================================================

  describe("analyzeAssignmentSubmissions", () => {
    const mockAnalysisResponse: AnalyzeResponse = {
      reportId: "report-123",
      summary: {
        totalFiles: 10,
        totalPairs: 5,
        suspiciousPairs: 2,
        averageSimilarity: 45.5,
        maxSimilarity: 85.0,
      },
      pairs: [
        {
          id: 1,
          leftFile: {
            id: 1,
            path: "/submissions/1/solution.py",
            filename: "solution.py",
            lineCount: 50,
            studentId: "student-1",
            studentName: "John Doe",
          },
          rightFile: {
            id: 2,
            path: "/submissions/2/solution.py",
            filename: "solution.py",
            lineCount: 48,
            studentId: "student-2",
            studentName: "Jane Smith",
          },
          structuralScore: 85.0,
          semanticScore: 78.0,
          hybridScore: 82.0,
          overlap: 35,
          longest: 12,
        },
      ],
      warnings: [],
    }

    it("returns analysis results for an assignment", async () => {
      vi.mocked(
        plagiarismRepository.analyzePlagiarismForAllSubmissionsInAssignment,
      ).mockResolvedValue({
        data: mockAnalysisResponse,
        status: 200,
      })

      const result = await plagiarismService.analyzeAssignmentSubmissions(1)

      expect(
        plagiarismRepository.analyzePlagiarismForAllSubmissionsInAssignment,
      ).toHaveBeenCalledWith(1)
      expect(result.reportId).toBe("report-123")
      expect(result.summary.totalPairs).toBe(5)
      expect(result.pairs).toHaveLength(1)
    })

    it("throws error for invalid assignment ID", async () => {
      await expect(
        plagiarismService.analyzeAssignmentSubmissions(0),
      ).rejects.toThrow("Invalid assignment ID")
    })

    it("throws error when API returns error", async () => {
      vi.mocked(
        plagiarismRepository.analyzePlagiarismForAllSubmissionsInAssignment,
      ).mockResolvedValue({
        error: "Analysis failed",
        status: 500,
      })

      await expect(
        plagiarismService.analyzeAssignmentSubmissions(1),
      ).rejects.toThrow("Analysis failed")
    })

    it("throws error when data is missing", async () => {
      vi.mocked(
        plagiarismRepository.analyzePlagiarismForAllSubmissionsInAssignment,
      ).mockResolvedValue({
        data: undefined,
        status: 200,
      })

      await expect(
        plagiarismService.analyzeAssignmentSubmissions(1),
      ).rejects.toThrow("Failed to analyze submissions")
    })
  })

  // ============================================================================
  // getResultDetails Tests
  // ============================================================================

  describe("getResultDetails", () => {
    const mockDetailsResponse: ResultDetailsResponse = {
      result: {
        id: 1,
        submission1Id: 1,
        submission2Id: 2,
        structuralScore: "85.00",
        overlap: 35,
        longestFragment: 12,
      },
      fragments: [
        {
          id: 1,
          leftSelection: {
            startRow: 5,
            startCol: 0,
            endRow: 10,
            endCol: 45,
          },
          rightSelection: {
            startRow: 8,
            startCol: 0,
            endRow: 13,
            endCol: 45,
          },
          length: 6,
        },
      ],
      leftFile: {
        filename: "solution.py",
        content: "def solution():\n    pass",
        lineCount: 50,
        studentName: "John Doe",
      },
      rightFile: {
        filename: "solution.py",
        content: "def solution():\n    return None",
        lineCount: 48,
        studentName: "Jane Smith",
      },
    }

    it("returns details for a similarity result", async () => {
      vi.mocked(
        plagiarismRepository.getPlagiarismResultDetailsWithFragmentsById,
      ).mockResolvedValue({
        data: mockDetailsResponse,
        status: 200,
      })

      const result = await plagiarismService.getResultDetails(1)

      expect(
        plagiarismRepository.getPlagiarismResultDetailsWithFragmentsById,
      ).toHaveBeenCalledWith(1)
      expect(result.result.id).toBe(1)
      expect(result.fragments).toHaveLength(1)
      expect(result.leftFile.studentName).toBe("John Doe")
      expect(result.rightFile.studentName).toBe("Jane Smith")
    })

    it("throws error for invalid result ID", async () => {
      await expect(plagiarismService.getResultDetails(0)).rejects.toThrow(
        "Invalid result ID",
      )
    })

    it("throws error when API returns error", async () => {
      vi.mocked(
        plagiarismRepository.getPlagiarismResultDetailsWithFragmentsById,
      ).mockResolvedValue({
        error: "Not found",
        status: 404,
      })

      await expect(plagiarismService.getResultDetails(999)).rejects.toThrow(
        "Not found",
      )
    })

    it("throws error when data is missing", async () => {
      vi.mocked(
        plagiarismRepository.getPlagiarismResultDetailsWithFragmentsById,
      ).mockResolvedValue({
        data: undefined,
        status: 200,
      })

      await expect(plagiarismService.getResultDetails(1)).rejects.toThrow(
        "Failed to fetch result details",
      )
    })
  })

  // ============================================================================
  // getStudentSummary Tests
  // ============================================================================

  describe("getStudentSummary", () => {
    const mockStudentSummary: StudentSummary[] = [
      {
        studentId: 1,
        studentName: "John Doe",
        submissionId: 101,
        originalityScore: 0.25,
        highestSimilarity: 0.75,
        highestMatchWith: {
          studentId: 2,
          studentName: "Jane Smith",
          submissionId: 102,
        },
        totalPairs: 5,
        suspiciousPairs: 2,
      },
      {
        studentId: 2,
        studentName: "Jane Smith",
        submissionId: 102,
        originalityScore: 0.45,
        highestSimilarity: 0.55,
        highestMatchWith: {
          studentId: 3,
          studentName: "Bob Johnson",
          submissionId: 103,
        },
        totalPairs: 4,
        suspiciousPairs: 1,
      },
    ]

    it("returns student summary for a report", async () => {
      vi.mocked(
        plagiarismRepository.getStudentSummaryForReport,
      ).mockResolvedValue({
        data: mockStudentSummary,
        status: 200,
      })

      const result = await plagiarismService.getStudentSummary("report-123")

      expect(
        plagiarismRepository.getStudentSummaryForReport,
      ).toHaveBeenCalledWith("report-123")
      expect(result).toHaveLength(2)
      expect(result[0].studentName).toBe("John Doe")
      expect(result[0].originalityScore).toBe(0.25)
      expect(result[1].studentName).toBe("Jane Smith")
    })

    it("throws error for empty report ID", async () => {
      await expect(plagiarismService.getStudentSummary("")).rejects.toThrow(
        "Report ID is required",
      )
    })

    it("throws error for whitespace-only report ID", async () => {
      await expect(plagiarismService.getStudentSummary("   ")).rejects.toThrow(
        "Report ID is required",
      )
    })

    it("throws error when API returns error", async () => {
      vi.mocked(
        plagiarismRepository.getStudentSummaryForReport,
      ).mockResolvedValue({
        error: "Report not found",
        status: 404,
      })

      await expect(
        plagiarismService.getStudentSummary("invalid-report"),
      ).rejects.toThrow("Report not found")
    })

    it("throws error when data is missing", async () => {
      vi.mocked(
        plagiarismRepository.getStudentSummaryForReport,
      ).mockResolvedValue({
        data: undefined,
        status: 200,
      })

      await expect(
        plagiarismService.getStudentSummary("report-123"),
      ).rejects.toThrow("Failed to fetch student summary")
    })
  })

  // ============================================================================
  // getStudentPairs Tests
  // ============================================================================

  describe("getStudentPairs", () => {
    const mockPairs: PairResponse[] = [
      {
        id: 1,
        leftFile: {
          id: 101,
          path: "/submissions/101/solution.py",
          filename: "solution.py",
          lineCount: 50,
          studentId: "1",
          studentName: "John Doe",
        },
        rightFile: {
          id: 102,
          path: "/submissions/102/solution.py",
          filename: "solution.py",
          lineCount: 48,
          studentId: "2",
          studentName: "Jane Smith",
        },
        structuralScore: 75.0,
        semanticScore: 70.0,
        hybridScore: 72.5,
        overlap: 30,
        longest: 10,
      },
      {
        id: 2,
        leftFile: {
          id: 101,
          path: "/submissions/101/solution.py",
          filename: "solution.py",
          lineCount: 50,
          studentId: "1",
          studentName: "John Doe",
        },
        rightFile: {
          id: 103,
          path: "/submissions/103/solution.py",
          filename: "solution.py",
          lineCount: 52,
          studentId: "3",
          studentName: "Bob Johnson",
        },
        structuralScore: 55.0,
        semanticScore: 50.0,
        hybridScore: 52.5,
        overlap: 20,
        longest: 8,
      },
    ]

    it("returns pairs for a student submission", async () => {
      vi.mocked(plagiarismRepository.getStudentPairs).mockResolvedValue({
        data: mockPairs,
        status: 200,
      })

      const result = await plagiarismService.getStudentPairs("report-123", 101)

      expect(plagiarismRepository.getStudentPairs).toHaveBeenCalledWith(
        "report-123",
        101,
      )
      expect(result).toHaveLength(2)
      expect(result[0].leftFile.studentName).toBe("John Doe")
      expect(result[0].rightFile.studentName).toBe("Jane Smith")
    })

    it("throws error for empty report ID", async () => {
      await expect(
        plagiarismService.getStudentPairs("", 101),
      ).rejects.toThrow("Report ID is required")
    })

    it("throws error for whitespace-only report ID", async () => {
      await expect(
        plagiarismService.getStudentPairs("   ", 101),
      ).rejects.toThrow("Report ID is required")
    })

    it("throws error for invalid submission ID", async () => {
      await expect(
        plagiarismService.getStudentPairs("report-123", 0),
      ).rejects.toThrow("Invalid submission ID")
    })

    it("throws error for negative submission ID", async () => {
      await expect(
        plagiarismService.getStudentPairs("report-123", -1),
      ).rejects.toThrow("Invalid submission ID")
    })

    it("throws error when API returns error", async () => {
      vi.mocked(plagiarismRepository.getStudentPairs).mockResolvedValue({
        error: "Submission not found",
        status: 404,
      })

      await expect(
        plagiarismService.getStudentPairs("report-123", 999),
      ).rejects.toThrow("Submission not found")
    })

    it("throws error when data is missing", async () => {
      vi.mocked(plagiarismRepository.getStudentPairs).mockResolvedValue({
        data: undefined,
        status: 200,
      })

      await expect(
        plagiarismService.getStudentPairs("report-123", 101),
      ).rejects.toThrow("Failed to fetch student pairs")
    })
  })
})
