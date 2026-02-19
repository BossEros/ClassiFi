import { describe, it, expect, vi, beforeEach } from "vitest"

import * as testCaseService from "@/business/services/testCaseService"
import * as testCaseRepository from "@/data/repositories/testCaseRepository"
import * as assignmentRepository from "@/data/repositories/assignmentRepository"

// Mock the repositories
vi.mock("@/data/repositories/testCaseRepository")
vi.mock("@/data/repositories/assignmentRepository")

describe("testCaseService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // Fixtures
  // ============================================================================

  const mockTestCase = {
    id: 1,
    assignmentId: 1,
    name: "Test Case 1",
    input: "hello",
    expectedOutput: "HELLO",
    isHidden: false,
    timeLimit: 5,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
  }

  // ============================================================================
  // getTestCases Tests
  // ============================================================================

  describe("getTestCases", () => {
    it("returns test cases for an assignment", async () => {
      vi.mocked(
        testCaseRepository.getAllTestCasesForAssignmentId,
      ).mockResolvedValue({
        data: { success: true, message: "Success", testCases: [mockTestCase] },
        status: 200,
      })

      const result = await testCaseService.getTestCases(1)

      expect(
        testCaseRepository.getAllTestCasesForAssignmentId,
      ).toHaveBeenCalledWith(1)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe("Test Case 1")
    })

    it("throws error for invalid assignment ID", async () => {
      await expect(testCaseService.getTestCases(0)).rejects.toThrow(
        "Invalid assignment ID",
      )
    })

    it("throws error when API returns error", async () => {
      vi.mocked(
        testCaseRepository.getAllTestCasesForAssignmentId,
      ).mockResolvedValue({
        error: "Not found",
        status: 404,
      })

      await expect(testCaseService.getTestCases(1)).rejects.toThrow("Not found")
    })

    it("throws error when data is missing", async () => {
      vi.mocked(
        testCaseRepository.getAllTestCasesForAssignmentId,
      ).mockResolvedValue({
        data: undefined,
        status: 200,
      })

      await expect(testCaseService.getTestCases(1)).rejects.toThrow(
        "Failed to fetch test cases",
      )
    })
  })

  // ============================================================================
  // createTestCase Tests
  // ============================================================================

  describe("createTestCase", () => {
    const validRequest = {
      name: "New Test Case",
      input: "input",
      expectedOutput: "output",
    }

    it("creates a test case with valid data", async () => {
      vi.mocked(
        testCaseRepository.createNewTestCaseForAssignment,
      ).mockResolvedValue({
        data: { success: true, message: "Created", testCase: mockTestCase },
        status: 201,
      })

      const result = await testCaseService.createTestCase(1, validRequest)

      expect(
        testCaseRepository.createNewTestCaseForAssignment,
      ).toHaveBeenCalledWith(1, validRequest)
      expect(result.id).toBe(1)
    })

    it("throws error for invalid assignment ID", async () => {
      await expect(
        testCaseService.createTestCase(0, validRequest),
      ).rejects.toThrow("Invalid assignment ID")
    })

    it("throws error when name is missing", async () => {
      await expect(
        testCaseService.createTestCase(1, { ...validRequest, name: "" }),
      ).rejects.toThrow("Test case name is required")
    })

    it("throws error when input is missing", async () => {
      await expect(
        testCaseService.createTestCase(1, {
          ...validRequest,
          input: undefined as unknown as string,
        }),
      ).rejects.toThrow("Input is required")
    })

    it("throws error when expectedOutput is missing", async () => {
      await expect(
        testCaseService.createTestCase(1, {
          ...validRequest,
          expectedOutput: undefined as unknown as string,
        }),
      ).rejects.toThrow("Expected output is required")
    })

    it("throws error when API fails", async () => {
      vi.mocked(
        testCaseRepository.createNewTestCaseForAssignment,
      ).mockResolvedValue({
        error: "Duplicate name",
        status: 409,
      })

      await expect(
        testCaseService.createTestCase(1, validRequest),
      ).rejects.toThrow("Duplicate name")
    })
  })

  // ============================================================================
  // updateTestCase Tests
  // ============================================================================

  describe("updateTestCase", () => {
    const updateRequest = { name: "Updated Name" }

    it("updates a test case successfully", async () => {
      const updatedTestCase = { ...mockTestCase, name: "Updated Name" }
      vi.mocked(testCaseRepository.updateTestCaseDetailsById).mockResolvedValue(
        {
          data: {
            success: true,
            message: "Updated",
            testCase: updatedTestCase,
          },
          status: 200,
        },
      )

      const result = await testCaseService.updateTestCase(1, updateRequest)

      expect(testCaseRepository.updateTestCaseDetailsById).toHaveBeenCalledWith(
        1,
        updateRequest,
      )
      expect(result.name).toBe("Updated Name")
    })

    it("throws error for invalid test case ID", async () => {
      await expect(
        testCaseService.updateTestCase(0, updateRequest),
      ).rejects.toThrow("Invalid test case ID")
    })

    it("throws error when API fails", async () => {
      vi.mocked(testCaseRepository.updateTestCaseDetailsById).mockResolvedValue(
        {
          error: "Not found",
          status: 404,
        },
      )

      await expect(
        testCaseService.updateTestCase(999, updateRequest),
      ).rejects.toThrow("Not found")
    })
  })

  // ============================================================================
  // deleteTestCase Tests
  // ============================================================================

  describe("deleteTestCase", () => {
    it("deletes a test case successfully", async () => {
      vi.mocked(testCaseRepository.deleteTestCaseById).mockResolvedValue({
        data: { success: true, message: "Deleted" },
        status: 200,
      })

      await expect(testCaseService.deleteTestCase(1)).resolves.toBeUndefined()

      expect(testCaseRepository.deleteTestCaseById).toHaveBeenCalledWith(1)
    })

    it("throws error for invalid test case ID", async () => {
      await expect(testCaseService.deleteTestCase(0)).rejects.toThrow(
        "Invalid test case ID",
      )
    })

    it("throws error when API fails", async () => {
      vi.mocked(testCaseRepository.deleteTestCaseById).mockResolvedValue({
        error: "Cannot delete",
        status: 400,
      })

      await expect(testCaseService.deleteTestCase(1)).rejects.toThrow(
        "Cannot delete",
      )
    })
  })

  // ============================================================================
  // getTestResults Tests
  // ============================================================================

  describe("getTestResults", () => {
    const mockRawResults = {
      success: true,
      message: "Success",
      data: {
        passed: 3,
        total: 5,
        percentage: 60,
        results: [
          {
            testCaseId: 1,
            status: "Passed" as const,
            input: "hello",
            actualOutput: "HELLO",
          },
        ],
      },
    }

    it("returns normalized test results", async () => {
      vi.mocked(
        assignmentRepository.getTestResultsForSubmissionById,
      ).mockResolvedValue({
        data: mockRawResults,
        status: 200,
      })

      const result = await testCaseService.getTestResults(1)

      expect(
        assignmentRepository.getTestResultsForSubmissionById,
      ).toHaveBeenCalledWith(1)
      expect(result).not.toBeNull()
      expect(result!.passed).toBe(3)
      expect(result!.total).toBe(5)
      expect(result!.percentage).toBe(60)
      expect(result!.results).toHaveLength(1)
    })

    it("supports legacy test result summary fields", async () => {
      vi.mocked(
        assignmentRepository.getTestResultsForSubmissionById,
      ).mockResolvedValue({
        data: {
          success: true,
          message: "Success",
          data: {
            passedCount: 3,
            totalCount: 5,
            score: 60,
            results: mockRawResults.data.results,
          },
        } as any,
        status: 200,
      })

      const result = await testCaseService.getTestResults(1)

      expect(result).not.toBeNull()
      expect(result!.passed).toBe(3)
      expect(result!.total).toBe(5)
      expect(result!.percentage).toBe(60)
    })

    it("throws error for invalid submission ID", async () => {
      await expect(testCaseService.getTestResults(0)).rejects.toThrow(
        "Invalid submission ID",
      )
    })

    it("throws error when API fails", async () => {
      vi.mocked(
        assignmentRepository.getTestResultsForSubmissionById,
      ).mockResolvedValue({
        error: "Not found",
        status: 404,
      })

      await expect(testCaseService.getTestResults(1)).rejects.toThrow(
        "Not found",
      )
    })
  })
})
