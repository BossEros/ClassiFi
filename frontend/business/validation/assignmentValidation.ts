import type {
  CreateAssignmentRequest,
  UpdateAssignmentValidationData,
} from "@/data/api/types";
import { VALID_PROGRAMMING_LANGUAGES } from "@/data/api/types";
import type { ValidationError, ValidationResult } from "@/shared/types/auth";

/**
 * Validates the assignment title.
 *
 * @param title - The assignment title to validate.
 * @returns An error message string if invalid, otherwise null.
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
 * Validates the assignment description.
 *
 * @param description - The description to validate.
 * @returns An error message string if invalid, otherwise null.
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
 * Validates the programming language.
 *
 * @param language - The programming language to validate.
 * @returns An error message string if invalid, otherwise null.
 */
export const validateProgrammingLanguage = (
  language: string,
): string | null => {
  if (!language) {
    return "Programming language is required";
  }

  // Cast to string to safely check includes against typed array
  if (!(VALID_PROGRAMMING_LANGUAGES as readonly string[]).includes(language.toLowerCase())) {
    return "Invalid programming language. Must be Python, Java, or C";
  }

  return null;
};

/**
 * Validates the assignment deadline.
 *
 * @param deadline - The deadline date or string to validate.
 * @returns An error message string if invalid, otherwise null.
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
 * Validates complete assignment creation data.
 *
 * @param data - The partial assignment data to validate.
 * @returns A ValidationResult object containing validity status and any errors.
 */
export const validateCreateAssignmentData = (
  data: Partial<CreateAssignmentRequest>,
): ValidationResult => {
  const errors: ValidationError[] = [];

  // Validate title
  if (data.assignmentName !== undefined) {
    const titleError = validateAssignmentTitle(data.assignmentName);

    if (titleError) {
      errors.push({ field: "assignmentName", message: titleError });
    }
  } else {
    errors.push({
      field: "assignmentName",
      message: "Assignment title is required",
    });
  }

  // Validate description
  if (data.description !== undefined) {
    const descriptionError = validateDescription(data.description);

    if (descriptionError) {
      errors.push({ field: "description", message: descriptionError });
    }
  } else {
    errors.push({ field: "description", message: "Description is required" });
  }

  // Validate programming language
  if (data.programmingLanguage !== undefined) {
    const languageError = validateProgrammingLanguage(data.programmingLanguage);

    if (languageError) {
      errors.push({ field: "programmingLanguage", message: languageError });
    }
  } else {
    errors.push({
      field: "programmingLanguage",
      message: "Programming language is required",
    });
  }

  // Validate deadline
  if (data.deadline !== undefined) {
    const deadlineError = validateDeadline(data.deadline);

    if (deadlineError) {
      errors.push({ field: "deadline", message: deadlineError });
    }
  } else {
    errors.push({ field: "deadline", message: "Deadline is required" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

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
    throw new Error("Invalid teacher ID");
  }

  // Validate title if provided
  if (data.assignmentName !== undefined) {
    const titleError = validateAssignmentTitle(data.assignmentName);

    if (titleError) {
      throw new Error(titleError);
    }
  }

  // Validate description if provided
  if (data.description !== undefined) {
    const descError = validateDescription(data.description);

    if (descError) {
      throw new Error(descError);
    }
  }

  // Validate deadline if provided
  if (data.deadline !== undefined) {
    const deadlineError = validateDeadline(data.deadline);

    if (deadlineError) {
      throw new Error(deadlineError);
    }
  }
};
