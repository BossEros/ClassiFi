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
  executionTime?: string // Legacy format
  memoryUsedKb?: number
  memoryUsed?: number // Legacy format
  input: string
  expectedOutput?: string
  actualOutput: string
  errorMessage?: string
}
