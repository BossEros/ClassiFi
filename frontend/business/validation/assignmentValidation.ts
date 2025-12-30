import type { CreateAssignmentRequest } from '@/data/api/types'

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

/**
 * Validate assignment title
 */
export const validateAssignmentTitle = (title: string): string | null => {
  const trimmed = title.trim()

  if (!trimmed) {
    return 'Assignment title is required'
  }

  if (trimmed.length > 150) {
    return 'Assignment title must not exceed 150 characters'
  }

  return null
}

/**
 * Validate assignment description
 */
export const validateDescription = (description: string): string | null => {
  const trimmed = description.trim()

  if (!trimmed) {
    return 'Description is required'
  }

  if (trimmed.length < 10) {
    return 'Description must be at least 10 characters'
  }

  return null
}

/**
 * Validate programming language
 */
export const validateProgrammingLanguage = (language: string): string | null => {
  if (!language) {
    return 'Programming language is required'
  }

  const validLanguages = ['python', 'java', 'c']
  if (!validLanguages.includes(language.toLowerCase())) {
    return 'Invalid programming language. Must be Python, Java, or C'
  }

  return null
}

/**
 * Validate deadline
 */
export const validateDeadline = (deadline: Date | string): string | null => {
  if (!deadline) {
    return 'Deadline is required'
  }

  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline

  if (isNaN(deadlineDate.getTime())) {
    return 'Invalid deadline date'
  }

  const now = new Date()
  if (deadlineDate <= now) {
    return 'Deadline must be in the future'
  }

  return null
}

/**
 * Validate complete assignment creation data
 */
export const validateCreateAssignmentData = (
  data: Partial<CreateAssignmentRequest>
): ValidationResult => {
  const errors: Record<string, string> = {}

  // Validate title
  if (data.assignmentName !== undefined) {
    const titleError = validateAssignmentTitle(data.assignmentName)
    if (titleError) errors.assignmentName = titleError
  } else {
    errors.assignmentName = 'Assignment title is required'
  }

  // Validate description
  if (data.description !== undefined) {
    const descriptionError = validateDescription(data.description)
    if (descriptionError) errors.description = descriptionError
  } else {
    errors.description = 'Description is required'
  }

  // Validate programming language
  if (data.programmingLanguage !== undefined) {
    const languageError = validateProgrammingLanguage(data.programmingLanguage)
    if (languageError) errors.programmingLanguage = languageError
  } else {
    errors.programmingLanguage = 'Programming language is required'
  }

  // Validate deadline
  if (data.deadline !== undefined) {
    const deadlineError = validateDeadline(data.deadline)
    if (deadlineError) errors.deadline = deadlineError
  } else {
    errors.deadline = 'Deadline is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
