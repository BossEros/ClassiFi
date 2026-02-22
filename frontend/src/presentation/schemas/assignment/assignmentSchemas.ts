import { z } from "zod"
import { PROGRAMMING_LANGUAGE_OPTIONS } from "@/shared/constants"

const penaltyTierSchema = z.object({
  id: z.string(),
  hoursLate: z.number(),
  penaltyPercent: z.number(),
})

const latePenaltyConfigSchema = z.object({
  tiers: z.array(penaltyTierSchema),
  rejectAfterHours: z.number().nullable(),
})

const supportedProgrammingLanguages = new Set<string>(
  PROGRAMMING_LANGUAGE_OPTIONS.map((option) => option.value),
)

function validateAssignmentTitleValue(titleValue: string): string | null {
  const normalizedTitle = titleValue.trim()

  if (!normalizedTitle) {
    return "Assignment title is required"
  }

  if (normalizedTitle.length > 150) {
    return "Assignment title must not exceed 150 characters"
  }

  return null
}

function validateInstructionsValue(
  instructionsValue: string,
  instructionsImageUrlValue: string | null,
): string | null {
  const normalizedInstructions = instructionsValue.trim()
  const hasInstructionsImage = Boolean(instructionsImageUrlValue?.trim())

  if (!normalizedInstructions && !hasInstructionsImage) {
    return "Add instructions or upload an image"
  }

  if (normalizedInstructions.length > 5000) {
    return "Instructions must not exceed 5000 characters"
  }

  return null
}

function validateProgrammingLanguageValue(
  programmingLanguageValue: string,
): string | null {
  if (!programmingLanguageValue) {
    return "Programming language is required"
  }

  if (!supportedProgrammingLanguages.has(programmingLanguageValue.toLowerCase())) {
    return "Invalid programming language. Must be Python, Java, or C"
  }

  return null
}

function validateDeadlineValue(deadlineValue: Date): string | null {
  if (Number.isNaN(deadlineValue.getTime())) {
    return "Invalid deadline date"
  }

  const currentDate = new Date()

  if (deadlineValue <= currentDate) {
    return "Deadline must be in the future"
  }

  return null
}

/**
 * Assignment form schema used by the teacher assignment create/edit flow.
 */
export const assignmentFormSchema = z
  .object({
    assignmentName: z.string(),
    instructions: z.string(),
    instructionsImageUrl: z.string().nullable(),
    programmingLanguage: z.string(),
    deadline: z.string(),
    allowResubmission: z.boolean(),
    maxAttempts: z.number().nullable(),
    templateCode: z.string(),
    totalScore: z.number().nullable(),
    scheduledDate: z.string().nullable(),
    allowLateSubmissions: z.boolean(),
    latePenaltyConfig: latePenaltyConfigSchema,
  })
  .superRefine((formValue, context) => {
    const assignmentNameError = validateAssignmentTitleValue(
      formValue.assignmentName,
    )

    if (assignmentNameError) {
      context.addIssue({
        code: "custom",
        path: ["assignmentName"],
        message: assignmentNameError,
      })
    }

    const instructionsError = validateInstructionsValue(
      formValue.instructions,
      formValue.instructionsImageUrl,
    )

    if (instructionsError) {
      context.addIssue({
        code: "custom",
        path: ["instructions"],
        message: instructionsError,
      })
    }

    const programmingLanguageError = validateProgrammingLanguageValue(
      formValue.programmingLanguage,
    )

    if (programmingLanguageError) {
      context.addIssue({
        code: "custom",
        path: ["programmingLanguage"],
        message: programmingLanguageError,
      })
    }

    const hasDeadline = formValue.deadline.trim().length > 0

    if (hasDeadline) {
      const deadlineError = validateDeadlineValue(new Date(formValue.deadline))

      if (deadlineError) {
        context.addIssue({
          code: "custom",
          path: ["deadline"],
          message: deadlineError,
        })
      }
    }

    if (formValue.scheduledDate) {
      const scheduledTime = formValue.scheduledDate.split("T")[1]?.slice(0, 5)
      const hasScheduledTime = Boolean(scheduledTime)

      if (!hasScheduledTime) {
        context.addIssue({
          code: "custom",
          path: ["scheduledDate"],
          message: "Release time is required",
        })
      }
    }

    if (formValue.totalScore === null) {
      context.addIssue({
        code: "custom",
        path: ["totalScore"],
        message: "Total score is required",
      })
    } else if (formValue.totalScore < 1) {
      context.addIssue({
        code: "custom",
        path: ["totalScore"],
        message: "Total score must be at least 1",
      })
    }

    if (formValue.allowResubmission && formValue.maxAttempts !== null) {
      if (formValue.maxAttempts < 1 || formValue.maxAttempts > 99) {
        context.addIssue({
          code: "custom",
          path: ["maxAttempts"],
          message: "Max attempts must be between 1 and 99",
        })
      }
    }
  })

/**
 * Test case modal schema used for test case create/edit.
 */
export const testCaseFormSchema = z.object({
  name: z.string().max(100, "Name must be 100 characters or less"),
  input: z.string(),
  expectedOutput: z
    .string()
    .refine((expectedOutputValue) => expectedOutputValue.trim().length > 0, {
      message: "Expected output is required",
    }),
  isHidden: z.boolean(),
  timeLimit: z.number(),
})

export type AssignmentFormValues = z.infer<typeof assignmentFormSchema>
export type TestCaseFormValues = z.infer<typeof testCaseFormSchema>
