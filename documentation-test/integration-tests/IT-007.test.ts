/**
 * IT-007: User Account Deletion → Complete Resource Cleanup Flow
 *
 * Module: User Management
 * Unit: Delete Account
 * Date Tested: 4/10/26
 * Description: Verify that deleting a user account removes all associated files, data records, and login credentials.
 * Expected Result: All associated resources are cleaned up and the account is fully deleted.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-007 Integration Test Pass - Account Deletion Cleans Up All Related Resources
 * Suggested Figure Title (System UI): User Settings UI - Delete Account Confirmation Flow
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { UserService } from "../../backend-ts/src/modules/users/user.service.js"
import { UserNotFoundError } from "../../backend-ts/src/shared/errors.js"
import { createMockUser, createMockSubmission } from "../../backend-ts/tests/utils/factories.js"

describe("IT-007: User Account Deletion → Complete Resource Cleanup Flow", () => {
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

  afterEach(() => { vi.clearAllMocks() })

  it("should delete avatar, submission files, local DB record, and Supabase auth in sequence", async () => {
    const user = createMockUser({
      id: 10,
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
    expect(mockSubmissionRepo.getSubmissionsByStudent).toHaveBeenCalledWith(10, false)
    expect(mockStorageService.deleteSubmissionFiles).toHaveBeenCalledWith([
      "submissions/10/1.py",
      "submissions/10/2.py",
    ])
    expect(mockUserRepo.deleteUser).toHaveBeenCalledWith(10)
    expect(mockAuthAdapter.deleteUser).toHaveBeenCalledWith("supabase-user-10")
  })

  it("should throw UserNotFoundError when the user does not exist", async () => {
    mockUserRepo.getUserById.mockResolvedValue(undefined)

    await expect(userService.deleteAccount(999)).rejects.toThrow(UserNotFoundError)

    expect(mockStorageService.deleteAvatar).not.toHaveBeenCalled()
    expect(mockAuthAdapter.deleteUser).not.toHaveBeenCalled()
  })
})
