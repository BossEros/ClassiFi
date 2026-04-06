import type { LatePenaltyConfig } from "@/modules/assignments/assignment.model.js"
import type { SimilarityPenaltyConfig } from "@/modules/assignments/similarity-penalty-config.js"

/** DTO for AssignmentService.createAssignment */
export interface CreateAssignmentServiceDTO {
  classId: number
  teacherId: number
  moduleId: number
  assignmentName: string
  instructions: string
  instructionsImageUrl?: string | null
  programmingLanguage: "python" | "java" | "c"
  deadline: Date | null
  allowResubmission?: boolean
  maxAttempts?: number | null
  templateCode?: string | null
  totalScore?: number
  scheduledDate?: Date | null
  allowLateSubmissions?: boolean
  latePenaltyConfig?: LatePenaltyConfig | null
  enableSimilarityPenalty?: boolean
  similarityPenaltyConfig?: SimilarityPenaltyConfig | null
}

/** DTO for AssignmentService.updateAssignment */
export interface UpdateAssignmentServiceDTO {
  assignmentId: number
  teacherId: number
  assignmentName?: string
  instructions?: string
  instructionsImageUrl?: string | null
  programmingLanguage?: "python" | "java" | "c"
  deadline?: Date | null
  allowResubmission?: boolean
  maxAttempts?: number | null
  templateCode?: string | null
  totalScore?: number
  scheduledDate?: Date | null
  allowLateSubmissions?: boolean
  latePenaltyConfig?: LatePenaltyConfig | null
  moduleId?: number
  enableSimilarityPenalty?: boolean
  similarityPenaltyConfig?: SimilarityPenaltyConfig | null
}
