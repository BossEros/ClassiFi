import type { CreateAssignmentRequest } from "@/data/api/types";

import type { ValidationError, ValidationResult } from "@/shared/types/auth";

/**
 * Validate assignment title
 */
export const validateAssignmentTitle = (title: string): string | null => {
  const trimmed = title.trim();

  if (!trimmed) {
    return "Assignment title is required";
  }

  if (trimmed.length > 150) {
    return "Assignment title must not exceed 150 characters";
  }

  return null;
};

/**
 * Validate assignment description
 */
export const validateDescription = (description: string): string | null => {
  const trimmed = description.trim();

  if (!trimmed) {
    return "Description is required";
  }

  if (trimmed.length < 10) {
    return "Description must be at least 10 characters";
  }

  return null;
};

/**
 * Validate programming language
 */
export const validateProgrammingLanguage = (
  language: string,
): string | null => {
  if (!language) {
    return "Programming language is required";
  }

  const validLanguages = ["python", "java", "c"];
  if (!validLanguages.includes(language.toLowerCase())) {
    return "Invalid programming language. Must be Python, Java, or C";
  }

  return null;
};

/**
 * Validate deadline
 */
export const validateDeadline = (deadline: Date | string): string | null => {
  if (!deadline) {
    return "Deadline is required";
  }

  const deadlineDate =
    typeof deadline === "string" ? new Date(deadline) : deadline;

  if (isNaN(deadlineDate.getTime())) {
    return "Invalid deadline date";
  }

  const now = new Date();
  if (deadlineDate <= now) {
    return "Deadline must be in the future";
  }

  return null;
};

/**
 * Validate complete assignment creation data
 */
export const validateCreateAssignmentData = (
  data: Partial<CreateAssignmentRequest>,
): ValidationResult => {
  const errors: ValidationError[] = [];

  // Validate title
  if (data.assignmentName !== undefined) {
    const titleError = validateAssignmentTitle(data.assignmentName);
    if (titleError)
      errors.push({ field: "assignmentName", message: titleError });
  } else {
    errors.push({
      field: "assignmentName",
      message: "Assignment title is required",
    });
  }

  // Validate description
  if (data.description !== undefined) {
    const descriptionError = validateDescription(data.description);
    if (descriptionError)
      errors.push({ field: "description", message: descriptionError });
  } else {
    errors.push({ field: "description", message: "Description is required" });
  }

  // Validate programming language
  if (data.programmingLanguage !== undefined) {
    const languageError = validateProgrammingLanguage(data.programmingLanguage);
    if (languageError)
      errors.push({ field: "programmingLanguage", message: languageError });
  } else {
    errors.push({
      field: "programmingLanguage",
      message: "Programming language is required",
    });
  }

  // Validate deadline
  if (data.deadline !== undefined) {
    const deadlineError = validateDeadline(data.deadline);
    if (deadlineError)
      errors.push({ field: "deadline", message: deadlineError });
  } else {
    errors.push({ field: "deadline", message: "Deadline is required" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate update assignment data (partial - only validates provided fields)
 * Throws an error if validation fails
 */
export const validateUpdateAssignmentData = (data: {
  teacherId?: number;
  assignmentName?: string;
  description?: string;
  deadline?: Date | string;
}): void => {
  // Validate teacher ID (required for authorization)
  // Import validateId inline to avoid circular dependency
  if (!data.teacherId || data.teacherId <= 0) {
    throw new Error("Invalid teacher ID");
  }

  // Validate title if provided
  if (data.assignmentName !== undefined) {
    const titleError = validateAssignmentTitle(data.assignmentName);
    if (titleError) throw new Error(titleError);
  }

  // Validate description if provided
  if (data.description !== undefined) {
    const descError = validateDescription(data.description);
    if (descError) throw new Error(descError);
  }

  // Validate deadline if provided
  if (data.deadline !== undefined) {
    const deadlineError = validateDeadline(data.deadline);
    if (deadlineError) throw new Error(deadlineError);
  }
};
