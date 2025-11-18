export type UserRole = 'student' | 'teacher' | 'admin'

export interface LoginCredentials {
  username?: string // Optional: for backward compatibility
  email?: string // Primary authentication method with Supabase
  password: string
}

export interface RegisterData {
  role: UserRole
  firstName: string
  lastName: string
  email: string
  username: string
  password: string
  confirmPassword: string
}

export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  createdAt: Date
}

export interface ForgotPasswordData {
  email: string
}

export interface ForgotPasswordResponse {
  success: boolean
  message?: string
}

export interface ResetPasswordData {
  accessToken?: string // Optional: Supabase handles session automatically via detectSessionInUrl
  newPassword: string
  confirmPassword: string
}

export interface ResetPasswordResponse {
  success: boolean
  message?: string
}

export interface AuthResponse {
  success: boolean
  message?: string
  user?: User
  token?: string
}

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export type RegistrationStep = 'role' | 'personal' | 'credentials' | 'complete'

export interface RegistrationStepInfo {
  id: RegistrationStep
  label: string
}
