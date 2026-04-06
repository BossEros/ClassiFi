import * as authRepository from "@/data/repositories/authRepository"
import { useAuthStore } from "@/shared/store/useAuthStore"
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ResetFlowResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  DeleteAccountRequest,
  DeleteAccountResponse,
} from "@/data/api/auth.types"

// Re-export types and values for presentation layer
export { VALID_ROLES } from "@/data/api/auth.types"
export type { UserRole, User, ChangePasswordRequest, RegistrationStep, RegistrationStepInfo } from "@/data/api/auth.types"

const emailConfirmationRequiredLoginMessage =
  "Please confirm your email before signing in. Check your inbox or spam folder for the verification link."
const invalidLoginCredentialsMessage = "Incorrect email or password."

/**
 * Converts provider-specific authentication failures into clear, actionable messages.
 *
 * @param authenticationFailureMessage - The raw authentication error message.
 * @returns A user-friendly authentication error message.
 */
function normalizeAuthenticationFailureMessage(
  authenticationFailureMessage?: string,
): string {
  if (!authenticationFailureMessage) {
    return "Login failed"
  }

  const normalizedAuthenticationFailureMessage =
    authenticationFailureMessage.toLowerCase()

  if (
    normalizedAuthenticationFailureMessage.includes("email not confirmed") ||
    normalizedAuthenticationFailureMessage.includes(
      "verify your email address before logging in",
    )
  ) {
    return emailConfirmationRequiredLoginMessage
  }

  if (
    normalizedAuthenticationFailureMessage.includes(
      "invalid login credentials",
    ) ||
    normalizedAuthenticationFailureMessage.includes(
      "invalid email or password",
    )
  ) {
    return invalidLoginCredentialsMessage
  }

  return authenticationFailureMessage
}

/**
 * Authenticates a user with email and password.
 * Validates credentials locally before attempting login with the repository.
 * Stores auth token and user data on success.
 *
 * @param loginCredentials - The user's login credentials (email and password).
 * @returns The authentication response containing success status, token, and user data.
 */
export async function loginUser(
  loginCredentials: LoginRequest,
): Promise<AuthResponse> {
  // Attempt login via repository
  try {
    const response =
      await authRepository.authenticateUserWithEmailAndPassword(
        loginCredentials,
      )

    if (response.success) {
      persistAuthenticationSession(response.token, response.user)
    }

    if (!response.success) {
      return {
        ...response,
        message: normalizeAuthenticationFailureMessage(response.message),
      }
    }

    return response
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? normalizeAuthenticationFailureMessage(error.message)
          : "Login failed",
    }
  }
}

/**
 * Registers a new user account.
 * Validates registration data before creating the account.
 * Automatically logs the user in upon successful registration.
 *
 * @param registrationRequest - The data required to register a new user.
 * @returns The authentication response containing success status and user data.
 */
export async function registerUser(
  registrationRequest: RegisterRequest,
): Promise<AuthResponse> {
  try {
    const response =
      await authRepository.registerNewUserAccount(registrationRequest)

    if (response.success && response.token && response.user) {
      persistAuthenticationSession(response.token, response.user)
    }

    return response
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Registration failed",
    }
  }
}

/**
 * Logs the user out of the application.
 * Ensures local auth data is cleared even if the server-side logout fails.
 */
export async function logoutUser(): Promise<void> {
  try {
    await authRepository.signOutCurrentUserAndClearSession()
  } finally {
    // Always clear local auth data, even if server logout fails
    clearLocalAuthenticationSession()
  }
}

/**
 * Retrieves the authentication token from Supabase session.
 * Uses Supabase's secure session management.
 *
 * @returns The authentication token string or null if not found.
 */
export async function getAuthToken(): Promise<string | null> {
  const result = await authRepository.getCurrentAuthenticationSession()

  return result.session?.access_token ?? null
}

/**
 * Checks if the user is currently authenticated by verifying the presence of user data.
 * For full session verification, use verifySession().
 *
 * @returns True if the user has local user data, false otherwise.
 */
export function isAuthenticated(): boolean {
  return useAuthStore.getState().isAuthenticated
}

/**
 * Verifies the validity of the current session token with the server.
 * Clears local auth data if the token is invalid or expired.
 *
 * @returns True if the session is valid, false otherwise.
 */
export async function verifySession(): Promise<boolean> {
  const token = await getAuthToken()

  if (!token) {
    clearLocalAuthenticationSession()
    return false
  }

  try {
    const isValid = await authRepository.validateAuthenticationToken(token)

    if (!isValid) {
      clearLocalAuthenticationSession()
    }

    return isValid
  } catch {
    clearLocalAuthenticationSession()
    return false
  }
}

/**
 * Persists user data to local storage.
 * Token is managed by Supabase's secure session storage.
 */
function persistAuthenticationSession(_token: string, user: User): void {
  useAuthStore.getState().login(user)
}

/**
 * Clears local authentication session data.
 * Token is managed by Supabase.
 */
