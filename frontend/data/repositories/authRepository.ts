import { apiClient } from "@/data/api/apiClient";
import { supabaseAuthAdapter } from "@/data/api/supabaseAuthAdapter";
import type { AuthResult } from "@/data/api/supabaseAuthAdapter";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ForgotPasswordResponse,
  DeleteAccountResponse,
} from "@/shared/types/auth";

// Export helper for external use
export { retrieveStoredUserFromLocalStorage };


// ============================================================================
// Auth Repository Functions
// ============================================================================

export async function authenticateUserWithEmailAndPassword(loginCredentials: LoginRequest): Promise<AuthResponse> {
  // 1. Sign in with Supabase (Client-Side)
  // This automatically sets the session in the Supabase client
  const { data, error } = await supabaseAuthAdapter.signInWithPassword({
    email: loginCredentials.email,
    password: loginCredentials.password,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  if (!data.session?.access_token) {
    return { success: false, message: "No session created" };
  }

  // 2. Fetch User Profile from Backend
  // The apiClient will automatically use the token from the Supabase session

  const token = data.session.access_token;

  // Utilize the existing verifyToken logic to get the user profile
  const userResponse = await apiClient.post<AuthResponse>("/auth/verify", {
    token,
  });

  if (
    userResponse.error ||
    !userResponse.data?.success ||
    !userResponse.data.user
  ) {
    // If we can't get the profile, we should probably sign out?
    return {
      success: false,
      message: userResponse.error || "Failed to retrieve user profile",
    };
  }

  return {
    success: true,
    token: token,
    user: userResponse.data.user,
  };
}

export async function registerNewUserAccount(registrationData: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>("/auth/register", registrationData);

  if (response.error) {
    return { success: false, message: response.error };
  }

  if (!response.data) {
    return { success: false, message: "Missing response data from auth API" };
  }

  return response.data;
}

/**
 * Signs out the current user and clears local session data.
 * Calls the Supabase adapter to sign out remotely.
 * Token is managed by Supabase, only user data needs manual cleanup.
 */
export async function signOutCurrentUserAndClearSession(): Promise<void> {
  await supabaseAuthAdapter.signOut();
  localStorage.removeItem("user");
}

export async function validateAuthenticationToken(authenticationToken: string): Promise<boolean> {
  const response = await apiClient.post<AuthResponse>(
    `/auth/verify?token=${authenticationToken}`,
    {},
  );

  if (response.error) {
    return false;
  }

  return response.data?.success ?? false;
}

export async function initiatePasswordResetForEmail(
  userEmailAddress: string,
): Promise<ForgotPasswordResponse> {
  const response = await apiClient.post<ForgotPasswordResponse>(
    "/auth/forgot-password",
    { email: userEmailAddress },
  );

  if (response.error) {
    return { success: false, message: response.error };
  }

  if (!response.data) {
    return { success: false, message: "Missing response data from auth API" };
  }

  return response.data;
}

/**
 * Initializes the password reset flow by verifying tokens in the URL.
 *
 * @param options - Optional hash and search strings (useful for testing).
 */
export async function initializePasswordResetFlowFromUrl(options?: {
  hash?: string;
  search?: string;
}): Promise<AuthResult> {
  return await supabaseAuthAdapter.initializeResetSession(options);
}

/**
 * Get current session from Supabase adapter.
 * Returns raw adapter result for business layer processing.
 */
export async function getCurrentAuthenticationSession(): ReturnType<
  typeof supabaseAuthAdapter.getSession
> {
  return await supabaseAuthAdapter.getSession();
}

/**
 * Update user in Supabase (e.g., password).
 * Returns raw adapter result for business layer processing.
 */
export async function updateAuthenticatedUserPassword(passwordUpdateData: {
  password: string;
}): ReturnType<typeof supabaseAuthAdapter.updateUser> {
  return await supabaseAuthAdapter.updateUser(passwordUpdateData);
}

/**
 * Sign in with password via Supabase adapter.
 */
export async function authenticateUserWithEmailPasswordCredentials(
  userEmailAddress: string,
  userPassword: string,
): ReturnType<typeof supabaseAuthAdapter.signInWithPassword> {
  return await supabaseAuthAdapter.signInWithPassword({ email: userEmailAddress, password: userPassword });
}

/**
 * Resets the user's password using the active session.
 *
 * @param newPasswordValue - The new password to set.
 * @returns The raw results from the sequence of adapter calls.
 */
export async function resetUserPasswordWithNewValue(newPasswordValue: string) {
  const sessionResult = await supabaseAuthAdapter.getSession();
  const updateResult = await supabaseAuthAdapter.updateUser({
    password: newPasswordValue,
  });
  const signOutResult = await supabaseAuthAdapter.signOut();

  return {
    session: sessionResult.session,
    sessionError: sessionResult.error,
    updateError: updateResult.error,
    signOutError: signOutResult.error,
  };
}

/**
 * Change password for authenticated user.
 * Accepts email as parameter instead of reading from localStorage.
 */
export async function changeAuthenticatedUserPassword(
  userEmailAddress: string,
  currentPasswordValue: string,
  newPasswordValue: string,
) {
  // Re-authenticate with current password to verify identity
  const signInResult = await supabaseAuthAdapter.signInWithPassword({
    email: userEmailAddress,
    password: currentPasswordValue,
  });

  if (signInResult.error) {
    return {
      signInError: signInResult.error,
    };
  }

  // Update to new password
  const updateResult = await supabaseAuthAdapter.updateUser({
    password: newPasswordValue,
  });

  return {
    signInError: null,
    updateError: updateResult.error,
  };
}

/**
 * Delete user account.
 * Accepts email and password as parameters instead of reading from localStorage.
 */
export async function deleteUserAccountWithVerification(userEmailAddress: string, verificationPassword: string) {
  // Re-authenticate to verify identity and establish fresh session
  // The apiClient will automatically retrieve the token from Supabase session
  const signInResult = await supabaseAuthAdapter.signInWithPassword({
    email: userEmailAddress,
    password: verificationPassword,
  });

  if (signInResult.error) {
    return {
      signInError: signInResult.error,
    };
  }

  // Call backend to delete account (handles database + Supabase Auth cleanup)
  const deleteResult =
    await apiClient.delete<DeleteAccountResponse>("/user/me");

  if (deleteResult.error) {
    return {
      signInError: null,
      deleteError: deleteResult.error,
    };
  }

  // Sign out after successful deletion
  const signOutResult = await supabaseAuthAdapter.signOut();

  // Cleanup local state (user data only - token is managed by Supabase)
  localStorage.removeItem("user");

  return {
    signInError: null,
    deleteError: null,
    signOutError: signOutResult.error,
  };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Safely parse JSON from a string, returning null on error.
 */
function parseJsonStringSafely<T>(json: string | null): T | null {
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
function retrieveStoredUserFromLocalStorage(): { email: string } | null {
  const storedUser = localStorage.getItem("user");
  return parseJsonStringSafely<{ email: string }>(storedUser);
}