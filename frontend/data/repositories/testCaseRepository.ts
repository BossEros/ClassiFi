import { apiClient, type ApiResponse } from "@/data/api/apiClient";

// =============================================================================
// Types
// =============================================================================

import type {
  TestCase,
  CreateTestCaseRequest,
  UpdateTestCaseRequest,
  TestResultDetail,
  TestExecutionSummary,
} from "@/shared/types/testCase";

export type {
  TestCase,
  CreateTestCaseRequest,
  UpdateTestCaseRequest,
  TestResultDetail,
  TestExecutionSummary,
};

// Response types matching backend
interface TestCaseListResponse {
  success: boolean;
  message: string;
  testCases: TestCase[];
}

interface TestCaseResponse {
  success: boolean;
  message: string;
  testCase: TestCase;
}

interface TestResultsResponse {
  success: boolean;
  message: string;
  data: {
    results: RawTestResult[];
    passedCount: number;
    totalCount: number;
    score: number;
  };
}

interface SuccessResponse {
  success: boolean;
  message: string;
}

// =============================================================================
// Test Case API
// =============================================================================

/**
 * Get all test cases for an assignment
 */
export async function getTestCases(
  assignmentId: number,
): Promise<ApiResponse<TestCaseListResponse>> {
  return apiClient.get<TestCaseListResponse>(
    `/assignments/${assignmentId}/test-cases`,
  );
}

/**
 * Create a new test case
 */
export async function createTestCase(
  assignmentId: number,
  data: CreateTestCaseRequest,
): Promise<ApiResponse<TestCaseResponse>> {
  return apiClient.post<TestCaseResponse>(
    `/assignments/${assignmentId}/test-cases`,
    data,
  );
}

/**
 * Update a test case
 */
export async function updateTestCase(
  testCaseId: number,
  data: UpdateTestCaseRequest,
): Promise<ApiResponse<TestCaseResponse>> {
  return apiClient.put<TestCaseResponse>(`/test-cases/${testCaseId}`, data);
}

/**
 * Delete a test case
 */
export async function deleteTestCase(
  testCaseId: number,
): Promise<ApiResponse<SuccessResponse>> {
  return apiClient.delete<SuccessResponse>(`/test-cases/${testCaseId}`);
}

/**
 * Reorder test cases
 */
export async function reorderTestCases(
  assignmentId: number,
  order: Array<{ id: number; sortOrder: number }>,
): Promise<ApiResponse<SuccessResponse>> {
  return apiClient.put<SuccessResponse>(
    `/assignments/${assignmentId}/test-cases/reorder`,
    { order },
  );
}

// =============================================================================
// Code Testing API
// =============================================================================

/**
 * Run tests in preview mode (without saving)
 */
export async function runTestsPreview(
  sourceCode: string,
  language: "python" | "java" | "c",
  assignmentId: number,
): Promise<ApiResponse<TestResultsResponse>> {
  return apiClient.post<TestResultsResponse>("/code/run-tests", {
    sourceCode,
    language,
    assignmentId,
  });
}

export interface RawTestResult {
  testCaseId: number;
  name?: string;
  testCase?: {
    name: string;
    isHidden: boolean;
    expectedOutput: string;
  };
  status: "Passed" | "Failed";
  isHidden?: boolean;
  executionTimeMs?: number;
  executionTime?: string; // Legacy format
  memoryUsedKb?: number;
  memoryUsed?: number; // Legacy format
  input: string;
  expectedOutput?: string;
  actualOutput: string;
  errorMessage?: string;
}

/**
 * Get test results for a submission
 * Normalizes the backend response to ensure consistent data structure
 */
export async function getTestResults(
  submissionId: number,
): Promise<ApiResponse<TestResultsResponse>> {
  return apiClient.get<TestResultsResponse>(
    `/submissions/${submissionId}/test-results`,
  );
}

/**
 * Run tests for a submission
 */
export async function runTestsForSubmission(
  submissionId: number,
): Promise<ApiResponse<TestResultsResponse>> {
  return apiClient.post<TestResultsResponse>(
    `/submissions/${submissionId}/run-tests`,
    {},
  );
}
