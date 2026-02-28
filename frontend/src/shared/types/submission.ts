/**
 * Core submission types used across the application layers.
 */

export interface Submission {
  id: number
  assignmentId: number
  studentId: number
  fileName: string
  fileSize: number
  submissionNumber: number
  submittedAt: string
  isLatest: boolean
  grade?: number | null
  teacherFeedback?: string | null
  feedbackGivenAt?: string | null
  isGradeOverridden?: boolean
  overrideReason?: string | null
  overriddenAt?: string | null
  assignmentName?: string
  studentName?: string
}

export interface SubmissionWithAssignment extends Submission {
  assignmentName: string
}

export interface SubmissionWithStudent extends Submission {
  studentName: string
}

export interface SubmissionContent {
  content: string
  language?: string
}
