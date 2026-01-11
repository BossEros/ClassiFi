import { apiClient } from '@/data/api/apiClient'

/** Test result from preview */
export interface TestPreviewResult {
    passed: number
    total: number
    percentage: number
    results: TestResultDetail[]
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

/** API response wrapper */
interface TestPreviewResponse {
    success: boolean
    message: string
    data: TestPreviewResult
}

/**
 * Run tests in preview mode (without creating a submission)
 * Allows students to verify their code works before committing a submission
 */
export async function runTestsPreview(
    sourceCode: string,
    language: 'python' | 'java' | 'c',
    assignmentId: number
): Promise<TestPreviewResult> {
    const response = await apiClient.post<TestPreviewResponse>('/code/run-tests', {
        sourceCode,
        language,
        assignmentId,
    })

    if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || response.error || 'Failed to run tests')
    }

    return response.data.data
}
