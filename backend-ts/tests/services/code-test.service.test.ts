/**
 * CodeTestService Unit Tests
 * Focused tests for getTestResults behavior with zero vs. present test cases.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { CodeTestService } from "../../src/modules/test-cases/code-test.service.js"
import {
  createMockAssignment,
  createMockSubmission,
} from "../utils/factories.js"

describe("CodeTestService", () => {
  let codeTestService: CodeTestService
  let mockExecutor: any
  let mockTestCaseRepo: any
  let mockTestResultRepo: any
  let mockSubmissionRepo: any
  let mockAssignmentRepo: any
  let mockStorageService: any
  let mockNotificationService: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockExecutor = {
      executeBatch: vi.fn(),
      healthCheck: vi.fn(),
    }

    mockTestCaseRepo = {
      getByAssignmentId: vi.fn(),
    }

    mockTestResultRepo = {
      getWithCasesBySubmissionId: vi.fn(),
      calculateScore: vi.fn(),
      deleteBySubmissionId: vi.fn(),
      createMany: vi.fn(),
    }

    mockSubmissionRepo = {
      getSubmissionById: vi.fn(),
      updateGrade: vi.fn(),
    }

    mockAssignmentRepo = {
      getAssignmentById: vi.fn(),
    }

    mockStorageService = {
      download: vi.fn(),
    }

    mockNotificationService = {
      createNotification: vi.fn().mockResolvedValue(undefined),
    }

    codeTestService = new CodeTestService(
      mockExecutor,
      mockTestCaseRepo,
      mockTestResultRepo,
      mockSubmissionRepo,
      mockAssignmentRepo,
      mockStorageService,
      mockNotificationService,
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  // ============================================================================
  // getTestResults Tests
  // ============================================================================

  describe("getTestResults", () => {
    const mockSubmission = createMockSubmission({ id: 10, assignmentId: 5 })
    const mockAssignment = createMockAssignment({ id: 5 })

    it("should return empty-success summary when assignment has zero test cases", async () => {
      mockTestResultRepo.getWithCasesBySubmissionId.mockResolvedValue([])
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
      mockAssignmentRepo.getAssignmentById.mockResolvedValue(mockAssignment)
      mockTestCaseRepo.getByAssignmentId.mockResolvedValue([])

      const result = await codeTestService.getTestResults(10)

      expect(result).toEqual({
        submissionId: 10,
        passed: 0,
        total: 0,
        percentage: 100,
        results: [],
      })

      expect(
        mockTestResultRepo.getWithCasesBySubmissionId,
      ).toHaveBeenCalledWith(10)
      expect(mockSubmissionRepo.getSubmissionById).toHaveBeenCalledWith(10)
      expect(mockAssignmentRepo.getAssignmentById).toHaveBeenCalledWith(5)
      expect(mockTestCaseRepo.getByAssignmentId).toHaveBeenCalledWith(5)
    })

    it("should return null when assignment has test cases but results are missing", async () => {
      mockTestResultRepo.getWithCasesBySubmissionId.mockResolvedValue([])
      mockSubmissionRepo.getSubmissionById.mockResolvedValue(mockSubmission)
      mockAssignmentRepo.getAssignmentById.mockResolvedValue(mockAssignment)
      mockTestCaseRepo.getByAssignmentId.mockResolvedValue([
        {
          id: 1,
          name: "Test 1",
          assignmentId: 5,
          input: "1",
          expectedOutput: "2",
        },
      ])

      const result = await codeTestService.getTestResults(10)

      expect(result).toBeNull()
    })

    it("should return test results when result rows exist", async () => {
      const mockResultsWithCases = [
        {
          testCaseId: 1,
          status: "Accepted",
          executionTime: "0.0050",
          memoryUsed: 1024,
          actualOutput: "hello",
          errorMessage: null,
          testCase: {
            id: 1,
            name: "Test 1",
            isHidden: false,
            input: "test input",
            expectedOutput: "hello",
          },
        },
      ]

      mockTestResultRepo.getWithCasesBySubmissionId.mockResolvedValue(
        mockResultsWithCases,
      )
      mockTestResultRepo.calculateScore.mockResolvedValue({
        passed: 1,
        total: 1,
        percentage: 100,
      })

      const result = await codeTestService.getTestResults(10)

      expect(result).toEqual({
        submissionId: 10,
        passed: 1,
        total: 1,
        percentage: 100,
        results: [
          {
            testCaseId: 1,
            name: "Test 1",
            status: "Accepted",
            isHidden: false,
            executionTimeMs: 5,
            memoryUsedKb: 1024,
            input: "test input",
            expectedOutput: "hello",
            actualOutput: "hello",
            errorMessage: undefined,
          },
        ],
      })

      // Should NOT call fetchSubmissionData or testCaseRepo when results exist
      expect(mockSubmissionRepo.getSubmissionById).not.toHaveBeenCalled()
      expect(mockTestCaseRepo.getByAssignmentId).not.toHaveBeenCalled()
    })

    it("should keep hidden test details masked by default", async () => {
      const hiddenResults = [
        {
          testCaseId: 2,
          status: "Accepted",
          executionTime: "0.0030",
          memoryUsed: 768,
          actualOutput: "42",
          errorMessage: null,
          testCase: {
            id: 2,
            name: "Hidden Test",
            isHidden: true,
            input: "21",
            expectedOutput: "42",
          },
        },
      ]

      mockTestResultRepo.getWithCasesBySubmissionId.mockResolvedValue(hiddenResults)
      mockTestResultRepo.calculateScore.mockResolvedValue({
        passed: 1,
        total: 1,
        percentage: 100,
      })

      const result = await codeTestService.getTestResults(10)

      expect(result?.results[0]).toEqual({
        testCaseId: 2,
        name: "Hidden Test",
        status: "Accepted",
        isHidden: true,
        executionTimeMs: 3,
        memoryUsedKb: 768,
        input: undefined,
        expectedOutput: undefined,
        actualOutput: undefined,
        errorMessage: undefined,
      })
    })

    it("should include hidden test details when includeHiddenDetails is true", async () => {
      const hiddenResults = [
        {
          testCaseId: 2,
          status: "Accepted",
          executionTime: "0.0030",
          memoryUsed: 768,
          actualOutput: "42",
          errorMessage: null,
          testCase: {
            id: 2,
            name: "Hidden Test",
            isHidden: true,
            input: "21",
            expectedOutput: "42",
          },
        },
      ]

      mockTestResultRepo.getWithCasesBySubmissionId.mockResolvedValue(hiddenResults)
      mockTestResultRepo.calculateScore.mockResolvedValue({
        passed: 1,
        total: 1,
        percentage: 100,
      })

      const result = await codeTestService.getTestResults(10, true)

      expect(result?.results[0]).toEqual({
        testCaseId: 2,
        name: "Hidden Test",
        status: "Accepted",
        isHidden: true,
        executionTimeMs: 3,
        memoryUsedKb: 768,
        input: "21",
        expectedOutput: "42",
        actualOutput: "42",
        errorMessage: undefined,
      })
    })
  })
})
