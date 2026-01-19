import { supabase } from "./supabaseClient";
import type { Session, AuthError, Subscription } from "@supabase/supabase-js";

export interface AuthResult<T = void> {
  success: boolean;
  data?: T;
  error?: AuthError | null;
  message?: string;
}

class SupabaseAuthAdapter {
  private authSubscription: Subscription | null = null;

  /**
   * Initialize the auth state change listener.
   * This should be called once when the app starts.
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
        if (session?.access_token) {
          // Update the token in localStorage so apiClient uses the fresh token
          localStorage.setItem("authToken", session.access_token);
          console.log("[Auth] Token updated in localStorage");
        }
      } else if (event === "SIGNED_OUT") {
        // Clear auth state
        localStorage.removeItem("authToken");
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
   * Cleanup the auth listener (call on app unmount if needed)
   */
  cleanupAuthListener(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
      this.authSubscription = null;
    }
  }
  /**
   * Get the current active session
   */
  async getSession(): Promise<{
    session: Session | null;
    error: AuthError | null;
  }> {
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  /**
   * Sign in with email and password
   */
  async signInWithPassword(credentials: { email: string; password: string }) {
    return await supabase.auth.signInWithPassword(credentials);
  }

  /**
   * Update user attributes (like password)
   */
  async updateUser(attributes: any) {
    return await supabase.auth.updateUser(attributes);
  }

  /**
   * Initialize a password reset session from URL parameters.
   * Encapsulates the logic previously found in ResetPasswordPage.
   */
  async initializeResetSession(): Promise<AuthResult> {
    try {
      // Extract tokens from URL hash
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);

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

      // Clear the hash from URL for security
      window.history.replaceState(null, "", window.location.pathname);

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
