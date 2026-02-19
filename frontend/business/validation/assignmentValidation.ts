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
 * Validates the assignment description.
 *
 * @param description - The description to validate.
 * @param descriptionImageUrl - Optional image URL used as the main description.
 * @returns An error message string if invalid, otherwise null.
 */
export const validateDescription = (
  description: string,
  descriptionImageUrl?: string | null,
): string | null => {
  const trimmed = description.trim()
  const hasDescriptionImage = !!descriptionImageUrl?.trim()

  if (!trimmed && !hasDescriptionImage) {
    return "Add a description or upload an image"
  }

  if (trimmed.length > 5000) {
    return "Description must not exceed 5000 characters"
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

  // Validate description
  if (data.description !== undefined || data.descriptionImageUrl !== undefined) {
    const descriptionError = validateDescription(
      data.description ?? "",
      data.descriptionImageUrl,
    )
    if (descriptionError) {
      errors.push({ field: "description", message: descriptionError })
    }
  } else {
    errors.push({
      field: "description",
      message: "Add a description or upload an image",
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

  // Validate description if provided
  if (data.description !== undefined) {
    if (data.description.trim().length > 5000) {
      throw new Error("Description must not exceed 5000 characters")
    }
  }

  // Validate deadline if provided
  if (data.deadline !== undefined) {
    const deadlineError = validateDeadline(data.deadline)

    if (deadlineError) {
      throw new Error(deadlineError)
    }
  }
}
