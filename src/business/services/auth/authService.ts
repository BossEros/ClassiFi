/**
 * Authentication Service
 * Part of the Business Logic Layer - Contains auth business logic
 */

import * as authRepository from '../../../data/repositories/auth/authRepository'
import {
  validateLoginCredentials,
  validateRegistrationData
} from '../../validation/authValidation'
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User
} from '../../models/auth/types'

/**
 * Handles user login with validation
 *
 * @param credentials - User login credentials
 * @returns Authentication response
 */
export async function loginUser(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  // Validate credentials
  const validationResult = validateLoginCredentials(credentials)

  if (!validationResult.isValid) {
    return {
      success: false,
      message: validationResult.errors.map((e) => e.message).join(', ')
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

/**
 * Handles user registration with validation
 *
 * @param data - User registration data
 * @returns Authentication response
 */
export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  // Validate registration data
  const validationResult = validateRegistrationData(data)

  if (!validationResult.isValid) {
    return {
      success: false,
      message: validationResult.errors.map((e) => e.message).join(', ')
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

/**
 * Logs out the current user
 */
export async function logoutUser(): Promise<void> {
  await authRepository.logout()
  clearAuthData()
}

/**
 * Gets the currently authenticated user from storage
 *
 * @returns User object or null if not authenticated
 */
export function getCurrentUser(): User | null {
  const userJson = localStorage.getItem('user')
  if (!userJson) return null

  try {
    return JSON.parse(userJson)
  } catch {
    return null
  }
}

/**
 * Gets the current authentication token
 *
 * @returns JWT token or null if not authenticated
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken')
}

/**
 * Checks if user is currently authenticated
 *
 * @returns True if user is authenticated, false otherwise
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken()
  const user = getCurrentUser()
  return !!(token && user)
}

/**
 * Verifies if the current session is valid
 *
 * @returns True if session is valid, false otherwise
 */
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

/**
 * Stores authentication data in local storage
 */
function storeAuthData(token: string, user: User): void {
  localStorage.setItem('authToken', token)
  localStorage.setItem('user', JSON.stringify(user))
}

/**
 * Clears authentication data from local storage
 */
function clearAuthData(): void {
  localStorage.removeItem('authToken')
  localStorage.removeItem('user')
}
