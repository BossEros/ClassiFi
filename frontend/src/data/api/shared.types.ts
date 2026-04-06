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
  gradeBreakdown?: import("@/data/api/gradebook.types").GradeBreakdown | null
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

/**
 * Array of valid programming languages.
 */
export const VALID_PROGRAMMING_LANGUAGES = ["python", "java", "c"] as const

/** Supported programming languages for assignments */
export type ProgrammingLanguage = (typeof VALID_PROGRAMMING_LANGUAGES)[number]

/** Test case structure for assignments */
export interface AssignmentTestCase {
  id: number
  name: string
  isHidden: boolean
  input?: string
  expectedOutput?: string
}

export interface SuccessResponse {
  success: boolean
  message: string
}
