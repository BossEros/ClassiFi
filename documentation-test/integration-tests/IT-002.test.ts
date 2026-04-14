/**
 * IT-002: Registration Creates User Successfully
 *
 * Module: Authentication
 * Unit: Register user
 * Date Tested: 4/13/26
 * Description: Verify that registration creates a user when the data is valid.
 * Expected Result: A new user account is created successfully.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-002 Integration Test Pass - Registration Creates User Successfully
 * Suggested Figure Title (System UI): Authentication UI - Registration Form with Successful Submission
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
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

describe("IT-002: Registration Creates User Successfully", () => {
  let authService: AuthService
  let mockUserRepo: any
  let mockAuthAdapter: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockUserRepo = {
      checkEmailExists: vi.fn(),
      createUser: vi.fn(),
      getUserBySupabaseId: vi.fn(),
      getUsersByRole: vi.fn().mockResolvedValue([]),
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

  it("should create a new user record after successful signup", async () => {
    const mockUser = createMockUser({ email: "new@example.com" })

    mockUserRepo.checkEmailExists.mockResolvedValue(false)
    mockUserRepo.createUser.mockResolvedValue(mockUser)
    mockAuthAdapter.signUp.mockResolvedValue({
      user: { id: "supabase-user-1" },
      token: "access-token",
    })
    mockAuthAdapter.getAdminUserById.mockResolvedValue({
      id: "supabase-user-1",
      email: "new@example.com",
    })

    const result = await authService.registerUser({
      email: "new@example.com",
      password: "Password1!",
      firstName: "New",
      lastName: "User",
      role: "student",
    })

    expect(result.userData.email).toBe("new@example.com")
    expect(mockUserRepo.createUser).toHaveBeenCalled()
  })
})
