import { describe, it, expect, vi, beforeEach } from "vitest";

import * as plagiarismService from "./plagiarismService";
import * as plagiarismRepository from "@/data/repositories/plagiarismRepository";

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
    const mockAnalysisResponse = {
      success: true,
      analysisId: 123,
      totalPairs: 5,
      pairs: [
        {
          id: 1,
          submission1Id: 1,
          submission2Id: 2,
          similarityScore: 85,
        },
      ],
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
      expect(result.success).toBe(true);
      expect(result.totalPairs).toBe(5);
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
    const mockDetailsResponse = {
      success: true,
      pair: {
        id: 1,
        submission1Id: 1,
        submission2Id: 2,
        similarityScore: 85,
      },
      files: [
        { submissionId: 1, content: "code1", filename: "solution.py" },
        { submissionId: 2, content: "code2", filename: "solution.py" },
      ],
      matchedLines: [{ line1: 5, line2: 5, similarity: 100 }],
    };

    it("returns details for a similarity result", async () => {
      vi.mocked(plagiarismRepository.getResultDetails).mockResolvedValue({
        data: mockDetailsResponse,
        status: 200,
      });

      const result = await plagiarismService.getResultDetails(1);

      expect(plagiarismRepository.getResultDetails).toHaveBeenCalledWith(1);
      expect(result.success).toBe(true);
      expect(result.files).toHaveLength(2);
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
