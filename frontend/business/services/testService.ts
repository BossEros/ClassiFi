import * as testCaseRepository from "@/data/repositories/testCaseRepository"
import * as assignmentRepository from "@/data/repositories/assignmentRepository"
import { validateId } from "@/shared/utils/validators"
import type { ProgrammingLanguage } from "@/business/models/assignment/types"
import type {
  TestPreviewResult,
  TestResultDetail,
  TestPreviewResponse,
  TestResultsResponse,
} from "@/data/api/types"
import { normalizeTestResult } from "@/shared/utils/testNormalization"

export type { TestPreviewResult, TestResultDetail, TestPreviewResponse }

function mapTestExecutionSummaryToPreviewResult(
  testExecutionSummaryData: TestResultsResponse["data"],
): TestPreviewResult {
  const passedTestCount =
    testExecutionSummaryData.passed ?? testExecutionSummaryData.passedCount
  const totalTestCount =
    testExecutionSummaryData.total ?? testExecutionSummaryData.totalCount
  const scorePercentage =
    testExecutionSummaryData.percentage ?? testExecutionSummaryData.score

  if (
    passedTestCount === undefined ||
    totalTestCount === undefined ||
    scorePercentage === undefined
  ) {
    throw new Error("Test execution summary is incomplete")
  }

  return {
    passed: passedTestCount,
    total: totalTestCount,
    percentage: scorePercentage,
    results: testExecutionSummaryData.results.map(normalizeTestResult),
  }
}

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
  validateId(assignmentId, "assignment")

  const executionResponse =
    await testCaseRepository.executeTestsInPreviewModeWithoutSaving(
      sourceCode,
      language,
      assignmentId,
    )

  if (!executionResponse.data || !executionResponse.data.success) {
    throw new Error(
      executionResponse.data?.message ||
        executionResponse.error ||
        "Failed to run tests",
    )
  }

  if (!executionResponse.data.data) {
    throw new Error("Test execution data is missing from the response")
  }

  return mapTestExecutionSummaryToPreviewResult(executionResponse.data.data)
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
  validateId(submissionId, "submission")
  const resultsResponse =
    await assignmentRepository.getTestResultsForSubmissionById(submissionId)

  if (!resultsResponse.data || !resultsResponse.data.success) {
    throw new Error(
      resultsResponse.data?.message ||
        resultsResponse.error ||
        "Failed to fetch test results",
    )
  }

  const summary = resultsResponse.data.data

  if (!summary) {
    throw new Error("Test results data is missing from the response")
  }

  return mapTestExecutionSummaryToPreviewResult(summary)
}
