/**
 * TC-005: Password Reset Request
 *
 * Module: Authentication
 * Unit: Password Reset
 * Date Tested: 3/28/26
 * Description: Verify that a password reset request is sent.
 * Expected Result: Password reset email is triggered.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-005 Unit Test Pass - Password Reset Request Triggered
 * Suggested Figure Title (System UI): Authentication UI - Forgot Password Form
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { AuthService } from "../../backend-ts/src/modules/auth/auth.service.js"
import { UserRepository } from "../../backend-ts/src/modules/users/user.repository.js"
import { SupabaseAuthAdapter } from "../../backend-ts/src/services/supabase-auth.adapter.js"

vi.mock("../../backend-ts/src/modules/users/user.repository.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../backend-ts/src/modules/users/user.repository.js")>()
  return { ...original, UserRepository: vi.fn() }
})
vi.mock("../../backend-ts/src/services/supabase-auth.adapter.js")
vi.mock("../../backend-ts/src/shared/config.js", () => ({
  settings: { frontendUrl: "http://localhost:3000" },
}))

describe("TC-005: Password Reset Request", () => {
  let authService: AuthService
  let mockUserRepo: any
  let mockAuthAdapter: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockUserRepo = {
      checkEmailExists: vi.fn(),
      createUser: vi.fn(),
      getUserBySupabaseId: vi.fn(),
    }
    mockAuthAdapter = {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      getUser: vi.fn(),
      getAdminUserById: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      deleteUser: vi.fn(),
    }
    authService = new AuthService(
      mockUserRepo as UserRepository,
      mockAuthAdapter as SupabaseAuthAdapter,
      { createNotification: vi.fn(), sendEmailNotificationIfEnabled: vi.fn(), withContext: vi.fn().mockReturnThis() } as any,
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it("should call Supabase with correct parameters", async () => {
    const email = "reset@example.com"
    mockAuthAdapter.resetPasswordForEmail.mockResolvedValue(undefined)

    await authService.requestPasswordReset(email)

    expect(mockAuthAdapter.resetPasswordForEmail).toHaveBeenCalledWith(
      email,
      "http://localhost:3000/reset-password",
    )
  })

  it("should not throw error even if email does not exist (security)", async () => {
    const email = "nonexistent@example.com"
    mockAuthAdapter.resetPasswordForEmail.mockResolvedValue(undefined)

    await expect(authService.requestPasswordReset(email)).resolves.not.toThrow()
  })
})
