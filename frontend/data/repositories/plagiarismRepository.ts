import { apiClient, type ApiResponse } from "../api/apiClient";
import type { AnalyzeResponse, ResultDetailsResponse } from "@/data/api/types";

/**
 * Analyze all submissions for an assignment for plagiarism
 */
export async function analyzeAssignmentSubmissions(
  assignmentId: number
): Promise<ApiResponse<AnalyzeResponse>> {
  return apiClient.post<AnalyzeResponse>(
    `/plagiarism/analyze/assignment/${assignmentId}`,
    {}
  );
}


/**
 * Get result details with fragments and file content
 */
export async function getResultDetails(
  resultId: number
): Promise<ApiResponse<ResultDetailsResponse>> {
  return apiClient.get<ResultDetailsResponse>(
    `/plagiarism/results/${resultId}/details`
  );
}
