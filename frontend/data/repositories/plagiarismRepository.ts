import { apiClient, type ApiResponse } from "../api/apiClient";
import type { AnalyzeResponse, ResultDetailsResponse } from "@/data/api/types";

export async function analyzePlagiarismForAllSubmissionsInAssignment(
  assignmentId: number
): Promise<ApiResponse<AnalyzeResponse>> {
  return apiClient.post<AnalyzeResponse>(
    `/plagiarism/analyze/assignment/${assignmentId}`,
    {}
  );
}

export async function getPlagiarismResultDetailsWithFragmentsById(
  resultId: number
): Promise<ApiResponse<ResultDetailsResponse>> {
  return apiClient.get<ResultDetailsResponse>(
    `/plagiarism/results/${resultId}/details`
  );
}
