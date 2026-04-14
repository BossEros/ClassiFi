/**
 * TC-004: Login with Invalid Credentials
 *
 * Module: Authentication
 * Unit: Login user
 * Date Tested: 3/28/26
 * Description: Verify error handling with invalid login credentials.
 * Expected Result: User sees "Incorrect email or password" message.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-004 Unit Test Pass - Login with Invalid Credentials Rejected
 * Suggested Figure Title (System UI): Authentication UI - Login Form Showing Invalid Credentials Error
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { AuthService } from "../../backend-ts/src/modules/auth/auth.service.js"
import { UserRepository } from "../../backend-ts/src/modules/users/user.repository.js"
import { SupabaseAuthAdapter } from "../../backend-ts/src/services/supabase-auth.adapter.js"
import { InvalidCredentialsError } from "../../backend-ts/src/shared/errors.js"

vi.mock("../../backend-ts/src/modules/users/user.repository.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../backend-ts/src/modules/users/user.repository.js")>()
  return { ...original, UserRepository: vi.fn() }
})
vi.mock("../../backend-ts/src/services/supabase-auth.adapter.js")
vi.mock("../../backend-ts/src/shared/config.js", () => ({
  settings: { frontendUrl: "http://localhost:3000" },
}))

describe("TC-004: Login with Invalid Credentials", () => {
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

  it("should throw InvalidCredentialsError for wrong password", async () => {
    mockAuthAdapter.signInWithPassword.mockRejectedValue(new InvalidCredentialsError())

    const loginPromise = authService.loginUser("test@example.com", "wrongpassword")

    await expect(loginPromise).rejects.toThrow(InvalidCredentialsError)
    await expect(loginPromise).rejects.toThrow("Incorrect email or password")
  })
})
