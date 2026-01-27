import { describe, it, expect, vi, beforeEach } from "vitest";

import * as plagiarismRepository from "./plagiarismRepository";
import { apiClient } from "@/data/api/apiClient";

// Mock the apiClient module
vi.mock("@/data/api/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("plagiarismRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // analyzePlagiarismForAllSubmissionsInAssignment Tests
  // ============================================================================

  describe("analyzePlagiarismForAllSubmissionsInAssignment", () => {
    const mockAnalyzeResponse = {
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
          },
          rightFile: {
            id: 2,
            path: "/submissions/2/solution.py",
            filename: "solution.py",
            lineCount: 48,
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

    it("triggers plagiarism analysis for an assignment", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockAnalyzeResponse,
        status: 200,
      });

      const result = await plagiarismRepository.analyzePlagiarismForAllSubmissionsInAssignment(1);

      expect(apiClient.post).toHaveBeenCalledWith(
        "/plagiarism/analyze/assignment/1",
        {},
      );
      expect(result.data).toEqual(mockAnalyzeResponse);
    });

    it("returns error when API fails", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        error: "Analysis failed",
        status: 500,
      });

      const result = await plagiarismRepository.analyzePlagiarismForAllSubmissionsInAssignment(1);

      expect(result.error).toBe("Analysis failed");
    });

    it("returns error for insufficient submissions", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        error: "At least 2 submissions required for analysis",
        status: 400,
      });

      const result = await plagiarismRepository.analyzePlagiarismForAllSubmissionsInAssignment(1);

      expect(result.error).toBe("At least 2 submissions required for analysis");
    });
  });

  // ============================================================================
  // getPlagiarismResultDetailsWithFragmentsById Tests
  // ============================================================================

  describe("getPlagiarismResultDetailsWithFragmentsById", () => {
    const mockResultDetails = {
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

    it("fetches detailed comparison results", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockResultDetails,
        status: 200,
      });

      const result = await plagiarismRepository.getPlagiarismResultDetailsWithFragmentsById(1);

      expect(apiClient.get).toHaveBeenCalledWith(
        "/plagiarism/results/1/details",
      );
      expect(result.data).toEqual(mockResultDetails);
    });

    it("returns error when result not found", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Result not found",
        status: 404,
      });

      const result = await plagiarismRepository.getPlagiarismResultDetailsWithFragmentsById(999);

      expect(result.error).toBe("Result not found");
    });

    it("returns error on server failure", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Internal server error",
        status: 500,
      });

      const result = await plagiarismRepository.getPlagiarismResultDetailsWithFragmentsById(1);

      expect(result.error).toBe("Internal server error");
    });
  });
});
