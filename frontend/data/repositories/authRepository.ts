import { apiClient } from "@/data/api/apiClient";
import { supabaseAuthAdapter } from "@/data/api/supabaseAuthAdapter";
import type { AuthResult } from "@/data/api/supabaseAuthAdapter";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  ChangePasswordResponse,
  DeleteAccountResponse,
} from "@/shared/types/auth";

// ============================================================================
// Helpers
// ============================================================================

/**
 * Safely parse JSON from a string, returning null on error.
 */
function safeJsonParse<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * Get the current stored user from localStorage safely.
 */
function getStoredUser(): { email: string } | null {
  const storedUser = localStorage.getItem("user");
  return safeJsonParse<{ email: string }>(storedUser);
}

// ============================================================================
// Auth Repository Functions
// ============================================================================

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>(
    "/auth/login",
    credentials,
  );

  if (response.error) {
    return { success: false, message: response.error };
  }

  if (!response.data) {
    return { success: false, message: "Missing response data from auth API" };
  }

  return response.data;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/register", data);

  if (response.error) {
    return { success: false, message: response.error };
  }

  if (!response.data) {
    return { success: false, message: "Missing response data from auth API" };
  }

  return response.data;
}

/**
 * Signs out the current user and clears local session data (localStorage).
 * Calls the Supabase adapter to sign out remotely.
 */
export async function logout(): Promise<void> {
  await supabaseAuthAdapter.signOut();
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
}

export async function verifyToken(token: string): Promise<boolean> {
  const response = await apiClient.post<AuthResponse>(
    `/auth/verify?token=${token}`,
    {},
  );

  if (response.error) {
    return false;
  }

  return response.data?.success ?? false;
}

export async function forgotPassword(
  email: string,
): Promise<ForgotPasswordResponse> {
  const response = await apiClient.post<ForgotPasswordResponse>(
    "/auth/forgot-password",
    { email },
  );

  if (response.error) {
    return { success: false, message: response.error };
  }

  if (!response.data) {
    return { success: false, message: "Missing response data from auth API" };
  }

  return response.data;
}

export async function initializeResetFlow(): Promise<AuthResult> {
  return await supabaseAuthAdapter.initializeResetSession();
}

/**
 * Get current session from Supabase adapter.
 * Returns raw adapter result for business layer processing.
 */
export async function getSession(): ReturnType<
  typeof supabaseAuthAdapter.getSession
> {
  return await supabaseAuthAdapter.getSession();
}

/**
 * Update user in Supabase (e.g., password).
 * Returns raw adapter result for business layer processing.
 */
export async function updateUser(data: {
  password: string;
}): ReturnType<typeof supabaseAuthAdapter.updateUser> {
  return await supabaseAuthAdapter.updateUser(data);
}

/**
 * Sign in with password via Supabase adapter.
 */
export async function signInWithPassword(
  email: string,
  password: string,
): ReturnType<typeof supabaseAuthAdapter.signInWithPassword> {
  return await supabaseAuthAdapter.signInWithPassword({ email, password });
}

/**
 * Legacy resetPassword - now delegates to business layer patterns.
 * Repository returns raw adapter results for business layer to interpret.
 */
export async function resetPassword(
  newPassword: string,
): Promise<ResetPasswordResponse> {
  try {
    const { session, error: sessionError } =
      await supabaseAuthAdapter.getSession();

    if (sessionError || !session) {
      return {
        success: false,
        message:
          "Invalid or expired reset link. Please request a new password reset.",
      };
    }

    if (!session.access_token) {
      return {
        success: false,
        message: "Invalid reset session. Please request a new password reset.",
      };
    }

    const { error: updateError } = await supabaseAuthAdapter.updateUser({
      password: newPassword,
    });

    if (updateError) {
      const errorMsg = updateError.message.toLowerCase();

      if (
        errorMsg.includes("expired") ||
        errorMsg.includes("invalid") ||
        errorMsg.includes("token")
      ) {
        return {
          success: false,
          message:
            "Invalid or expired reset link. Please request a new password reset.",
        };
      } else if (
        errorMsg.includes("weak") ||
        (errorMsg.includes("password") && errorMsg.includes("requirement"))
      ) {
        return {
          success: false,
          message:
            "Password does not meet security requirements. Please use a stronger password.",
        };
      } else {
        return {
          success: false,
          message:
            updateError.message ||
            "Failed to reset password. Please try again.",
        };
      }
    }

    await supabaseAuthAdapter.signOut();

    return {
      success: true,
      message:
        "Password has been reset successfully. You can now log in with your new password.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to reset password. Please try again.",
    };
  }
}

/**
 * Change password for authenticated user.
 * Accepts email as parameter instead of reading from localStorage.
 */
export async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResponse> {
  try {
    // Re-authenticate with current password to verify identity
    const { error: signInError } = await supabaseAuthAdapter.signInWithPassword(
      {
        email,
        password: currentPassword,
      },
    );

    if (signInError) {
      return {
        success: false,
        message: "Current password is incorrect.",
      };
    }

    // Update to new password
    const { error: updateError } = await supabaseAuthAdapter.updateUser({
      password: newPassword,
    });

    if (updateError) {
      const errorMsg = updateError.message.toLowerCase();

      if (errorMsg.includes("weak") || errorMsg.includes("password")) {
        return {
          success: false,
          message:
            "New password does not meet security requirements. Please use a stronger password.",
        };
      }

      return {
        success: false,
        message:
          updateError.message || "Failed to change password. Please try again.",
      };
    }

    return {
      success: true,
      message: "Password changed successfully.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to change password. Please try again.",
    };
  }
}

/**
 * Delete user account.
 * Accepts email and password as parameters instead of reading from localStorage.
 */
export async function deleteAccount(
  email: string,
  password: string,
): Promise<DeleteAccountResponse> {
  try {
    // Re-authenticate to verify identity and get fresh token
    const { data: signInData, error: signInError } =
      await supabaseAuthAdapter.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      return {
        success: false,
        message: "Password is incorrect.",
      };
    }

    // Update localStorage with fresh token for the API call
    if (signInData.session?.access_token) {
      localStorage.setItem("authToken", signInData.session.access_token);
    }

    // Call backend to delete account (handles database + Supabase Auth cleanup)
    const response = await apiClient.delete<DeleteAccountResponse>("/user/me");

    if (response.error) {
      return { success: false, message: response.error };
    }

    // Sign out after successful deletion
    await supabaseAuthAdapter.signOut();
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");

    return {
      success: true,
      message: "Your account has been permanently deleted.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete account. Please try again.",
    };
  }
}

// Export helper for external use
export { getStoredUser };
