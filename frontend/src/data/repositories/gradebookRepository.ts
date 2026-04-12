import { apiClient, unwrapApiResponse } from "../api/apiClient"
import type {
  ClassGradebook,
  ClassGradebookResponse,
  StudentClassGrades,
  StudentGradesResponse,
  StudentRank,
  StudentRankResponse,
  LatePenaltyConfig,
  LatePenaltyConfigResponse,
  GradeOverrideRequest,
  LatePenaltyUpdateRequest,
} from "../api/gradebook.types"

// ============================================================================
// Class Gradebook Functions
// ============================================================================

/**
 * Fetches the complete gradebook for a class, including all assignments and every student's scores.
 *
 * @param classId - The unique identifier of the class.
 * @returns An object with `assignments` (column headers) and `students` (rows of grade data).
 * @throws Error if the API call fails.
 */
export async function getCompleteGradebookForClassId(
  classId: number,
): Promise<ClassGradebook> {
  const apiResponse = await apiClient.get<ClassGradebookResponse>(
    `/gradebook/classes/${classId}`,
  )
  const data = unwrapApiResponse(
    apiResponse,
    "Failed to fetch gradebook",
    ["assignments", "students"],
  )

  return {
    assignments: data.assignments,
    students: data.students,
  }
}

/**
 * Requests a CSV export of the gradebook from the backend and returns it as a Blob.
 * Used internally by `downloadGradebookCSVFileForClassId`.
 *
 * @param classId - The unique identifier of the class.
 * @returns A Blob containing the CSV data.
 * @throws Error if the API call fails or returns no data.
 */
export async function exportGradebookAsCSVForClassId(
  classId: number,
): Promise<Blob> {
  const apiResponse = await apiClient.get<Blob>(
    `/gradebook/classes/${classId}/export`,
    { responseType: "blob" },
  )

  if (apiResponse.error || !apiResponse.data) {
    throw new Error(apiResponse.error || "Failed to export gradebook")
  }

  return apiResponse.data
}

/**
 * Downloads the gradebook as a CSV file and triggers a browser file download.
 * Creates a temporary anchor element to initiate the download, then cleans up.
 *
 * @param classId - The unique identifier of the class.
 * @param customFilename - Optional custom filename for the downloaded file. Defaults to `gradebook-class-{classId}.csv`.
 */
export async function downloadGradebookCSVFileForClassId(
  classId: number,
  customFilename?: string,
): Promise<void> {
  const csvBlobData = await exportGradebookAsCSVForClassId(classId)
  const downloadUrl = window.URL.createObjectURL(csvBlobData)
  const downloadLinkElement = document.createElement("a")
  downloadLinkElement.href = downloadUrl
  downloadLinkElement.download =
    customFilename || `gradebook-class-${classId}.csv`
  document.body.appendChild(downloadLinkElement)
  downloadLinkElement.click()
  document.body.removeChild(downloadLinkElement)
  window.URL.revokeObjectURL(downloadUrl)
}

// ============================================================================
// Student Grades Functions
// ============================================================================

/**
 * Fetches all graded class grades for a specific student across all their enrolled classes.
 *
 * @param studentId - The unique identifier of the student.
 * @returns An array of `StudentClassGrades` objects, one per enrolled class.
 * @throws Error if the API call fails.
 */
export async function getAllGradesForStudentId(
  studentId: number,
): Promise<StudentClassGrades[]> {
  const apiResponse = await apiClient.get<StudentGradesResponse>(
    `/gradebook/students/${studentId}`,
  )
  const data = unwrapApiResponse(
    apiResponse,
    "Failed to fetch student grades",
    "grades",
  )

  return data.grades
}

/**
 * Fetches a student's grades within a specific class.
 *
 * @param studentId - The unique identifier of the student.
 * @param classId - The unique identifier of the class.
 * @returns The `StudentClassGrades` object for that class, or null if no grades are found.
 * @throws Error if the API call fails.
 */
export async function getGradesForStudentInSpecificClass(
  studentId: number,
  classId: number,
): Promise<StudentClassGrades | null> {
  const apiResponse = await apiClient.get<StudentGradesResponse>(
    `/gradebook/students/${studentId}/classes/${classId}`,
  )
  const data = unwrapApiResponse(
    apiResponse,
    "Failed to fetch student class grades",
    "grades",
  )

  return data.grades[0] ?? null
}

/**
 * Fetches a student's rank within a class based on their overall grade score.
 *
 * @param studentId - The unique identifier of the student.
 * @param classId - The unique identifier of the class.
 * @returns A `StudentRank` object containing the rank, total students, and percentile.
 * @throws Error if the API call fails.
 */
