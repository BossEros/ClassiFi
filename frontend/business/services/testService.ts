import * as testCaseRepository from "@/data/repositories/testCaseRepository";
import type { ProgrammingLanguage } from "@/business/models/assignment/types";
import type {
  TestPreviewResult,
  TestResultDetail,
  TestPreviewResponse,
} from "@/data/api/types";

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

  return executionResponse.data.data;
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
  const resultsResponse = await testCaseRepository.getTestResults(submissionId);

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

  return summary;
}
