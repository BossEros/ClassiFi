/**
 * Assignment and Submission Types
 * Part of the Business Logic Layer
 * Type definitions for assignments and submissions
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

export interface SubmitAssignmentRequest {
  assignmentId: number
  studentId: number
  file: File
}

export interface SubmitAssignmentResponse {
  success: boolean
  message?: string
  submission?: Submission
}

export interface SubmissionListResponse {
  success: boolean
  message?: string
  submissions: Submission[]
}

export interface SubmissionHistoryResponse {
  success: boolean
  message?: string
  submissions: Submission[]
  totalSubmissions: number
}

export interface AssignmentDetail {
  id: number
  classId: number
  className: string
  title: string
  description: string
  programmingLanguage: string
  deadline: Date
  allowResubmission: boolean
  createdAt?: Date
  isActive: boolean
  // Submission status for the current student
  hasSubmitted?: boolean
  latestSubmission?: Submission
  submissionCount?: number
}

export interface AssignmentDetailResponse {
  success: boolean
  message?: string
  assignment?: AssignmentDetail
}
