import type { ProgrammingLanguage } from "@/business/models/assignment/types"
import type { LatePenaltyConfig, PenaltyTier } from "@/shared/types/gradebook"
import { DEFAULT_LATE_PENALTY_CONFIG } from "@/presentation/components/teacher/forms/assignment/LatePenaltyConfig"
import type { AssignmentFormData } from "@/presentation/hooks/teacher/assignmentForm.types"

function generateTierId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID()
  }

  return `tier-${Math.random().toString(36).slice(2, 10)}`
}

export function normalizeLatePenaltyConfig(
  latePenaltyConfig: LatePenaltyConfig | null | undefined,
): LatePenaltyConfig {
  const sourceConfig = latePenaltyConfig ?? DEFAULT_LATE_PENALTY_CONFIG

  const normalizedTiers: PenaltyTier[] = sourceConfig.tiers.map((tier) => {
    const tierWithOptionalId = tier as PenaltyTier & { id?: string }
    const tierWithLegacyHours = tier as PenaltyTier & {
      hoursAfterGrace?: number
    }
    const hasValidId =
      typeof tierWithOptionalId.id === "string" &&
      tierWithOptionalId.id.trim().length > 0
    const tierHoursLate =
      typeof tier.hoursLate === "number"
        ? tier.hoursLate
        : (tierWithLegacyHours.hoursAfterGrace ?? 0)

    return {
      id: hasValidId ? tierWithOptionalId.id : generateTierId(),
      hoursLate: Math.max(0, tierHoursLate),
      penaltyPercent: tier.penaltyPercent,
    }
  })

  return {
    tiers: normalizedTiers,
    rejectAfterHours: sourceConfig.rejectAfterHours,
  }
}

export interface AssignmentPayload {
  teacherId: number
  assignmentName: string
  instructions: string
  instructionsImageUrl: string | null
  programmingLanguage: ProgrammingLanguage
  deadline: Date | null
  allowResubmission: boolean
  maxAttempts: number | null
  templateCode: string | null
  totalScore: number
  scheduledDate: Date | null
  allowLateSubmissions: boolean
  latePenaltyConfig: LatePenaltyConfig | null
}

export function buildAssignmentPayload(
  formData: AssignmentFormData,
  teacherId: number,
): AssignmentPayload {
  const hasDeadline = formData.deadline.trim().length > 0
  const shouldEnableLatePenalty = hasDeadline && formData.allowLateSubmissions

  return {
    teacherId,
    assignmentName: formData.assignmentName.trim(),
    instructions: formData.instructions.trim(),
    instructionsImageUrl: formData.instructionsImageUrl,
    programmingLanguage: formData.programmingLanguage as ProgrammingLanguage,
    deadline: formData.deadline ? new Date(formData.deadline) : null,
    allowResubmission: formData.allowResubmission,
    maxAttempts: formData.allowResubmission ? formData.maxAttempts : 1,
    templateCode: formData.templateCode || null,
    totalScore: formData.totalScore ?? 0,
    scheduledDate: formData.scheduledDate
      ? new Date(formData.scheduledDate)
      : null,
    allowLateSubmissions: shouldEnableLatePenalty,
    latePenaltyConfig: shouldEnableLatePenalty
      ? formData.latePenaltyConfig
      : null,
  }
}
