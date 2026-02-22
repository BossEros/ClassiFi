import { inject, injectable } from "tsyringe"
import { TestCaseRepository } from "@/modules/test-cases/test-case.repository.js"
import type {
  NewTestCase,
  TestCase,
} from "@/modules/test-cases/test-case.model.js"
import { TestCaseNotFoundError } from "@/shared/errors.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Business logic for test case operations.
 * Handles CRUD operations and ordering for test cases.
 */
@injectable()
export class TestCaseService {
  constructor(
    @inject(DI_TOKENS.repositories.testCase)
    private testCaseRepo: TestCaseRepository,
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
}
