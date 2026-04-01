import { apiClient, type ApiResponse } from "../api/apiClient"
import type {
  CrossClassAnalysisResponse,
  CrossClassResultDetailsResponse,
} from "@/data/api/crossClassPlagiarism.types"

/**
 * Triggers cross-class similarity analysis for an assignment.
 * Compares submissions across matching assignments in the teacher's classes.
 *
 * @param assignmentId - The source assignment to analyze.
 * @param signal - Optional AbortSignal to cancel the request mid-flight.
 * @returns API response containing the cross-class analysis report.
 */
export async function analyzeCrossClassSimilarity(
  assignmentId: number,
  signal?: AbortSignal,
): Promise<ApiResponse<CrossClassAnalysisResponse>> {
  return apiClient.post<CrossClassAnalysisResponse>(
    `/plagiarism/cross-class/analyze/assignment/${assignmentId}`,
    {},
    undefined,
    signal,
  )
}

/**
 * Retrieves a cross-class similarity report by report ID.
 *
 * @param reportId - The unique identifier of the cross-class report.
 * @returns API response containing the full cross-class report.
 */
export async function getCrossClassReport(
  reportId: number,
): Promise<ApiResponse<CrossClassAnalysisResponse>> {
  return apiClient.get<CrossClassAnalysisResponse>(
    `/plagiarism/cross-class/reports/${reportId}`,
  )
}

/**
 * Retrieves the latest cross-class report for a source assignment.
 *
 * @param assignmentId - The source assignment ID.
 * @returns API response containing the latest report, or null if none exists.
 */
export async function getLatestCrossClassReport(
  assignmentId: number,
): Promise<ApiResponse<CrossClassAnalysisResponse | null>> {
  return apiClient.get<CrossClassAnalysisResponse | null>(
    `/plagiarism/cross-class/reports/assignment/${assignmentId}/latest`,
  )
}

/**
 * Retrieves detailed cross-class result with code contents and matching fragments.
 *
 * @param resultId - The unique identifier of the cross-class similarity result.
 * @returns API response containing result details including file contents.
 */
export async function getCrossClassResultDetails(
  resultId: number,
): Promise<ApiResponse<CrossClassResultDetailsResponse>> {
  return apiClient.get<CrossClassResultDetailsResponse>(
    `/plagiarism/cross-class/results/${resultId}/details`,
  )
}

/**
 * Deletes a cross-class similarity report.
 *
 * @param reportId - The unique identifier of the report to delete.
 * @returns API response confirming deletion.
 */
export async function deleteCrossClassReport(
  reportId: number,
): Promise<ApiResponse<{ success: boolean; message: string }>> {
  return apiClient.delete<{ success: boolean; message: string }>(
    `/plagiarism/cross-class/reports/${reportId}`,
  )
}
