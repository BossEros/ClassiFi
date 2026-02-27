import { apiClient, type ApiResponse } from "../api/apiClient"
import type {
  AnalyzeResponse,
  AssignmentSimilarityStatusResponse,
  ResultDetailsResponse,
} from "@/data/api/plagiarism.types"

/**
 * Analyzes all submissions for a specific assignment to detect plagiarism.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @returns API response containing analysis results with similarity pairs.
 */
export async function analyzePlagiarismForAllSubmissionsInAssignment(
  assignmentId: number,
): Promise<ApiResponse<AnalyzeResponse>> {
  return apiClient.post<AnalyzeResponse>(
    `/plagiarism/analyze/assignment/${assignmentId}`,
    {},
  )
}

/**
 * Retrieves similarity review status for an assignment.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @returns API response containing whether a reusable report is available.
 */
export async function getAssignmentSimilarityStatus(
  assignmentId: number,
): Promise<ApiResponse<AssignmentSimilarityStatusResponse>> {
  return apiClient.get<AssignmentSimilarityStatusResponse>(
    `/plagiarism/analyze/assignment/${assignmentId}/status`,
  )
}

/**
 * Retrieves detailed comparison results for a specific similarity pair.
 *
 * @param resultId - The unique identifier of the similarity result.
 * @returns API response containing detailed comparison data with fragments.
 */
export async function getPlagiarismResultDetailsWithFragmentsById(
  resultId: number,
): Promise<ApiResponse<ResultDetailsResponse>> {
  return apiClient.get<ResultDetailsResponse>(
    `/plagiarism/results/${resultId}/details`,
  )
}
