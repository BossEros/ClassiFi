import * as plagiarismRepository from "@/data/repositories/plagiarismRepository"
import { validateId } from "@/shared/utils/validators"
import type {
  AnalyzeResponse,
  PairResponse,
  FileResponse,
  ResultDetailsResponse,
} from "@/data/api/types"

export type {
  AnalyzeResponse,
  PairResponse,
  FileResponse,
  ResultDetailsResponse,
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
