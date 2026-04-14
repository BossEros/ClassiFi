/**
 * TC-004: Login Rejects Wrong Credentials
 *
 * Module: Authentication
 * Unit: Login user
 * Date Tested: 4/13/26
 * Description: Verify that login rejects wrong credentials.
 * Expected Result: The system shows the wrong credentials error.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-004 Unit Test Pass - Login Wrong Credentials Rejected
 * Suggested Figure Title (System UI): Authentication UI - Login Form Showing Wrong Credentials Error
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AuthService } from "../../backend-ts/src/modules/auth/auth.service.js"
import { UserRepository } from "../../backend-ts/src/modules/users/user.repository.js"
import { SupabaseAuthAdapter } from "../../backend-ts/src/services/supabase-auth.adapter.js"
import { InvalidCredentialsError } from "../../backend-ts/src/shared/errors.js"

vi.mock("../../backend-ts/src/modules/users/user.repository.js", async (importOriginal) => {
  const original = await importOriginal<
    typeof import("../../backend-ts/src/modules/users/user.repository.js")
  >()

  return { ...original, UserRepository: vi.fn() }
})

vi.mock("../../backend-ts/src/services/supabase-auth.adapter.js")
vi.mock("../../backend-ts/src/shared/config.js", () => ({
  settings: { frontendUrl: "http://localhost:3000" },
}))

describe("TC-004: Login Rejects Wrong Credentials", () => {
  let authService: AuthService
  let mockUserRepo: {
    checkEmailExists: ReturnType<typeof vi.fn>
    createUser: ReturnType<typeof vi.fn>
    getUserBySupabaseId: ReturnType<typeof vi.fn>
  }
  let mockAuthAdapter: {
    signUp: ReturnType<typeof vi.fn>
    signInWithPassword: ReturnType<typeof vi.fn>
    getUser: ReturnType<typeof vi.fn>
    getAdminUserById: ReturnType<typeof vi.fn>
    resetPasswordForEmail: ReturnType<typeof vi.fn>
    deleteUser: ReturnType<typeof vi.fn>
  }

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
      mockUserRepo as unknown as UserRepository,
      mockAuthAdapter as unknown as SupabaseAuthAdapter,
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

  it("should throw an invalid credentials error for wrong email or password", async () => {
    mockAuthAdapter.signInWithPassword.mockRejectedValue(
      new InvalidCredentialsError(),
    )

    const loginPromise = authService.loginUser(
      "teacher@classifi.com",
      "wrongpassword",
    )

    await expect(loginPromise).rejects.toThrow(InvalidCredentialsError)
    await expect(loginPromise).rejects.toThrow(
      "Incorrect email or password",
    )
  })
})
