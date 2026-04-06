import type { RawTestResult, TestResultDetail } from "@/data/api/test-case.types"

/**
 * Normalizes a raw test result from the repository into a standardized TestResultDetail object.
 * Handles field-name inconsistencies between different API response versions
 * (e.g., `passed` vs `passedCount`, `executionTime` in seconds vs `executionTimeMs`).
 * Applies safe fallbacks so the UI never receives undefined for required display fields.
 *
 * @param result - The raw test result object returned by the test execution API.
 * @returns A normalized TestResultDetail with consistent field names, units, and resolved fallbacks.
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
  }
}
