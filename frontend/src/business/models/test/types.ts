import type { RawTestResult, TestResultDetail } from "@/shared/types/testCase"

export type { TestResultDetail, RawTestResult } from "@/shared/types/testCase"

export interface TestPreviewResult {
  passed: number
  total: number
  percentage: number
  results: TestResultDetail[]
}

export interface TestPreviewResponse {
  success: boolean
  message: string
  data: TestPreviewResult
}

export interface TestExecutionSummaryData {
  submissionId?: number
  results: RawTestResult[]
  passed?: number
  total?: number
  percentage?: number
  passedCount?: number
  totalCount?: number
  score?: number
}

export interface TestResultsResponse {
  success: boolean
  message: string
  data: TestExecutionSummaryData
}
