/**
 * Authentication validation rules
 * Part of the Business Logic Layer
 */

import type {
  LoginCredentials,
  RegisterData,
  ForgotPasswordData,
  ValidationResult,
  ValidationError
} from '../models/auth/types'

/**
 * Validates login credentials
 */
export function validateLoginCredentials(
  credentials: LoginCredentials
): ValidationResult {
  const errors: ValidationError[] = []

  // Email validation (required for Supabase authentication)
  if (!credentials.email || credentials.email.trim() === '') {
    errors.push({
      field: 'email',
      message: 'Email is required'
    })
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
    errors.push({
      field: 'email',
      message: 'Please enter a valid email address'
    })
  }

  // Password validation
  if (!credentials.password || credentials.password.trim() === '') {
    errors.push({
      field: 'password',
      message: 'Password is required'
    })
  } else if (credentials.password.length < 6) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 6 characters'
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates registration data
 */
export function validateRegistrationData(
  data: RegisterData
): ValidationResult {
  const errors: ValidationError[] = []

  // Role validation
  if (!data.role) {
    errors.push({
      field: 'role',
      message: 'Please select a role'
    })
  }

  // First name validation
  if (!data.firstName || data.firstName.trim() === '') {
    errors.push({
      field: 'firstName',
      message: 'First name is required'
    })
  } else if (data.firstName.length < 2) {
    errors.push({
      field: 'firstName',
      message: 'First name must be at least 2 characters'
    })
  }

  // Last name validation
  if (!data.lastName || data.lastName.trim() === '') {
    errors.push({
      field: 'lastName',
      message: 'Last name is required'
    })
  } else if (data.lastName.length < 2) {
    errors.push({
      field: 'lastName',
      message: 'Last name must be at least 2 characters'
    })
  }

  // Email validation
  if (!data.email || data.email.trim() === '') {
    errors.push({
      field: 'email',
      message: 'Email is required'
    })
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      errors.push({
        field: 'email',
        message: 'Please enter a valid email address'
      })
    }
  }

  // Username validation
  if (!data.username || data.username.trim() === '') {
    errors.push({
      field: 'username',
      message: 'Username is required'
    })
  } else if (data.username.length < 3) {
    errors.push({
      field: 'username',
      message: 'Username must be at least 3 characters'
    })
  } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
    errors.push({
      field: 'username',
      message: 'Username can only contain letters, numbers, and underscores'
    })
  }

  // Password validation
  if (!data.password || data.password.trim() === '') {
    errors.push({
      field: 'password',
      message: 'Password is required'
    })
  } else if (data.password.length < 8) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 8 characters'
    })
  } else {
    // Password strength checks
    const hasUpperCase = /[A-Z]/.test(data.password)
    const hasLowerCase = /[a-z]/.test(data.password)
    const hasNumber = /[0-9]/.test(data.password)

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      errors.push({
        field: 'password',
        message: 'Password must contain uppercase, lowercase, and numbers'
      })
    }
  }

  // Confirm password validation
  if (!data.confirmPassword || data.confirmPassword.trim() === '') {
    errors.push({
      field: 'confirmPassword',
      message: 'Please confirm your password'
    })
  } else if (data.password !== data.confirmPassword) {
    errors.push({
      field: 'confirmPassword',
      message: 'Passwords do not match'
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates password strength
 */
export function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false

  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)

  return hasUpperCase && hasLowerCase && hasNumber
}

/**
 * Validates forgot password data
 */
export function validateForgotPasswordData(
  data: ForgotPasswordData
): ValidationResult {
  const errors: ValidationError[] = []

  // Email validation
  if (!data.email || data.email.trim() === '') {
    errors.push({
      field: 'email',
      message: 'Email address is required'
    })
  } else if (!isValidEmail(data.email)) {
    errors.push({
      field: 'email',
      message: 'Please enter a valid email address'
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
