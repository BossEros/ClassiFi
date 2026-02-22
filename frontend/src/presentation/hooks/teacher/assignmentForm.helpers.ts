import {
  validateAssignmentTitle,
  validateInstructions,
  validateProgrammingLanguage,
  validateDeadline,
} from "@/business/validation/assignmentValidation"
import type { ProgrammingLanguage } from "@/business/models/assignment/types"
import type { LatePenaltyConfig, PenaltyTier } from "@/shared/types/gradebook"
import { DEFAULT_LATE_PENALTY_CONFIG } from "@/presentation/components/teacher/forms/assignment/LatePenaltyConfig"
import type {
  AssignmentFormData,
  FormErrors,
} from "@/presentation/hooks/teacher/assignmentForm.types"

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

export function validateAssignmentFormData(
  formData: AssignmentFormData,
): FormErrors {
  const newErrors: FormErrors = {}

  const nameError = validateAssignmentTitle(formData.assignmentName)
  if (nameError) newErrors.assignmentName = nameError

  const descError = validateInstructions(
    formData.instructions,
    formData.instructionsImageUrl,
  )
  if (descError) newErrors.instructions = descError

  const langError = validateProgrammingLanguage(formData.programmingLanguage)
  if (langError) newErrors.programmingLanguage = langError

  if (formData.deadline) {
    const deadlineError = validateDeadline(new Date(formData.deadline))
    if (deadlineError) newErrors.deadline = deadlineError
  }

  if (formData.scheduledDate) {
    const scheduledTime = formData.scheduledDate.split("T")[1]?.slice(0, 5)
    const hasScheduledTime = Boolean(scheduledTime)

    if (!hasScheduledTime) {
      newErrors.scheduledDate = "Release time is required"
    }
  }

  if (formData.totalScore === null) {
    newErrors.totalScore = "Total score is required"
  } else if (formData.totalScore < 1) {
    newErrors.totalScore = "Total score must be at least 1"
  }

  if (formData.allowResubmission && formData.maxAttempts !== null) {
    if (formData.maxAttempts < 1 || formData.maxAttempts > 99) {
      newErrors.maxAttempts = "Max attempts must be between 1 and 99"
    }
  }

  return newErrors
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
