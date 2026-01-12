import { apiClient } from "@/data/api/apiClient";

/** Test result from preview */
export interface TestPreviewResult {
  passed: number;
  total: number;
  percentage: number;
  results: TestResultDetail[];
}

/** Individual test result detail */
export interface TestResultDetail {
  testCaseId: number;
  name: string;
  status: string;
  isHidden: boolean;
  executionTimeMs: number;
  memoryUsedKb: number;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  errorMessage?: string;
}

/** API response wrapper */
interface TestPreviewResponse {
  success: boolean;
  message: string;
  data: TestPreviewResult;
}

/**
 * Run tests in preview mode (without creating a submission)
 * Allows students to verify their code works before committing a submission
 */
export async function runTestsPreview(
  sourceCode: string,
  language: "python" | "java" | "c",
  assignmentId: number
): Promise<TestPreviewResult> {
  const response = await apiClient.post<TestPreviewResponse>(
    "/code/run-tests",
    {
      sourceCode,
      language,
      assignmentId,
    }
  );

  if (!response.data || !response.data.success) {
    throw new Error(
      response.data?.message || response.error || "Failed to run tests"
    );
  }

  return response.data.data;
}

/**
 * Get test results for a specific submission
 */
interface ApiTestResult {
  testCaseId: number;
  name?: string;
  testCase?: { name: string; isHidden: boolean; expectedOutput: string };
  status: string;
  isHidden?: boolean;
  executionTimeMs?: number;
  executionTime?: string;
  memoryUsedKb?: number;
  memoryUsed?: number;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  errorMessage?: string;
}

/**
 * Get test results for a specific submission
 */
export async function getTestResultsForSubmission(
  submissionId: number
): Promise<TestPreviewResult> {
  const response = await apiClient.get<any>(
    `/submissions/${submissionId}/test-results`
  );

  if (!response.data || !response.data.success) {
    throw new Error(
      response.data?.message || response.error || "Failed to fetch test results"
    );
  }

  const data = response.data.data;

  // Handle both array (legacy) and object (new) response formats
  let rawResults: ApiTestResult[] = [];
  let passed = 0;
  let total = 0;
  let percentage = 0;

  if (Array.isArray(data)) {
    rawResults = data;
    total = rawResults.length;
    passed = rawResults.filter(
      (r: ApiTestResult) => r.status === "Accepted"
    ).length;
    percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
  } else {
    // Backend returns TestExecutionSummary
    rawResults = data.results || [];
    passed = data.passed;
    total = data.total;
    percentage = data.percentage;
  }

  // Map backend response to TestResultDetail
  const mappedResults: TestResultDetail[] = rawResults.map(
    (r: ApiTestResult) => ({
      testCaseId: r.testCaseId,
      name: r.name || r.testCase?.name || `Test Case ${r.testCaseId}`,
      status: r.status,
      isHidden: r.isHidden || r.testCase?.isHidden || false,
      executionTimeMs:
        r.executionTimeMs ||
        (r.executionTime ? parseFloat(r.executionTime) * 1000 : 0),
      memoryUsedKb: r.memoryUsedKb || r.memoryUsed || 0,
      input: r.input,
      expectedOutput: r.expectedOutput || r.testCase?.expectedOutput,
      actualOutput: r.actualOutput,
      errorMessage: r.errorMessage,
    })
  );

  return {
    passed,
    total,
    percentage,
    results: mappedResults,
  };
}
