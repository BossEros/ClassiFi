import { apiClient } from '../api/apiClient'
import { supabase } from '../api/supabaseClient'
import type {
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    DeleteAccountRequest,
    DeleteAccountResponse
} from '../../business/models/auth/types'

export async function login(
    credentials: LoginRequest
): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
        email: credentials.email,
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

/**
 * Change password for authenticated user.
 * Re-authenticates with current password, then updates to new password.
 */
export async function changePassword(
    data: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
    try {
        // Get user email from localStorage (since auth is managed by backend)
        const storedUser = localStorage.getItem('user')
        if (!storedUser) {
            return {
                success: false,
                message: 'You must be logged in to change your password.'
            }
        }

        const user = JSON.parse(storedUser)
        const email = user.email

        // Re-authenticate with current password to verify identity
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: data.currentPassword
        })

        if (signInError) {
            return {
                success: false,
                message: 'Current password is incorrect.'
            }
        }

        // Update to new password
        const { error: updateError } = await supabase.auth.updateUser({
            password: data.newPassword
        })

        if (updateError) {
            const errorMsg = updateError.message.toLowerCase()

            if (errorMsg.includes('weak') || errorMsg.includes('password')) {
                return {
                    success: false,
                    message: 'New password does not meet security requirements. Please use a stronger password.'
                }
            }

            return {
                success: false,
                message: updateError.message || 'Failed to change password. Please try again.'
            }
        }

        return {
            success: true,
            message: 'Password changed successfully.'
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to change password. Please try again.'
        }
    }
}

/**
 * Delete user account.
 * Requires password confirmation and calls backend to delete from all systems.
 */
export async function deleteAccount(
    data: DeleteAccountRequest
): Promise<DeleteAccountResponse> {
    try {
        // Get user email from localStorage (since auth is managed by backend)
        const storedUser = localStorage.getItem('user')
        if (!storedUser) {
            return {
                success: false,
                message: 'You must be logged in to delete your account.'
            }
        }

        const user = JSON.parse(storedUser)
        const email = user.email

        // Re-authenticate to verify identity and get fresh token
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password: data.password
        })

        if (signInError) {
            return {
                success: false,
                message: 'Password is incorrect.'
            }
        }

        // Update localStorage with fresh token for the API call
        if (signInData.session?.access_token) {
            localStorage.setItem('authToken', signInData.session.access_token)
        }

        // Call backend to delete account (handles database + Supabase Auth cleanup)
        const response = await apiClient.delete<DeleteAccountResponse>('/user/me')

        if (response.error) {
            return { success: false, message: response.error }
        }

        // Sign out after successful deletion
        await supabase.auth.signOut()
        localStorage.removeItem('authToken')
        localStorage.removeItem('user')

        return {
            success: true,
            message: 'Your account has been permanently deleted.'
        }
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to delete account. Please try again.'
        }
    }
}
