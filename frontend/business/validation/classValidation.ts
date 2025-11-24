/**
 * Class Validation Rules
 * Part of the Business Logic Layer
 *
 * Provides client-side validation for class forms.
 * These validations provide immediate user feedback before API calls.
 * Server-side validation is the final authority.
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface CreateClassData {
  className: string;
  description: string;
}

/**
 * Validates class name
 * Requirements:
 * - Required field
 * - Minimum 1 character
 * - Maximum 100 characters
 */
export const validateClassName = (className: string): string | null => {
  const trimmed = className.trim();

  if (!trimmed) {
    return 'Class name is required';
  }

  if (trimmed.length > 100) {
    return 'Class name must not exceed 100 characters';
  }

  return null;
};

/**
 * Validates class description
 * Requirements:
 * - Optional field
 * - Maximum 1000 characters if provided
 */
export const validateClassDescription = (description: string): string | null => {
  const trimmed = description.trim();

  if (trimmed.length > 1000) {
    return 'Description must not exceed 1000 characters';
  }

  return null;
};

/**
 * Validates complete create class form data
 * Returns validation result with all errors
 */
export const validateCreateClassData = (
  data: CreateClassData
): ValidationResult => {
  const errors: Record<string, string> = {};

  const classNameError = validateClassName(data.className);
  if (classNameError) errors.className = classNameError;

  const descriptionError = validateClassDescription(data.description);
  if (descriptionError) errors.description = descriptionError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validates individual field for real-time validation
 * Used for showing errors as the user types or on blur
 */
export const validateClassField = (
  fieldName: string,
  value: string
): string | null => {
  switch (fieldName) {
    case 'className':
      return validateClassName(value);
    case 'description':
      return validateClassDescription(value);
    default:
      return null;
  }
};
