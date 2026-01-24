import * as testCaseRepository from "@/data/repositories/testCaseRepository";
import * as assignmentRepository from "@/data/repositories/assignmentRepository";
import { validateId } from "@/shared/utils/validators";
import type { ProgrammingLanguage } from "@/business/models/assignment/types";
import type {
  TestPreviewResult,
  TestResultDetail,
  TestPreviewResponse,
} from "@/data/api/types";
import { normalizeTestResult } from "@/shared/utils/testNormalization";

export type { TestPreviewResult, TestResultDetail, TestPreviewResponse };

/**
 * Executes a dry run of the provided source code against the assignment's test cases.
 * This allows students to verify their solution without creating a formal submission.
 *
 * @param sourceCode - The raw source code to execute.
 * @param language - The programming language of the source code.
 * @param assignmentId - The unique identifier of the assignment.
 * @returns The results of the test execution, including pass/fail status and output.
 * @throws Error if the test execution fails or returns an error.
 */
export async function runTestsPreview(
  sourceCode: string,
  language: ProgrammingLanguage,
  assignmentId: number,
): Promise<TestPreviewResult> {
  validateId(assignmentId, "assignment");

  const executionResponse = await testCaseRepository.runTestsPreview(
    sourceCode,
    language,
    assignmentId,
  );

  if (!executionResponse.data || !executionResponse.data.success) {
    throw new Error(
      executionResponse.data?.message ||
        executionResponse.error ||
        "Failed to run tests",
    );
  }

  if (!executionResponse.data.data) {
    throw new Error("Test execution data is missing from the response");
  }

  const data = executionResponse.data.data;
  return {
    passed: data.passedCount,
    total: data.totalCount,
    percentage: data.score,
    results: data.results.map(normalizeTestResult),
  };
}

/**
 * Retrieves and formats the test results for a specific submission.
 * Normalizes legacy array responses and new object responses into a unified structure.
 *
 * @param submissionId - The unique identifier of the submission.
 * @returns A standardized object containing test statistics and detailed results.
 * @throws Error if the results cannot be fetched.
 */
export async function getTestResultsForSubmission(
  submissionId: number,
): Promise<TestPreviewResult> {
  validateId(submissionId, "submission");
  const resultsResponse = await assignmentRepository.getTestResults(submissionId);

  if (!resultsResponse.data || !resultsResponse.data.success) {
    throw new Error(
      resultsResponse.data?.message ||
        resultsResponse.error ||
        "Failed to fetch test results",
    );
  }

  const summary = resultsResponse.data.data;

  if (!summary) {
    throw new Error("Test results data is missing from the response");
  }

  return {
    passed: summary.passedCount,
    total: summary.totalCount,
    percentage: summary.score,
    results: summary.results.map(normalizeTestResult),
  };
}
