/**
 * TC-031: Delete Non-existent Test Case
 *
 * Module: Assignment Management
 * Unit: Manage Test Cases
 * Date Tested: 4/10/26
 * Description: Verify error handling when deleting a test case that does not exist.
 * Expected Result: An error is returned indicating the test case was not found.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-031 Unit Test Pass - Deleting Non-Existent Test Case Returns Error
 * Suggested Figure Title (System UI): Assignment Management UI - Test Case List with Delete Action
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { TestCaseService } from "../../backend-ts/src/modules/test-cases/test-case.service.js"
import { TestCaseNotFoundError } from "../../backend-ts/src/shared/errors.js"

vi.mock("../../backend-ts/src/modules/test-cases/test-case.repository.js")

describe("TC-031: Delete Non-existent Test Case", () => {
  let testCaseService: TestCaseService
  let mockTestCaseRepo: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockTestCaseRepo = {
      getByAssignmentId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn().mockResolvedValue(false),
      getNextSortOrder: vi.fn(),
    }

    testCaseService = new TestCaseService(mockTestCaseRepo)
  })

  afterEach(() => { vi.clearAllMocks() })

  it("should throw TestCaseNotFoundError when the test case does not exist", async () => {
    await expect(testCaseService.deleteTestCase(999)).rejects.toThrow(TestCaseNotFoundError)
    expect(mockTestCaseRepo.delete).toHaveBeenCalledWith(999)
  })

  it("should return true when the test case exists and deletion succeeds", async () => {
    mockTestCaseRepo.delete.mockResolvedValue(true)

    const result = await testCaseService.deleteTestCase(1)

    expect(result).toBe(true)
  })
})
