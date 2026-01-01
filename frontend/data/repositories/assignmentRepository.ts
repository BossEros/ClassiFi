import { apiClient, type ApiResponse } from '../api/apiClient'
import type {
  SubmitAssignmentRequest,
  SubmitAssignmentResponse,
  SubmissionListResponse,
  SubmissionHistoryResponse,
  AssignmentDetailResponse
} from '../../business/models/assignment/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1'

/**
 * Gets the auth token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('authToken')
}

/**
 * Submit an assignment with file upload
 * Uses multipart/form-data instead of JSON
 */
export async function submitAssignment(
  request: SubmitAssignmentRequest
): Promise<ApiResponse<SubmitAssignmentResponse>> {
  try {
    // Create FormData for file upload - use snake_case keys to match backend
    const formData = new FormData()
    formData.append('assignment_id', request.assignmentId.toString())
    formData.append('student_id', request.studentId.toString())
    formData.append('file', request.file)

    // Get auth token
    const authToken = getAuthToken()

    // Make request with fetch directly (apiClient doesn't support FormData)
    const response = await fetch(`${API_BASE_URL}/submissions`, {
      method: 'POST',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      body: formData
      // Don't set Content-Type header - browser will set it with boundary
    })

    const data = await response.json()

    if (!response.ok) {
      let errorMessage = 'Failed to submit assignment'

      if (data.detail) {
        errorMessage = data.detail
      } else if (data.message) {
        errorMessage = data.message
      } else if (typeof data === 'string') {
        errorMessage = data
      }

      console.error('Submission failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        responseData: data
      })

      return {
        error: `${errorMessage} (Status: ${response.status})`,
        status: response.status
      }
    }

    // Backend now returns camelCase - direct mapping
    const responseData: SubmitAssignmentResponse = {
      success: data.success,
      message: data.message,
      submission: data.submission ? {
        id: data.submission.id,
        assignmentId: data.submission.assignmentId,
        studentId: data.submission.studentId,
        fileName: data.submission.fileName,
        fileSize: data.submission.fileSize,
        submissionNumber: data.submission.submissionNumber,
        submittedAt: new Date(data.submission.submittedAt),
        isLatest: data.submission.isLatest
      } : undefined
    }

    return {
      data: responseData,
      status: response.status
    }
  } catch (error) {
    console.error('Submission error (network or other):', error)

    return {
      error: error instanceof Error
        ? `Network error: ${error.message}. Make sure the backend server is running.`
        : 'Failed to submit assignment',
      status: 0
    }
  }
}

/**
 * Get submission history for a specific student and assignment
 */
export async function getSubmissionHistory(
  assignmentId: number,
  studentId: number
): Promise<ApiResponse<SubmissionHistoryResponse>> {
  const response = await apiClient.get<SubmissionHistoryResponse>(
    `/submissions/history/${assignmentId}/${studentId}`
  )

  if (response.data) {
    // Backend returns camelCase - convert date strings to Date objects
    response.data = {
      ...response.data,
      submissions: response.data.submissions.map((sub: any) => ({
        id: sub.id,
        assignmentId: sub.assignmentId,
        studentId: sub.studentId,
        fileName: sub.fileName,
        fileSize: sub.fileSize,
        submissionNumber: sub.submissionNumber,
        submittedAt: new Date(sub.submittedAt),
        isLatest: sub.isLatest
      }))
    }
  }

  return response
}

/**
 * Get all submissions by a student
 */
export async function getStudentSubmissions(
  studentId: number,
  latestOnly: boolean = true
): Promise<ApiResponse<SubmissionListResponse>> {
  const response = await apiClient.get<SubmissionListResponse>(
    `/submissions/student/${studentId}?latestOnly=${latestOnly}`
  )

  if (response.data) {
    // Backend returns camelCase - convert date strings to Date objects
    response.data = {
      ...response.data,
      submissions: response.data.submissions.map((sub: any) => ({
        id: sub.id,
        assignmentId: sub.assignmentId,
        studentId: sub.studentId,
        fileName: sub.fileName,
        fileSize: sub.fileSize,
        submissionNumber: sub.submissionNumber,
        submittedAt: new Date(sub.submittedAt),
        isLatest: sub.isLatest,
        assignmentName: sub.assignmentName
      }))
    }
  }

  return response
}

/**
 * Get all submissions for an assignment (typically for teachers)
 */
export async function getAssignmentSubmissions(
  assignmentId: number,
  latestOnly: boolean = true
): Promise<ApiResponse<SubmissionListResponse>> {
  const response = await apiClient.get<SubmissionListResponse>(
    `/submissions/assignment/${assignmentId}?latestOnly=${latestOnly}`
  )

  if (response.data) {
    // Backend returns camelCase - convert date strings to Date objects
    response.data = {
      ...response.data,
      submissions: response.data.submissions.map((sub: any) => ({
        id: sub.id,
        assignmentId: sub.assignmentId,
        studentId: sub.studentId,
        fileName: sub.fileName,
        fileSize: sub.fileSize,
        submissionNumber: sub.submissionNumber,
        submittedAt: new Date(sub.submittedAt),
        isLatest: sub.isLatest,
        studentName: sub.studentName
      }))
    }
  }

  return response
}

/**
 * Get assignment details by ID
 */
export async function getAssignmentById(
  assignmentId: number,
  userId: number
): Promise<ApiResponse<AssignmentDetailResponse>> {
  const response = await apiClient.get<any>(
    `/assignments/${assignmentId}?userId=${userId}`
  )

  if (response.data && response.data.assignment) {
    // Backend returns camelCase - convert date strings to Date objects
    const assignmentData = response.data.assignment

    response.data = {
      success: response.data.success,
      message: response.data.message,
      assignment: {
        id: assignmentData.id,
        classId: assignmentData.classId,
        className: assignmentData.className,
        assignmentName: assignmentData.assignmentName,
        title: assignmentData.assignmentName,
        description: assignmentData.description,
        programmingLanguage: assignmentData.programmingLanguage,
        deadline: new Date(assignmentData.deadline),
        allowResubmission: assignmentData.allowResubmission,
        maxAttempts: assignmentData.maxAttempts ?? null,
        isActive: assignmentData.isActive,
        createdAt: assignmentData.createdAt ? new Date(assignmentData.createdAt) : undefined
      }
    }
  }

  return response
}
