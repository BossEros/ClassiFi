/**
 * IT-001: Registration Rejects Existing Email
 *
 * Module: Authentication
 * Unit: Register user
 * Date Tested: 4/13/26
 * Description: Verify that registration rejects an email that is already used.
 * Expected Result: The system shows that the email is already in use.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-001 Integration Test Pass - Registration Rejects Existing Email
 * Suggested Figure Title (System UI): Authentication UI - Registration Form Showing Existing Email Error
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
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

describe("IT-001: Registration Rejects Existing Email", () => {
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

  it("should stop the registration flow when the email already exists", async () => {
    mockUserRepo.checkEmailExists.mockResolvedValue(true)

    await expect(
      authService.registerUser({
        email: "existing@example.com",
        password: "Password1!",
        firstName: "Existing",
        lastName: "User",
        role: "student",
      }),
    ).rejects.toThrow(UserAlreadyExistsError)

    expect(mockAuthAdapter.signUp).not.toHaveBeenCalled()
    expect(mockUserRepo.createUser).not.toHaveBeenCalled()
  })
})
