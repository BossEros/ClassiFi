import { apiClient, type ApiResponse } from "@/data/api/apiClient"
import type {
  TestCase,
  CreateTestCaseRequest,
  UpdateTestCaseRequest,
  TestResultDetail,
  TestExecutionSummary,
  RawTestResult,
} from "@/shared/types/testCase"
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

export async function getAllTestCasesForAssignmentId(
  assignmentId: number,
): Promise<ApiResponse<TestCaseListResponse>> {
  return apiClient.get<TestCaseListResponse>(
    `/assignments/${assignmentId}/test-cases`,
  )
}

export async function createNewTestCaseForAssignment(
  assignmentId: number,
  newTestCaseData: CreateTestCaseRequest,
): Promise<ApiResponse<TestCaseResponse>> {
  return apiClient.post<TestCaseResponse>(
    `/assignments/${assignmentId}/test-cases`,
    newTestCaseData,
  )
}

export async function updateTestCaseDetailsById(
  testCaseId: number,
  updatedTestCaseData: UpdateTestCaseRequest,
): Promise<ApiResponse<TestCaseResponse>> {
  return apiClient.put<TestCaseResponse>(
    `/test-cases/${testCaseId}`,
    updatedTestCaseData,
  )
}

export async function deleteTestCaseById(
  testCaseId: number,
): Promise<ApiResponse<SuccessResponse>> {
  return apiClient.delete<SuccessResponse>(`/test-cases/${testCaseId}`)
}

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
