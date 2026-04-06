export interface TestCase {
  id: number
  assignmentId: number
  name: string
  input: string
  expectedOutput: string
  isHidden: boolean
  timeLimit: number
  sortOrder: number
  createdAt: string
}

export interface CreateTestCaseRequest {
  name: string
  input: string
  expectedOutput: string
  isHidden?: boolean
  timeLimit?: number
  sortOrder?: number
}

export interface UpdateTestCaseRequest {
  name?: string
  input?: string
  expectedOutput?: string
  isHidden?: boolean
  timeLimit?: number
  sortOrder?: number
}

export interface TestExecutionSummary {
  submissionId?: number
  passed: number
  total: number
  percentage: number
  results: TestResultDetail[]
}

export interface RawTestResult {
  testCaseId: number
  name?: string
  testCase?: {
    name: string
    isHidden: boolean
    expectedOutput: string
  }
  status: "Passed" | "Failed"
  isHidden?: boolean
  executionTimeMs?: number
  executionTime?: string
  memoryUsedKb?: number
  memoryUsed?: number
  input: string
  expectedOutput?: string
  actualOutput: string
  errorMessage?: string
}

/** Individual test result detail */
export interface TestResultDetail {
  testCaseId: number
  name: string
  status: string
  isHidden: boolean
  executionTimeMs: number
  memoryUsedKb: number
  input?: string
  expectedOutput?: string
  actualOutput?: string
  errorMessage?: string
}

/** Test result from preview */
export interface TestPreviewResult {
  passed: number
  total: number
  percentage: number
  results: TestResultDetail[]
}

/** API response wrapper */
export interface TestPreviewResponse {
  success: boolean
  message: string
  data: TestPreviewResult
}

export interface TestCaseListResponse {
  success: boolean
  message: string
  testCases: TestCase[]
}

export interface TestCaseResponse {
  success: boolean
  message: string
  testCase: TestCase
}

export interface TestExecutionSummaryData {
  submissionId?: number
  results: RawTestResult[]
  // Current backend contract
  passed?: number
  total?: number
  percentage?: number
  // Legacy contract kept for compatibility
  passedCount?: number
  totalCount?: number
  score?: number
}

export interface TestResultsResponse {
  success: boolean
  message: string
  data: TestExecutionSummaryData
}
