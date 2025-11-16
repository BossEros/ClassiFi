/**
 * Authentication Repository
 * Part of the Data Access Layer - Handles all auth-related API calls
 */

// import { apiClient } from '../../api/apiClient' // TODO: Uncomment when backend is ready
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ForgotPasswordData,
  ForgotPasswordResponse
} from '../../../business/models/auth/types'

/**
 * Authenticates a user with login credentials
 *
 * @param credentials - User login credentials
 * @returns Authentication response with user data and token
 */
export async function login(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  // TODO: Replace with actual API call when backend is ready
  // const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
  // if (response.error) {
  //   return { success: false, message: response.error }
  // }
  // return response.data!

  // Simulated API call for now
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Login attempt with:', credentials)

      // Simulate successful login
      resolve({
        success: true,
        message: 'Login successful',
        user: {
          id: '1',
          username: credentials.username,
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'student',
          createdAt: new Date()
        },
        token: 'fake-jwt-token'
      })
    }, 1500)
  })
}

/**
 * Registers a new user
 *
 * @param data - User registration data
 * @returns Authentication response with user data and token
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  // TODO: Replace with actual API call when backend is ready
  // const response = await apiClient.post<AuthResponse>('/auth/register', data)
  // if (response.error) {
  //   return { success: false, message: response.error }
  // }
  // return response.data!

  // Simulated API call for now
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Registration attempt with:', data)

      // Simulate successful registration
      resolve({
        success: true,
        message: 'Registration successful',
        user: {
          id: '1',
          username: data.username,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          createdAt: new Date()
        },
        token: 'fake-jwt-token'
      })
    }, 1500)
  })
}

/**
 * Logs out the current user
 */
export async function logout(): Promise<void> {
  // TODO: Implement logout API call when backend is ready
  // await apiClient.post('/auth/logout', {})

  // For now, just clear local storage
  localStorage.removeItem('authToken')
  localStorage.removeItem('user')
}

/**
 * Verifies the current authentication token
 *
 * @param token - JWT token to verify
 * @returns True if token is valid, false otherwise
 */
export async function verifyToken(token: string): Promise<boolean> {
  // TODO: Implement token verification when backend is ready
  // const response = await apiClient.post<{ valid: boolean }>('/auth/verify', { token })
  // return response.data?.valid ?? false

  // Simulated verification
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(!!token)
    }, 500)
  })
}

/**
 * Sends a password reset request for the given email
 *
 * @param data - Forgot password data containing email
 * @returns Response indicating success or failure
 */
export async function forgotPassword(
  data: ForgotPasswordData
): Promise<ForgotPasswordResponse> {
  // TODO: Replace with actual API call when backend is ready
  // const response = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', data)
  // if (response.error) {
  //   return { success: false, message: response.error }
  // }
  // return response.data!

  // Simulated API call for now
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Forgot password request for:', data.email)

      // Simulate successful request
      // Note: For security, we always return success even if email doesn't exist
      resolve({
        success: true,
        message: 'If an account exists with this email, you will receive password reset instructions.'
      })
    }, 1500)
  })
}
