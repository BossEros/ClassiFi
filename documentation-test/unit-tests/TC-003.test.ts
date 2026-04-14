/**
 * TC-003: Login User Successfully
 *
 * Module: Authentication
 * Unit: Login user
 * Date Tested: 3/28/26
 * Description: Verify that login works with correct credentials.
 * Expected Result: User can access the dashboard after login.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-003 Unit Test Pass - Login with Valid Credentials
 * Suggested Figure Title (System UI): Authentication UI - Login Form for Valid Sign-In
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

describe("TC-003: Login User Successfully", () => {
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

  it("should successfully login a user with valid credentials", async () => {
    const mockUser = createMockUser()
    const supabaseUserId = "supabase-id"
    const accessToken = "test-access-token"

    mockAuthAdapter.signInWithPassword.mockResolvedValue({
      accessToken,
      user: { id: supabaseUserId },
    })
    mockUserRepo.getUserBySupabaseId.mockResolvedValue(mockUser)

    const result = await authService.loginUser("test@example.com", "password123")

    expect(result.userData.email).toBe(mockUser.email)
    expect(result.token).toBe(accessToken)
    expect(mockAuthAdapter.signInWithPassword).toHaveBeenCalledWith(
      "test@example.com",
      "password123",
    )
  })
})
