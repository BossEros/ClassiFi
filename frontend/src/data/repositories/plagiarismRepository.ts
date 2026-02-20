import { apiClient, type ApiResponse } from "../api/apiClient"
import type {
  AnalyzeResponse,
  ResultDetailsResponse,
  StudentSummary,
  PairResponse,
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

/**
 * Fetches student-centric summary for a plagiarism report.
 * Returns originality scores and statistics for all students in the report.
 *
 * @param reportId - The unique identifier of the report.
 * @returns API response containing student summaries.
 */
export async function getStudentSummaryForReport(
  reportId: string,
): Promise<ApiResponse<StudentSummary[]>> {
  const response = await apiClient.get<{
    success: boolean
    message: string
    students: StudentSummary[]
  }>(`/plagiarism/reports/${reportId}/students`)

  if (response.error) {
    return { error: response.error, status: response.status }
  }

  if (!response.data) {
    return {
      error: "Failed to fetch student summary",
      status: response.status,
    }
  }

  return {
    data: response.data.students,
    status: response.status,
  }
}

/**
 * Fetches all pairwise comparisons for a specific student's submission.
 * Results are sorted by similarity score in descending order.
 *
 * @param reportId - The unique identifier of the report.
 * @param submissionId - The unique identifier of the student's submission.
 * @returns API response containing pairs involving the student.
 */
export async function getStudentPairs(
  reportId: string,
  submissionId: number,
): Promise<ApiResponse<PairResponse[]>> {
  const response = await apiClient.get<{
    success: boolean
    message: string
    pairs: PairResponse[]
  }>(`/plagiarism/reports/${reportId}/students/${submissionId}/pairs`)

  if (response.error) {
    return { error: response.error, status: response.status }
  }

  if (!response.data) {
    return {
      error: "Failed to fetch student pairs",
      status: response.status,
    }
  }

  return {
    data: response.data.pairs,
    status: response.status,
  }
}
