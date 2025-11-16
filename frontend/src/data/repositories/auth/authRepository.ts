/**
 * Authentication Repository
 * Part of the Data Access Layer - Handles all auth-related API calls
 */

import { apiClient } from '../../api/apiClient'
import { supabase } from '../../api/supabaseClient'
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ForgotPasswordData,
  ForgotPasswordResponse
} from '../../../business/models/auth/types'

/**
 * Authenticates a user with login credentials
 * Uses backend API which handles both Supabase auth and database sync
 *
 * @param credentials - User login credentials
 * @returns Authentication response with user data and token
 */
export async function login(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  // Call backend API for login
  const response = await apiClient.post<AuthResponse>('/auth/login', {
    email: credentials.email || credentials.username, // Support both email and username
    password: credentials.password
  })

  if (response.error) {
    return { success: false, message: response.error }
  }

  return response.data!
}

/**
 * Registers a new user
 * Calls backend API which handles both Supabase auth and database insertion
 *
 * @param data - User registration data
 * @returns Authentication response with user data and token
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  // Call backend API for registration
  const response = await apiClient.post<AuthResponse>('/auth/register', {
    role: data.role,
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    username: data.username,
    password: data.password,
    confirm_password: data.confirmPassword
  })

  if (response.error) {
    return { success: false, message: response.error }
  }

  return response.data!
}

/**
 * Logs out the current user
 * Signs out from Supabase and clears local session
 */
export async function logout(): Promise<void> {
  // Sign out from Supabase
  await supabase.auth.signOut()

  // Clear local storage
  localStorage.removeItem('authToken')
  localStorage.removeItem('user')
}

/**
 * Verifies the current authentication token
 * Calls backend API to verify Supabase token
 *
 * @param token - Supabase access token to verify
 * @returns True if token is valid, false otherwise
 */
export async function verifyToken(token: string): Promise<boolean> {
  // Call backend API to verify token
  const response = await apiClient.post<AuthResponse>(`/auth/verify?token=${token}`, {})

  if (response.error) {
    return false
  }

  return response.data?.success ?? false
}

/**
 * Sends a password reset request for the given email
 * Calls backend API which triggers Supabase password reset email
 *
 * @param data - Forgot password data containing email
 * @returns Response indicating success or failure
 */
export async function forgotPassword(
  data: ForgotPasswordData
): Promise<ForgotPasswordResponse> {
  // Call backend API for password reset
  const response = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', {
    email: data.email
  })

  if (response.error) {
    return { success: false, message: response.error }
  }

  return response.data!
}
