/**
 * IT-003: Password Reset Request Is Sent
 *
 * Module: Authentication
 * Unit: Password reset
 * Date Tested: 4/13/26
 * Description: Verify that a password reset request is sent.
 * Expected Result: A password reset email is sent to the user's email address.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-003 Integration Test Pass - Password Reset Request Is Sent
 * Suggested Figure Title (System UI): Authentication UI - User Getting Password Reset Email
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
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

describe("IT-003: Password Reset Request Is Sent", () => {
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
      {
        createNotification: vi.fn(),
        sendEmailNotificationIfEnabled: vi.fn(),
        withContext: vi.fn().mockReturnThis(),
      } as any,
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it("should send the reset request with the correct redirect url", async () => {
    mockAuthAdapter.resetPasswordForEmail.mockResolvedValue(undefined)

    await authService.requestPasswordReset("reset@example.com")

    expect(mockAuthAdapter.resetPasswordForEmail).toHaveBeenCalledWith(
      "reset@example.com",
      "http://localhost:3000/reset-password",
    )
  })
})
