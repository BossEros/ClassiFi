import * as plagiarismRepository from "@/data/repositories/plagiarismRepository"
import { validateId } from "@/shared/utils/validators"
import type {
  AnalyzeResponse,
  PairResponse,
  FileResponse,
  ResultDetailsResponse,
  StudentSummary,
} from "@/business/models/plagiarism/types"

export type {
  AnalyzeResponse,
  PairResponse,
  FileResponse,
  ResultDetailsResponse,
  StudentSummary,
}

/**
 * Initiates plagiarism detection analysis for all submissions of a specific assignment.
 * Validates the assignment ID before triggering the repository call.
 *
 * @param assignmentId - The unique identifier of the assignment to analyze.
 * @returns The analysis results containing detected similarity pairs and metadata.
 * @throws Error if the analysis fails or returns no data.
 */
export async function analyzeAssignmentSubmissions(
  assignmentId: number,
): Promise<AnalyzeResponse> {
  validateId(assignmentId, "assignment")

  const analysisResponse =
    await plagiarismRepository.analyzePlagiarismForAllSubmissionsInAssignment(
      assignmentId,
    )

  if (analysisResponse.error) {
    throw new Error(analysisResponse.error)
  }

  if (!analysisResponse.data) {
    throw new Error("Failed to analyze submissions")
  }

  return analysisResponse.data
}

/**
 * Retrieves detailed comparison results for a specific pair of submissions.
 * Includes code fragments, matched lines, and full file contents for side-by-side comparison.
 *
 * @param resultId - The unique identifier of the similarity result (pair).
 * @returns detailed comparison data including code fragments and file content.
 * @throws Error if the details cannot be fetched.
 */
export async function getResultDetails(
  resultId: number,
): Promise<ResultDetailsResponse> {
  validateId(resultId, "result")

  const detailsResponse =
    await plagiarismRepository.getPlagiarismResultDetailsWithFragmentsById(
      resultId,
    )

  if (detailsResponse.error) {
    throw new Error(detailsResponse.error)
  }

  if (!detailsResponse.data) {
    throw new Error("Failed to fetch result details")
  }

  return detailsResponse.data
}

/**
 * Retrieves student-centric summary with originality scores for a report.
 * Validates the report ID before making the API call.
 *
 * @param reportId - The unique identifier of the plagiarism report.
 * @returns Array of student summaries with originality metrics.
 * @throws Error if the report cannot be fetched or validation fails.
 */
export async function getStudentSummary(
  reportId: string,
): Promise<StudentSummary[]> {
  if (!reportId || reportId.trim() === "") {
    throw new Error("Report ID is required")
  }

  const response =
    await plagiarismRepository.getStudentSummaryForReport(reportId)

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data) {
    throw new Error("Failed to fetch student summary")
  }

  return response.data
}

/**
 * Retrieves all pairwise comparisons involving a specific student's submission.
 * Validates inputs before making the API call.
 *
 * @param reportId - The unique identifier of the plagiarism report.
 * @param submissionId - The unique identifier of the student's submission.
 * @returns Array of pairs involving the specified student.
 * @throws Error if the pairs cannot be fetched or validation fails.
 */
export async function getStudentPairs(
  reportId: string,
  submissionId: number,
): Promise<PairResponse[]> {
  if (!reportId || reportId.trim() === "") {
    throw new Error("Report ID is required")
  }

  validateId(submissionId, "submission")

  const response = await plagiarismRepository.getStudentPairs(
    reportId,
    submissionId,
  )

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data) {
    throw new Error("Failed to fetch student pairs")
  }

  return response.data
}
