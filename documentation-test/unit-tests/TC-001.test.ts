/**
 * TC-001: User Registration with Valid Data
 *
 * Module: Authentication
 * Unit: Register user
 * Date Tested: 3/28/26
 * Description: Verify that a new user is registered with valid input.
 * Expected Result: User record is created in the database.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-001 Unit Test Pass - Register User with Valid Data
 * Suggested Figure Title (System UI): Authentication UI - Registration Form with Valid User Details
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { AuthService } from "../../backend-ts/src/modules/auth/auth.service.js"
import { UserRepository } from "../../backend-ts/src/modules/users/user.repository.js"
import { SupabaseAuthAdapter } from "../../backend-ts/src/services/supabase-auth.adapter.js"
import { createMockUser } from "../../backend-ts/tests/utils/factories.js"

vi.mock("../../backend-ts/src/modules/users/user.repository.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../backend-ts/src/modules/users/user.repository.js")>()
  return { ...original, UserRepository: vi.fn() }
})
vi.mock("../../backend-ts/src/services/supabase-auth.adapter.js")
vi.mock("../../backend-ts/src/shared/config.js", () => ({
  settings: { frontendUrl: "http://localhost:3000" },
}))

describe("TC-001: Register User Successfully", () => {
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

  it("should successfully register a new user", async () => {
    const validRegistration = {
      email: "new@example.com",
      password: "password123",
      firstName: "New",
      lastName: "User",
      role: "student",
    }
    const mockUser = createMockUser({ email: validRegistration.email })
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
  })
})
