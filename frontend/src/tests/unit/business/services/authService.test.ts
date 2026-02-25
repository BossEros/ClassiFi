import { useAuthStore } from "@/shared/store/useAuthStore";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import * as authService from "@/business/services/authService"
import * as authRepository from "@/data/repositories/authRepository"
import * as authValidation from "@/business/validation/authValidation"
import type {
  LoginRequest,
  RegisterRequest,
  User,
  ResetFlowResponse,
  ResetPasswordRequest,
  ChangePasswordRequest,
  DeleteAccountRequest,
} from "@/business/models/auth/types"
import { AuthError } from "@supabase/supabase-js"

// Mock dependencies
vi.mock("@/data/repositories/authRepository")
vi.mock("@/business/validation/authValidation")

describe("authService", () => {
  const mockUser: User = {
    id: "1",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    role: "student",
    createdAt: new Date(),
  }

  const mockToken = "mock-jwt-token"

  // Create a mock localStorage object
  const createMockStorage = () => {
    let store: Record<string, string> = {}
    return {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key]
      }),
      clear: vi.fn(() => {
        store = {}
      }),
      key: vi.fn(),
      length: 0,
    }
  }

  let mockStorage = createMockStorage()

  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
    vi.clearAllMocks()
    // Reset the mock storage object each test
    mockStorage = createMockStorage()
    Object.defineProperty(window, "localStorage", {
      value: mockStorage,
      writable: true,
      configurable: true,
    })

    // Default validation mocks to return valid
    vi.mocked(authValidation.validateLoginData).mockReturnValue({
      isValid: true,
      errors: [],
    })
    vi.mocked(authValidation.validateRegistrationData).mockReturnValue({
      isValid: true,
      errors: [],
    })
    vi.mocked(authValidation.validateEmail).mockReturnValue(null)
    vi.mocked(authValidation.validatePassword).mockReturnValue(null)
    vi.mocked(authValidation.validatePasswordsMatch).mockReturnValue(null)
  })

  afterEach(() => {
    // Don't restore all mocks here since we're using module-level spies
  })

  describe("loginUser", () => {
    const credentials: LoginRequest = {
      email: "test@example.com",
      password: "Password1!",
    }

    it("should validate credentials before attempting login", async () => {
      vi.mocked(
        authRepository.authenticateUserWithEmailAndPassword,
      ).mockResolvedValue({
        success: true,
        token: mockToken,
        user: mockUser,
      })

      await authService.loginUser(credentials)

      expect(authValidation.validateLoginData).toHaveBeenCalledWith(credentials)
    })

    it("should return validation errors if credentials are invalid", async () => {
      vi.mocked(authValidation.validateLoginData).mockReturnValue({
        isValid: false,
        errors: [{ field: "email", message: "Invalid email" }],
      })

      const result = await authService.loginUser(credentials)

      expect(result.success).toBe(false)
      expect(result.message).toContain("Invalid email")
      expect(
        authRepository.authenticateUserWithEmailAndPassword,
      ).not.toHaveBeenCalled()
    })

    it("should call repository login and persist session on success", async () => {
      vi.mocked(
        authRepository.authenticateUserWithEmailAndPassword,
      ).mockResolvedValue({
        success: true,
        token: mockToken,
        user: mockUser,
      })

      const result = await authService.loginUser(credentials)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.user).toEqual(mockUser)
      }
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "user",
        JSON.stringify(mockUser),
      )
    })

    it("should handle repository login failure", async () => {
      vi.mocked(
        authRepository.authenticateUserWithEmailAndPassword,
      ).mockResolvedValue({
        success: false,
        message: "Invalid credentials",
      })

      const result = await authService.loginUser(credentials)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Invalid credentials")
    })

    it("should catch and handle unexpected errors", async () => {
      vi.mocked(
        authRepository.authenticateUserWithEmailAndPassword,
      ).mockRejectedValue(new Error("Network error"))

      const result = await authService.loginUser(credentials)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Network error")
    })

    it("should return fallback message for non-error login failures", async () => {
      vi.mocked(
        authRepository.authenticateUserWithEmailAndPassword,
      ).mockRejectedValue("unexpected")

      const result = await authService.loginUser(credentials)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Login failed")
    })
  })

  describe("registerUser", () => {
    const registrationData: RegisterRequest = {
      email: "new@example.com",
      password: "Password1!",
      confirmPassword: "Password1!",
      firstName: "New",
      lastName: "User",
      role: "student",
    }

    it("should return validation errors if data is invalid", async () => {
      vi.mocked(authValidation.validateRegistrationData).mockReturnValue({
        isValid: false,
        errors: [{ field: "password", message: "Password too short" }],
      })

      const result = await authService.registerUser(registrationData)

      expect(result.success).toBe(false)
      expect(result.message).toContain("Password too short")
      expect(authRepository.registerNewUserAccount).not.toHaveBeenCalled()
    })

    it("should call repository register and persist session on success", async () => {
      vi.mocked(authRepository.registerNewUserAccount).mockResolvedValue({
        success: true,
        token: mockToken,
        user: mockUser,
      })

      const result = await authService.registerUser(registrationData)

      expect(result.success).toBe(true)
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "user",
        JSON.stringify(mockUser),
      )
    })

    it("should handle repository registration failure", async () => {
      vi.mocked(authRepository.registerNewUserAccount).mockResolvedValue({
        success: false,
        message: "Email already exists",
      })

      const result = await authService.registerUser(registrationData)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Email already exists")
    })

    it("should not persist session when response is success but user payload is missing", async () => {
      vi.mocked(authRepository.registerNewUserAccount).mockResolvedValue({
        success: true,
        token: mockToken,
      } as any)

      const result = await authService.registerUser(registrationData)

      expect(result.success).toBe(true)
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it("should return fallback message for non-error registration failures", async () => {
      vi.mocked(authRepository.registerNewUserAccount).mockRejectedValue("fail")

      const result = await authService.registerUser(registrationData)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Registration failed")
    })

    it("should return error message for Error registration failures", async () => {
      vi.mocked(authRepository.registerNewUserAccount).mockRejectedValue(
        new Error("Registration service unavailable"),
      )

      const result = await authService.registerUser(registrationData)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Registration service unavailable")
    })
  })

  describe("logoutUser", () => {
    it("should call repository logout and clear local storage", async () => {
      vi.mocked(
        authRepository.signOutCurrentUserAndClearSession,
      ).mockResolvedValue(undefined) // Fixed: logout returns void

      await authService.logoutUser()

      expect(
        authRepository.signOutCurrentUserAndClearSession,
      ).toHaveBeenCalled()
      expect(mockStorage.removeItem).toHaveBeenCalledWith("user")
    })

    it("should clear local storage even if repository logout fails", async () => {
      vi.mocked(
        authRepository.signOutCurrentUserAndClearSession,
      ).mockRejectedValue(new Error("Network error"))

      await expect(authService.logoutUser()).rejects.toThrow("Network error")

      expect(mockStorage.removeItem).toHaveBeenCalledWith("user")
    })
  })

  describe("getAuthToken", () => {
    it("should return token from repository session", async () => {
      // Fixed: match getSession return type { session, error }
      vi.mocked(
        authRepository.getCurrentAuthenticationSession,
      ).mockResolvedValue({
        session: { access_token: "token" } as any,
        error: null,
      })

      const token = await authService.getAuthToken()
      expect(token).toBe("token")
    })

    it("should return null if no session", async () => {
      vi.mocked(
        authRepository.getCurrentAuthenticationSession,
      ).mockResolvedValue({
        session: null,
        error: { message: "no session" } as AuthError, // using AuthError type or casting
      })

      const token = await authService.getAuthToken()
      expect(token).toBeNull()
    })
  })

  describe("isAuthenticated", () => {
    it("should reflect auth store state", () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true })
      expect(authService.isAuthenticated()).toBe(true)

      useAuthStore.setState({ user: null, isAuthenticated: false })
      expect(authService.isAuthenticated()).toBe(false)
    })
  })

  describe("verifySession", () => {
    it("should return true if token is valid locally and verified by repository", async () => {
      vi.mocked(
        authRepository.getCurrentAuthenticationSession,
      ).mockResolvedValue({
        session: { access_token: "token" } as any,
        error: null,
      })
      vi.mocked(authRepository.validateAuthenticationToken).mockResolvedValue(
        true,
      )

      const isValid = await authService.verifySession()
      expect(isValid).toBe(true)
    })

    it("should return false and clear session if no token", async () => {
      vi.mocked(
        authRepository.getCurrentAuthenticationSession,
      ).mockResolvedValue({
        session: null,
        error: { message: "no session" } as AuthError,
      })

      const isValid = await authService.verifySession()
      expect(isValid).toBe(false)
      expect(mockStorage.removeItem).toHaveBeenCalledWith("user")
    })

    it("should clear session when repository validation returns false", async () => {
      vi.mocked(
        authRepository.getCurrentAuthenticationSession,
      ).mockResolvedValue({
        session: { access_token: "token" } as any,
        error: null,
      })
      vi.mocked(authRepository.validateAuthenticationToken).mockResolvedValue(
        false,
      )

      const isValid = await authService.verifySession()

      expect(isValid).toBe(false)
      expect(mockStorage.removeItem).toHaveBeenCalledWith("user")
    })

    it("should clear session when token verification throws", async () => {
      vi.mocked(
        authRepository.getCurrentAuthenticationSession,
      ).mockResolvedValue({
        session: { access_token: "token" } as any,
        error: null,
      })
      vi.mocked(authRepository.validateAuthenticationToken).mockRejectedValue(
        new Error("Verification failed"),
      )

      const isValid = await authService.verifySession()

      expect(isValid).toBe(false)
      expect(mockStorage.removeItem).toHaveBeenCalledWith("user")
    })
  })

  describe("requestPasswordReset", () => {
    const request: any = { email: "test@example.com" }

    it("should validate email", async () => {
      vi.mocked(authValidation.validateEmail).mockReturnValue("Invalid email")
      const result = await authService.requestPasswordReset(request)
      expect(result.success).toBe(false)
      expect(result.message).toBe("Invalid email")
    })

    it("should call repository forgotPassword", async () => {
      vi.mocked(authRepository.initiatePasswordResetForEmail).mockResolvedValue(
        {
          success: true,
          message: "Email sent",
        },
      )
      const result = await authService.requestPasswordReset(request)
      expect(result.success).toBe(true)
      expect(authRepository.initiatePasswordResetForEmail).toHaveBeenCalledWith(
        request.email,
      )
    })

    it("should return fallback error message for non-error throwables", async () => {
      vi.mocked(authRepository.initiatePasswordResetForEmail).mockRejectedValue(
        "unexpected",
      )

      const result = await authService.requestPasswordReset(request)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Failed to process request")
    })

    it("should return thrown error message for Error instances", async () => {
      vi.mocked(authRepository.initiatePasswordResetForEmail).mockRejectedValue(
        new Error("Rate limit exceeded"),
      )

      const result = await authService.requestPasswordReset(request)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Rate limit exceeded")
    })
  })

  describe("resetPassword", () => {
    const request: ResetPasswordRequest = {
      newPassword: "NewPassword1!",
      confirmPassword: "NewPassword1!",
    }

    it("should validate password match", async () => {
      vi.mocked(authValidation.validatePasswordsMatch).mockReturnValue(
        "Passwords do not match",
      )
      const result = await authService.resetPassword(request)
      expect(result.success).toBe(false)
      expect(result.message).toBe("Passwords do not match")
    })

    it("should return password validation error before calling repository", async () => {
      vi.mocked(authValidation.validatePassword).mockReturnValue(
        "Password must be at least 8 characters long",
      )

      const result = await authService.resetPassword(request)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Password must be at least 8 characters long")
      expect(authRepository.resetUserPasswordWithNewValue).not.toHaveBeenCalled()
    })

    it("should handle invalid link/session error from repository", async () => {
      // Fixed: match resetPassword return type structure
      vi.mocked(authRepository.resetUserPasswordWithNewValue).mockResolvedValue(
        {
          session: null,
          sessionError: { message: "Invalid session" } as any,
          updateError: null,
          signOutError: null,
        },
      )

      const result = await authService.resetPassword(request)
      expect(result.success).toBe(false)
      expect(result.message).toContain("Invalid or expired reset link")
    })

    it("should handle update error (weak password)", async () => {
      vi.mocked(authRepository.resetUserPasswordWithNewValue).mockResolvedValue(
        {
          session: { access_token: "token" } as any,
          sessionError: null,
          updateError: { message: "Weak password" } as any,
          signOutError: null,
        },
      )

      const result = await authService.resetPassword(request)
      expect(result.success).toBe(false)
      expect(result.message).toContain(
        "Password does not meet security requirements",
      )
    })

    it("should return invalid-link message for token-related update errors", async () => {
      vi.mocked(authRepository.resetUserPasswordWithNewValue).mockResolvedValue(
        {
          session: { access_token: "token" } as any,
          sessionError: null,
          updateError: { message: "Token expired" } as any,
          signOutError: null,
        },
      )

      const result = await authService.resetPassword(request)

      expect(result.success).toBe(false)
      expect(result.message).toContain("Invalid or expired reset link")
    })

    it("should return repository update message for non-token non-weak failures", async () => {
      vi.mocked(authRepository.resetUserPasswordWithNewValue).mockResolvedValue(
        {
          session: { access_token: "token" } as any,
          sessionError: null,
          updateError: { message: "Update failed" } as any,
          signOutError: null,
        },
      )

      const result = await authService.resetPassword(request)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Update failed")
    })

    it("should classify password-requirement errors as security failures", async () => {
      vi.mocked(authRepository.resetUserPasswordWithNewValue).mockResolvedValue(
        {
          session: { access_token: "token" } as any,
          sessionError: null,
          updateError: { message: "Password requirement not met" } as any,
          signOutError: null,
        },
      )

      const result = await authService.resetPassword(request)

      expect(result.success).toBe(false)
      expect(result.message).toContain("security requirements")
    })

    it("should return default update message when repository provides empty message", async () => {
      vi.mocked(authRepository.resetUserPasswordWithNewValue).mockResolvedValue(
        {
          session: { access_token: "token" } as any,
          sessionError: null,
          updateError: { message: "" } as any,
          signOutError: null,
        },
      )

      const result = await authService.resetPassword(request)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Failed to reset password. Please try again.")
    })

    it("should succeed when all steps pass", async () => {
      vi.mocked(authRepository.resetUserPasswordWithNewValue).mockResolvedValue(
        {
          session: { access_token: "token" } as any,
          sessionError: null,
          updateError: null,
          signOutError: null,
        },
      )

      const result = await authService.resetPassword(request)
      expect(result.success).toBe(true)
    })

    it("should return fallback message for non-error reset failures", async () => {
      vi.mocked(authRepository.resetUserPasswordWithNewValue).mockRejectedValue(
        "unexpected",
      )

      const result = await authService.resetPassword(request)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Failed to reset password")
    })

    it("should return thrown error message for Error reset failures", async () => {
      vi.mocked(authRepository.resetUserPasswordWithNewValue).mockRejectedValue(
        new Error("Reset unavailable"),
      )

      const result = await authService.resetPassword(request)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Reset unavailable")
    })
  })

  describe("changePassword", () => {
    const request: ChangePasswordRequest = {
      currentPassword: "OldPassword1!",
      newPassword: "NewPassword1!",
      confirmPassword: "NewPassword1!",
    }

    it("should enforce login check", async () => {
      // mockLocalStorage is already empty from beforeEach, so getCurrentUser returns null
      const result = await authService.changePassword(request)
      expect(result.success).toBe(false)
      expect(result.message).toContain("must be logged in")
    })

    it("should call repository changePassword", async () => {
      // Pre-populate Zustand store with user
      useAuthStore.setState({ user: mockUser, isAuthenticated: true })
      // Fixed: match changePassword return type structure
      vi.mocked(
        authRepository.changeAuthenticatedUserPassword,
      ).mockResolvedValue({
        signInError: null,
        updateError: null,
      })

      const result = await authService.changePassword(request)
      expect(result.success).toBe(true)
      expect(
        authRepository.changeAuthenticatedUserPassword,
      ).toHaveBeenCalledWith(
        mockUser.email,
        request.currentPassword,
        request.newPassword,
      )
    })

    it("should return validation error when new password is weak", async () => {
      vi.mocked(authValidation.validatePassword).mockReturnValue(
        "Password must contain at least one uppercase letter",
      )

      const result = await authService.changePassword(request)

      expect(result.success).toBe(false)
      expect(result.message).toBe(
        "Password must contain at least one uppercase letter",
      )
      expect(authRepository.changeAuthenticatedUserPassword).not.toHaveBeenCalled()
    })

    it("should return mismatch error when passwords differ", async () => {
      vi.mocked(authValidation.validatePasswordsMatch).mockReturnValue(
        "Passwords do not match",
      )

      const result = await authService.changePassword(request)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Passwords do not match")
      expect(authRepository.changeAuthenticatedUserPassword).not.toHaveBeenCalled()
    })

    it("should return current-password error when sign in verification fails", async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true })
      vi.mocked(
        authRepository.changeAuthenticatedUserPassword,
      ).mockResolvedValue({
        signInError: { message: "Invalid login credentials" } as any,
        updateError: null,
      })

      const result = await authService.changePassword(request)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Current password is incorrect.")
    })

    it("should return strong-password message for weak update errors", async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true })
      vi.mocked(
        authRepository.changeAuthenticatedUserPassword,
      ).mockResolvedValue({
        signInError: null,
        updateError: { message: "Password is too weak" } as any,
      })

      const result = await authService.changePassword(request)

      expect(result.success).toBe(false)
      expect(result.message).toContain("security requirements")
    })

    it("should return strong-password message when update error mentions password only", async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true })
      vi.mocked(
        authRepository.changeAuthenticatedUserPassword,
      ).mockResolvedValue({
        signInError: null,
        updateError: { message: "Password policy violation" } as any,
      })

      const result = await authService.changePassword(request)

      expect(result.success).toBe(false)
      expect(result.message).toContain("security requirements")
    })

    it("should surface generic update errors when password policy does not match", async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true })
      vi.mocked(
        authRepository.changeAuthenticatedUserPassword,
      ).mockResolvedValue({
        signInError: null,
        updateError: { message: "Unexpected update failure" } as any,
      })

      const result = await authService.changePassword(request)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Unexpected update failure")
    })

    it("should return fallback message for non-error throwables", async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true })
      vi.mocked(authRepository.changeAuthenticatedUserPassword).mockRejectedValue(
        "unexpected",
      )

      const result = await authService.changePassword(request)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Failed to change password")
    })

    it("should return default update message when repository message is empty", async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true })
      vi.mocked(
        authRepository.changeAuthenticatedUserPassword,
      ).mockResolvedValue({
        signInError: null,
        updateError: { message: "" } as any,
      })

      const result = await authService.changePassword(request)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Failed to change password. Please try again.")
    })

    it("should return thrown error message for Error instances", async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true })
      vi.mocked(authRepository.changeAuthenticatedUserPassword).mockRejectedValue(
        new Error("Change password unavailable"),
      )

      const result = await authService.changePassword(request)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Change password unavailable")
    })
  })

  describe("deleteAccount", () => {
    const request: DeleteAccountRequest = {
      confirmation: "DELETE",
      password: "Password1!",
    }

    it("should validate confirmation string", async () => {
      const result = await authService.deleteAccount({
        ...request,
        confirmation: "NO",
      })
      expect(result.success).toBe(false)
      expect(result.message).toContain("type DELETE")
    })

    it("should call repository deleteAccount", async () => {
      // Pre-populate Zustand store with user
      useAuthStore.setState({ user: mockUser, isAuthenticated: true })
      // Fixed: match deleteAccount return type structure
      vi.mocked(
        authRepository.deleteUserAccountWithVerification,
      ).mockResolvedValue({
        signInError: null,
        deleteError: null,
        signOutError: null,
      })

      const result = await authService.deleteAccount(request)
      expect(result.success).toBe(true)
      expect(
        authRepository.deleteUserAccountWithVerification,
      ).toHaveBeenCalledWith(mockUser.email, request.password)
    })

    it("should reject missing password", async () => {
      const result = await authService.deleteAccount({
        ...request,
        password: "   ",
      })

      expect(result.success).toBe(false)
      expect(result.message).toBe("Password is required to delete your account")
      expect(authRepository.deleteUserAccountWithVerification).not.toHaveBeenCalled()
    })

    it("should reject deletion when user is not logged in", async () => {
      useAuthStore.setState({ user: null, isAuthenticated: false })

      const result = await authService.deleteAccount(request)

      expect(result.success).toBe(false)
      expect(result.message).toBe("You must be logged in to delete your account")
      expect(authRepository.deleteUserAccountWithVerification).not.toHaveBeenCalled()
    })

    it("should return password error when account verification fails", async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true })
      vi.mocked(
        authRepository.deleteUserAccountWithVerification,
      ).mockResolvedValue({
        signInError: { message: "Invalid credentials" } as any,
        deleteError: null,
        signOutError: null,
      })

      const result = await authService.deleteAccount(request)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Password is incorrect.")
    })

    it("should surface delete errors from repository", async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true })
      vi.mocked(
        authRepository.deleteUserAccountWithVerification,
      ).mockResolvedValue({
        signInError: null,
        deleteError: "Delete failed",
      })

      const result = await authService.deleteAccount(request)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Delete failed")
    })

    it("should return fallback message for non-error throwables", async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true })
      vi.mocked(authRepository.deleteUserAccountWithVerification).mockRejectedValue(
        "unexpected",
      )

      const result = await authService.deleteAccount(request)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Failed to delete account")
    })

    it("should return thrown error message for Error instances", async () => {
      useAuthStore.setState({ user: mockUser, isAuthenticated: true })
      vi.mocked(authRepository.deleteUserAccountWithVerification).mockRejectedValue(
        new Error("Deletion unavailable"),
      )

      const result = await authService.deleteAccount(request)

      expect(result.success).toBe(false)
      expect(result.message).toBe("Deletion unavailable")
    })
  })

  describe("initializeResetFlow", () => {
    it("should return repository reset-flow state", async () => {
      const resetFlowResponse: ResetFlowResponse = {
        success: true,
        message: "Reset session ready",
      }
      vi.mocked(authRepository.initializePasswordResetFlowFromUrl).mockResolvedValue(
        resetFlowResponse,
      )

      const result = await authService.initializeResetFlow()

      expect(result).toEqual(resetFlowResponse)
    })

    it("should return fallback message for non-error throwables", async () => {
      vi.mocked(authRepository.initializePasswordResetFlowFromUrl).mockRejectedValue(
        "unexpected",
      )

      const result = await authService.initializeResetFlow()

      expect(result.success).toBe(false)
      expect(result.message).toBe("Failed to initialize reset session")
    })

    it("should return thrown error message for Error instances", async () => {
      vi.mocked(authRepository.initializePasswordResetFlowFromUrl).mockRejectedValue(
        new Error("Reset flow init failed"),
      )

      const result = await authService.initializeResetFlow()

      expect(result.success).toBe(false)
      expect(result.message).toBe("Reset flow init failed")
    })
  })
})
