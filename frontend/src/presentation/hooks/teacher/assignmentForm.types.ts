import type { ProgrammingLanguage } from "@/business/models/assignment/types"
import type { LatePenaltyConfig } from "@/shared/types/gradebook"

export interface AssignmentFormData {
  assignmentName: string
  instructions: string
  instructionsImageUrl: string | null
  programmingLanguage: ProgrammingLanguage | ""
  deadline: string
  allowResubmission: boolean
  maxAttempts: number | null
  templateCode: string
  totalScore: number | null
  scheduledDate: string | null
  allowLateSubmissions: boolean
  latePenaltyConfig: LatePenaltyConfig
}

export interface FormErrors {
  assignmentName?: string
  instructions?: string
  programmingLanguage?: string
  deadline?: string
  scheduledDate?: string
  totalScore?: string
  maxAttempts?: string
  general?: string
}

export type AssignmentFormInputChangeHandler = <
  K extends keyof AssignmentFormData,
>(
  field: K,
  value: AssignmentFormData[K],
) => void
