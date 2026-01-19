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

export async function loginUser(
  credentials: LoginRequest,
): Promise<AuthResponse> {
  // Validate credentials
  const validationResult = validateLoginData(credentials);

  if (!validationResult.isValid) {
    return {
      success: false,
      message: Object.values(validationResult.errors).join(", "),
    };
  }

  // Attempt login via repository
  try {
    const response = await authRepository.login(credentials);

    // Store auth data if successful
    if (response.success && response.token && response.user) {
      storeAuthData(response.token, response.user);
    }

    return response;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Login failed",
    };
  }
}

export async function registerUser(
  data: RegisterRequest,
): Promise<AuthResponse> {
  const validationResult = validateRegistrationData(data);

  if (!validationResult.isValid) {
    return {
      success: false,
      message: Object.values(validationResult.errors).join(", "),
    };
  }

  try {
    const response = await authRepository.register(data);

    if (response.success && response.token && response.user) {
      storeAuthData(response.token, response.user);
    }

    return response;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Registration failed",
    };
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await authRepository.logout();
  } finally {
    // Always clear local auth data, even if server logout fails
    clearAuthData();
  }
}

export function getCurrentUser(): User | null {
  const userJson = localStorage.getItem("user");
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem("authToken");
}

export function isAuthenticated(): boolean {
  const token = getAuthToken();
  const user = getCurrentUser();
  return !!(token && user);
}

export async function verifySession(): Promise<boolean> {
  const token = getAuthToken();

  if (!token) {
    return false;
  }

  try {
    const isValid = await authRepository.verifyToken(token);

    if (!isValid) {
      clearAuthData();
    }

    return isValid;
  } catch {
    clearAuthData();
    return false;
  }
}

function storeAuthData(token: string, user: User): void {
  localStorage.setItem("authToken", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearAuthData(): void {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
}

export async function requestPasswordReset(
  data: ForgotPasswordRequest,
): Promise<ForgotPasswordResponse> {
  const emailError = validateEmail(data.email);

  if (emailError) {
    return {
      success: false,
      message: emailError,
    };
  }

  try {
    const response = await authRepository.forgotPassword(data.email);
    return response;
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to process request",
    };
  }
}

export async function resetPassword(
  data: ResetPasswordRequest,
): Promise<ResetPasswordResponse> {
  const passwordError = validatePassword(data.newPassword);

  if (passwordError) {
    return {
      success: false,
      message: passwordError,
    };
  }

  const matchError = validatePasswordsMatch(
    data.newPassword,
    data.confirmPassword,
  );

  if (matchError) {
    return {
      success: false,
      message: matchError,
    };
  }

  try {
    const response = await authRepository.resetPassword(data.newPassword);
    return response;
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to reset password",
    };
  }
}

export async function changePassword(
  data: ChangePasswordRequest,
): Promise<ChangePasswordResponse> {
  // Validate new password strength
  const passwordError = validatePassword(data.newPassword);

  if (passwordError) {
    return {
      success: false,
      message: passwordError,
    };
  }

  // Validate passwords match
  const matchError = validatePasswordsMatch(
    data.newPassword,
    data.confirmPassword,
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
      data.currentPassword,
      data.newPassword,
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

export async function deleteAccount(
  data: DeleteAccountRequest,
): Promise<DeleteAccountResponse> {
  // Validate confirmation text
  if (data.confirmation !== "DELETE") {
    return {
      success: false,
      message: "Please type DELETE to confirm account deletion",
    };
  }

  // Validate password is provided
  if (!data.password || data.password.trim() === "") {
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
      data.password,
    );

    if (response.success) {
      clearAuthData();
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
 * Initialize the password reset flow by verifying the reset session.
 * Used to validate reset links before showing the reset form.
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
