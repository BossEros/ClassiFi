import { apiClient } from '../../api/apiClient'
import { supabase } from '../../api/supabaseClient'
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse
} from '../../../business/models/auth/types'

interface BackendUser {
  id: string | number
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  created_at: string
}

function transformUserResponse(backendUser: BackendUser): User {
  return {
    id: typeof backendUser.id === 'string' ? backendUser.id : backendUser.id.toString(),
    username: backendUser.username,
    email: backendUser.email,
    firstName: backendUser.first_name,
    lastName: backendUser.last_name,
    role: backendUser.role as 'student' | 'teacher' | 'admin',
    createdAt: new Date(backendUser.created_at)
  }
}


export async function login(
  credentials: LoginRequest
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
    authResponse.user = transformUserResponse(authResponse.user as unknown as BackendUser)
  }

  return authResponse
}


export async function register(data: RegisterRequest): Promise<AuthResponse> {
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
    authResponse.user = transformUserResponse(authResponse.user as unknown as BackendUser)
  }

  return authResponse
}

export async function logout(): Promise<void> {
  // Sign out from Supabase
  await supabase.auth.signOut()

  // Clear local storage
  localStorage.removeItem('authToken')
  localStorage.removeItem('user')
}


export async function verifyToken(token: string): Promise<boolean> {
  // Call backend API to verify token
  const response = await apiClient.post<AuthResponse>(`/auth/verify?token=${token}`, {})

  if (response.error) {
    return false
  }

  return response.data?.success ?? false
}


export async function forgotPassword(
  data: ForgotPasswordRequest
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


export async function resetPassword(
  data: ResetPasswordRequest
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
