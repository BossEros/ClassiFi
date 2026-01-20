import * as authRepository from "@/data/repositories/authRepository";
import {
  validateLoginData,
  validateRegistrationData,
  validateEmail,
  validatePassword,
  validatePasswordsMatch,
} from "@/business/validation/authValidation";
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
} from "@/business/models/auth/types";

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
  // Validate credentials
  const validationResult = validateLoginData(loginCredentials);

  if (!validationResult.isValid) {
    return {
      success: false,
      message: validationResult.errors.map((e) => e.message).join(", "),
    };
  }

  // Attempt login via repository
  try {
    const response = await authRepository.login(loginCredentials);

    if (response.success) {
      persistAuthenticationSession(response.token, response.user);
    }

    return response;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Login failed",
    };
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
  const validationResult = validateRegistrationData(registrationRequest);

  if (!validationResult.isValid) {
    return {
      success: false,
      message: Object.values(validationResult.errors).join(", "),
    };
  }

  try {
    const response = await authRepository.register(registrationRequest);

    if (response.success && response.token && response.user) {
      persistAuthenticationSession(response.token, response.user);
    }

    return response;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Registration failed",
    };
  }
}

/**
 * Logs the user out of the application.
 * Ensures local auth data is cleared even if the server-side logout fails.
 */
export async function logoutUser(): Promise<void> {
  try {
    await authRepository.logout();
  } finally {
    // Always clear local auth data, even if server logout fails
    clearLocalAuthenticationSession();
  }
}


/**
 * Retrieves the currently logged-in user from local storage.
 *
 * @returns The user object if a user is logged in, or null otherwise.
 */
export function getCurrentUser(): User | null {
  const userJson = localStorage.getItem("user");
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

/**
 * Retrieves the authentication token from local storage.
 *
 * @returns The authentication token string or null if not found.
 */
export function getAuthToken(): string | null {
  return localStorage.getItem("authToken");
}

/**
 * Checks if the user is currently authenticated by verifying the presence of token and user data.
 * Does not verify token validity with the server (use verifySession for that).
 *
 * @returns True if the user has a local session, false otherwise.
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  const user = getCurrentUser();

  return !!(token && user);
}

/**
 * Verifies the validity of the current session token with the server.
 * Clears local auth data if the token is invalid or expired.
 *
 * @returns True if the session is valid, false otherwise.
 */
export async function verifySession(): Promise<boolean> {
  const token = getAuthToken();

  if (!token) {
    return false;
  }

  try {
    const isValid = await authRepository.verifyToken(token);

    if (!isValid) {
      clearLocalAuthenticationSession();
    }

    return isValid;
  } catch {
    clearLocalAuthenticationSession();
    return false;
  }
}

function persistAuthenticationSession(token: string, user: User): void {
  localStorage.setItem("authToken", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearLocalAuthenticationSession(): void {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
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
  const emailError = validateEmail(forgotPasswordRequest.email);

  if (emailError) {
    return {
      success: false,
      message: emailError,
    };
  }

  try {
    const response = await authRepository.forgotPassword(
      forgotPasswordRequest.email,
    );
    return response;
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to process request",
    };
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
  const passwordError = validatePassword(resetPasswordRequest.newPassword);

  if (passwordError) {
    return {
      success: false,
      message: passwordError,
    };
  }

  const matchError = validatePasswordsMatch(
    resetPasswordRequest.newPassword,
    resetPasswordRequest.confirmPassword,
  );

  if (matchError) {
    return {
      success: false,
      message: matchError,
    };
  }

  try {
    const response = await authRepository.resetPassword(
      resetPasswordRequest.newPassword,
    );

    return response;
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to reset password",
    };
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
  // Validate new password strength
  const passwordError = validatePassword(changePasswordRequest.newPassword);

  if (passwordError) {
    return {
      success: false,
      message: passwordError,
    };
  }

  // Validate passwords match
  const matchError = validatePasswordsMatch(
    changePasswordRequest.newPassword,
    changePasswordRequest.confirmPassword,
  );

  if (matchError) {
    return {
      success: false,
      message: matchError,
    };
  }

  try {
    // Get current user email
    const currentUser = getCurrentUser();

    if (!currentUser?.email) {
      return {
        success: false,
        message: "You must be logged in to change your password",
      };
    }

    const response = await authRepository.changePassword(
      currentUser.email,
      changePasswordRequest.currentPassword,
      changePasswordRequest.newPassword,
    );

    return response;
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to change password",
    };
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
    };
  }

  // Validate password is provided
  if (
    !deleteAccountRequest.password ||
    deleteAccountRequest.password.trim() === ""
  ) {
    return {
      success: false,
      message: "Password is required to delete your account",
    };
  }

  try {
    // Get current user email
    const currentUser = getCurrentUser();
    
    if (!currentUser?.email) {
      return {
        success: false,
        message: "You must be logged in to delete your account",
      };
    }

    const response = await authRepository.deleteAccount(
      currentUser.email,
      deleteAccountRequest.password,
    );

    if (response.success) {
      clearLocalAuthenticationSession();
    }

    return response;
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete account",
    };
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
    return await authRepository.initializeResetFlow();
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to initialize reset session",
    };
  }
}
