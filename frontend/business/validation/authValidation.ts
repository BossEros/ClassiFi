import type { ValidationError, ValidationResult } from "@/shared/types/auth";

// Re-export shared types for consistency
export type { ValidationResult };

export interface RegisterRequest {
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginValidationData {
  email: string;
  password: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password validation patterns
 */
const PASSWORD_PATTERNS = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  specialChar: /[!@#$%^&*(),.?":{}|<>]/,
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): string | null => {
  if (!email) {
    return "Email is required";
  }

  if (!EMAIL_PATTERN.test(email)) {
    return "Please enter a valid email address";
  }

  return null;
};

/**
 * Validates password complexity
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */
export const validatePassword = (password: string): string | null => {
  if (!password) {
    return "Password is required";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }

  if (!PASSWORD_PATTERNS.uppercase.test(password)) {
    return "Password must contain at least one uppercase letter";
  }

  if (!PASSWORD_PATTERNS.lowercase.test(password)) {
    return "Password must contain at least one lowercase letter";
  }

  if (!PASSWORD_PATTERNS.number.test(password)) {
    return "Password must contain at least one number";
  }

  if (!PASSWORD_PATTERNS.specialChar.test(password)) {
    return 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)';
  }

  return null;
};

/**
 * Validates that passwords match
 */
export const validatePasswordsMatch = (
  password: string,
  confirmPassword: string,
): string | null => {
  if (!confirmPassword) {
    return "Please confirm your password";
  }

  if (password !== confirmPassword) {
    return "Passwords do not match";
  }

  return null;
};

/**
 * Validates first name
 */
export const validateFirstName = (firstName: string): string | null => {
  if (!firstName) {
    return "First name is required";
  }

  if (firstName.length < 2) {
    return "First name must be at least 2 characters long";
  }

  if (firstName.length > 50) {
    return "First name must not exceed 50 characters";
  }

  return null;
};

/**
 * Validates last name
 */
export const validateLastName = (lastName: string): string | null => {
  if (!lastName) {
    return "Last name is required";
  }

  if (lastName.length < 2) {
    return "Last name must be at least 2 characters long";
  }

  if (lastName.length > 50) {
    return "Last name must not exceed 50 characters";
  }

  return null;
};

/**
 * Validates role selection
 */
export const validateRole = (role: string): string | null => {
  if (!role) {
    return "Please select a role";
  }

  const validRoles = ["student", "teacher", "admin"];
  if (!validRoles.includes(role)) {
    return "Invalid role selected";
  }

  return null;
};

/**
 * Validates complete registration form data
 * Returns validation result with all errors
 */
export const validateRegistrationData = (
  data: RegisterRequest,
): ValidationResult => {
  const errors: ValidationError[] = [];

  // Validate each field
  const roleError = validateRole(data.role);
  if (roleError) errors.push({ field: "role", message: roleError });

  const firstNameError = validateFirstName(data.firstName);
  if (firstNameError)
    errors.push({ field: "firstName", message: firstNameError });

  const lastNameError = validateLastName(data.lastName);
  if (lastNameError) errors.push({ field: "lastName", message: lastNameError });

  const emailError = validateEmail(data.email);
  if (emailError) errors.push({ field: "email", message: emailError });

  const passwordError = validatePassword(data.password);
  if (passwordError) errors.push({ field: "password", message: passwordError });

  const confirmPasswordError = validatePasswordsMatch(
    data.password,
    data.confirmPassword,
  );
  if (confirmPasswordError)
    errors.push({ field: "confirmPassword", message: confirmPasswordError });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates login form data
 * Returns validation result with all errors
 * Note: Only checks if fields are present, not complexity (that's for registration)
 */
export const validateLoginData = (
  data: LoginValidationData,
): ValidationResult => {
  const errors: ValidationError[] = [];

  const emailError = validateEmail(data.email);
  if (emailError) errors.push({ field: "email", message: emailError });

  if (!data.password) {
    errors.push({ field: "password", message: "Password is required" });
  } else if (data.password.trim().length === 0) {
    errors.push({ field: "password", message: "Password cannot be empty" });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validates individual field for real-time validation
 * Used for showing errors as the user types
 */
export const validateField = (
  fieldName: string,
  value: string,
  additionalData?: Record<string, string>,
): string | null => {
  switch (fieldName) {
    case "email":
      return validateEmail(value);
    case "password":
      return validatePassword(value);
    case "confirmPassword":
      return validatePasswordsMatch(additionalData?.password || "", value);
    case "firstName":
      return validateFirstName(value);
    case "lastName":
      return validateLastName(value);
    case "role":
      return validateRole(value);
    default:
      return null;
  }
};
