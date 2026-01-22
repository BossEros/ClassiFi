// ============================================================================
// Auth Types - Shared Layer
// ============================================================================

/**
 * Array of valid user roles.
 */
export const VALID_ROLES = ["student", "teacher", "admin"] as const;

/**
 * User role type.
 */
export type UserRole = (typeof VALID_ROLES)[number];

/**
 * User model.
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * Payload for login request.
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Payload for registration request.
 */
export interface RegisterRequest {
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Payload for forgot password request.
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Payload for reset password request.
 */
export interface ResetPasswordRequest {
  accessToken?: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Payload for change password request.
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Payload for delete account request.
 */
export interface DeleteAccountRequest {
  password: string;
  confirmation: string;
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Response for authentication operations.
 */
/**
 * Failure response for authentication operations.
 */
export interface AuthFailure {
  success: false;
  message: string;
}

/**
 * Success response for authentication operations.
 */
export interface AuthSuccess {
  success: true;
  message?: string;
  user: User;
  token: string;
}

/**
 * Response for authentication operations.
 */
export type AuthResponse = AuthSuccess | AuthFailure;

/**
 * Base response for simple auth operations.
 * Used as a foundation for operations that only return success/message.
 */
export interface BaseAuthResponse {
  success: boolean;
  message?: string;
}

/**
 * Response for forgot password request.
 */
export type ForgotPasswordResponse = BaseAuthResponse;

/**
 * Response for reset password request.
 */
export type ResetPasswordResponse = BaseAuthResponse;

/**
 * Response for reset flow initialization.
 */
export type ResetFlowResponse = BaseAuthResponse;

/**
 * Response for change password request.
 */
export type ChangePasswordResponse = BaseAuthResponse;

/**
 * Response for delete account request.
 */
export type DeleteAccountResponse = BaseAuthResponse;

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation error.
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation result.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Registration step type.
 */
export type RegistrationStep = "role" | "personal" | "credentials" | "complete";

/**
 * Registration step info.
 */
export interface RegistrationStepInfo {
  id: RegistrationStep;
  label: string;
}
