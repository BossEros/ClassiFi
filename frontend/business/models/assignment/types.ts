/**
 * Type definitions for assignments and submissions.
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Represents a student's submission for an assignment.
 */
export interface Submission {
  id: number
  assignmentId: number

  studentId: number
  fileName: string
  fileSize: number
  submissionNumber: number
  submittedAt: Date
  isLatest: boolean
  assignmentName?: string
  studentName?: string
}

/**
 * Detailed information about an assignment, including submission status.
 */
export interface AssignmentDetail {
  id: number
  classId: number
  className: string
  assignmentName: string
  description: string
  programmingLanguage: string
  deadline: Date | string
  allowResubmission: boolean
  maxAttempts?: number | null
  createdAt?: Date | string
  isActive: boolean
  hasSubmitted?: boolean
  latestSubmission?: Submission
  submissionCount?: number
}

// ============================================================================
// Request Schemas
// ============================================================================

/**
 * Payload for submitting an assignment.
 */
export interface SubmitAssignmentRequest {
  assignmentId: number
  studentId: number
  file: File
  programmingLanguage: string
}

/**
 * Payload for updating an assignment.
 */
export interface UpdateAssignmentRequest {
  teacherId: number
  assignmentName?: string
  description?: string
  programmingLanguage?: 'python' | 'java' | 'c'
  deadline?: Date
  allowResubmission?: boolean
  maxAttempts?: number | null
}

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * Response for submitting an assignment.
 */
export interface SubmitAssignmentResponse {
  success: boolean
  message?: string
  submission?: Submission
}

/**
 * Response for listing submissions.
 */
export interface SubmissionListResponse {
  success: boolean
  message?: string
  submissions: Submission[]
}

/**
 * Response for listing submission history.
 */
export interface SubmissionHistoryResponse {
  success: boolean
  message?: string
  submissions: Submission[]
  totalSubmissions: number
}

/**
 * Response for getting assignment detail.
 */
export interface AssignmentDetailResponse {
  success: boolean
  message?: string
  assignment?: AssignmentDetail
}
