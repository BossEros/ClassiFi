/**
 * Plagiarism Repository
 * Part of the Data Access Layer
 * Handles API calls for plagiarism detection operations
 */

import { apiClient, type ApiResponse } from '../api/apiClient'

/**
 * Response types for plagiarism API
 */
export interface AnalyzeResponse {
    reportId: string
    summary: {
        totalFiles: number
        totalPairs: number
        suspiciousPairs: number
        averageSimilarity: number
        maxSimilarity: number
    }
    pairs: PairResponse[]
    warnings: string[]
}

export interface PairResponse {
    id: number
    leftFile: FileResponse
    rightFile: FileResponse
    structuralScore: number
    semanticScore: number
    hybridScore: number
    overlap: number
    longest: number
}

export interface FileResponse {
    id: number
    path: string
    filename: string
    lineCount: number
    studentId?: string
    studentName?: string
}

/**
 * Analyze all submissions for an assignment for plagiarism
 */
export async function analyzeAssignmentSubmissions(
    assignmentId: number
): Promise<ApiResponse<AnalyzeResponse>> {
    return apiClient.post<AnalyzeResponse>(
        `/plagiarism/analyze/assignment/${assignmentId}`,
        {}
    )
}

/**
 * Result details response with fragments and file content
 */
export interface ResultDetailsResponse {
    result: {
        id: number
        submission1Id: number
        submission2Id: number
        structuralScore: string
        overlap: number
        longestFragment: number
    }
    fragments: Array<{
        id: number
        leftSelection: { startRow: number; startCol: number; endRow: number; endCol: number }
        rightSelection: { startRow: number; startCol: number; endRow: number; endCol: number }
        length: number
    }>
    leftFile: { filename: string; content: string; lineCount: number; studentName: string }
    rightFile: { filename: string; content: string; lineCount: number; studentName: string }
}

/**
 * Get result details with fragments and file content
 */
export async function getResultDetails(
    resultId: number
): Promise<ApiResponse<ResultDetailsResponse>> {
    return apiClient.get<ResultDetailsResponse>(
        `/plagiarism/results/${resultId}/details`
    )
}
