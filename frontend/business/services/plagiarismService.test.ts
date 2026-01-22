import { describe, it, expect, vi, beforeEach } from "vitest";

import * as plagiarismService from "@/business/services/plagiarismService";
import * as plagiarismRepository from "@/data/repositories/plagiarismRepository";
import type { AnalyzeResponse, ResultDetailsResponse } from "@/data/api/types";

// Mock the repository
vi.mock("@/data/repositories/plagiarismRepository");

describe("plagiarismService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    };

    it("returns analysis results for an assignment", async () => {
      vi.mocked(
        plagiarismRepository.analyzeAssignmentSubmissions,
      ).mockResolvedValue({
        data: mockAnalysisResponse,
        status: 200,
      });

      const result = await plagiarismService.analyzeAssignmentSubmissions(1);

      expect(
        plagiarismRepository.analyzeAssignmentSubmissions,
      ).toHaveBeenCalledWith(1);
      expect(result.reportId).toBe("report-123");
      expect(result.summary.totalPairs).toBe(5);
      expect(result.pairs).toHaveLength(1);
    });

    it("throws error for invalid assignment ID", async () => {
      await expect(
        plagiarismService.analyzeAssignmentSubmissions(0),
      ).rejects.toThrow("Invalid assignment ID");
    });

    it("throws error when API returns error", async () => {
      vi.mocked(
        plagiarismRepository.analyzeAssignmentSubmissions,
      ).mockResolvedValue({
        error: "Analysis failed",
        status: 500,
      });

      await expect(
        plagiarismService.analyzeAssignmentSubmissions(1),
      ).rejects.toThrow("Analysis failed");
    });

    it("throws error when data is missing", async () => {
      vi.mocked(
        plagiarismRepository.analyzeAssignmentSubmissions,
      ).mockResolvedValue({
        data: undefined,
        status: 200,
      });

      await expect(
        plagiarismService.analyzeAssignmentSubmissions(1),
      ).rejects.toThrow("Failed to analyze submissions");
    });
  });

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
    };

    it("returns details for a similarity result", async () => {
      vi.mocked(plagiarismRepository.getResultDetails).mockResolvedValue({
        data: mockDetailsResponse,
        status: 200,
      });

      const result = await plagiarismService.getResultDetails(1);

      expect(plagiarismRepository.getResultDetails).toHaveBeenCalledWith(1);
      expect(result.result.id).toBe(1);
      expect(result.fragments).toHaveLength(1);
      expect(result.leftFile.studentName).toBe("John Doe");
      expect(result.rightFile.studentName).toBe("Jane Smith");
    });

    it("throws error for invalid result ID", async () => {
      await expect(plagiarismService.getResultDetails(0)).rejects.toThrow(
        "Invalid result ID",
      );
    });

    it("throws error when API returns error", async () => {
      vi.mocked(plagiarismRepository.getResultDetails).mockResolvedValue({
        error: "Not found",
        status: 404,
      });

      await expect(plagiarismService.getResultDetails(999)).rejects.toThrow(
        "Not found",
      );
    });

    it("throws error when data is missing", async () => {
      vi.mocked(plagiarismRepository.getResultDetails).mockResolvedValue({
        data: undefined,
        status: 200,
      });

      await expect(plagiarismService.getResultDetails(1)).rejects.toThrow(
        "Failed to fetch result details",
      );
    });
  });
});
