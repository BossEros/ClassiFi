import type { RawTestResult } from "@/data/repositories/testCaseRepository";
import type { TestResultDetail } from "@/shared/types/testCase";

/**
 * Normalizes a raw test result from the repository into a standardized detail object.
 * Handles fallback for names, status, hidden flags, and unit conversions.
 */
export function normalizeTestResult(result: RawTestResult): TestResultDetail {
  return {
    testCaseId: result.testCaseId,
    name:
      result.name || result.testCase?.name || `Test Case ${result.testCaseId}`,
    status: result.status,
    isHidden: result.isHidden || result.testCase?.isHidden || false,
    executionTimeMs:
      result.executionTimeMs ||
      (result.executionTime ? parseFloat(result.executionTime) * 1000 : 0),
    memoryUsedKb: result.memoryUsedKb || result.memoryUsed || 0,
    input: result.input,
    expectedOutput: result.expectedOutput || result.testCase?.expectedOutput,
    actualOutput: result.actualOutput,
    errorMessage: result.errorMessage,
  };
}
