import { apiClient } from '../api/apiClient'
import { supabase } from '../api/supabaseClient'
import type {
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse
} from '../../business/models/auth/types'

export async function login(
    credentials: LoginRequest
): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
        email: credentials.email || credentials.username,
        password: credentials.password
    })

    if (response.error) {
        return { success: false, message: response.error }
    }

    return response.data!
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', {
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        username: data.username,
        password: data.password,
        confirmPassword: data.confirmPassword
    })

    if (response.error) {
        return { success: false, message: response.error }
    }

    return response.data!
}

export async function logout(): Promise<void> {
    await supabase.auth.signOut()
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
}

export async function verifyToken(token: string): Promise<boolean> {
    const response = await apiClient.post<AuthResponse>(`/auth/verify?token=${token}`, {})

    if (response.error) {
        return false
    }

    return response.data?.success ?? false
}

export async function forgotPassword(
    data: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> {
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
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !sessionData.session) {
            return {
                success: false,
                message: 'Invalid or expired reset link. Please request a new password reset.'
            }
        }

        const session = sessionData.session
        if (!session.access_token) {
            return {
                success: false,
                message: 'Invalid reset session. Please request a new password reset.'
            }
        }

        const { error: updateError } = await supabase.auth.updateUser({
            password: data.newPassword
        })

        if (updateError) {
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