export async function getClassRankForStudentById(
  studentId: number,
  classId: number,
): Promise<StudentRank> {
  const apiResponse = await apiClient.get<StudentRankResponse>(
    `/gradebook/students/${studentId}/classes/${classId}/rank`,
  )
  const data = unwrapApiResponse(
    apiResponse,
    "Failed to fetch student rank",
    ["rank", "totalStudents", "percentile"],
  )

  return {
    rank: data.rank,
    totalStudents: data.totalStudents,
    percentile: data.percentile,
  }
}

// ============================================================================
// Grade Override Functions
// ============================================================================

/**
 * Sets a manual grade override on a specific submission, bypassing the auto-graded score.
 * Optionally attaches teacher feedback alongside the override.
 *
 * @param submissionId - The unique identifier of the submission to override.
 * @param overriddenGradeValue - The grade value to set as the override.
 * @param teacherFeedbackText - Optional written feedback from the teacher.
 * @throws Error if the API call fails.
 */
export async function setGradeOverrideForSubmissionById(
  submissionId: number,
  overriddenGradeValue: number,
  teacherFeedbackText?: string | null,
): Promise<void> {
  const requestBody: GradeOverrideRequest = {
    grade: overriddenGradeValue,
    feedback: teacherFeedbackText,
  }
  const apiResponse = await apiClient.post<{
    success: boolean
    message?: string
  }>(`/gradebook/submissions/${submissionId}/override`, requestBody)
  unwrapApiResponse(apiResponse, "Failed to override grade")
}

/**
 * Removes a previously applied manual grade override from a submission.
 * After removal, the auto-graded score will be used again.
 *
 * @param submissionId - The unique identifier of the submission.
 * @throws Error if the API call fails.
 */
export async function removeGradeOverrideForSubmissionById(
  submissionId: number,
): Promise<void> {
  const apiResponse = await apiClient.delete<{
    success: boolean
    message?: string
  }>(`/gradebook/submissions/${submissionId}/override`)
  unwrapApiResponse(apiResponse, "Failed to remove grade override")
}

/**
 * Sets a manual grade directly on a submission that has no auto-calculated grade
 * (i.e. assignments with no test cases). Writes to the grade column — does NOT
 * set the override flag.
 *
 * @param submissionId - The unique identifier of the submission.
 * @param gradeValue - The grade value to set.
 * @throws Error if the API call fails.
 */
export async function setManualGradeForSubmissionById(
  submissionId: number,
  gradeValue: number,
): Promise<void> {
  const requestBody = { grade: gradeValue }
  const apiResponse = await apiClient.post<{
    success: boolean
    message?: string
  }>(`/gradebook/submissions/${submissionId}/grade`, requestBody)
  unwrapApiResponse(apiResponse, "Failed to set grade")
}

// ============================================================================
// Late Penalty Configuration Functions
// ============================================================================

/**
 * Fetches the late penalty configuration for a specific assignment.
 * The config determines how points are deducted for late submissions.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @returns An object with `enabled` flag and the `config` details (or null if not configured).
 * @throws Error if the API call fails.
 */
export async function getLatePenaltyConfigurationForAssignmentId(
  assignmentId: number,
): Promise<{ enabled: boolean; config: LatePenaltyConfig | null }> {
  const apiResponse = await apiClient.get<LatePenaltyConfigResponse>(
    `/assignments/${assignmentId}/late-penalty`,
  )
  const data = unwrapApiResponse(
    apiResponse,
    "Failed to fetch late penalty config",
    "enabled",
  )

  return {
    enabled: data.enabled,
    config: data.config,
  }
}

/**
 * Updates the late penalty configuration for a specific assignment.
 * Enables or disables late penalties and sets the penalty rules.
 *
 * @param assignmentId - The unique identifier of the assignment.
 * @param isLatePenaltyEnabled - Whether late penalties should be applied.
 * @param latePenaltyConfiguration - The penalty rules to apply (deduction rate, grace period, etc).
 * @throws Error if the API call fails.
 */
export async function updateLatePenaltyConfigurationForAssignmentId(
  assignmentId: number,
  isLatePenaltyEnabled: boolean,
  latePenaltyConfiguration?: LatePenaltyConfig,
): Promise<void> {
  const requestBody: LatePenaltyUpdateRequest = {
    enabled: isLatePenaltyEnabled,
    config: latePenaltyConfiguration,
  }
  const apiResponse = await apiClient.put<{
    success: boolean
    message?: string
  }>(`/assignments/${assignmentId}/late-penalty`, requestBody)
  unwrapApiResponse(apiResponse, "Failed to update late penalty config")
}
