import { describe, it, expect, vi, beforeEach } from "vitest";

import * as testService from "./testService";
import * as testCaseRepository from "@/data/repositories/testCaseRepository";
import * as testNormalization from "@/shared/utils/testNormalization";
import type { RawTestResult } from "@/shared/types/testCase";

// Mock dependencies
vi.mock("@/data/repositories/testCaseRepository");
vi.mock("@/shared/utils/testNormalization");

describe("testService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // runTestsPreview Tests
  // ============================================================================

  describe("runTestsPreview", () => {
    const mockSourceCode = "print('hello')";
    const mockLanguage = "python" as const;
    const mockAssignmentId = 1;

    const mockRawResult = {
      passedCount: 1,
      totalCount: 1,
      score: 100,
      results: [{ testCaseId: 1, status: "Passed" as const, input: "", actualOutput: "" }] as RawTestResult[],
    };

    const mockNormalizedResult = {
      id: "1",
      status: "passed",
      name: "Test Case 1",
    };

    it("executes preview successfully", async () => {
      vi.mocked(testCaseRepository.runTestsPreview).mockResolvedValue({
        data: {
          success: true,
          message: "",
          data: mockRawResult,
        } as any,
        status: 200,
      });

      vi.mocked(testNormalization.normalizeTestResult).mockReturnValue(
        mockNormalizedResult as any,
      );

      const result = await testService.runTestsPreview(
        mockSourceCode,
        mockLanguage,
        mockAssignmentId,
      );

      expect(testCaseRepository.runTestsPreview).toHaveBeenCalledWith(
        mockSourceCode,
        mockLanguage,
        mockAssignmentId,
      );
      expect(testNormalization.normalizeTestResult).toHaveBeenCalled();
      expect(result).toEqual({
        passed: 1,
        total: 1,
        percentage: 100,
        results: [mockNormalizedResult],
      });
    });

    it("throws error when execution fails", async () => {
      vi.mocked(testCaseRepository.runTestsPreview).mockResolvedValue({
        error: "Execution failed",
        status: 400,
      });

      await expect(
        testService.runTestsPreview(
          mockSourceCode,
          mockLanguage,
          mockAssignmentId,
        ),
      ).rejects.toThrow("Execution failed");
    });

    it("throws error when API returns unsuccessful status", async () => {
      vi.mocked(testCaseRepository.runTestsPreview).mockResolvedValue({
        data: {
          success: false,
          message: "Compilation error",
        } as any,
        status: 200,
      });

      await expect(
        testService.runTestsPreview(
          mockSourceCode,
          mockLanguage,
          mockAssignmentId,
        ),
      ).rejects.toThrow("Compilation error");
    });

    it("throws error when data is missing", async () => {
      vi.mocked(testCaseRepository.runTestsPreview).mockResolvedValue({
        data: {
          success: true,
          message: "",
          data: null,
        } as any,
        status: 200,
      });

      await expect(
        testService.runTestsPreview(
          mockSourceCode,
          mockLanguage,
          mockAssignmentId,
        ),
      ).rejects.toThrow("Test execution data is missing from the response");
    });
  });

  // ============================================================================
  // getTestResultsForSubmission Tests
  // ============================================================================

  describe("getTestResultsForSubmission", () => {
    const mockSubmissionId = 123;
    const mockRawSummary = {
      passedCount: 2,
      totalCount: 3,
      score: 66,
      results: [
        { testCaseId: 1, status: "Passed" as const, input: "", actualOutput: "" },
        { testCaseId: 2, status: "Passed" as const, input: "", actualOutput: "" },
        { testCaseId: 3, status: "Failed" as const, input: "", actualOutput: "" },
      ] as RawTestResult[],
    };

    it("fetches results successfully", async () => {
      vi.mocked(testCaseRepository.getTestResults).mockResolvedValue({
        data: {
          success: true,
          message: "",
          data: mockRawSummary,
        } as any,
        status: 200,
      });

      const result =
        await testService.getTestResultsForSubmission(mockSubmissionId);

      expect(testCaseRepository.getTestResults).toHaveBeenCalledWith(
        mockSubmissionId,
      );
      expect(result.passed).toBe(2);
      expect(result.total).toBe(3);
      expect(testNormalization.normalizeTestResult).toHaveBeenCalledTimes(3);
    });

    it("throws error when fetch fails", async () => {
      vi.mocked(testCaseRepository.getTestResults).mockResolvedValue({
        error: "Network error",
        status: 400,
      });

      await expect(
        testService.getTestResultsForSubmission(mockSubmissionId),
      ).rejects.toThrow("Network error");
    });

    it("throws error when API returns unsuccessful status", async () => {
      vi.mocked(testCaseRepository.getTestResults).mockResolvedValue({
        data: {
          success: false,
          message: "Results not found",
        } as any,
        status: 200,
      });

      await expect(
        testService.getTestResultsForSubmission(mockSubmissionId),
      ).rejects.toThrow("Results not found");
    });

    it("throws error when data is missing", async () => {
      vi.mocked(testCaseRepository.getTestResults).mockResolvedValue({
        data: {
          success: true,
          message: "",
          data: null,
        } as any,
        status: 200,
      });

      await expect(
        testService.getTestResultsForSubmission(mockSubmissionId),
      ).rejects.toThrow("Test results data is missing from the response");
    });
  });
});
