/**
 * TC-041: Update User Avatar
 *
 * Module: User Management
 * Unit: Update Profile
 * Date Tested: 4/11/26
 * Description: Verify that a user can update their profile picture.
 * Expected Result: The user's avatar URL is saved and the profile reflects the new image.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-041 Unit Test Pass - User Avatar Updated Successfully
 * Suggested Figure Title (System UI): User Profile UI - Avatar Update Action
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { UserService } from "../../backend-ts/src/modules/users/user.service.js"
import { UserNotFoundError } from "../../backend-ts/src/shared/errors.js"
import { createMockUser } from "../../backend-ts/tests/utils/factories.js"

describe("TC-041: Update User Avatar", () => {
  let userService: UserService
  let mockUserRepo: any
  let mockSubmissionRepo: any
  let mockStorageService: any
  let mockAuthAdapter: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockUserRepo = {
      getUserById: vi.fn(),
      updateUser: vi.fn(),
      createUser: vi.fn(),
      getUserByEmail: vi.fn(),
      deleteUser: vi.fn(),
    }
    mockSubmissionRepo = { getSubmissionsByStudent: vi.fn() }
    mockStorageService = { deleteAvatar: vi.fn(), deleteSubmissionFiles: vi.fn() }
    mockAuthAdapter = { deleteUser: vi.fn() }

    userService = new UserService(mockUserRepo, mockSubmissionRepo, mockStorageService, mockAuthAdapter)
  })

  afterEach(() => { vi.clearAllMocks() })

  it("should update the user's avatar URL successfully", async () => {
    const user = createMockUser({ id: 7 })
    const newAvatarUrl = "https://cdn.example.com/avatars/7.png"

    mockUserRepo.getUserById.mockResolvedValue(user)
    mockUserRepo.updateUser.mockResolvedValue(undefined)

    await expect(userService.updateAvatarUrl(7, newAvatarUrl)).resolves.toBeUndefined()
    expect(mockUserRepo.updateUser).toHaveBeenCalledWith(7, { avatarUrl: newAvatarUrl })
  })

  it("should throw UserNotFoundError when the user does not exist", async () => {
    mockUserRepo.getUserById.mockResolvedValue(undefined)

    await expect(userService.updateAvatarUrl(999, "https://example.com/avatar.png")).rejects.toThrow(UserNotFoundError)
  })
})
