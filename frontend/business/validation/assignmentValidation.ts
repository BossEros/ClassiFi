import type {
  CreateAssignmentRequest,
  UpdateAssignmentValidationData,
} from "@/data/api/types"
import { VALID_PROGRAMMING_LANGUAGES } from "@/data/api/types"
import type { ValidationError, ValidationResult } from "@/shared/types/auth"

/**
 * Validates the assignment title.
 *
 * @param title - The assignment title to validate.
 * @returns An error message string if invalid, otherwise null.
 */
export const validateAssignmentTitle = (title: string): string | null => {
  const trimmed = title.trim()

  if (!trimmed) {
    return "Assignment title is required"
  }

  if (trimmed.length > 150) {
    return "Assignment title must not exceed 150 characters"
  }

  return null
}

/**
 * Validates the assignment instructions.
 *
 * @param instructions - The instructions to validate.
 * @param instructionsImageUrl - Optional image URL used as the main instructions.
 * @returns An error message string if invalid, otherwise null.
 */
export const validateInstructions = (
  instructions: string,
  instructionsImageUrl?: string | null,
): string | null => {
  const trimmed = instructions.trim()
  const hasInstructionsImage = !!instructionsImageUrl?.trim()

  if (!trimmed && !hasInstructionsImage) {
    return "Add instructions or upload an image"
  }

  if (trimmed.length > 5000) {
    return "Instructions must not exceed 5000 characters"
  }

  return null
}

/**
 * Validates the programming language.
 *
 * @param language - The programming language to validate.
 * @returns An error message string if invalid, otherwise null.
 */
export const validateProgrammingLanguage = (
  language: string,
): string | null => {
  if (!language) {
    return "Programming language is required"
  }

  // Cast to string to safely check includes against typed array
  if (
    !(VALID_PROGRAMMING_LANGUAGES as readonly string[]).includes(
      language.toLowerCase(),
    )
  ) {
    return "Invalid programming language. Must be Python, Java, or C"
  }

  return null
}

/**
 * Validates the assignment deadline.
 *
 * @param deadline - The deadline date or string to validate.
 * @returns An error message string if invalid, otherwise null.
 */
export const validateDeadline = (
  deadline: Date | string | null | undefined,
): string | null => {
  if (!deadline) {
    return null
  }

  const deadlineDate =
    typeof deadline === "string" ? new Date(deadline) : deadline

  if (isNaN(deadlineDate.getTime())) {
    return "Invalid deadline date"
  }

  const now = new Date()

  if (deadlineDate <= now) {
    return "Deadline must be in the future"
  }

  return null
}

/**
 * Validates complete assignment creation data.
 *
 * @param data - The partial assignment data to validate.
 * @returns A ValidationResult object containing validity status and any errors.
 */
export const validateCreateAssignmentData = (
  data: Partial<CreateAssignmentRequest>,
): ValidationResult => {
  const errors: ValidationError[] = []

  // Validate title
  if (data.assignmentName !== undefined) {
    const titleError = validateAssignmentTitle(data.assignmentName)

    if (titleError) {
      errors.push({ field: "assignmentName", message: titleError })
    }
  } else {
    errors.push({
      field: "assignmentName",
      message: "Assignment title is required",
    })
  }

  // Validate instructions
  if (data.instructions !== undefined || data.instructionsImageUrl !== undefined) {
    const instructionsError = validateInstructions(
      data.instructions ?? "",
      data.instructionsImageUrl,
    )
    if (instructionsError) {
      errors.push({ field: "instructions", message: instructionsError })
    }
  } else {
    errors.push({
      field: "instructions",
      message: "Add instructions or upload an image",
    })
  }

  // Validate programming language
  if (data.programmingLanguage !== undefined) {
    const languageError = validateProgrammingLanguage(data.programmingLanguage)

    if (languageError) {
      errors.push({ field: "programmingLanguage", message: languageError })
    }
  } else {
    errors.push({
      field: "programmingLanguage",
      message: "Programming language is required",
    })
  }

  // Validate deadline
  if (data.deadline !== undefined) {
    const deadlineError = validateDeadline(data.deadline)

    if (deadlineError) {
      errors.push({ field: "deadline", message: deadlineError })
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validates update assignment data (partial - only validates provided fields).
 * Throws an error if validation fails.
 *
 * @param data - The data object containing fields to update and the teacher ID.
 * @throws {Error} If validation fails or teacher ID is invalid.
 */
export const validateUpdateAssignmentData = (
  data: UpdateAssignmentValidationData,
): void => {
  // Validate teacher ID (required for authorization)
  if (!data.teacherId || data.teacherId <= 0) {
    throw new Error("Invalid teacher ID")
  }

  // Validate title if provided
  if (data.assignmentName !== undefined) {
    const titleError = validateAssignmentTitle(data.assignmentName)

    if (titleError) {
      throw new Error(titleError)
    }
  }

  // Validate deadline if provided
  if (data.deadline !== undefined) {
    const deadlineError = validateDeadline(data.deadline)

    if (deadlineError) {
      throw new Error(deadlineError)
    }
  }

  // Validate instructions content consistency
  const instructionsError = validateInstructions(
    data.instructions ?? "",
    data.instructionsImageUrl,
  )

  if (instructionsError) {
    throw new Error(instructionsError)
  }
}
