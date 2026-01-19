import { injectable } from "tsyringe";
import { db } from "@/shared/database.js";
import {
  testResults,
  testCases,
  type TestResult,
  type NewTestResult,
} from "@/models/index.js";
import { eq } from "drizzle-orm";

/** Test result with test case details */
export interface TestResultWithCase extends TestResult {
  testCase: {
    name: string;
    isHidden: boolean;
    expectedOutput: string;
    input: string;
  };
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
      .where(eq(testResults.submissionId, submissionId));
  }

  /**
   * Get test results with test case details for a submission.
   */
  async getWithCasesBySubmissionId(
    submissionId: number,
  ): Promise<TestResultWithCase[]> {
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
      .where(eq(testResults.submissionId, submissionId));

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
    }));
  }

  /**
   * Create test results in batch.
   */
  async createMany(
    data: Omit<NewTestResult, "id" | "createdAt">[],
    tx?: typeof db,
  ): Promise<TestResult[]> {
    if (data.length === 0) return [];
    const executor = tx || db;
    return executor.insert(testResults).values(data).returning();
  }

  /**
   * Delete all test results for a submission.
   */
  async deleteBySubmissionId(submissionId: number, tx?: any): Promise<number> {
    const executor = tx || db;
    const result = await executor
      .delete(testResults)
      .where(eq(testResults.submissionId, submissionId))
      .returning({ id: testResults.id });
    return result.length;
  }

  /**
   * Calculate score as percentage (passed / total * 100).
   */
  async calculateScore(
    submissionId: number,
  ): Promise<{ passed: number; total: number; percentage: number }> {
    const results = await this.getBySubmissionId(submissionId);
    const total = results.length;
    const passed = results.filter((r) => r.status === "Accepted").length;
    const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
    return { passed, total, percentage };
  }
}
