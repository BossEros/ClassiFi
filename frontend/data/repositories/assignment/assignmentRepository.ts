/**
 * Assignment Repository
 * Part of the Data Access Layer
 * Handles API calls for assignment and submission operations
 */

import { apiClient, type ApiResponse } from '../../api/apiClient'
import type {
  SubmitAssignmentResponse,
  SubmissionListResponse,
  SubmissionHistoryResponse,
  AssignmentDetailResponse
} from '../../../business/models/assignment/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

/**
 * Submit an assignment with file upload
 * Uses multipart/form-data instead of JSON
 */
export async function submitAssignment(
  assignmentId: number,
  studentId: number,
  file: File
): Promise<ApiResponse<SubmitAssignmentResponse>> {
  try {
    // Create FormData for file upload
    const formData = new FormData()
    formData.append('assignment_id', assignmentId.toString())
    formData.append('student_id', studentId.toString())
    formData.append('file', file)

    // Make request with fetch directly (apiClient doesn't support FormData)
    const response = await fetch(`${API_BASE_URL}/submissions`, {
      method: 'POST',
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

      return {
        error: errorMessage,
        status: response.status
      }
    }

    // Convert snake_case to camelCase
    const responseData: SubmitAssignmentResponse = {
      success: data.success,
      message: data.message,
      submission: data.submission ? {
        id: data.submission.id,
        assignmentId: data.submission.assignment_id,
        studentId: data.submission.student_id,
        fileName: data.submission.file_name,
        fileSize: data.submission.file_size,
        submissionNumber: data.submission.submission_number,
        submittedAt: new Date(data.submission.submitted_at),
        isLatest: data.submission.is_latest
      } : undefined
    }

    return {
      data: responseData,
      status: response.status
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to submit assignment',
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
    // Convert snake_case to camelCase and date strings to Date objects
    response.data = {
      ...response.data,
      submissions: response.data.submissions.map((sub: any) => ({
        id: sub.id,
        assignmentId: sub.assignment_id,
        studentId: sub.student_id,
        fileName: sub.file_name,
        fileSize: sub.file_size,
        submissionNumber: sub.submission_number,
        submittedAt: new Date(sub.submitted_at),
        isLatest: sub.is_latest
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
    `/submissions/student/${studentId}?latest_only=${latestOnly}`
  )

  if (response.data) {
    // Convert snake_case to camelCase
    response.data = {
      ...response.data,
      submissions: response.data.submissions.map((sub: any) => ({
        id: sub.id,
        assignmentId: sub.assignment_id,
        studentId: sub.student_id,
        fileName: sub.file_name,
        fileSize: sub.file_size,
        submissionNumber: sub.submission_number,
        submittedAt: new Date(sub.submitted_at),
        isLatest: sub.is_latest,
        assignmentName: sub.assignment_name
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
    `/submissions/assignment/${assignmentId}?latest_only=${latestOnly}`
  )

  if (response.data) {
    // Convert snake_case to camelCase
    response.data = {
      ...response.data,
      submissions: response.data.submissions.map((sub: any) => ({
        id: sub.id,
        assignmentId: sub.assignment_id,
        studentId: sub.student_id,
        fileName: sub.file_name,
        fileSize: sub.file_size,
        submissionNumber: sub.submission_number,
        submittedAt: new Date(sub.submitted_at),
        isLatest: sub.is_latest,
        studentName: sub.student_name
      }))
    }
  }

  return response
}

/**
 * Get assignment details by ID
 * Note: Uses the existing classes endpoint
 */
export async function getAssignmentById(
  assignmentId: number,
  userId: number
): Promise<ApiResponse<AssignmentDetailResponse>> {
  const response = await apiClient.get<AssignmentDetailResponse>(
    `/assignments/${assignmentId}?user_id=${userId}`
  )

  if (response.data) {
    // Convert snake_case to camelCase
    // The API returns the assignment object directly inside the response wrapper
    // We need to ensure the types match
    const assignmentData = response.data.assignment as any

    response.data = {
      ...response.data,
      assignment: {
        id: assignmentData.id,
        classId: assignmentData.class_id,
        className: assignmentData.class_name,
        title: assignmentData.title,
        description: assignmentData.description,
        programmingLanguage: assignmentData.programming_language,
        deadline: new Date(assignmentData.deadline),
        allowResubmission: assignmentData.allow_resubmission,
        isActive: assignmentData.is_active,
        createdAt: new Date(assignmentData.created_at)
      }
    }
  }

  return response
}
