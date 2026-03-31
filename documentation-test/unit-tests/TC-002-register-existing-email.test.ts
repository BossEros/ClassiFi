/**
 * TC-002: Registration with Existing Email
 *
 * Module: Authentication
 * Unit: Register User
 * Date Tested: 3/28/26
 * Description: Verify error handling when registering with an existing email.
 * Expected Result: User sees "User already exists" message.
 * Actual Result: As Expected.
 * Remarks: Passed
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { AuthService } from "../../backend-ts/src/modules/auth/auth.service.js"
import { UserRepository } from "../../backend-ts/src/modules/users/user.repository.js"
import { SupabaseAuthAdapter } from "../../backend-ts/src/services/supabase-auth.adapter.js"
import { UserAlreadyExistsError } from "../../backend-ts/src/shared/errors.js"

vi.mock("../../backend-ts/src/modules/users/user.repository.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../backend-ts/src/modules/users/user.repository.js")>()
  return { ...original, UserRepository: vi.fn() }
})
vi.mock("../../backend-ts/src/services/supabase-auth.adapter.js")
vi.mock("../../backend-ts/src/shared/config.js", () => ({
  settings: { frontendUrl: "http://localhost:3000" },
}))

describe("TC-002: Register with Existing Email", () => {
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
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it("should throw UserAlreadyExistsError if email exists", async () => {
    mockUserRepo.checkEmailExists.mockResolvedValue(true)

    const registerPromise = authService.registerUser({
      email: "existing@example.com",
      password: "password123",
      firstName: "Existing",
      lastName: "User",
      role: "student",
    })

    await expect(registerPromise).rejects.toThrow(UserAlreadyExistsError)
    await expect(registerPromise).rejects.toThrow("already exists")

    expect(mockAuthAdapter.signUp).not.toHaveBeenCalled()
  })
})
