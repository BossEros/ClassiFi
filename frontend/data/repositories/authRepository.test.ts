import { describe, it, expect, vi, beforeEach } from "vitest";

import * as authRepository from "@/data/repositories/authRepository";
import { apiClient } from "@/data/api/apiClient";
import { supabaseAuthAdapter } from "@/data/api/supabaseAuthAdapter";
import type {
  Session,
  User as SupabaseUser,
  AuthError,
} from "@supabase/supabase-js";

// Mock the apiClient module
vi.mock("@/data/api/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the supabaseAuthAdapter module
vi.mock("@/data/api/supabaseAuthAdapter", () => ({
  supabaseAuthAdapter: {
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    updateUser: vi.fn(),
    initializeResetSession: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
});

describe("authRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  // ============================================================================
  // Fixtures
  // ============================================================================

  const mockUser = {
    id: "1",
    email: "user@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "student" as const,
    createdAt: new Date("2024-01-01"),
  };

  // Minimal mock for Supabase User
  const mockSupabaseUser: Partial<SupabaseUser> = {
    id: "uuid-123",
    email: "user@example.com",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2024-01-01T00:00:00Z",
  };

  // Minimal mock for Supabase Session
  const mockSupabaseSession: Partial<Session> = {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_at: 1234567890,
    expires_in: 3600,
    token_type: "bearer",
    user: mockSupabaseUser as SupabaseUser,
  };

  // Mock AuthError
  const createMockAuthError = (message: string) =>
    ({
      message,
      name: "AuthError",
      code: "auth_error",
      status: 401,
      __isAuthError: true,
    }) as unknown as AuthError;

  // ============================================================================
  // authenticateUserWithEmailAndPassword Tests
  // ============================================================================

  describe("authenticateUserWithEmailAndPassword", () => {
    it("logs in successfully with valid credentials", async () => {
      vi.mocked(supabaseAuthAdapter.signInWithPassword).mockResolvedValue({
        data: {
          user: mockSupabaseUser as SupabaseUser,
          session: mockSupabaseSession as Session,
        },
        error: null,
      });

      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: true, user: mockUser, token: "mock-access-token" },
        status: 200,
      });

      const result = await authRepository.authenticateUserWithEmailAndPassword({
        email: "user@example.com",
        password: "password123",
      });

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.user).toEqual(mockUser);
        expect(result.token).toBe("mock-access-token");
      }
    });

    it("returns error when Supabase sign-in fails", async () => {
      vi.mocked(supabaseAuthAdapter.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: createMockAuthError("Invalid credentials"),
      });

      const result = await authRepository.authenticateUserWithEmailAndPassword({
        email: "user@example.com",
        password: "wrongpassword",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.message).toBe("Invalid credentials");
      }
    });

    it("returns error when no session is created", async () => {
      vi.mocked(supabaseAuthAdapter.signInWithPassword).mockResolvedValue({
        data: { user: mockSupabaseUser as SupabaseUser, session: null },
        error: null,
      });

      const result = await authRepository.authenticateUserWithEmailAndPassword({
        email: "user@example.com",
        password: "password123",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.message).toBe("No session created");
      }
    });

    it("returns error when profile fetch fails", async () => {
      vi.mocked(supabaseAuthAdapter.signInWithPassword).mockResolvedValue({
        data: {
          user: mockSupabaseUser as SupabaseUser,
          session: mockSupabaseSession as Session,
        },
        error: null,
      });

      vi.mocked(apiClient.post).mockResolvedValue({
        error: "Profile not found",
        status: 404,
      });

      const result = await authRepository.authenticateUserWithEmailAndPassword({
        email: "user@example.com",
        password: "password123",
      });

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.message).toBe("Profile not found");
      }
    });
  });

  // ============================================================================
  // registerNewUserAccount Tests
  // ============================================================================

  describe("registerNewUserAccount", () => {
    const registerData = {
      email: "newuser@example.com",
      password: "securePassword123",
      confirmPassword: "securePassword123",
      firstName: "New",
      lastName: "User",
      role: "student" as const,
    };

    it("registers a new user successfully", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: {
          success: true,
          user: mockUser,
          token: "new-token",
          message: "Registration successful",
        },
        status: 201,
      });

      const result = await authRepository.registerNewUserAccount(registerData);

      expect(apiClient.post).toHaveBeenCalledWith(
        "/auth/register",
        registerData,
      );
      expect(result.success).toBe(true);
    });

    it("returns error when registration fails", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        error: "Email already registered",
        status: 409,
      });

      const result = await authRepository.registerNewUserAccount(registerData);

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.message).toBe("Email already registered");
      }
    });

    it("returns error when response data is missing", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: null,
        status: 200,
      });

      const result = await authRepository.registerNewUserAccount(registerData);

      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.message).toBe("Missing response data from auth API");
      }
    });
  });

  // ============================================================================
  // signOutCurrentUserAndClearSession Tests
  // ============================================================================

  describe("signOutCurrentUserAndClearSession", () => {
    it("signs out and clears user from localStorage", async () => {
      localStorageMock.setItem("user", JSON.stringify(mockUser));
      vi.mocked(supabaseAuthAdapter.signOut).mockResolvedValue({ error: null });

      await authRepository.signOutCurrentUserAndClearSession();

      expect(supabaseAuthAdapter.signOut).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("user");
    });
  });

  // ============================================================================
  // validateAuthenticationToken Tests
  // ============================================================================

  describe("validateAuthenticationToken", () => {
    it("returns true for valid token", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: true },
        status: 200,
      });

      const result = await authRepository.validateAuthenticationToken("valid-token");

      expect(apiClient.post).toHaveBeenCalledWith(
        "/auth/verify?token=valid-token",
        {},
      );
      expect(result).toBe(true);
    });

    it("returns false for invalid token", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: false },
        status: 401,
      });

      const result = await authRepository.validateAuthenticationToken("invalid-token");

      expect(result).toBe(false);
    });

    it("returns false when API returns error", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        error: "Token expired",
        status: 401,
      });

      const result = await authRepository.validateAuthenticationToken("expired-token");

      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // initiatePasswordResetForEmail Tests
  // ============================================================================

  describe("initiatePasswordResetForEmail", () => {
    it("sends password reset email successfully", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: true, message: "Reset email sent" },
        status: 200,
      });

      const result = await authRepository.initiatePasswordResetForEmail("user@example.com");

      expect(apiClient.post).toHaveBeenCalledWith("/auth/forgot-password", {
        email: "user@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("returns error when email not found", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        error: "Email not found",
        status: 404,
      });

      const result = await authRepository.initiatePasswordResetForEmail(
        "notfound@example.com",
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe("Email not found");
    });

    it("returns error when response data is missing", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: null,
        status: 200,
      });

      const result = await authRepository.initiatePasswordResetForEmail("user@example.com");

      expect(result.success).toBe(false);
      expect(result.message).toBe("Missing response data from auth API");
    });
  });

  // ============================================================================
  // initializePasswordResetFlowFromUrl Tests
  // ============================================================================

  describe("initializePasswordResetFlowFromUrl", () => {
    it("initializes reset flow successfully", async () => {
      vi.mocked(supabaseAuthAdapter.initializeResetSession).mockResolvedValue({
        success: true,
      });

      const result = await authRepository.initializePasswordResetFlowFromUrl({
        hash: "#access_token=abc",
        search: "?type=recovery",
      });

      expect(supabaseAuthAdapter.initializeResetSession).toHaveBeenCalledWith({
        hash: "#access_token=abc",
        search: "?type=recovery",
      });
      expect(result.success).toBe(true);
    });

    it("returns error when initialization fails", async () => {
      vi.mocked(supabaseAuthAdapter.initializeResetSession).mockResolvedValue({
        success: false,
        message: "Invalid token",
      });

      const result = await authRepository.initializePasswordResetFlowFromUrl();

      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid token");
    });
  });

  // ============================================================================
  // getCurrentAuthenticationSession Tests
  // ============================================================================

  describe("getCurrentAuthenticationSession", () => {
    it("returns current session", async () => {
      vi.mocked(supabaseAuthAdapter.getSession).mockResolvedValue({
        session: mockSupabaseSession as Session,
        error: null,
      });

      const result = await authRepository.getCurrentAuthenticationSession();

      expect(supabaseAuthAdapter.getSession).toHaveBeenCalled();
      expect(result.session).toBeDefined();
    });

    it("returns null session when not authenticated", async () => {
      vi.mocked(supabaseAuthAdapter.getSession).mockResolvedValue({
        session: null,
        error: null,
      });

      const result = await authRepository.getCurrentAuthenticationSession();

      expect(result.session).toBeNull();
    });
  });

  // ============================================================================
  // updateAuthenticatedUserPassword Tests
  // ============================================================================

  describe("updateAuthenticatedUserPassword", () => {
    it("updates user password successfully", async () => {
      vi.mocked(supabaseAuthAdapter.updateUser).mockResolvedValue({
        data: { user: mockSupabaseUser as SupabaseUser },
        error: null,
      });

      const result = await authRepository.updateAuthenticatedUserPassword({
        password: "newPassword123",
      });

      expect(supabaseAuthAdapter.updateUser).toHaveBeenCalledWith({
        password: "newPassword123",
      });
      expect(result.error).toBeNull();
    });

    it("returns error when update fails", async () => {
      vi.mocked(supabaseAuthAdapter.updateUser).mockResolvedValue({
        data: { user: null },
        error: createMockAuthError("Password too weak"),
      });

      const result = await authRepository.updateAuthenticatedUserPassword({
        password: "weak",
      });

      expect(result.error).toBeDefined();
    });
  });

  // ============================================================================
  // authenticateUserWithEmailPasswordCredentials Tests
  // ============================================================================

  describe("authenticateUserWithEmailPasswordCredentials", () => {
    it("signs in user with password", async () => {
      vi.mocked(supabaseAuthAdapter.signInWithPassword).mockResolvedValue({
        data: {
          user: mockSupabaseUser as SupabaseUser,
          session: mockSupabaseSession as Session,
        },
        error: null,
      });

      const result = await authRepository.authenticateUserWithEmailPasswordCredentials(
        "user@example.com",
        "password123",
      );

      expect(supabaseAuthAdapter.signInWithPassword).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123",
      });
      expect(result.error).toBeNull();
    });

    it("returns error for invalid credentials", async () => {
      vi.mocked(supabaseAuthAdapter.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: createMockAuthError("Invalid credentials"),
      });

      const result = await authRepository.authenticateUserWithEmailPasswordCredentials(
        "user@example.com",
        "wrong",
      );

      expect(result.error).toBeDefined();
    });
  });

  // ============================================================================
  // resetUserPasswordWithNewValue Tests
  // ============================================================================

  describe("resetUserPasswordWithNewValue", () => {
    it("resets password successfully", async () => {
      vi.mocked(supabaseAuthAdapter.getSession).mockResolvedValue({
        session: mockSupabaseSession as Session,
        error: null,
      });
      vi.mocked(supabaseAuthAdapter.updateUser).mockResolvedValue({
        data: { user: mockSupabaseUser as SupabaseUser },
        error: null,
      });
      vi.mocked(supabaseAuthAdapter.signOut).mockResolvedValue({ error: null });

      const result = await authRepository.resetUserPasswordWithNewValue("newPassword123");

      expect(supabaseAuthAdapter.getSession).toHaveBeenCalled();
      expect(supabaseAuthAdapter.updateUser).toHaveBeenCalledWith({
        password: "newPassword123",
      });
      expect(supabaseAuthAdapter.signOut).toHaveBeenCalled();
      expect(result.session).toBeDefined();
      expect(result.updateError).toBeNull();
    });

    it("returns errors from each step", async () => {
      vi.mocked(supabaseAuthAdapter.getSession).mockResolvedValue({
        session: null,
        error: createMockAuthError("No session"),
      });
      vi.mocked(supabaseAuthAdapter.updateUser).mockResolvedValue({
        data: { user: null },
        error: createMockAuthError("Update failed"),
      });
      vi.mocked(supabaseAuthAdapter.signOut).mockResolvedValue({
        error: createMockAuthError("Sign out failed"),
      });

      const result = await authRepository.resetUserPasswordWithNewValue("newPassword123");

      expect(result.sessionError).toBeDefined();
      expect(result.updateError).toBeDefined();
      expect(result.signOutError).toBeDefined();
    });
  });

  // ============================================================================
  // changeAuthenticatedUserPassword Tests
  // ============================================================================

  describe("changeAuthenticatedUserPassword", () => {
    it("changes password successfully", async () => {
      vi.mocked(supabaseAuthAdapter.signInWithPassword).mockResolvedValue({
        data: {
          user: mockSupabaseUser as SupabaseUser,
          session: mockSupabaseSession as Session,
        },
        error: null,
      });
      vi.mocked(supabaseAuthAdapter.updateUser).mockResolvedValue({
        data: { user: mockSupabaseUser as SupabaseUser },
        error: null,
      });

      const result = await authRepository.changeAuthenticatedUserPassword(
        "user@example.com",
        "oldPassword",
        "newPassword123",
      );

      expect(supabaseAuthAdapter.signInWithPassword).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "oldPassword",
      });
      expect(supabaseAuthAdapter.updateUser).toHaveBeenCalledWith({
        password: "newPassword123",
      });
      expect(result.signInError).toBeNull();
      expect(result.updateError).toBeNull();
    });

    it("returns error when current password is wrong", async () => {
      vi.mocked(supabaseAuthAdapter.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: createMockAuthError("Invalid password"),
      });

      const result = await authRepository.changeAuthenticatedUserPassword(
        "user@example.com",
        "wrongPassword",
        "newPassword123",
      );

      expect(result.signInError).toBeDefined();
      expect(supabaseAuthAdapter.updateUser).not.toHaveBeenCalled();
    });

    it("returns error when password update fails", async () => {
      vi.mocked(supabaseAuthAdapter.signInWithPassword).mockResolvedValue({
        data: {
          user: mockSupabaseUser as SupabaseUser,
          session: mockSupabaseSession as Session,
        },
        error: null,
      });
      vi.mocked(supabaseAuthAdapter.updateUser).mockResolvedValue({
        data: { user: null },
        error: createMockAuthError("Password too weak"),
      });

      const result = await authRepository.changeAuthenticatedUserPassword(
        "user@example.com",
        "oldPassword",
        "weak",
      );

      expect(result.signInError).toBeNull();
      expect(result.updateError).toBeDefined();
    });
  });

  // ============================================================================
  // deleteUserAccountWithVerification Tests
  // ============================================================================

  describe("deleteUserAccountWithVerification", () => {
    it("deletes account successfully", async () => {
      localStorageMock.setItem("user", JSON.stringify(mockUser));

      vi.mocked(supabaseAuthAdapter.signInWithPassword).mockResolvedValue({
        data: {
          user: mockSupabaseUser as SupabaseUser,
          session: mockSupabaseSession as Session,
        },
        error: null,
      });
      vi.mocked(apiClient.delete).mockResolvedValue({
        data: { success: true, message: "Account deleted" },
        status: 200,
      });
      vi.mocked(supabaseAuthAdapter.signOut).mockResolvedValue({ error: null });

      const result = await authRepository.deleteUserAccountWithVerification(
        "user@example.com",
        "password123",
      );

      expect(supabaseAuthAdapter.signInWithPassword).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123",
      });
      expect(apiClient.delete).toHaveBeenCalledWith("/user/me");
      expect(supabaseAuthAdapter.signOut).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("user");
      expect(result.signInError).toBeNull();
      expect(result.deleteError).toBeNull();
    });

    it("returns error when re-authentication fails", async () => {
      vi.mocked(supabaseAuthAdapter.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: createMockAuthError("Invalid password"),
      });

      const result = await authRepository.deleteUserAccountWithVerification(
        "user@example.com",
        "wrongPassword",
      );

      expect(result.signInError).toBeDefined();
      expect(apiClient.delete).not.toHaveBeenCalled();
    });

    it("returns error when backend deletion fails", async () => {
      vi.mocked(supabaseAuthAdapter.signInWithPassword).mockResolvedValue({
        data: {
          user: mockSupabaseUser as SupabaseUser,
          session: mockSupabaseSession as Session,
        },
        error: null,
      });
      vi.mocked(apiClient.delete).mockResolvedValue({
        error: "Cannot delete user with active data",
        status: 400,
      });

      const result = await authRepository.deleteUserAccountWithVerification(
        "user@example.com",
        "password123",
      );

      expect(result.signInError).toBeNull();
      expect(result.deleteError).toBe("Cannot delete user with active data");
    });
  });

  // ============================================================================
  // retrieveStoredUserFromLocalStorage Tests
  // ============================================================================

  describe("retrieveStoredUserFromLocalStorage", () => {
    it("returns stored user from localStorage", () => {
      const storedUser = { email: "user@example.com" };
      localStorageMock.setItem("user", JSON.stringify(storedUser));

      const result = authRepository.retrieveStoredUserFromLocalStorage();

      expect(result).toEqual(storedUser);
    });

    it("returns null when no user stored", () => {
      const result = authRepository.retrieveStoredUserFromLocalStorage();

      expect(result).toBeNull();
    });

    it("returns null when stored user is invalid JSON", () => {
      localStorageMock.setItem("user", "invalid-json");

      const result = authRepository.retrieveStoredUserFromLocalStorage();

      expect(result).toBeNull();
    });
  });
});
