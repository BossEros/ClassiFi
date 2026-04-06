import { injectable } from "tsyringe"
import { db } from "@/shared/database.js"
import { testCases } from "@/modules/test-cases/test-case.model.js"
import { testResults, type TestResult, type NewTestResult } from "@/modules/test-cases/test-result.model.js"
import { eq } from "drizzle-orm"

/** Database executor type that works with both db and transactions */
type DbExecutor = {
  insert: typeof db.insert
  delete: typeof db.delete
}

/** Test result with test case details */
export interface TestResultWithCase extends TestResult {
  testCase: {
    name: string
    isHidden: boolean
    expectedOutput: string
    input: string
  }
}

/**
 * Repository for test result database operations.
 */
@injectable()
export class TestResultRepository {
  /**
   * Get all test results for a submission.
   */
  async getBySubmissionId(submissionId: number): Promise<TestResult[]> {
    return db
      .select()
      .from(testResults)
      .where(eq(testResults.submissionId, submissionId))
  }

  /**
   * Get test results with test case details for a submission.
   */
  async getWithCasesBySubmissionId(
    submissionId: number,
  ): Promise<TestResultWithCase[]> {
    // JOIN test_results with test_cases in one query so callers don't have to do two round-trips.
    // We alias the test case columns (e.g. testCaseName) to keep them separate from the result fields.
    const results = await db
      .select({
        // Test result fields
        id: testResults.id,
        submissionId: testResults.submissionId,
        testCaseId: testResults.testCaseId,
        status: testResults.status,
        actualOutput: testResults.actualOutput,
        executionTime: testResults.executionTime,
        memoryUsed: testResults.memoryUsed,
        executorToken: testResults.executorToken,
        errorMessage: testResults.errorMessage,
        createdAt: testResults.createdAt,
        // Test case fields
        testCaseName: testCases.name,
        testCaseIsHidden: testCases.isHidden,
        testCaseExpectedOutput: testCases.expectedOutput,
        testCaseInput: testCases.input,
      })
      .from(testResults)
      .innerJoin(testCases, eq(testResults.testCaseId, testCases.id))
      .where(eq(testResults.submissionId, submissionId))

    // Reshape the flat JOIN rows into the nested TestResultWithCase shape the rest of the app expects
    return results.map((r) => ({
      id: r.id,
      submissionId: r.submissionId,
      testCaseId: r.testCaseId,
      status: r.status,
      actualOutput: r.actualOutput,
      executionTime: r.executionTime,
      memoryUsed: r.memoryUsed,
      executorToken: r.executorToken,
      errorMessage: r.errorMessage,
      createdAt: r.createdAt,
      testCase: {
        name: r.testCaseName,
        isHidden: r.testCaseIsHidden,
        expectedOutput: r.testCaseExpectedOutput,
        input: r.testCaseInput,
      },
    }))
  }

  /**
   * Create test results in batch.
   */
  async createMany(
    data: Omit<NewTestResult, "id" | "createdAt">[],
    tx?: DbExecutor,
  ): Promise<TestResult[]> {
    if (data.length === 0) return []

    // Use the transaction executor when one is provided (e.g. inside saveTestResults),
    // otherwise fall back to the default db connection for standalone calls
    const executor = tx ?? db
    return executor.insert(testResults).values(data).returning()
  }

  /**
   * Delete all test results for a submission.
   */
  async deleteBySubmissionId(
    submissionId: number,
    tx?: DbExecutor,
  ): Promise<number> {
    // Use the transaction executor when one is provided so this delete
    // stays atomic with the createMany call that follows it
    const executor = tx ?? db
    const result = await executor
      .delete(testResults)
      .where(eq(testResults.submissionId, submissionId))
      .returning({ id: testResults.id })
    return result.length
  }

  /**
   * Calculate score as percentage (passed / total * 100).
   */
  async calculateScore(
    submissionId: number,
  ): Promise<{ passed: number; total: number; percentage: number }> {
    // STEP 1: Read the saved test results back from the DB.
    // We intentionally read after saving so the score always reflects what's actually persisted.
    const results = await this.getBySubmissionId(submissionId)

    // STEP 2: Count how many Judge0 results came back as "Accepted" (exact output match + within time limit)
    const total = results.length
    const passed = results.filter((r) => r.status === "Accepted").length

    // STEP 3: Calculate the percentage. If there are no results somehow, default to 0 — not 100.
    // (The 100% default for no test cases is handled upstream before this is ever called.)
    const percentage = total > 0 ? Math.round((passed / total) * 100) : 0

    return { passed, total, percentage }
  }
}
