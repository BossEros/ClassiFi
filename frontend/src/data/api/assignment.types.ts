import type { LatePenaltyConfig } from "@/shared/types/gradebook"
import type { Submission } from "@/shared/types/submission"
import type { AssignmentTestCase, ProgrammingLanguage } from "@/data/api/shared.types"
import type { TaskDTO } from "@/data/api/class.types"

export interface AssignmentDetail {
  id: number
  classId: number
  className: string
  assignmentName: string
  instructions: string
  instructionsImageUrl?: string | null
  programmingLanguage: ProgrammingLanguage
  deadline: string | null
  allowResubmission: boolean
  maxAttempts?: number | null
  createdAt?: string
  isActive: boolean
  hasSubmitted?: boolean
  latestSubmission?: Submission
  submissionCount?: number
  templateCode?: string | null
  hasTemplateCode?: boolean
  totalScore?: number
  scheduledDate?: string | null
  allowLateSubmissions?: boolean
  latePenaltyConfig?: LatePenaltyConfig | null
  testCases?: AssignmentTestCase[]
}

export interface SubmitAssignmentRequest {
  assignmentId: number
  studentId: number
  file: File
  programmingLanguage: ProgrammingLanguage
}

export interface CreateAssignmentRequest {
  classId: number
  teacherId: number
  assignmentName: string
  instructions: string
  instructionsImageUrl?: string | null
  programmingLanguage: ProgrammingLanguage
  deadline?: Date | string | null
  allowResubmission?: boolean
  maxAttempts?: number | null
  templateCode?: string | null
  totalScore?: number
  scheduledDate?: Date | string | null
  allowLateSubmissions?: boolean
  latePenaltyConfig?: LatePenaltyConfig | null
}

export interface UpdateAssignmentRequest {
  teacherId: number
  assignmentName?: string
  instructions?: string
  instructionsImageUrl?: string | null
  programmingLanguage?: ProgrammingLanguage
  deadline?: Date | string | null
  allowResubmission?: boolean
  maxAttempts?: number | null
  templateCode?: string | null
  totalScore?: number
  scheduledDate?: Date | string | null
  allowLateSubmissions?: boolean
  latePenaltyConfig?: LatePenaltyConfig | null
}

export interface UpdateAssignmentValidationData {
  teacherId?: number
  assignmentName?: string
  instructions?: string
  instructionsImageUrl?: string | null
  deadline?: Date | string | null
}

export interface CreateAssignmentResponse {
  success: boolean
  message?: string
  assignment?: TaskDTO
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

export interface AssignmentDetailResponse {
  success: boolean
  message?: string
  assignment?: AssignmentDetailDTO
}

/** Mapped assignment detail response with domain model */
export interface MappedAssignmentDetailResponse {
  success: boolean
  message?: string
  assignment?: AssignmentDetail
}

export interface AssignmentDetailDTO {
  id: number
  classId: number
  className: string
  assignmentName: string
  instructions: string
  instructionsImageUrl?: string | null
  programmingLanguage: string
  deadline: string | null
  allowResubmission: boolean
  maxAttempts?: number | null
  isActive: boolean
  createdAt?: string
  templateCode?: string | null
  hasTemplateCode?: boolean
  totalScore?: number
  scheduledDate?: string | null
  allowLateSubmissions?: boolean
  latePenaltyConfig?: LatePenaltyConfig | null
  testCases?: AssignmentTestCase[]
}

export interface SubmissionDTO {
  id: number
  assignmentId: number
  studentId: number
  fileName: string
  fileSize: number
  submissionNumber: number
  submittedAt: string | Date
  isLatest: boolean
  grade?: number | null
  assignmentName?: string
  studentName?: string
}
