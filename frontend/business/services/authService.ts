import * as authRepository from '@/data/repositories/authRepository'
import {
    validateLoginData,
    validateRegistrationData,
    validateEmail,
    validatePassword,
    validatePasswordsMatch
} from '../validation/authValidation'
import type {
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    User,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    DeleteAccountRequest,
    DeleteAccountResponse
} from '../models/auth/types'


export async function loginUser(
    credentials: LoginRequest
): Promise<AuthResponse> {
    // Validate credentials
    const validationResult = validateLoginData({
        email: credentials.email,
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

export async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
    const validationResult = validateRegistrationData({
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword
    })

    if (!validationResult.isValid) {
        return {
            success: false,
            message: Object.values(validationResult.errors).join(', ')
        }
    }

    try {
        const response = await authRepository.register(data)

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
    data: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> {
    const emailError = validateEmail(data.email)

    if (emailError) {
        return {
            success: false,
            message: emailError
        }
    }

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
    data: ResetPasswordRequest
): Promise<ResetPasswordResponse> {
    const passwordError = validatePassword(data.newPassword)

    if (passwordError) {
        return {
            success: false,
            message: passwordError
        }
    }

    const matchError = validatePasswordsMatch(data.newPassword, data.confirmPassword)

    if (matchError) {
        return {
            success: false,
            message: matchError
        }
    }

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

/**
 * Change password for authenticated user.
 * Validates passwords and calls repository.
 */
export async function changePassword(
    data: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
    // Validate new password strength
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

    // Validate new password is different from current
    if (data.currentPassword === data.newPassword) {
        return {
            success: false,
            message: 'New password must be different from current password'
        }
    }

    try {
        const response = await authRepository.changePassword(data)
        return response
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to change password'
        }
    }
}

/**
 * Delete user account.
 * Requires password confirmation and "DELETE" text confirmation.
 */
export async function deleteAccount(
    data: DeleteAccountRequest
): Promise<DeleteAccountResponse> {
    // Validate confirmation text
    if (data.confirmation !== 'DELETE') {
        return {
            success: false,
            message: 'Please type DELETE to confirm account deletion'
        }
    }

    // Validate password is provided
    if (!data.password || data.password.trim() === '') {
        return {
            success: false,
            message: 'Password is required to delete your account'
        }
    }

    try {
        const response = await authRepository.deleteAccount(data)

        // Clear local auth data on successful deletion
        if (response.success) {
            clearAuthData()
        }

        return response
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to delete account'
        }
    }
}

