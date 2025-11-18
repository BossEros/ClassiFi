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
  User,
  ForgotPasswordData,
  ForgotPasswordResponse,
  ResetPasswordData,
  ResetPasswordResponse
} from '../../../business/models/auth/types'

/**
 * Transforms backend user response (snake_case) to frontend User interface (camelCase)
 * @param backendUser - User object from backend with snake_case fields
 * @returns User object with camelCase fields
 */
function transformUserResponse(backendUser: any): User {
  return {
    id: backendUser.id?.toString() || backendUser.id,
    username: backendUser.username,
    email: backendUser.email,
    firstName: backendUser.first_name,
    lastName: backendUser.last_name,
    role: backendUser.role,
    createdAt: new Date(backendUser.created_at)
  }
}

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

  // Transform snake_case user response to camelCase
  const authResponse = response.data!
  if (authResponse.user) {
    authResponse.user = transformUserResponse(authResponse.user)
  }

  return authResponse
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

  // Transform snake_case user response to camelCase
  const authResponse = response.data!
  if (authResponse.user) {
    authResponse.user = transformUserResponse(authResponse.user)
  }

  return authResponse
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

/**
 * Resets user password using Supabase session established from reset email link
 * Uses Supabase's recommended frontend-only approach
 * 
 * When user clicks reset link, Supabase automatically establishes a session
 * (via detectSessionInUrl: true). We then call updateUser() directly.
 *
 * @param data - Reset password data containing new password
 * @returns Response indicating success or failure
 */
export async function resetPassword(
  data: ResetPasswordData
): Promise<ResetPasswordResponse> {
  try {
    // Check if Supabase has established a session from the reset link
    // This happens automatically when detectSessionInUrl is true
    // When user clicks reset link, Supabase automatically creates a recovery session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !sessionData.session) {
      return {
        success: false,
        message: 'Invalid or expired reset link. Please request a new password reset.'
      }
    }

    // If we have a session, it means Supabase has validated the recovery token
    // We can proceed with updating the password
    const session = sessionData.session
    if (!session.access_token) {
      return {
        success: false,
        message: 'Invalid reset session. Please request a new password reset.'
      }
    }

    // Update the user's password using the established session
    const { error: updateError } = await supabase.auth.updateUser({
      password: data.newPassword
    })

    if (updateError) {
      // Handle specific Supabase errors
      const errorMsg = updateError.message.toLowerCase()
      
      if (errorMsg.includes('expired') || errorMsg.includes('invalid') || errorMsg.includes('token')) {
        return {
          success: false,
          message: 'Invalid or expired reset link. Please request a new password reset.'
        }
      } else if (errorMsg.includes('weak') || errorMsg.includes('password') && errorMsg.includes('requirement')) {
        return {
          success: false,
          message: 'Password does not meet security requirements. Please use a stronger password.'
        }
      } else {
        return {
          success: false,
          message: updateError.message || 'Failed to reset password. Please try again.'
        }
      }
    }

    // Sign out after password reset to require fresh login with new password
    await supabase.auth.signOut()

    return {
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to reset password. Please try again.'
    }
  }
}
