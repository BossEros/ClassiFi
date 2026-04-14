import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { AuthService } from "../../src/modules/auth/auth.service.js"
import { UserRepository } from "../../src/modules/users/user.repository.js"
import { SupabaseAuthAdapter } from "../../src/services/supabase-auth.adapter.js"
import type { IEmailService } from "../../src/services/interfaces/email.interface.js"
import type { NotificationService } from "../../src/modules/notifications/notification.service.js"
import { createMockUser, createMockTeacher } from "../utils/factories.js"
import {
  UserAlreadyExistsError,
  InvalidCredentialsError,
  UserNotFoundError,
  EmailNotVerifiedError,
  InvalidRoleError,
} from "../../src/shared/errors.js"

// Mock the UserRepository class but preserve USER_ROLES constant
vi.mock(
  "../../src/modules/users/user.repository.js",
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import("../../src/modules/users/user.repository.js")
      >()
    return {
      ...original,
      UserRepository: vi.fn(),
    }
  },
)
// Mock the SupabaseAuthAdapter
vi.mock("../../src/services/supabase-auth.adapter.js")
// Mock config
vi.mock("../../src/shared/config.js", () => ({
  settings: {
    frontendUrl: "http://localhost:3000",
  },
}))

describe("AuthService", () => {
  let authService: AuthService
  let mockUserRepo: any
  let mockAuthAdapter: any
  let mockEmailService: IEmailService
  let mockNotificationService: NotificationService

  beforeEach(() => {
    vi.clearAllMocks()

    mockUserRepo = {
      checkEmailExists: vi.fn(),
      createUser: vi.fn(),
      getUserBySupabaseId: vi.fn(),
      getUserByEmail: vi.fn(),
      getUsersByRole: vi.fn().mockResolvedValue([]),
    }

    mockAuthAdapter = {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      getUser: vi.fn(),
      getAdminUserById: vi.fn(),
      generatePasswordRecoveryLink: vi.fn(),
      deleteUser: vi.fn(),
    }

    mockEmailService = {
      sendEmail: vi.fn().mockResolvedValue(undefined),
    }

    mockNotificationService = {
      createNotification: vi.fn(),
      sendEmailNotificationIfEnabled: vi.fn(),
    } as unknown as NotificationService

    authService = new AuthService(
      mockUserRepo as UserRepository,
      mockAuthAdapter as SupabaseAuthAdapter,
      mockEmailService,
      mockNotificationService,
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  // ============ registerUser Tests ============
  describe("registerUser", () => {
    const validRegistration = {
      email: "new@example.com",
      password: "password123",
      firstName: "New",
      lastName: "User",
      role: "student",
    }

    it("should successfully register a new user", async () => {
      const mockUser = createMockUser({
        email: validRegistration.email,
      })
      const supabaseUserId = "new-supabase-id"
      const accessToken = "test-access-token"

      mockUserRepo.checkEmailExists.mockResolvedValue(false)
      mockUserRepo.createUser.mockResolvedValue(mockUser)

      mockAuthAdapter.signUp.mockResolvedValue({
        user: { id: supabaseUserId },
        token: accessToken,
      })
      mockAuthAdapter.getAdminUserById.mockResolvedValue({
        id: supabaseUserId,
        email: validRegistration.email,
      })

      const result = await authService.registerUser(validRegistration)

      expect(result.userData.email).toBe(validRegistration.email)
      expect(result.token).toBe(accessToken)
      expect(mockUserRepo.createUser).toHaveBeenCalledWith({
        supabaseUserId,
        email: validRegistration.email,
        firstName: validRegistration.firstName,
        lastName: validRegistration.lastName,
        role: validRegistration.role,
      })
      expect(mockAuthAdapter.signUp).toHaveBeenCalledWith(
        validRegistration.email,
        validRegistration.password,
        {
          metadata: {
            first_name: validRegistration.firstName,
            last_name: validRegistration.lastName,
            role: validRegistration.role,
          },
          emailRedirectTo: "http://localhost:3000/login",
        },
      )
    })

    it("should throw UserAlreadyExistsError if email exists", async () => {
      mockUserRepo.checkEmailExists.mockResolvedValue(true)

      await expect(
        authService.registerUser({
          ...validRegistration,
          email: "existing@example.com",
        }),
      ).rejects.toThrow(UserAlreadyExistsError)

      expect(mockAuthAdapter.signUp).not.toHaveBeenCalled()
    })

    it("should throw InvalidRoleError for unsupported roles", async () => {
      const invalidRoleRegistration = {
        ...validRegistration,
        role: "admin",
      } as unknown as Parameters<AuthService["registerUser"]>[0]

      await expect(
        authService.registerUser(invalidRoleRegistration),
      ).rejects.toThrow(InvalidRoleError)

      expect(mockUserRepo.checkEmailExists).not.toHaveBeenCalled()
      expect(mockAuthAdapter.signUp).not.toHaveBeenCalled()
    })

    it("should throw error when Supabase signup fails", async () => {
      mockUserRepo.checkEmailExists.mockResolvedValue(false)
      mockAuthAdapter.signUp.mockRejectedValue(
        new Error("Supabase error occurred"),
      )

      await expect(authService.registerUser(validRegistration)).rejects.toThrow(
        "Supabase error occurred",
      )
    })

    it("should throw error when Supabase returns no user", async () => {
      mockUserRepo.checkEmailExists.mockResolvedValue(false)
      mockAuthAdapter.signUp.mockResolvedValue({ user: null, token: null })

      await expect(authService.registerUser(validRegistration)).rejects.toThrow(
        "Failed to create Supabase user",
      )
    })

    it("should rollback Supabase user when database insert fails", async () => {
      const supabaseUserId = "temp-supabase-id"
      mockUserRepo.checkEmailExists.mockResolvedValue(false)
      mockUserRepo.createUser.mockRejectedValue(
        new Error("Database insert failed"),
      )

      mockAuthAdapter.signUp.mockResolvedValue({
        user: { id: supabaseUserId },
        token: "token",
      })
      mockAuthAdapter.getAdminUserById.mockResolvedValue({
        id: supabaseUserId,
        email: validRegistration.email,
      })

      await expect(authService.registerUser(validRegistration)).rejects.toThrow(
        "Database insert failed",
      )

      expect(mockAuthAdapter.deleteUser).toHaveBeenCalledWith(supabaseUserId)
    })

    it("should still throw original error even if rollback fails", async () => {
      const supabaseUserId = "temp-supabase-id"
      mockUserRepo.checkEmailExists.mockResolvedValue(false)
      mockUserRepo.createUser.mockRejectedValue(
        new Error("Database insert failed"),
      )
      mockAuthAdapter.deleteUser.mockRejectedValue(new Error("Rollback failed"))

      mockAuthAdapter.signUp.mockResolvedValue({
        user: { id: supabaseUserId },
        token: "token",
      })
      mockAuthAdapter.getAdminUserById.mockResolvedValue({
        id: supabaseUserId,
        email: validRegistration.email,
      })

      await expect(authService.registerUser(validRegistration)).rejects.toThrow(
        "Database insert failed",
      )
    })

    it("should map unique-email database violation to UserAlreadyExistsError", async () => {
      mockUserRepo.checkEmailExists.mockResolvedValue(false)
      mockUserRepo.createUser.mockRejectedValue({
        code: "23505",
        constraint: "users_email_unique",
      })
      mockAuthAdapter.signUp.mockResolvedValue({
        user: { id: "supabase-unique-email" },
        token: "token",
      })
      mockAuthAdapter.getAdminUserById.mockResolvedValue({
        id: "supabase-unique-email",
        email: validRegistration.email,
      })

      await expect(authService.registerUser(validRegistration)).rejects.toThrow(
        UserAlreadyExistsError,
      )
      expect(mockAuthAdapter.deleteUser).toHaveBeenCalledWith(
        "supabase-unique-email",
      )
    })

    it("should retry local user creation when supabase user foreign key is not ready yet", async () => {
      const mockUser = createMockUser({
        email: validRegistration.email,
      })
      const supabaseUserId = "eventual-consistency-id"

      mockUserRepo.checkEmailExists.mockResolvedValue(false)
      mockUserRepo.createUser
        .mockRejectedValueOnce({
          code: "23503",
          constraint: "fk_users_supabase_user_id",
        })
        .mockResolvedValueOnce(mockUser)
      mockAuthAdapter.signUp.mockResolvedValue({
        user: { id: supabaseUserId },
        token: null,
      })
      mockAuthAdapter.getAdminUserById.mockResolvedValue({
        id: supabaseUserId,
        email: validRegistration.email,
      })

      const result = await authService.registerUser(validRegistration)

      expect(result.userData.email).toBe(validRegistration.email)
      expect(mockUserRepo.createUser).toHaveBeenCalledTimes(2)
      expect(mockAuthAdapter.getAdminUserById).toHaveBeenCalledWith(
        supabaseUserId,
      )
      expect(mockAuthAdapter.deleteUser).not.toHaveBeenCalled()
    })

    it("should reject obfuscated signup users for existing auth emails", async () => {
      vi.useFakeTimers()

      try {
        const obfuscatedSupabaseUserId = "obfuscated-auth-user-id"
        mockUserRepo.checkEmailExists.mockResolvedValue(false)
        mockAuthAdapter.signUp.mockResolvedValue({
          user: { id: obfuscatedSupabaseUserId },
          token: null,
        })
        mockAuthAdapter.getAdminUserById.mockResolvedValue(null)

        const registrationPromise = authService.registerUser(validRegistration)
        const registrationRejectionExpectation = expect(
          registrationPromise,
        ).rejects.toThrow(UserAlreadyExistsError)

        await vi.runAllTimersAsync()
        await registrationRejectionExpectation

        expect(mockUserRepo.createUser).not.toHaveBeenCalled()
        expect(mockAuthAdapter.deleteUser).not.toHaveBeenCalled()
      } finally {
        vi.useRealTimers()
      }
    })

    it("should return null token when session is not provided", async () => {
      const mockUser = createMockUser()
      mockUserRepo.checkEmailExists.mockResolvedValue(false)
      mockUserRepo.createUser.mockResolvedValue(mockUser)

      mockAuthAdapter.signUp.mockResolvedValue({
        user: { id: "supabase-id" },
        token: null,
      })
      mockAuthAdapter.getAdminUserById.mockResolvedValue({
        id: "supabase-id",
        email: validRegistration.email,
      })

      const result = await authService.registerUser(validRegistration)

      expect(result.token).toBeNull()
    })

    it("should use the configured frontend login route for signup emails", async () => {
      const mockUser = createMockUser({
        email: validRegistration.email,
      })

      mockUserRepo.checkEmailExists.mockResolvedValue(false)
      mockUserRepo.createUser.mockResolvedValue(mockUser)
      mockAuthAdapter.signUp.mockResolvedValue({
        user: { id: "signup-redirect-user-id" },
        token: null,
      })
      mockAuthAdapter.getAdminUserById.mockResolvedValue({
        id: "signup-redirect-user-id",
        email: validRegistration.email,
      })

      await authService.registerUser(validRegistration)

      expect(mockAuthAdapter.signUp).toHaveBeenCalledWith(
        validRegistration.email,
        validRegistration.password,
        expect.objectContaining({
          emailRedirectTo: "http://localhost:3000/login",
        }),
      )
    })

    it("should work for teacher role", async () => {
      const mockTeacher = createMockTeacher()
      mockUserRepo.checkEmailExists.mockResolvedValue(false)
      mockUserRepo.createUser.mockResolvedValue(mockTeacher)

      mockAuthAdapter.signUp.mockResolvedValue({
        user: { id: "teacher-supabase-id" },
        token: "token",
      })

      const result = await authService.registerUser({
        email: "teacher@example.com",
        password: "password123",
        firstName: "Test",
        lastName: "Teacher",
        role: "teacher",
      })

      expect(result.userData.role).toBe("teacher")
    })
  })

  // ============ loginUser Tests ============
  describe("loginUser", () => {
    const validCredentials = {
      email: "test@example.com",
      password: "password123",
    }

    it("should successfully login a user", async () => {
      const mockUser = createMockUser()
      const supabaseUserId = "supabase-id"
      const accessToken = "test-access-token"

      mockAuthAdapter.signInWithPassword.mockResolvedValue({
        accessToken,
        user: { id: supabaseUserId },
      })
      mockUserRepo.getUserBySupabaseId.mockResolvedValue(mockUser)

      const result = await authService.loginUser(
        validCredentials.email,
        validCredentials.password,
      )

      expect(result.userData.email).toBe(mockUser.email)
      expect(result.token).toBe(accessToken)
      expect(mockAuthAdapter.signInWithPassword).toHaveBeenCalledWith(
        validCredentials.email,
        validCredentials.password,
      )
    })

    it("should throw InvalidCredentialsError for wrong password", async () => {
      mockAuthAdapter.signInWithPassword.mockRejectedValue(
        new InvalidCredentialsError(),
      )

      await expect(
        authService.loginUser(validCredentials.email, "wrongpassword"),
      ).rejects.toThrow(InvalidCredentialsError)
    })

    it("should throw EmailNotVerifiedError when email is not confirmed", async () => {
      mockAuthAdapter.signInWithPassword.mockRejectedValue(
        new EmailNotVerifiedError(),
      )

      await expect(
        authService.loginUser(
          validCredentials.email,
          validCredentials.password,
        ),
      ).rejects.toThrow(EmailNotVerifiedError)
    })

    it("should throw InvalidCredentialsError when Supabase returns no user", async () => {
      mockAuthAdapter.signInWithPassword.mockResolvedValue({
        accessToken: "token",
        user: null,
      })

      await expect(
        authService.loginUser(
          validCredentials.email,
          validCredentials.password,
        ),
      ).rejects.toThrow(InvalidCredentialsError)
    })

    it("should throw UserNotFoundError when user not in local database", async () => {
      mockAuthAdapter.signInWithPassword.mockResolvedValue({
        accessToken: "token",
        user: { id: "orphan-supabase-id" },
      })
      mockUserRepo.getUserBySupabaseId.mockResolvedValue(undefined)

      await expect(
        authService.loginUser(
          validCredentials.email,
          validCredentials.password,
        ),
      ).rejects.toThrow(UserNotFoundError)
    })
  })

  // ============ verifyToken Tests ============
  describe("verifyToken", () => {
    it("should return user data for valid token", async () => {
      const mockUser = createMockUser()

      mockAuthAdapter.getUser.mockResolvedValue({ id: "supabase-id" })
      mockUserRepo.getUserBySupabaseId.mockResolvedValue(mockUser)

      const result = await authService.verifyToken("valid-token")

      expect(result.id).toBe(mockUser.id)
      expect(result.email).toBe(mockUser.email)
      expect(mockAuthAdapter.getUser).toHaveBeenCalledWith("valid-token")
    })

    it("should throw InvalidCredentialsError for invalid token", async () => {
      mockAuthAdapter.getUser.mockResolvedValue(null)

      await expect(authService.verifyToken("invalid-token")).rejects.toThrow(
        InvalidCredentialsError,
      )
    })

    it("should throw UserNotFoundError when user not in local database", async () => {
      mockAuthAdapter.getUser.mockResolvedValue({ id: "orphan-supabase-id" })
      mockUserRepo.getUserBySupabaseId.mockResolvedValue(undefined)

      await expect(
        authService.verifyToken("valid-token-orphan-user"),
      ).rejects.toThrow(UserNotFoundError)
    })
  })

  // ============ requestPasswordReset Tests ============
  describe("requestPasswordReset", () => {
    it("should generate a recovery link and send the reset email", async () => {
      const email = "reset@example.com"
      mockUserRepo.getUserByEmail.mockResolvedValue(createMockUser({ email }))
      mockAuthAdapter.generatePasswordRecoveryLink.mockResolvedValue({
        actionLink: "http://localhost:3000/reset-password?token=abc",
      })

      await authService.requestPasswordReset(email)

      expect(mockAuthAdapter.generatePasswordRecoveryLink).toHaveBeenCalledWith(
        email,
        "http://localhost:3000/reset-password",
      )
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: "Reset Your Password",
          html: expect.stringContaining("Reset Your Password"),
        }),
      )
    })

    it("should not throw error even if email does not exist (security)", async () => {
      const email = "nonexistent@example.com"
      mockUserRepo.getUserByEmail.mockResolvedValue(undefined)

      await expect(
        authService.requestPasswordReset(email),
      ).resolves.not.toThrow()

      expect(
        mockAuthAdapter.generatePasswordRecoveryLink,
      ).not.toHaveBeenCalled()
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled()
    })

    it("should propagate link generation errors", async () => {
      const email = "error@example.com"
      mockUserRepo.getUserByEmail.mockResolvedValue(createMockUser({ email }))
      mockAuthAdapter.generatePasswordRecoveryLink.mockRejectedValue(
        new Error("Rate limit exceeded"),
      )

      await expect(authService.requestPasswordReset(email)).rejects.toThrow(
        "Rate limit exceeded",
      )
    })
  })
})
