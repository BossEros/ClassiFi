/**
 * IT-015: User Account Deletion Cleans Up Resources
 *
 * Module: User Management
 * Unit: Delete account
 * Date Tested: 4/13/26
 * Description: Verify that deleting an account cleans up related resources.
 * Expected Result: The user account and related data are deleted successfully.
 * Actual Result: As Expected.
 * Remarks: Passed  
 * Suggested Figure Title (Test Pass): IT-015 Integration Test Pass - User Account Deletion Cleans Up Resources
 * Suggested Figure Title (System UI): User Settings UI - Delete Account Confirmation Flow
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { UserService } from "../../backend-ts/src/modules/users/user.service.js"
import { createMockSubmission, createMockUser } from "../../backend-ts/tests/utils/factories.js"

describe("IT-015: User Account Deletion Cleans Up Resources", () => {
  let userService: UserService
  let mockUserRepo: any
  let mockSubmissionRepo: any
  let mockStorageService: any
  let mockAuthAdapter: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockUserRepo = {
      getUserById: vi.fn(),
      deleteUser: vi.fn().mockResolvedValue(true),
      updateUser: vi.fn(),
    }
    mockSubmissionRepo = {
      getSubmissionsByStudent: vi.fn().mockResolvedValue([]),
    }
    mockStorageService = {
      deleteAvatar: vi.fn().mockResolvedValue(undefined),
      deleteSubmissionFiles: vi.fn().mockResolvedValue(undefined),
    }
    mockAuthAdapter = {
      deleteUser: vi.fn().mockResolvedValue(undefined),
    }

    userService = new UserService(
      mockUserRepo,
      mockSubmissionRepo,
      mockStorageService,
      mockAuthAdapter,
    )
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("should delete the user's avatar, files, record, and auth account", async () => {
    const user = createMockUser({
      id: 10 as any,
      supabaseUserId: "supabase-user-10",
      avatarUrl: "https://cdn.example.com/avatars/10.png",
    })
    const submissions = [
      createMockSubmission({ filePath: "submissions/10/1.py" }),
      createMockSubmission({ filePath: "submissions/10/2.py" }),
    ]

    mockUserRepo.getUserById.mockResolvedValue(user)
    mockSubmissionRepo.getSubmissionsByStudent.mockResolvedValue(submissions)

    await userService.deleteAccount(10)

    expect(mockStorageService.deleteAvatar).toHaveBeenCalledWith(user.avatarUrl)
    expect(mockStorageService.deleteSubmissionFiles).toHaveBeenCalledWith([
      "submissions/10/1.py",
      "submissions/10/2.py",
    ])
    expect(mockUserRepo.deleteUser).toHaveBeenCalledWith(10)
    expect(mockAuthAdapter.deleteUser).toHaveBeenCalledWith("supabase-user-10")
  })
})
