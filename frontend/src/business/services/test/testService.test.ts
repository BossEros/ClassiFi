import { describe, it, expect, vi, beforeEach } from "vitest"

import * as testService from "../testService"
import * as testCaseRepository from "@/data/repositories/testCaseRepository"
import * as assignmentRepository from "@/data/repositories/assignmentRepository"
import * as testNormalization from "@/business/services/testResultNormalizer"
import type { RawTestResult } from "@/shared/types/testCase"

// Mock dependencies
vi.mock("@/data/repositories/testCaseRepository")
vi.mock("@/data/repositories/assignmentRepository")
vi.mock("@/business/services/testResultNormalizer")

describe("testService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // runTestsPreview Tests
  // ============================================================================

  describe("runTestsPreview", () => {
    const mockSourceCode = "print('hello')"
    const mockLanguage = "python" as const
    const mockAssignmentId = 1

    const mockRawResult = {
      passed: 1,
      total: 1,
      percentage: 100,
      results: [
        {
          testCaseId: 1,
          status: "Passed" as const,
          input: "",
          actualOutput: "",
        },
      ] as RawTestResult[],
    }

    const mockNormalizedResult = {
      id: "1",
      status: "passed",
      name: "Test Case 1",
    }

    it("executes preview successfully", async () => {
      vi.mocked(
        testCaseRepository.executeTestsInPreviewModeWithoutSaving,
      ).mockResolvedValue({
        data: {
          success: true,
          message: "",
          data: mockRawResult,
        } as any,
        status: 200,
      })

      vi.mocked(testNormalization.normalizeTestResult).mockReturnValue(
        mockNormalizedResult as any,
      )

      const result = await testService.runTestsPreview(
        mockSourceCode,
        mockLanguage,
        mockAssignmentId,
      )

      expect(
        testCaseRepository.executeTestsInPreviewModeWithoutSaving,
      ).toHaveBeenCalledWith(mockSourceCode, mockLanguage, mockAssignmentId)
      expect(testNormalization.normalizeTestResult).toHaveBeenCalled()
      expect(result).toEqual({
        passed: 1,
        total: 1,
        percentage: 100,
        results: [mockNormalizedResult],
      })
    })

    it("supports legacy preview summary fields", async () => {
      vi.mocked(
        testCaseRepository.executeTestsInPreviewModeWithoutSaving,
      ).mockResolvedValue({
        data: {
          success: true,
          message: "",
          data: {
            passedCount: 1,
            totalCount: 1,
            score: 100,
            results: mockRawResult.results,
          },
        } as any,
        status: 200,
      })

      vi.mocked(testNormalization.normalizeTestResult).mockReturnValue(
        mockNormalizedResult as any,
      )

      const result = await testService.runTestsPreview(
        mockSourceCode,
        mockLanguage,
        mockAssignmentId,
      )

      expect(result.passed).toBe(1)
      expect(result.total).toBe(1)
      expect(result.percentage).toBe(100)
    })

    it("throws error when execution fails", async () => {
      vi.mocked(
        testCaseRepository.executeTestsInPreviewModeWithoutSaving,
      ).mockResolvedValue({
        error: "Execution failed",
        status: 400,
      })

      await expect(
        testService.runTestsPreview(
          mockSourceCode,
          mockLanguage,
          mockAssignmentId,
        ),
      ).rejects.toThrow("Execution failed")
    })

    it("throws error when API returns unsuccessful status", async () => {
      vi.mocked(
        testCaseRepository.executeTestsInPreviewModeWithoutSaving,
      ).mockResolvedValue({
        data: {
          success: false,
          message: "Compilation error",
        } as any,
        status: 200,
      })

      await expect(
        testService.runTestsPreview(
          mockSourceCode,
          mockLanguage,
          mockAssignmentId,
        ),
      ).rejects.toThrow("Compilation error")
    })

    it("throws error when data is missing", async () => {
      vi.mocked(
        testCaseRepository.executeTestsInPreviewModeWithoutSaving,
      ).mockResolvedValue({
        data: {
          success: true,
          message: "",
          data: null,
        } as any,
        status: 200,
      })

      await expect(
        testService.runTestsPreview(
          mockSourceCode,
          mockLanguage,
          mockAssignmentId,
        ),
      ).rejects.toThrow("Test execution data is missing from the response")
    })
  })

  // ============================================================================
  // getTestResultsForSubmission Tests
  // ============================================================================

  describe("getTestResultsForSubmission", () => {
    const mockSubmissionId = 123
    const mockRawSummary = {
      passed: 2,
      total: 3,
      percentage: 66,
      results: [
        {
          testCaseId: 1,
          status: "Passed" as const,
          input: "",
          actualOutput: "",
        },
        {
          testCaseId: 2,
          status: "Passed" as const,
          input: "",
          actualOutput: "",
        },
        {
          testCaseId: 3,
          status: "Failed" as const,
          input: "",
          actualOutput: "",
        },
      ] as RawTestResult[],
    }

    it("fetches results successfully", async () => {
      vi.mocked(
        assignmentRepository.getTestResultsForSubmissionById,
      ).mockResolvedValue({
        data: {
          success: true,
          message: "",
          data: mockRawSummary,
        } as any,
        status: 200,
      })

      const result =
        await testService.getTestResultsForSubmission(mockSubmissionId)

      expect(
        assignmentRepository.getTestResultsForSubmissionById,
      ).toHaveBeenCalledWith(mockSubmissionId)
      expect(result.passed).toBe(2)
      expect(result.total).toBe(3)
      expect(testNormalization.normalizeTestResult).toHaveBeenCalledTimes(3)
    })

    it("supports legacy submission summary fields", async () => {
      vi.mocked(
        assignmentRepository.getTestResultsForSubmissionById,
      ).mockResolvedValue({
        data: {
          success: true,
          message: "",
          data: {
            passedCount: 2,
            totalCount: 3,
            score: 66,
            results: mockRawSummary.results,
          },
        } as any,
        status: 200,
      })

      const result =
        await testService.getTestResultsForSubmission(mockSubmissionId)

      expect(result.passed).toBe(2)
      expect(result.total).toBe(3)
      expect(result.percentage).toBe(66)
    })

    it("throws error when fetch fails", async () => {
      vi.mocked(
        assignmentRepository.getTestResultsForSubmissionById,
      ).mockResolvedValue({
        error: "Network error",
        status: 400,
      })

      await expect(
        testService.getTestResultsForSubmission(mockSubmissionId),
      ).rejects.toThrow("Network error")
    })

    it("throws error when API returns unsuccessful status", async () => {
      vi.mocked(
        assignmentRepository.getTestResultsForSubmissionById,
      ).mockResolvedValue({
        data: {
          success: false,
          message: "Results not found",
        } as any,
        status: 200,
      })

      await expect(
        testService.getTestResultsForSubmission(mockSubmissionId),
      ).rejects.toThrow("Results not found")
    })

    it("throws error when data is missing", async () => {
      vi.mocked(
        assignmentRepository.getTestResultsForSubmissionById,
      ).mockResolvedValue({
        data: {
          success: true,
          message: "",
          data: null,
        } as any,
        status: 200,
      })

      await expect(
        testService.getTestResultsForSubmission(mockSubmissionId),
      ).rejects.toThrow("Test results data is missing from the response")
    })
  })
})
