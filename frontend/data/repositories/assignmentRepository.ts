import { apiClient, type ApiResponse } from "@/data/api/apiClient"
import { supabase } from "@/data/api/supabaseClient"
import {
  mapSubmission,
  mapSubmissionWithAssignment,
  mapSubmissionWithStudent,
  mapAssignmentDetail,
} from "@/data/mappers"
import type {
  SubmitAssignmentRequest,
  SubmitAssignmentResponse,
  SubmissionListResponse,
  SubmissionHistoryResponse,
  AssignmentDetailResponse,
  MappedAssignmentDetailResponse,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  TestResultsResponse,
  DeleteResponse,
  SubmissionDTO,
} from "@/data/api/types"
import type { Assignment } from "@/shared/types/class"
import type { Submission } from "@/shared/types/submission"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8001/api/v1"

export async function submitAssignmentWithFile(
  submissionRequest: SubmitAssignmentRequest,
): Promise<ApiResponse<SubmitAssignmentResponse>> {
  try {
    const submissionFormData =
      buildSubmissionFormDataFromRequest(submissionRequest)
    const authenticationToken = await retrieveAuthenticationTokenFromSession()

    const httpResponse = await fetch(`${API_BASE_URL}/submissions`, {
      method: "POST",
      headers: authenticationToken
        ? { Authorization: `Bearer ${authenticationToken}` }
        : {},
      body: submissionFormData,
    })

    const responseData = await httpResponse.json()

    if (!httpResponse.ok) {
      return buildErrorResponseForFailedSubmission(httpResponse, responseData)
    }

    return buildSuccessResponseFromSubmissionData(
      responseData,
      httpResponse.status,
    )
  } catch (networkError) {
    console.error("Submission error (network or other):", networkError)

    return {
      error:
        networkError instanceof Error
          ? `Network error: ${networkError.message}. Make sure the backend server is running.`
          : "Failed to submit assignment",
      status: 0,
    }
  }
}

export async function getSubmissionHistoryForStudentAndAssignment(
  assignmentId: number,
  studentId: number,
): Promise<ApiResponse<SubmissionHistoryResponse>> {
  const apiResponse = await apiClient.get<SubmissionHistoryResponse>(
    `/submissions/history/${assignmentId}/${studentId}`,
  )

  if (apiResponse.data) {
    apiResponse.data = {
      ...apiResponse.data,
      submissions: apiResponse.data.submissions.map(mapSubmission),
    }
  }

  return apiResponse
}

export async function getAllSubmissionsByStudentId(
  studentId: number,
  shouldReturnLatestSubmissionsOnly: boolean = true,
): Promise<ApiResponse<SubmissionListResponse>> {
  const apiResponse = await apiClient.get<SubmissionListResponse>(
    `/submissions/student/${studentId}?latestOnly=${shouldReturnLatestSubmissionsOnly}`,
  )

  if (apiResponse.data) {
    apiResponse.data = {
      ...apiResponse.data,
      submissions: apiResponse.data.submissions.map(
        mapSubmissionWithAssignment,
      ),
    }
  }

  return apiResponse
}

export async function getAllSubmissionsForAssignmentId(
  assignmentId: number,
  shouldReturnLatestSubmissionsOnly: boolean = true,
): Promise<ApiResponse<SubmissionListResponse>> {
  const apiResponse = await apiClient.get<SubmissionListResponse>(
    `/submissions/assignment/${assignmentId}?latestOnly=${shouldReturnLatestSubmissionsOnly}`,
  )

  if (apiResponse.data) {
    apiResponse.data = {
      ...apiResponse.data,
      submissions: apiResponse.data.submissions.map(mapSubmissionWithStudent),
    }
  }

  return apiResponse
}

export async function getAssignmentDetailsByIdForUser(
  assignmentId: number,
  userId: number,
): Promise<ApiResponse<MappedAssignmentDetailResponse>> {
  const apiResponse = await apiClient.get<AssignmentDetailResponse>(
    `/assignments/${assignmentId}?userId=${userId}`,
  )

  if (apiResponse.data?.assignment) {
    // Map DTO to domain model with proper type validation
    const mappedAssignment = mapAssignmentDetail(apiResponse.data.assignment)

    return {
      ...apiResponse,
      data: {
        success: apiResponse.data.success,
        message: apiResponse.data.message,
        assignment: mappedAssignment,
      },
    }
  }

  return apiResponse as ApiResponse<MappedAssignmentDetailResponse>
}

export async function createNewAssignmentForClass(
  classId: number,
  newAssignmentData: Omit<CreateAssignmentRequest, "classId">,
): Promise<Assignment> {
  const apiResponse = await apiClient.post<{
    success: boolean
    message?: string
    assignment?: Assignment
  }>(`/classes/${classId}/assignments`, newAssignmentData)

  if (
    apiResponse.error ||
    !apiResponse.data?.success ||
    !apiResponse.data.assignment
  ) {
    throw new Error(
      apiResponse.error ||
        apiResponse.data?.message ||
        "Failed to create assignment",
    )
  }

  return apiResponse.data.assignment
}