function clearLocalAuthenticationSession(): void {
  useAuthStore.getState().logout()
}

/**
 * Initiates the password reset process by sending a reset link to the user's email.
 *
 * @param forgotPasswordRequest - The request containing the user's email address.
 * @returns The response indicating whether the reset email was sent.
 */
export async function requestPasswordReset(
  forgotPasswordRequest: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  try {
    const response = await authRepository.initiatePasswordResetForEmail(
      forgotPasswordRequest.email,
    )
    return response
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to process request",
    }
  }
}

/**
 * Resets the user's password using the token from the reset link.
 * Validates password strength and matching before processing.
 *
 * @param resetPasswordRequest - The request containing the new password and confirmation.
 * @returns The response indicating the success of the password reset.
 */
export async function resetPassword(
  resetPasswordRequest: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  try {
    const { session, sessionError, updateError } =
      await authRepository.resetUserPasswordWithNewValue(
        resetPasswordRequest.newPassword,
      )

    if (sessionError || !session) {
      return {
        success: false,
        message:
          "Invalid or expired reset link. Please request a new password reset.",
      }
    }

    if (updateError) {
      const errorMsg = updateError.message.toLowerCase()

      if (
        errorMsg.includes("expired") ||
        errorMsg.includes("invalid") ||
        errorMsg.includes("token")
      ) {
        return {
          success: false,
          message:
            "Invalid or expired reset link. Please request a new password reset.",
        }
      } else if (
        errorMsg.includes("weak") ||
        (errorMsg.includes("password") && errorMsg.includes("requirement"))
      ) {
        return {
          success: false,
          message:
            "Password does not meet security requirements. Please use a stronger password.",
        }
      } else {
        return {
          success: false,
          message:
            updateError.message ||
            "Failed to reset password. Please try again.",
        }
      }
    }

    return {
      success: true,
      message:
        "Password has been reset successfully. You can now log in with your new password.",
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to reset password",
    }
  }
}

/**
 * Changes the authenticated user's password.
 * Requires the current password for verification.
 *
 * @param changePasswordRequest - The request containing current and new passwords.
 * @returns The response indicating the success of the password change.
 */
export async function changePassword(
  changePasswordRequest: ChangePasswordRequest,
): Promise<ChangePasswordResponse> {
  try {
    // Get current user email
    const currentUser = useAuthStore.getState().user

    if (!currentUser?.email) {
      return {
        success: false,
        message: "You must be logged in to change your password",
      }
    }

    const { signInError, updateError } =
      await authRepository.changeAuthenticatedUserPassword(
        currentUser.email,
        changePasswordRequest.currentPassword,
        changePasswordRequest.newPassword,
      )

    if (signInError) {
      return {
        success: false,
        message: "Current password is incorrect.",
      }
    }

    if (updateError) {
      const errorMsg = updateError.message.toLowerCase()

      if (errorMsg.includes("weak") || errorMsg.includes("password")) {
        return {
          success: false,
          message:
            "New password does not meet security requirements. Please use a stronger password.",
        }
      }

      return {
        success: false,
        message:
          updateError.message || "Failed to change password. Please try again.",
      }
    }

    return {
      success: true,
      message: "Password changed successfully.",
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to change password",
    }
  }
}

/**
 * Permanently deletes the user's account.
 * Requires explicit confirmation string "DELETE" and password verification.
 *
 * @param deleteAccountRequest - The request containing confirmation string and password.
 * @returns The response indicating the success of the account deletion.
 */
export async function deleteAccount(
  deleteAccountRequest: DeleteAccountRequest,
): Promise<DeleteAccountResponse> {
  // Validate confirmation text
  if (deleteAccountRequest.confirmation !== "DELETE") {
    return {
      success: false,
      message: "Please type DELETE to confirm account deletion",
    }
  }

  // Validate password is provided
  if (
    !deleteAccountRequest.password ||
    deleteAccountRequest.password.trim() === ""
  ) {
    return {
      success: false,
      message: "Password is required to delete your account",
    }
  }

  try {
    // Get current user email
    const currentUser = useAuthStore.getState().user

    if (!currentUser?.email) {
      return {
        success: false,
        message: "You must be logged in to delete your account",
      }
    }

    const { signInError, deleteError } =
      await authRepository.deleteUserAccountWithVerification(
        currentUser.email,
        deleteAccountRequest.password,
      )

    if (signInError) {
      return {
        success: false,
        message: "Password is incorrect.",
      }
    }

    if (deleteError) {
      return {
        success: false,
        message: deleteError,
      }
    }

    // Success - local session was already cleared by repository
    return {
      success: true,
      message: "Your account has been permanently deleted.",
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete account",
    }
  }
}

/**
 * Validates the password reset session when a user clicks a reset link.
 * Should be called when determining if the reset password form should be shown.
 *
 * @returns The response containing the validity of the reset session.
 */
export async function initializeResetFlow(): Promise<ResetFlowResponse> {
  try {
    return await authRepository.initializePasswordResetFlowFromUrl()
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to initialize reset session",
    }
  }
}
