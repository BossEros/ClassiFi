import * as testCaseRepository from "@/data/repositories/testCaseRepository"
import * as assignmentRepository from "@/data/repositories/assignmentRepository"
import { validateId } from "@/shared/utils/idUtils"
import type { ProgrammingLanguage } from "@/data/api/shared.types"
import type {
  TestPreviewResult,
  TestResultDetail,
  TestPreviewResponse,
  TestResultsResponse,
} from "@/data/api/test-case.types"
import { normalizeTestResult } from "@/business/services/testResultNormalizer"

export type { TestPreviewResult, TestResultDetail, TestPreviewResponse }

/**
 * Maps raw API test execution data into a typed TestPreviewResult.
 * Resolves field name aliases (e.g., `passed` vs `passedCount`, `percentage` vs `score`)
 * to maintain backward compatibility across older and newer API response formats.
 * Each raw result is normalized via `normalizeTestResult` for consistent display.
 *
 * @param testExecutionSummaryData - The raw test result payload from the API response.
 * @returns A normalized TestPreviewResult with pass counts, total counts, percentage, and detailed results.
 * @throws Error if required summary fields (passed, total, percentage) are missing from the raw data.
 */
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

  const normalizedResults = Array.isArray(testExecutionSummaryData.results)
    ? testExecutionSummaryData.results.map(normalizeTestResult)
    : []

  return {
    passed: passedTestCount,
    total: totalTestCount,
    percentage: scorePercentage,
    results: normalizedResults,
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
 * @param includeHiddenDetails - Whether hidden test case details should be returned.
 * @returns A standardized object containing test statistics and detailed results.
 * @throws Error if the results cannot be fetched.
 */
export async function getTestResultsForSubmission(
  submissionId: number,
  includeHiddenDetails: boolean = false,
): Promise<TestPreviewResult> {
  validateId(submissionId, "submission")
  const resultsResponse =
    await assignmentRepository.getTestResultsForSubmissionById(
      submissionId,
      includeHiddenDetails,
    )

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
