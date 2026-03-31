import { describe, it, expect, beforeEach, vi } from "vitest"
import type { MockedObject } from "vitest"
import { TestCaseService } from "../../src/modules/test-cases/test-case.service.js"
import type { TestCaseRepository } from "../../src/modules/test-cases/test-case.repository.js"
import { TestCaseNotFoundError } from "../../src/shared/errors.js"
import type { TestCase } from "../../src/modules/test-cases/test-case.model.js"

/**
 * Helper to create a mock TestCase entity.
 */
function createMockTestCase(overrides: Partial<TestCase> = {}): TestCase {
  return {
    id: 1,
    assignmentId: 10,
    name: "Test Case 1",
    input: "hello",
    expectedOutput: "world",
    isHidden: false,
    timeLimit: 5,
    sortOrder: 0,
    createdAt: new Date("2026-01-01"),
    ...overrides,
  }
}

describe("TestCaseService", () => {
  let testCaseService: TestCaseService
  let mockTestCaseRepo: Partial<MockedObject<TestCaseRepository>>

  beforeEach(() => {
    vi.clearAllMocks()

    mockTestCaseRepo = {
      getByAssignmentId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getNextSortOrder: vi.fn(),
    } as any

    testCaseService = new TestCaseService(
      mockTestCaseRepo as unknown as TestCaseRepository,
    )
  })

  describe("getTestCasesByAssignment", () => {
    it("should return all test cases for an assignment", async () => {
      const testCases = [
        createMockTestCase({ id: 1, sortOrder: 0 }),
        createMockTestCase({ id: 2, sortOrder: 1 }),
      ]
      mockTestCaseRepo.getByAssignmentId!.mockResolvedValue(testCases)

      const result = await testCaseService.getTestCasesByAssignment(10)

      expect(result).toEqual(testCases)
      expect(mockTestCaseRepo.getByAssignmentId).toHaveBeenCalledWith(10)
    })

    it("should return empty array when no test cases exist", async () => {
      mockTestCaseRepo.getByAssignmentId!.mockResolvedValue([])

      const result = await testCaseService.getTestCasesByAssignment(10)

      expect(result).toEqual([])
    })
  })

  describe("createTestCase", () => {
    it("should create a test case with explicit sortOrder", async () => {
      const created = createMockTestCase({ sortOrder: 5 })
      mockTestCaseRepo.create!.mockResolvedValue(created)

      const result = await testCaseService.createTestCase(10, {
        name: "Test Case 1",
        expectedOutput: "world",
        sortOrder: 5,
      })

      expect(result).toEqual(created)
      expect(mockTestCaseRepo.create).toHaveBeenCalledWith({
        assignmentId: 10,
        name: "Test Case 1",
        input: "",
        expectedOutput: "world",
        isHidden: false,
        timeLimit: 5,
        sortOrder: 5,
      })
      expect(mockTestCaseRepo.getNextSortOrder).not.toHaveBeenCalled()
    })

    it("should auto-generate sortOrder when not provided", async () => {
      mockTestCaseRepo.getNextSortOrder!.mockResolvedValue(3)
      const created = createMockTestCase({ sortOrder: 3 })
      mockTestCaseRepo.create!.mockResolvedValue(created)

      const result = await testCaseService.createTestCase(10, {
        name: "Auto-ordered",
        expectedOutput: "output",
      })

      expect(result.sortOrder).toBe(3)
      expect(mockTestCaseRepo.getNextSortOrder).toHaveBeenCalledWith(10)
    })

    it("should use custom input and isHidden values", async () => {
      const created = createMockTestCase({
        input: "custom input",
        isHidden: true,
        timeLimit: 10,
      })
      mockTestCaseRepo.create!.mockResolvedValue(created)

      await testCaseService.createTestCase(10, {
        name: "Hidden test",
        input: "custom input",
        expectedOutput: "expected",
        isHidden: true,
        timeLimit: 10,
        sortOrder: 0,
      })

      expect(mockTestCaseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          input: "custom input",
          isHidden: true,
          timeLimit: 10,
        }),
      )
    })

    it("should default input to empty string when not provided", async () => {
      mockTestCaseRepo.create!.mockResolvedValue(createMockTestCase())

      await testCaseService.createTestCase(10, {
        name: "No input",
        expectedOutput: "output",
        sortOrder: 0,
      })

      expect(mockTestCaseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ input: "" }),
      )
    })
  })

  describe("updateTestCase", () => {
    it("should update an existing test case", async () => {
      const updated = createMockTestCase({ name: "Updated Name" })
      mockTestCaseRepo.update!.mockResolvedValue(updated)

      const result = await testCaseService.updateTestCase(1, {
        name: "Updated Name",
      })

      expect(result.name).toBe("Updated Name")
      expect(mockTestCaseRepo.update).toHaveBeenCalledWith(1, {
        name: "Updated Name",
      })
    })

    it("should throw TestCaseNotFoundError when test case does not exist", async () => {
      mockTestCaseRepo.update!.mockResolvedValue(null)

      await expect(
        testCaseService.updateTestCase(999, { name: "X" }),
      ).rejects.toThrow(TestCaseNotFoundError)
    })

    it("should support partial updates", async () => {
      const updated = createMockTestCase({ isHidden: true })
      mockTestCaseRepo.update!.mockResolvedValue(updated)

      const result = await testCaseService.updateTestCase(1, { isHidden: true })

      expect(result.isHidden).toBe(true)
    })
  })

  describe("deleteTestCase", () => {
    it("should delete an existing test case", async () => {
      mockTestCaseRepo.delete!.mockResolvedValue(true)

      const result = await testCaseService.deleteTestCase(1)

      expect(result).toBe(true)
      expect(mockTestCaseRepo.delete).toHaveBeenCalledWith(1)
    })

    it("should throw TestCaseNotFoundError when test case does not exist", async () => {
      mockTestCaseRepo.delete!.mockResolvedValue(false)

      await expect(testCaseService.deleteTestCase(999)).rejects.toThrow(
        TestCaseNotFoundError,
      )
    })
  })
})
