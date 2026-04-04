import type { Assignment } from "@/modules/assignments/assignment.model.js"

const DEFAULT_TOTAL_SCORE = 100

export interface AssignmentDTO {
  id: number
  classId: number
  moduleId: number | null
  assignmentName: string
  instructions: string
  instructionsImageUrl: string | null
  programmingLanguage: string
  deadline: string | null
  allowResubmission: boolean
  maxAttempts: number | null
  createdAt: string
  isActive: boolean
  templateCode: string | null
  hasTemplateCode: boolean
  totalScore: number
  scheduledDate: string | null
  allowLateSubmissions: boolean
  latePenaltyConfig: Assignment["latePenaltyConfig"] | null
  enableSimilarityPenalty: boolean
  submissionCount?: number
  studentCount?: number
  hasSubmitted?: boolean
  submittedAt?: string | null
  grade?: number | null
  maxGrade?: number
  className?: string
  testCases?: { id: number; name: string; isHidden: boolean }[]
}

export function toAssignmentDTO(
  assignment: Assignment,
  extras?: {
    submissionCount?: number
    studentCount?: number
    hasSubmitted?: boolean
    submittedAt?: string | null
    grade?: number | null
    maxGrade?: number
    className?: string
    testCases?: { id: number; name: string; isHidden: boolean }[]
  },
): AssignmentDTO {
  return {
    id: assignment.id,
    classId: assignment.classId,
    moduleId: assignment.moduleId ?? null,
    assignmentName: assignment.assignmentName,
    instructions: assignment.instructions,
    instructionsImageUrl: assignment.instructionsImageUrl ?? null,
    programmingLanguage: assignment.programmingLanguage,
    deadline: assignment.deadline?.toISOString() ?? null,
    allowResubmission: assignment.allowResubmission ?? true,
    maxAttempts: assignment.maxAttempts ?? null,
    createdAt: assignment.createdAt?.toISOString() ?? new Date().toISOString(),
    isActive: assignment.isActive ?? true,
    templateCode: assignment.templateCode ?? null,
    hasTemplateCode: !!assignment.templateCode,
    totalScore: assignment.totalScore ?? DEFAULT_TOTAL_SCORE,
    scheduledDate: assignment.scheduledDate?.toISOString() ?? null,
    allowLateSubmissions: assignment.allowLateSubmissions ?? false,
    latePenaltyConfig: assignment.latePenaltyConfig ?? null,
    enableSimilarityPenalty: assignment.enableSimilarityPenalty ?? false,
    ...extras,
  }
}
