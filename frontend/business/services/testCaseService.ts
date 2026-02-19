import * as testCaseRepository from "@/data/repositories/testCaseRepository"
import * as assignmentRepository from "@/data/repositories/assignmentRepository"
import { validateId } from "@/shared/utils/validators"
import type {
  TestCase,
  CreateTestCaseRequest,
  UpdateTestCaseRequest,
  TestExecutionSummary,
} from "@/shared/types/testCase"
import type { TestResultsResponse } from "@/data/api/types"
import { normalizeTestResult } from "@/shared/utils/testNormalization"

function mapTestExecutionSummary(
  testExecutionSummaryData: TestResultsResponse["data"],
  submissionId: number,
): TestExecutionSummary {
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
    throw new Error("Test results summary is incomplete")
  }

  return {
    submissionId,
    passed: passedTestCount,
    total: totalTestCount,
    percentage: scorePercentage,
    results: testExecutionSummaryData.results.map(normalizeTestResult),
  }
}

/**
 * Retrieves all test cases associated with a specific assignment.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @returns A list of test case objects.
 * @throws Error if the test cases cannot be fetched.
 */
export async function getTestCases(assignmentId: number): Promise<TestCase[]> {
  validateId(assignmentId, "assignment")

  const testCasesResponse =
    await testCaseRepository.getAllTestCasesForAssignmentId(assignmentId)

  if (testCasesResponse.error) {
    throw new Error(testCasesResponse.error)
  }

  if (!testCasesResponse.data || !testCasesResponse.data.testCases) {
    throw new Error("Failed to fetch test cases")
  }

  return testCasesResponse.data.testCases
}

/**
 * Creates a new test case for an assignment.
 * Validates required fields before submitting to the repository.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @param createTestCaseData - The data required to create the test case (name, input, expected output).
 * @returns The newly created test case.
 * @throws Error if validation fails or creation is unsuccessful.
 */
export async function createTestCase(
  assignmentId: number,
  createTestCaseData: CreateTestCaseRequest,
): Promise<TestCase> {
  validateId(assignmentId, "assignment")

  if (!createTestCaseData.name) throw new Error("Test case name is required")

  if (
    createTestCaseData.input === undefined ||
    createTestCaseData.input === null
  )
    throw new Error("Input is required")

  if (
    createTestCaseData.expectedOutput === undefined ||
    createTestCaseData.expectedOutput === null
  )
    throw new Error("Expected output is required")

  const creationResponse =
    await testCaseRepository.createNewTestCaseForAssignment(
      assignmentId,
      createTestCaseData,
    )

  if (creationResponse.error) throw new Error(creationResponse.error)

  if (!creationResponse.data || !creationResponse.data.testCase) {
    throw new Error("Failed to create test case")
  }

  return creationResponse.data.testCase
}

/**
 * Updates an existing test case with new data.
 *
 * @param testCaseId - The unique identifier of the test case to update.
 * @param updateTestCaseData - The partial data to update (e.g., modified input or expected output).
 * @returns The updated test case object.
 * @throws Error if the update fails.
 */
export async function updateTestCase(
  testCaseId: number,
  updateTestCaseData: UpdateTestCaseRequest,
): Promise<TestCase> {
  validateId(testCaseId, "test case")

  const updateResponse = await testCaseRepository.updateTestCaseDetailsById(
    testCaseId,
    updateTestCaseData,
  )

  if (updateResponse.error) throw new Error(updateResponse.error)

  if (!updateResponse.data || !updateResponse.data.testCase)
    throw new Error("Failed to update test case")

  return updateResponse.data.testCase
}

/**
 * Permanently deletes a test case.
 *
 * @param testCaseId - The unique identifier of the test case to delete.
 * @returns A promise that resolves upon successful deletion.
 * @throws Error if the deletion fails.
 */
export async function deleteTestCase(testCaseId: number): Promise<void> {
  validateId(testCaseId, "test case")

  const deletionResponse =
    await testCaseRepository.deleteTestCaseById(testCaseId)

  if (deletionResponse.error) throw new Error(deletionResponse.error)

  if (!deletionResponse.data || !deletionResponse.data.success)
    throw new Error("Failed to delete test case")
}

/**
 * Retrieves the test execution summary for a specific submission.
 *
 * @param submissionId - The unique identifier of the student's submission.
 * @returns The summary of test results (passed/failed counts, details) or null if not found.
 * @throws Error if the results cannot be fetched.
 */
export async function getTestResults(
  submissionId: number,
): Promise<TestExecutionSummary | null> {
  validateId(submissionId, "submission")

  const resultsResponse =
    await assignmentRepository.getTestResultsForSubmissionById(submissionId)

  if (resultsResponse.error) throw new Error(resultsResponse.error)

  if (!resultsResponse.data) throw new Error("Failed to fetch test results")

  const rawData = resultsResponse.data.data

  return mapTestExecutionSummary(rawData, submissionId)
}
