/**
 * Authentication related type definitions.
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * User role.
 */
export type UserRole = 'student' | 'teacher' | 'admin'

/**
 * User model.
 */
export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  createdAt: Date
}

// ============================================================================
// Request Schemas
// ============================================================================

/**
 * Payload for login request.
 */
export interface LoginRequest {
  /** Optional: for backward compatibility */
  username?: string
  /** Primary authentication method with Supabase */
  email?: string
  password: string
}

/**
 * Payload for registration request.
 */
export interface RegisterRequest {
  role: UserRole
  firstName: string
  lastName: string
  email: string
  username: string
  password: string
  confirmPassword: string
}

/**
 * Payload for forgot password request.
 */
export interface ForgotPasswordRequest {
  email: string
}

/**
 * Payload for reset password request.
 */
export interface ResetPasswordRequest {
  /** Optional: Supabase handles session automatically via detectSessionInUrl */
  accessToken?: string
  newPassword: string
  confirmPassword: string
}

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * Response for authentication operations.
 */
export interface AuthResponse {
  success: boolean
  message?: string
  user?: User
  token?: string
}

/**
 * Response for forgot password request.
 */
export interface ForgotPasswordResponse {
  success: boolean
  message?: string
}

/**
 * Response for reset password request.
 */
export interface ResetPasswordResponse {
  success: boolean
  message?: string
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validation error.
 */
export interface ValidationError {
  field: string
  message: string
}

/**
 * Validation result.
 */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// ============================================================================
// Registration Flow
// ============================================================================

/**
 * Registration step.
 */
export type RegistrationStep = 'role' | 'personal' | 'credentials' | 'complete'

/**
 * Registration step info.
 */
export interface RegistrationStepInfo {
  id: RegistrationStep
  label: string
}
