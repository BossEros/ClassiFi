import type {
  DayOfWeek,
  Schedule,
  Class,
  Assignment,
  EnrolledStudent,
} from "@/shared/types/class"
import type {
  Submission,
  SubmissionWithAssignment,
  SubmissionWithStudent,
  SubmissionContent,
} from "@/shared/types/submission"

export type { DayOfWeek, Schedule, Class, Assignment, EnrolledStudent }
export type {
  Submission,
  SubmissionWithAssignment,
  SubmissionWithStudent,
  SubmissionContent,
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
