import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as authService from "./authService";
import * as authRepository from "@/data/repositories/authRepository";
import * as authValidation from "@/business/validation/authValidation";
import type {
  LoginRequest,
  RegisterRequest,
  User,
  ResetPasswordRequest,
  ChangePasswordRequest,
  DeleteAccountRequest,
} from "@/business/models/auth/types";
import { AuthError } from "@supabase/supabase-js";

// Mock dependencies
vi.mock("@/data/repositories/authRepository");
vi.mock("@/business/validation/authValidation");

describe("authService", () => {
  const mockUser: User = {
    id: "1",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    role: "student",
    createdAt: new Date(),
  };

  const mockToken = "mock-jwt-token";

  // Create a mock localStorage object
  const createMockStorage = () => {
    let store: Record<string, string> = {};
    return {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      key: vi.fn(),
      length: 0,
    };
  };

  let mockStorage = createMockStorage();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock storage object each test
    mockStorage = createMockStorage();
    Object.defineProperty(window, "localStorage", {
      value: mockStorage,
      writable: true,
    });

    // Default validation mocks to return valid
    vi.mocked(authValidation.validateLoginData).mockReturnValue({
      isValid: true,
      errors: [],
    });
    vi.mocked(authValidation.validateRegistrationData).mockReturnValue({
      isValid: true,
      errors: [],
    });
    vi.mocked(authValidation.validateEmail).mockReturnValue(null);
    vi.mocked(authValidation.validatePassword).mockReturnValue(null);
    vi.mocked(authValidation.validatePasswordsMatch).mockReturnValue(null);
  });

  afterEach(() => {
    // Don't restore all mocks here since we're using module-level spies
  });

  describe("loginUser", () => {
    const credentials: LoginRequest = {
      email: "test@example.com",
      password: "Password1!",
    };

    it("should validate credentials before attempting login", async () => {
      vi.mocked(authRepository.login).mockResolvedValue({
        success: true,
        token: mockToken,
        user: mockUser,
      });

      await authService.loginUser(credentials);

      expect(authValidation.validateLoginData).toHaveBeenCalledWith(
        credentials,
      );
    });

    it("should return validation errors if credentials are invalid", async () => {
      vi.mocked(authValidation.validateLoginData).mockReturnValue({
        isValid: false,
        errors: [{ field: "email", message: "Invalid email" }],
      });

      const result = await authService.loginUser(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Invalid email");
      expect(authRepository.login).not.toHaveBeenCalled();
    });

    it("should call repository login and persist session on success", async () => {
      vi.mocked(authRepository.login).mockResolvedValue({
        success: true,
        token: mockToken,
        user: mockUser,
      });

      const result = await authService.loginUser(credentials);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user).toEqual(mockUser);
      }
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "user",
        JSON.stringify(mockUser),
      );
    });

    it("should handle repository login failure", async () => {
      vi.mocked(authRepository.login).mockResolvedValue({
        success: false,
        message: "Invalid credentials",
      });

      const result = await authService.loginUser(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid credentials");
    });

    it("should catch and handle unexpected errors", async () => {
      vi.mocked(authRepository.login).mockRejectedValue(
        new Error("Network error"),
      );

      const result = await authService.loginUser(credentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Network error");
    });
  });

  describe("registerUser", () => {
    const registrationData: RegisterRequest = {
      email: "new@example.com",
      password: "Password1!",
      confirmPassword: "Password1!",
      firstName: "New",
      lastName: "User",
      role: "student",
    };

    it("should return validation errors if data is invalid", async () => {
      vi.mocked(authValidation.validateRegistrationData).mockReturnValue({
        isValid: false,
        errors: [{ field: "password", message: "Password too short" }],
      });

      const result = await authService.registerUser(registrationData);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Password too short");
      expect(authRepository.register).not.toHaveBeenCalled();
    });

    it("should call repository register and persist session on success", async () => {
      vi.mocked(authRepository.register).mockResolvedValue({
        success: true,
        token: mockToken,
        user: mockUser,
      });

      const result = await authService.registerUser(registrationData);

      expect(result.success).toBe(true);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "user",
        JSON.stringify(mockUser),
      );
    });

    it("should handle repository registration failure", async () => {
      vi.mocked(authRepository.register).mockResolvedValue({
        success: false,
        message: "Email already exists",
      });

      const result = await authService.registerUser(registrationData);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Email already exists");
    });
  });

  describe("logoutUser", () => {
    it("should call repository logout and clear local storage", async () => {
      vi.mocked(authRepository.logout).mockResolvedValue(undefined); // Fixed: logout returns void

      await authService.logoutUser();

      expect(authRepository.logout).toHaveBeenCalled();
      expect(mockStorage.removeItem).toHaveBeenCalledWith("user");
    });

    it("should clear local storage even if repository logout fails", async () => {
      vi.mocked(authRepository.logout).mockRejectedValue(
        new Error("Network error"),
      );

      await expect(authService.logoutUser()).rejects.toThrow("Network error");

      expect(mockStorage.removeItem).toHaveBeenCalledWith("user");
    });
  });

  describe("getCurrentUser", () => {
    it("should return user from local storage if present", () => {
      // Pre-populate localStorage with user
      window.localStorage.setItem("user", JSON.stringify(mockUser));

      const user = authService.getCurrentUser();
      // JSON.parse converts dates to strings, so we expect string date
      expect(user).toEqual({
        ...mockUser,
        createdAt: mockUser.createdAt.toISOString(),
      });
    });

    it("should return null if no user in local storage", () => {
      // mockLocalStorage is already empty from beforeEach
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    });

    it("should return null if user data is invalid json", () => {
      // Set invalid JSON in localStorage
      window.localStorage.setItem("user", "invalid-json");
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe("getAuthToken", () => {
    it("should return token from repository session", async () => {
      // Fixed: match getSession return type { session, error }
      vi.mocked(authRepository.getSession).mockResolvedValue({
        session: { access_token: "token" } as any,
        error: null,
      });

      const token = await authService.getAuthToken();
      expect(token).toBe("token");
    });

    it("should return null if no session", async () => {
      vi.mocked(authRepository.getSession).mockResolvedValue({
        session: null,
        error: { message: "no session" } as AuthError, // using AuthError type or casting
      });

      const token = await authService.getAuthToken();
      expect(token).toBeNull();
    });
  });

  describe("verifySession", () => {
    it("should return true if token is valid locally and verified by repository", async () => {
      vi.mocked(authRepository.getSession).mockResolvedValue({
        session: { access_token: "token" } as any,
        error: null,
      });
      vi.mocked(authRepository.verifyToken).mockResolvedValue(true);

      const isValid = await authService.verifySession();
      expect(isValid).toBe(true);
    });

    it("should return false and clear session if no token", async () => {
      vi.mocked(authRepository.getSession).mockResolvedValue({
        session: null,
        error: { message: "no session" } as AuthError,
      });

      const isValid = await authService.verifySession();
      expect(isValid).toBe(false);
      expect(mockStorage.removeItem).toHaveBeenCalledWith("user");
    });
  });

  describe("requestPasswordReset", () => {
    const request: any = { email: "test@example.com" };

    it("should validate email", async () => {
      vi.mocked(authValidation.validateEmail).mockReturnValue("Invalid email");
      const result = await authService.requestPasswordReset(request);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid email");
    });

    it("should call repository forgotPassword", async () => {
      vi.mocked(authRepository.forgotPassword).mockResolvedValue({
        success: true,
        message: "Email sent",
      });
      const result = await authService.requestPasswordReset(request);
      expect(result.success).toBe(true);
      expect(authRepository.forgotPassword).toHaveBeenCalledWith(request.email);
    });
  });

  describe("resetPassword", () => {
    const request: ResetPasswordRequest = {
      newPassword: "NewPassword1!",
      confirmPassword: "NewPassword1!",
    };

    it("should validate password match", async () => {
      vi.mocked(authValidation.validatePasswordsMatch).mockReturnValue(
        "Passwords do not match",
      );
      const result = await authService.resetPassword(request);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Passwords do not match");
    });

    it("should handle invalid link/session error from repository", async () => {
      // Fixed: match resetPassword return type structure
      vi.mocked(authRepository.resetPassword).mockResolvedValue({
        session: null,
        sessionError: { message: "Invalid session" } as any,
        updateError: null,
        signOutError: null,
      });

      const result = await authService.resetPassword(request);
      expect(result.success).toBe(false);
      expect(result.message).toContain("Invalid or expired reset link");
    });

    it("should handle update error (weak password)", async () => {
      vi.mocked(authRepository.resetPassword).mockResolvedValue({
        session: { access_token: "token" } as any,
        sessionError: null,
        updateError: { message: "Weak password" } as any,
        signOutError: null,
      });

      const result = await authService.resetPassword(request);
      expect(result.success).toBe(false);
      expect(result.message).toContain(
        "Password does not meet security requirements",
      );
    });

    it("should succeed when all steps pass", async () => {
      vi.mocked(authRepository.resetPassword).mockResolvedValue({
        session: { access_token: "token" } as any,
        sessionError: null,
        updateError: null,
        signOutError: null,
      });

      const result = await authService.resetPassword(request);
      expect(result.success).toBe(true);
    });
  });

  describe("changePassword", () => {
    const request: ChangePasswordRequest = {
      currentPassword: "OldPassword1!",
      newPassword: "NewPassword1!",
      confirmPassword: "NewPassword1!",
    };

    it("should enforce login check", async () => {
      // mockLocalStorage is already empty from beforeEach, so getCurrentUser returns null
      const result = await authService.changePassword(request);
      expect(result.success).toBe(false);
      expect(result.message).toContain("must be logged in");
    });

    it("should call repository changePassword", async () => {
      // Pre-populate localStorage with user
      window.localStorage.setItem("user", JSON.stringify(mockUser));
      // Fixed: match changePassword return type structure
      vi.mocked(authRepository.changePassword).mockResolvedValue({
        signInError: null,
        updateError: null,
      });

      const result = await authService.changePassword(request);
      expect(result.success).toBe(true);
      expect(authRepository.changePassword).toHaveBeenCalledWith(
        mockUser.email,
        request.currentPassword,
        request.newPassword,
      );
    });
  });

  describe("deleteAccount", () => {
    const request: DeleteAccountRequest = {
      confirmation: "DELETE",
      password: "Password1!",
    };

    it("should validate confirmation string", async () => {
      const result = await authService.deleteAccount({
        ...request,
        confirmation: "NO",
      });
      expect(result.success).toBe(false);
      expect(result.message).toContain("type DELETE");
    });

    it("should call repository deleteAccount", async () => {
      // Pre-populate localStorage with user
      window.localStorage.setItem("user", JSON.stringify(mockUser));
      // Fixed: match deleteAccount return type structure
      vi.mocked(authRepository.deleteAccount).mockResolvedValue({
        signInError: null,
        deleteError: null,
        signOutError: null,
      });

      const result = await authService.deleteAccount(request);
      expect(result.success).toBe(true);
      expect(authRepository.deleteAccount).toHaveBeenCalledWith(
        mockUser.email,
        request.password,
      );
    });
  });
});
