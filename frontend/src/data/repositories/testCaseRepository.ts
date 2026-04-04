import { apiClient, type ApiResponse } from "@/data/api/apiClient"
import type {
  TestCase,
  CreateTestCaseRequest,
  UpdateTestCaseRequest,
  TestResultDetail,
  TestExecutionSummary,
  RawTestResult,
} from "@/data/api/test-case.types"
import type {
  TestCaseListResponse,
  TestCaseResponse,
  TestResultsResponse,
} from "@/data/api/test-case.types"
import type { SuccessResponse } from "@/data/api/shared.types"

export type {
  TestCase,
  CreateTestCaseRequest,
  UpdateTestCaseRequest,
  TestResultDetail,
  TestExecutionSummary,
  RawTestResult,
  TestCaseListResponse,
  TestCaseResponse,
  TestResultsResponse,
  SuccessResponse,
}

/**
 * Retrieves all test cases configured for a specific assignment.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @returns API response containing the list of test cases.
 */
export async function getAllTestCasesForAssignmentId(
  assignmentId: number,
): Promise<ApiResponse<TestCaseListResponse>> {
  return apiClient.get<TestCaseListResponse>(
    `/assignments/${assignmentId}/test-cases`,
  )
}

/**
 * Creates a new test case for an assignment.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @param newTestCaseData - The test case payload to create.
 * @returns API response containing the created test case.
 */
export async function createNewTestCaseForAssignment(
  assignmentId: number,
  newTestCaseData: CreateTestCaseRequest,
): Promise<ApiResponse<TestCaseResponse>> {
  return apiClient.post<TestCaseResponse>(
    `/assignments/${assignmentId}/test-cases`,
    newTestCaseData,
  )
}

/**
 * Updates an existing test case by ID.
 *
 * @param testCaseId - The unique identifier of the test case.
 * @param updatedTestCaseData - The fields to update for the test case.
 * @returns API response containing the updated test case.
 */
export async function updateTestCaseDetailsById(
  testCaseId: number,
  updatedTestCaseData: UpdateTestCaseRequest,
): Promise<ApiResponse<TestCaseResponse>> {
  return apiClient.put<TestCaseResponse>(
    `/test-cases/${testCaseId}`,
    updatedTestCaseData,
  )
}

/**
 * Deletes a test case by ID.
 *
 * @param testCaseId - The unique identifier of the test case to delete.
 * @returns API response indicating whether deletion succeeded.
 */
export async function deleteTestCaseById(
  testCaseId: number,
): Promise<ApiResponse<SuccessResponse>> {
  return apiClient.delete<SuccessResponse>(`/test-cases/${testCaseId}`)
}

/**
 * Executes assignment tests in preview mode without storing a submission.
 * Used by teachers to validate test cases against sample source code.
 *
 * @param sourceCodeContent - The source code to execute.
 * @param programmingLanguage - The programming language of the source code.
 * @param assignmentId - The assignment whose test suite will run.
 * @returns API response containing aggregated test execution results.
 */
export async function executeTestsInPreviewModeWithoutSaving(
  sourceCodeContent: string,
  programmingLanguage: "python" | "java" | "c",
  assignmentId: number,
): Promise<ApiResponse<TestResultsResponse>> {
  return apiClient.post<TestResultsResponse>("/code/run-tests", {
    sourceCode: sourceCodeContent,
    language: programmingLanguage,
    assignmentId,
  })
}
