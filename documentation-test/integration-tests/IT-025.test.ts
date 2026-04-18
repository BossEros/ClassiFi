/**
 * IT-025: Inactive Teacher Login Is Blocked Pending Approval
 *
 * Module: Authentication
 * Unit: Login user
 * Date Tested: 4/16/26
 * Description: Verify that an inactive teacher account cannot log in before administrator approval.
 * Expected Result: The system blocks login and shows the pending approval message.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-025 Integration Test Pass - Inactive Teacher Login Is Blocked Pending Approval
 * Suggested Figure Title (System UI): Authentication UI - Login Form Showing Pending Administrator Approval Message
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AuthService } from "../../backend-ts/src/modules/auth/auth.service.js"
import { UserRepository } from "../../backend-ts/src/modules/users/user.repository.js"
import { SupabaseAuthAdapter } from "../../backend-ts/src/services/supabase-auth.adapter.js"
import type { IEmailService } from "../../backend-ts/src/services/interfaces/email.interface.js"
import type { NotificationService } from "../../backend-ts/src/modules/notifications/notification.service.js"
import { TeacherApprovalPendingError } from "../../backend-ts/src/shared/errors.js"
import { createMockTeacher } from "../../backend-ts/tests/utils/factories.js"

vi.mock("../../backend-ts/src/modules/users/user.repository.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../backend-ts/src/modules/users/user.repository.js")>()
  return { ...original, UserRepository: vi.fn() }
})
vi.mock("../../backend-ts/src/services/supabase-auth.adapter.js")
vi.mock("../../backend-ts/src/shared/config.js", () => ({
  settings: { frontendUrl: "http://localhost:3000" },
}))

describe("IT-025: Inactive Teacher Login Is Blocked Pending Approval", () => {
  let authService: AuthService
  let mockUserRepo: {
    checkEmailExists: ReturnType<typeof vi.fn>
    createUser: ReturnType<typeof vi.fn>
    getUserBySupabaseId: ReturnType<typeof vi.fn>
    getUserByEmail: ReturnType<typeof vi.fn>
    getUsersByRole: ReturnType<typeof vi.fn>
  }
  let mockAuthAdapter: {
    signUp: ReturnType<typeof vi.fn>
    signInWithPassword: ReturnType<typeof vi.fn>
    getUser: ReturnType<typeof vi.fn>
    getAdminUserById: ReturnType<typeof vi.fn>
    generatePasswordRecoveryLink: ReturnType<typeof vi.fn>
    deleteUser: ReturnType<typeof vi.fn>
  }
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
      withContext: vi.fn().mockReturnThis(),
    } as unknown as NotificationService

    authService = new AuthService(
      mockUserRepo as unknown as UserRepository,
      mockAuthAdapter as unknown as SupabaseAuthAdapter,
      mockEmailService,
      mockNotificationService,
    )
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it("should reject login for a teacher whose account is still inactive", async () => {
    mockAuthAdapter.signInWithPassword.mockResolvedValue({
      accessToken: "pending-teacher-token",
      user: { id: "pending-teacher-supabase-id" },
    })
    mockUserRepo.getUserBySupabaseId.mockResolvedValue(
      createMockTeacher({
        supabaseUserId: "pending-teacher-supabase-id",
        email: "teacher.pending@classifi.com",
        isActive: false,
      }),
    )

    const loginPromise = authService.loginUser(
      "teacher.pending@classifi.com",
      "Password1!",
    )

    await expect(loginPromise).rejects.toThrow(TeacherApprovalPendingError)
    await expect(loginPromise).rejects.toThrow(
      "Your access is pending administrator approval. You will be able to sign in once your account has been reviewed and approved by the admin",
    )
  })
})
