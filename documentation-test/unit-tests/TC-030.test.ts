/**
 * TC-030: Create Test Case for Assignment
 *
 * Module: Assignment Management
 * Unit: Manage Test Cases
 * Date Tested: 4/10/26
 * Description: Verify that a test case is created for an assignment and automatically assigned a display order.
 * Expected Result: Test case is saved and automatically assigned the next available display order.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-030 Unit Test Pass - Test Case Created with Auto-Generated Sort Order
 * Suggested Figure Title (System UI): Assignment Management UI - Test Case Creation Form
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { TestCaseService } from "../../backend-ts/src/modules/test-cases/test-case.service.js"

vi.mock("../../backend-ts/src/modules/test-cases/test-case.repository.js")

describe("TC-030: Create Test Case for Assignment", () => {
  let testCaseService: TestCaseService
  let mockTestCaseRepo: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockTestCaseRepo = {
      getByAssignmentId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getNextSortOrder: vi.fn().mockResolvedValue(2),
    }

    testCaseService = new TestCaseService(mockTestCaseRepo)
  })

  afterEach(() => { vi.clearAllMocks() })

  it("should create a test case with auto-generated sortOrder when none is provided", async () => {
    const createdTestCase = {
      id: 1,
      assignmentId: 5,
      name: "Check squared output",
      input: "5",
      expectedOutput: "25",
      isHidden: false,
      timeLimit: 5,
      sortOrder: 2,
      createdAt: new Date(),
    }

    mockTestCaseRepo.create.mockResolvedValue(createdTestCase)

    const result = await testCaseService.createTestCase(5, {
      name: "Check squared output",
      input: "5",
      expectedOutput: "25",
    })

    expect(mockTestCaseRepo.getNextSortOrder).toHaveBeenCalledWith(5)
    expect(mockTestCaseRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ assignmentId: 5, sortOrder: 2, expectedOutput: "25" }),
    )
    expect(result.sortOrder).toBe(2)
    expect(result.expectedOutput).toBe("25")
  })

  it("should use the provided sortOrder when explicitly set", async () => {
    const createdTestCase = {
      id: 2,
      assignmentId: 5,
      name: "Edge case",
      input: "0",
      expectedOutput: "0",
      isHidden: true,
      timeLimit: 5,
      sortOrder: 10,
      createdAt: new Date(),
    }

    mockTestCaseRepo.create.mockResolvedValue(createdTestCase)

    const result = await testCaseService.createTestCase(5, {
      name: "Edge case",
      input: "0",
      expectedOutput: "0",
      sortOrder: 10,
    })

    expect(mockTestCaseRepo.getNextSortOrder).not.toHaveBeenCalled()
    expect(result.sortOrder).toBe(10)
  })
})
