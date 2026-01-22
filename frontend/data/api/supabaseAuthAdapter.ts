import { supabase } from "@/data/api/supabaseClient";
import type {
  Session,
  AuthError,
  Subscription,
  UserAttributes,
  SignInWithPasswordCredentials,
  AuthResponse,
  UserResponse,
} from "@supabase/supabase-js";

/**
 * Standardized result for authentication operations.
 *
 * @template T - The type of the optional data payload.
 */
export interface AuthResult<T = void> {
  success: boolean;
  data?: T;
  error?: AuthError | null;
  message?: string;
}

/**
 * Adapter class for interacting with Supabase Authentication.
 * Encapsulates auth logic, session management, and state listeners.
 */
class SupabaseAuthAdapter {
  private authSubscription: Subscription | null = null;

  /**
   * Initializes the auth state change listener.
   * This should be called once when the application starts.
   * It automatically syncs the auth token in localStorage whenever Supabase refreshes it.
   */
  initializeAuthListener(): void {
    // Avoid setting up multiple listeners
    if (this.authSubscription) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("[Auth] State change:", event);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Token is managed by Supabase internally
        // apiClient retrieves it via getSession() when needed
        if (session?.access_token) {
          console.log("[Auth] Session established/refreshed");
        }
      } else if (event === "SIGNED_OUT") {
        // Clear user data (token is managed by Supabase)
        localStorage.removeItem("currentUser");
        console.log("[Auth] User signed out, auth state cleared");

        // Only redirect if not already on login page
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    });

    this.authSubscription = subscription;
  }

  /**
   * Cleans up the auth listener.
   * Should be called when the application unmounts or to prevent memory leaks.
   */
  cleanupAuthListener(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
      this.authSubscription = null;
    }
  }

  /**
   * Retrieves the current active session from Supabase.
   *
   * @returns A promise resolving to an object containing the session and any error.
   */
  async getSession(): Promise<{
    session: Session | null;
    error: AuthError | null;
  }> {
    const { data, error } = await supabase.auth.getSession();

    return { session: data.session, error };
  }

  /**
   * Signs out the current user.
   *
   * @returns A promise resolving to an object containing any error that occurred during sign-out.
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();

    return { error };
  }

  /**
   * Signs in a user with email and password.
   *
   * @param credentials - The email and password credentials.
   * @returns A promise resolving to the authentication response.
   */
  async signInWithPassword(
    credentials: SignInWithPasswordCredentials,
  ): Promise<AuthResponse> {
    return await supabase.auth.signInWithPassword(credentials);
  }

  /**
   * Updates user attributes (e.g., password, email, meta_data).
   *
   * @param attributes - The user attributes to update.
   * @returns A promise resolving to the user update response.
   */
  async updateUser(attributes: UserAttributes): Promise<UserResponse> {
    return await supabase.auth.updateUser(attributes);
  }

  /**
   * Initializes a password reset session from URL parameters.
   * Encapsulates the logic for extracting tokens and verifying the reset link.
   *
   * @param options - Optional parameters for hash and search (useful for testing).
   * @returns A promise resolving to an AuthResult indicating success or failure.
   */
  async initializeResetSession(options?: {
    hash?: string;
    search?: string;
  }): Promise<AuthResult> {
    try {
      // Extract tokens from URL hash or parameters
      const hash = options?.hash ?? window.location.hash;
      const search = options?.search ?? window.location.search;

      const hashParams = new URLSearchParams(hash.substring(1));
      const searchParams = new URLSearchParams(search);

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const tokenType = hashParams.get("type") || searchParams.get("type");
      const urlError = hashParams.get("error") || searchParams.get("error");
      const urlErrorDescription =
        hashParams.get("error_description") ||
        searchParams.get("error_description");

      if (urlError) {
        return {
          success: false,
          message:
            urlErrorDescription ||
            "Invalid or expired reset link. Please request a new password reset.",
        };
      }

      if (tokenType !== "recovery" && !accessToken) {
        // If we don't have a recovery token type OR an access token, check if we already have a session
        const { session } = await this.getSession();

        if (session) {
          return { success: true };
        }

        // No session and no tokens
        return {
          success: false,
          message:
            "Invalid reset link type. Please request a new password reset.",
        };
      }

      if (!accessToken || !refreshToken) {
        // Maybe the user is already logged in or clicked a magic link that just works?
        // Let's double check session
        const { session } = await this.getSession();

        if (session) {
          return { success: true };
        }

        return {
          success: false,
          message:
            "Missing required tokens. Please request a new password reset.",
        };
      }

      // Manually set the session using the tokens from the URL
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        return {
          success: false,
          message:
            "Unable to establish reset session. The link may have expired. Please request a new password reset.",
        };
      }

      // Verify session was established
      const { session } = await this.getSession();

      if (!session) {
        return {
          success: false,
          message:
            "Unable to verify session. Please request a new password reset.",
        };
      }

      // Clear the hash from URL for security (if we are using the real window)
      if (!options?.hash) {
        window.history.replaceState(null, "", window.location.pathname);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to verify reset link.",
      };
    }
  }
}

export const supabaseAuthAdapter = new SupabaseAuthAdapter();
