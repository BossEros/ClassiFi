/**
 * Authentication Validation Rules
 * Part of the Business Logic Layer
 *
 * Provides client-side validation for authentication forms.
 * These validations provide immediate user feedback before API calls.
 * Server-side validation is the final authority.
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface RegisterData {
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface LoginData {
  email: string;
  password: string;
}

/**
 * Email validation regex pattern
 * Validates standard email format: user@domain.tld
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Username validation regex pattern
 * Allows only alphanumeric characters and underscores
 */
const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

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
    return 'Email is required';
  }

  if (!EMAIL_PATTERN.test(email)) {
    return 'Please enter a valid email address';
  }

  return null;
};

/**
 * Validates username format and length
 */
export const validateUsername = (username: string): string | null => {
  if (!username) {
    return 'Username is required';
  }

  if (username.length < 3) {
    return 'Username must be at least 3 characters long';
  }

  if (username.length > 50) {
    return 'Username must not exceed 50 characters';
  }

  if (!USERNAME_PATTERN.test(username)) {
    return 'Username can only contain letters, numbers, and underscores';
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
    return 'Password is required';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  if (!PASSWORD_PATTERNS.uppercase.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }

  if (!PASSWORD_PATTERNS.lowercase.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }

  if (!PASSWORD_PATTERNS.number.test(password)) {
    return 'Password must contain at least one number';
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
  confirmPassword: string
): string | null => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }

  return null;
};

/**
 * Validates first name
 */
export const validateFirstName = (firstName: string): string | null => {
  if (!firstName) {
    return 'First name is required';
  }

  if (firstName.length < 2) {
    return 'First name must be at least 2 characters long';
  }

  if (firstName.length > 50) {
    return 'First name must not exceed 50 characters';
  }

  return null;
};

/**
 * Validates last name
 */
export const validateLastName = (lastName: string): string | null => {
  if (!lastName) {
    return 'Last name is required';
  }

  if (lastName.length < 2) {
    return 'Last name must be at least 2 characters long';
  }

  if (lastName.length > 50) {
    return 'Last name must not exceed 50 characters';
  }

  return null;
};

/**
 * Validates role selection
 */
export const validateRole = (role: string): string | null => {
  if (!role) {
    return 'Please select a role';
  }

  const validRoles = ['student', 'teacher', 'admin'];
  if (!validRoles.includes(role)) {
    return 'Invalid role selected';
  }

  return null;
};

/**
 * Validates complete registration form data
 * Returns validation result with all errors
 */
export const validateRegistrationData = (
  data: RegisterData
): ValidationResult => {
  const errors: Record<string, string> = {};

  // Validate each field
  const roleError = validateRole(data.role);
  if (roleError) errors.role = roleError;

  const firstNameError = validateFirstName(data.firstName);
  if (firstNameError) errors.firstName = firstNameError;

  const lastNameError = validateLastName(data.lastName);
  if (lastNameError) errors.lastName = lastNameError;

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  const usernameError = validateUsername(data.username);
  if (usernameError) errors.username = usernameError;

  const passwordError = validatePassword(data.password);
  if (passwordError) errors.password = passwordError;

  const confirmPasswordError = validatePasswordsMatch(
    data.password,
    data.confirmPassword
  );
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validates login form data
 * Returns validation result with all errors
 * Note: Only checks if fields are present, not complexity (that's for registration)
 */
export const validateLoginData = (data: LoginData): ValidationResult => {
  const errors: Record<string, string> = {};

  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;

  if (!data.password) {
    errors.password = 'Password is required';
  } else if (data.password.length < 1) {
    errors.password = 'Password cannot be empty';
  }

  return {
    isValid: Object.keys(errors).length === 0,
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
  additionalData?: Record<string, string>
): string | null => {
  switch (fieldName) {
    case 'email':
      return validateEmail(value);
    case 'username':
      return validateUsername(value);
    case 'password':
      return validatePassword(value);
    case 'confirmPassword':
      return validatePasswordsMatch(
        additionalData?.password || '',
        value
      );
    case 'firstName':
      return validateFirstName(value);
    case 'lastName':
      return validateLastName(value);
    case 'role':
      return validateRole(value);
    default:
      return null;
  }
};