export async function updateAssignmentDetailsById(
  assignmentId: number,
  updatedAssignmentData: UpdateAssignmentRequest,
): Promise<Assignment> {
  const apiResponse = await apiClient.put<{
    success: boolean
    message?: string
    assignment?: Assignment
  }>(`/assignments/${assignmentId}`, updatedAssignmentData)

  if (
    apiResponse.error ||
    !apiResponse.data?.success ||
    !apiResponse.data.assignment
  ) {
    throw new Error(
      apiResponse.error ||
        apiResponse.data?.message ||
        "Failed to update assignment",
    )
  }

  return apiResponse.data.assignment
}

export async function deleteAssignmentByIdForTeacher(
  assignmentId: number,
  teacherId: number,
): Promise<void> {
  const apiResponse = await apiClient.delete<DeleteResponse>(
    `/assignments/${assignmentId}?teacherId=${teacherId}`,
  )

  if (apiResponse.error || !apiResponse.data?.success) {
    throw new Error(
      apiResponse.error ||
        apiResponse.data?.message ||
        "Failed to delete assignment",
    )
  }
}

export async function getSubmissionFileContentById(
  submissionId: number,
): Promise<
  ApiResponse<{ success: boolean; content: string; language?: string }>
> {
  return await apiClient.get(`/submissions/${submissionId}/content`)
}

export async function getSubmissionFileDownloadUrlById(
  submissionId: number,
): Promise<
  ApiResponse<{ success: boolean; message: string; downloadUrl: string }>
> {
  return await apiClient.get<{
    success: boolean
    message: string
    downloadUrl: string
  }>(`/submissions/${submissionId}/download`)
}

export async function getTestResultsForSubmissionById(
  submissionId: number,
): Promise<ApiResponse<TestResultsResponse>> {
  return await apiClient.get(`/submissions/${submissionId}/test-results`)
}

export async function executeTestsForSubmissionById(
  submissionId: number,
): Promise<ApiResponse<TestResultsResponse>> {
  return await apiClient.post(`/submissions/${submissionId}/run-tests`, {})
}

// Helper functions

async function retrieveAuthenticationTokenFromSession(): Promise<
  string | null
> {
  const { data: sessionData } = await supabase.auth.getSession()
  return sessionData.session?.access_token ?? null
}

function buildSubmissionFormDataFromRequest(
  submissionRequest: SubmitAssignmentRequest,
): FormData {
  const formData = new FormData()
  formData.append("assignment_id", submissionRequest.assignmentId.toString())
  formData.append("student_id", submissionRequest.studentId.toString())
  formData.append("file", submissionRequest.file)
  return formData
}

function extractErrorMessageFromResponseData(responseData: unknown): string {
  if (typeof responseData === "object" && responseData !== null) {
    const data = responseData as Record<string, unknown>
    if (data.detail && typeof data.detail === "string") return data.detail
    if (data.message && typeof data.message === "string") return data.message
  }
  if (typeof responseData === "string") return responseData
  return "Failed to submit assignment"
}

function buildErrorResponseForFailedSubmission(
  httpResponse: Response,
  responseData: unknown,
): ApiResponse<SubmitAssignmentResponse> {
  const errorMessage = extractErrorMessageFromResponseData(responseData)

  console.error("Submission failed:", {
    status: httpResponse.status,
    statusText: httpResponse.statusText,
    error: errorMessage,
    responseData: responseData,
  })

  return {
    error: `${errorMessage} (Status: ${httpResponse.status})`,
    status: httpResponse.status,
  }
}

function buildSuccessResponseFromSubmissionData(
  responseData: unknown,
  httpStatusCode: number,
): ApiResponse<SubmitAssignmentResponse> {
  // Validate responseData is an object
  if (typeof responseData !== "object" || responseData === null) {
    throw new Error("Invalid response data: expected object")
  }

  const data = responseData as Record<string, unknown>

  // Validate success field
  const success = typeof data.success === "boolean" ? data.success : false

  // Validate message field
  const message = typeof data.message === "string" ? data.message : undefined

  // Validate submission field
  let submission: Submission | undefined = undefined

  if (
    typeof data.submission === "object" &&
    data.submission !== null &&
    "id" in data.submission &&
    "assignmentId" in data.submission &&
    "studentId" in data.submission &&
    "fileName" in data.submission
  ) {
    // Only map if submission has the expected structure
    submission = mapSubmission(data.submission as SubmissionDTO)
  }

  return {
    data: {
      success,
      message,
      submission,
    },
    status: httpStatusCode,
  }
}
