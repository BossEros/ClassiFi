import * as crossClassRepository from "@/data/repositories/crossClassPlagiarismRepository"
import { validateId } from "@/business/validation/commonValidation"
import type {
  CrossClassAnalysisResponse,
  CrossClassResultDetailsResponse,
} from "@/business/models/plagiarism/crossClassTypes"

export type {
  CrossClassAnalysisResponse,
  CrossClassResultDTO,
  CrossClassResultDetailsResponse,
} from "@/business/models/plagiarism/crossClassTypes"

const inFlightCrossClassAnalysisByAssignmentId = new Map<
  number,
  Promise<CrossClassAnalysisResponse>
>()

/**
 * Triggers cross-class similarity analysis for an assignment.
 * Compares submissions across matching assignments in the teacher's classes.
 *
 * @param assignmentId - The source assignment to analyze.
 * @param signal - Optional AbortSignal to cancel the request mid-flight.
 * @returns The cross-class analysis report with matched assignments and results.
 * @throws Error if the analysis fails or returns no data.
 */
export async function analyzeCrossClassSimilarity(
  assignmentId: number,
): Promise<CrossClassAnalysisResponse> {
  validateId(assignmentId, "assignment")

  const existingAnalysisRequest = inFlightCrossClassAnalysisByAssignmentId.get(
    assignmentId,
  )
  if (existingAnalysisRequest) {
    return existingAnalysisRequest
  }

  const analysisRequestPromise = (async () => {
    const response =
      await crossClassRepository.analyzeCrossClassSimilarity(assignmentId)

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error("Failed to run cross-class similarity analysis")
    }

    return response.data
  })()

  inFlightCrossClassAnalysisByAssignmentId.set(
    assignmentId,
    analysisRequestPromise,
  )

  try {
    return await analysisRequestPromise
  } finally {
    if (
      inFlightCrossClassAnalysisByAssignmentId.get(assignmentId) ===
      analysisRequestPromise
    ) {
      inFlightCrossClassAnalysisByAssignmentId.delete(assignmentId)
    }
  }
}

/**
 * Retrieves the latest cross-class report for a source assignment.
 *
 * @param assignmentId - The source assignment ID.
 * @returns The latest cross-class report, or null if none exists.
 * @throws Error if the request fails.
 */
export async function getLatestCrossClassReport(
  assignmentId: number,
): Promise<CrossClassAnalysisResponse | null> {
  validateId(assignmentId, "assignment")

  const response = await crossClassRepository.getLatestCrossClassReport(assignmentId)

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data ?? null
}

/**
 * Retrieves detailed cross-class result with code contents and matching fragments.
 *
 * @param resultId - The unique identifier of the cross-class similarity result.
 * @returns Detailed comparison data including code fragments and file content.
 * @throws Error if the details cannot be fetched.
 */
export async function getCrossClassResultDetails(
  resultId: number,
): Promise<CrossClassResultDetailsResponse> {
  validateId(resultId, "result")

  const response = await crossClassRepository.getCrossClassResultDetails(resultId)

  if (response.error) {
    throw new Error(response.error)
  }

  if (!response.data) {
    throw new Error("Failed to fetch cross-class result details")
  }

  return response.data
}

/**
 * Deletes a cross-class similarity report.
 *
 * @param reportId - The unique identifier of the report to delete.
 * @throws Error if the deletion fails.
 */
export async function deleteCrossClassReport(reportId: number): Promise<void> {
  validateId(reportId, "report")

  const response = await crossClassRepository.deleteCrossClassReport(reportId)

  if (response.error) {
    throw new Error(response.error)
  }
}
