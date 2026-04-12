/**
 * TC-039: Update Test Case
 *
 * Module: Assignment Management
 * Unit: Manage Test Cases
 * Date Tested: 4/11/26
 * Description: Verify that a test case can be updated with a new expected output.
 * Expected Result: The test case is updated and the new expected output is reflected.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-039 Unit Test Pass - Test Case Updated Successfully
 * Suggested Figure Title (System UI): Assignment Management UI - Edit Test Case Form
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { TestCaseService } from "../../backend-ts/src/modules/test-cases/test-case.service.js"
import { TestCaseNotFoundError } from "../../backend-ts/src/shared/errors.js"

vi.mock("../../backend-ts/src/modules/test-cases/test-case.repository.js")

describe("TC-039: Update Test Case", () => {
  let testCaseService: TestCaseService
  let mockTestCaseRepo: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockTestCaseRepo = {
      getByAssignmentId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getNextSortOrder: vi.fn(),
    }

    testCaseService = new TestCaseService(mockTestCaseRepo)
  })

  afterEach(() => { vi.clearAllMocks() })

  it("should update a test case's expected output successfully", async () => {
    const updatedTestCase = {
      id: 1, assignmentId: 5, name: "Square Check",
      input: "5", expectedOutput: "30",
      isHidden: false, timeLimit: 5, sortOrder: 1, createdAt: new Date(),
    }

    mockTestCaseRepo.update.mockResolvedValue(updatedTestCase)

    const result = await testCaseService.updateTestCase(1, { expectedOutput: "30" })

    expect(result.expectedOutput).toBe("30")
    expect(mockTestCaseRepo.update).toHaveBeenCalledWith(1, { expectedOutput: "30" })
  })

  it("should throw an error when updating a test case that does not exist", async () => {
    mockTestCaseRepo.update.mockResolvedValue(undefined)

    await expect(testCaseService.updateTestCase(999, { expectedOutput: "0" })).rejects.toThrow(TestCaseNotFoundError)
  })
})
