import { inject, injectable } from "tsyringe"
import { TestCaseRepository } from "@/repositories/testCase.repository.js"
import type { NewTestCase, TestCase } from "@/models/test-case.model.js"
import {
  TestCaseNotFoundError,
  TestCaseOwnershipError,
} from "@/shared/errors.js"

/**
 * Business logic for test case operations.
 * Handles CRUD operations and ordering for test cases.
 */
@injectable()
export class TestCaseService {
  constructor(
    @inject("TestCaseRepository") private testCaseRepo: TestCaseRepository,
  ) {}

  /**
   * Get all test cases for an assignment
   */
  async getTestCasesByAssignment(assignmentId: number): Promise<TestCase[]> {
    return this.testCaseRepo.getByAssignmentId(assignmentId)
  }

  /**
   * Create a new test case
   */
  async createTestCase(
    assignmentId: number,
    data: Omit<NewTestCase, "assignmentId" | "sortOrder"> & {
      sortOrder?: number
    },
  ): Promise<TestCase> {
    const sortOrder =
      data.sortOrder ?? (await this.testCaseRepo.getNextSortOrder(assignmentId))

    return this.testCaseRepo.create({
      assignmentId,
      name: data.name,
      input: data.input ?? "",
      expectedOutput: data.expectedOutput,
      isHidden: data.isHidden ?? false,
      timeLimit: data.timeLimit ?? 5,
      sortOrder,
    })
  }

  /**
   * Update a test case
   */
  async updateTestCase(
    testCaseId: number,
    data: Partial<Omit<NewTestCase, "assignmentId">>,
  ): Promise<TestCase> {
    const testCase = await this.testCaseRepo.update(testCaseId, data)

    if (!testCase) {
      throw new TestCaseNotFoundError(testCaseId)
    }

    return testCase
  }

  /**
   * Delete a test case
   */
  async deleteTestCase(testCaseId: number): Promise<boolean> {
    const deleted = await this.testCaseRepo.delete(testCaseId)

    if (!deleted) {
      throw new TestCaseNotFoundError(testCaseId)
    }

    return true
  }

  /**
   * Reorder test cases
   */
  async reorderTestCases(
    order: Array<{ id: number; sortOrder: number }>,
  ): Promise<void> {
    await this.testCaseRepo.updateSortOrder(order)
  }

  /**
   * Reorder test cases for a specific assignment with ownership validation.
   * Ensures all test cases belong to the specified assignment before reordering.
   *
   * @param assignmentId - The assignment ID to validate ownership against.
   * @param order - Array of test case IDs with their new sort orders.
   * @throws TestCaseNotFoundError if any test case doesn't exist.
   * @throws TestCaseOwnershipError if any test case doesn't belong to the assignment.
   */
  async reorderTestCasesForAssignment(
    assignmentId: number,
    order: Array<{ id: number; sortOrder: number }>,
  ): Promise<void> {
    // Validate that all test cases exist and belong to the assignment
    for (const { id } of order) {
      const testCase = await this.testCaseRepo.getById(id)

      if (!testCase) {
        throw new TestCaseNotFoundError(id)
      }

      if (testCase.assignmentId !== assignmentId) {
        throw new TestCaseOwnershipError(id, assignmentId)
      }
    }

    // All test cases are valid, proceed with reordering
    await this.testCaseRepo.updateSortOrder(order)
  }
}
