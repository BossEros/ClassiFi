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
} from "../api/types"

// ============================================================================
// Class Gradebook Functions
// ============================================================================

export async function getCompleteGradebookForClassId(
  classId: number,
): Promise<ClassGradebook> {
  const apiResponse = await apiClient.get<ClassGradebookResponse>(
    `/gradebook/classes/${classId}`,
  )
  const data = unwrapApiResponse(apiResponse, "Failed to fetch gradebook")

  return {
    assignments: data.assignments,
    students: data.students,
  }
}

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

export async function getAllGradesForStudentId(
  studentId: number,
): Promise<StudentClassGrades[]> {
  const apiResponse = await apiClient.get<StudentGradesResponse>(
    `/gradebook/students/${studentId}`,
  )
  const data = unwrapApiResponse(apiResponse, "Failed to fetch student grades")

  return data.grades
}

export async function getGradesForStudentInSpecificClass(
  studentId: number,
  classId: number,
): Promise<StudentClassGrades | null> {
  const apiResponse = await apiClient.get<StudentGradesResponse>(
    `/gradebook/students/${studentId}/classes/${classId}`,
  )
  const data = unwrapApiResponse(apiResponse, "Failed to fetch student class grades")

  return data.grades[0] ?? null
}

export async function getClassRankForStudentById(
  studentId: number,
  classId: number,
): Promise<StudentRank> {
  const apiResponse = await apiClient.get<StudentRankResponse>(
    `/gradebook/students/${studentId}/classes/${classId}/rank`,
  )
  const data = unwrapApiResponse(apiResponse, "Failed to fetch student rank")

  return {
    rank: data.rank,
    totalStudents: data.totalStudents,
    percentile: data.percentile,
  }
}

// ============================================================================
// Grade Override Functions
// ============================================================================

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

export async function removeGradeOverrideForSubmissionById(
  submissionId: number,
): Promise<void> {
  const apiResponse = await apiClient.delete<{
    success: boolean
    message?: string
  }>(`/gradebook/submissions/${submissionId}/override`)
  unwrapApiResponse(apiResponse, "Failed to remove grade override")
}

// ============================================================================
// Late Penalty Configuration Functions
// ============================================================================

export async function getLatePenaltyConfigurationForAssignmentId(
  assignmentId: number,
): Promise<{ enabled: boolean; config: LatePenaltyConfig | null }> {
  const apiResponse = await apiClient.get<LatePenaltyConfigResponse>(
    `/gradebook/assignments/${assignmentId}/late-penalty`,
  )
  const data = unwrapApiResponse(apiResponse, "Failed to fetch late penalty config")

  return {
    enabled: data.enabled,
    config: data.config,
  }
}

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
  }>(`/gradebook/assignments/${assignmentId}/late-penalty`, requestBody)
  unwrapApiResponse(apiResponse, "Failed to update late penalty config")
}
