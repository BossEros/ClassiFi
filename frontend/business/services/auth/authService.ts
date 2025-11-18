import * as authRepository from '../../../data/repositories/auth/authRepository'
import {
  validateLoginData,
  validateRegistrationData,
  validateEmail,
  validatePassword,
  validatePasswordsMatch
} from '../../validation/authValidation'
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
  ForgotPasswordData,
  ForgotPasswordResponse,
  ResetPasswordData,
  ResetPasswordResponse
} from '../../models/auth/types'


export async function loginUser(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  // Validate credentials
  const validationResult = validateLoginData({
    email: credentials.email || credentials.username || '',
    password: credentials.password
  })

  if (!validationResult.isValid) {
    return {
      success: false,
      message: Object.values(validationResult.errors).join(', ')
    }
  }

  // Attempt login via repository
  try {
    const response = await authRepository.login(credentials)

    // Store auth data if successful
    if (response.success && response.token && response.user) {
      storeAuthData(response.token, response.user)
    }

    return response
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Login failed'
    }
  }
}

export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  // Validate registration data
  const validationResult = validateRegistrationData({
    role: data.role,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    username: data.username,
    password: data.password,
    confirmPassword: data.confirmPassword
  })

  if (!validationResult.isValid) {
    return {
      success: false,
      message: Object.values(validationResult.errors).join(', ')
    }
  }

  // Attempt registration via repository
  try {
    const response = await authRepository.register(data)

    // Store auth data if successful
    if (response.success && response.token && response.user) {
      storeAuthData(response.token, response.user)
    }

    return response
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Registration failed'
    }
  }
}

export async function logoutUser(): Promise<void> {
  await authRepository.logout()
  clearAuthData()
}

export function getCurrentUser(): User | null {
  const userJson = localStorage.getItem('user')
  if (!userJson) return null

  try {
    return JSON.parse(userJson)
  } catch {
    return null
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem('authToken')
}

export function isAuthenticated(): boolean {
  const token = getAuthToken()
  const user = getCurrentUser()
  return !!(token && user)
}

export async function verifySession(): Promise<boolean> {
  const token = getAuthToken()

  if (!token) {
    return false
  }

  try {
    const isValid = await authRepository.verifyToken(token)

    if (!isValid) {
      clearAuthData()
    }

    return isValid
  } catch {
    clearAuthData()
    return false
  }
}

function storeAuthData(token: string, user: User): void {
  localStorage.setItem('authToken', token)
  localStorage.setItem('user', JSON.stringify(user))
}

function clearAuthData(): void {
  localStorage.removeItem('authToken')
  localStorage.removeItem('user')
}

export async function requestPasswordReset(
  data: ForgotPasswordData
): Promise<ForgotPasswordResponse> {
  // Validate email
  const emailError = validateEmail(data.email)

  if (emailError) {
    return {
      success: false,
      message: emailError
    }
  }

  // Request password reset via repository
  try {
    const response = await authRepository.forgotPassword(data)
    return response
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process request'
    }
  }
}

export async function resetPassword(
  data: ResetPasswordData
): Promise<ResetPasswordResponse> {
  // Validate new password
  const passwordError = validatePassword(data.newPassword)

  if (passwordError) {
    return {
      success: false,
      message: passwordError
    }
  }

  // Validate passwords match
  const matchError = validatePasswordsMatch(data.newPassword, data.confirmPassword)

  if (matchError) {
    return {
      success: false,
      message: matchError
    }
  }

  // Reset password via repository
  try {
    const response = await authRepository.resetPassword(data)
    return response
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to reset password'
    }
  }
}
