import * as plagiarismRepository from '@/data/repositories/plagiarismRepository'
import { validateId } from '@/shared/utils/validators'
import type { AnalyzeResponse, PairResponse, FileResponse, ResultDetailsResponse } from '@/data/repositories/plagiarismRepository'

export type { AnalyzeResponse, PairResponse, FileResponse, ResultDetailsResponse }

/**
 * Analyze all submissions for an assignment for plagiarism detection.
 * 
 * @param assignmentId - ID of the assignment to analyze
 * @returns Analysis results including similarity pairs
 */
export async function analyzeAssignmentSubmissions(
    assignmentId: number
): Promise<AnalyzeResponse> {
    validateId(assignmentId, 'assignment')

    const response = await plagiarismRepository.analyzeAssignmentSubmissions(assignmentId)

    if (response.error) {
        throw new Error(response.error)
    }

    if (!response.data) {
        throw new Error('Failed to analyze submissions')
    }

    return response.data
}

/**
 * Get detailed result with fragments and file content.
 * 
 * @param resultId - ID of the similarity result
 * @returns Result details with fragments and code content
 */
export async function getResultDetails(
    resultId: number
): Promise<ResultDetailsResponse> {
    validateId(resultId, 'result')

    const response = await plagiarismRepository.getResultDetails(resultId)

    if (response.error) {
        throw new Error(response.error)
    }

    if (!response.data) {
        throw new Error('Failed to fetch result details')
    }

    return response.data
}
