import { beforeEach, describe, expect, it, vi } from "vitest"
import { uploadAvatar } from "@/business/services/userService"
import { useAuthStore } from "@/shared/store/useAuthStore"
import * as userRepository from "@/data/repositories/userRepository"
import type { User } from "@/business/models/auth/types"

vi.mock("@/data/repositories/userRepository")

describe("userService.uploadAvatar", () => {
  const mockUser: User = {
    id: "user-1",
    email: "student@classifi.com",
    firstName: "Student",
    lastName: "User",
    role: "student",
    createdAt: new Date(),
    avatarUrl: undefined,
  }

  const mockAvatarFile = new File(["avatar"], "avatar.png", {
    type: "image/png",
  })

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: null, isAuthenticated: false })
  })

  it("returns an error when user is not authenticated", async () => {
    const result = await uploadAvatar({ file: mockAvatarFile })

    expect(result).toEqual({
      success: false,
      message: "You must be logged in to upload an avatar",
    })
    expect(userRepository.uploadUserAvatar).not.toHaveBeenCalled()
  })

  it("uploads avatar and updates the auth store user", async () => {
    const uploadedAvatarUrl = "https://cdn.classifi.com/avatars/user-1.png"
    useAuthStore.setState({ user: mockUser, isAuthenticated: true })
    vi.mocked(userRepository.uploadUserAvatar).mockResolvedValue(
      uploadedAvatarUrl,
    )

    const result = await uploadAvatar({
      file: mockAvatarFile,
      currentAvatarUrl: mockUser.avatarUrl ?? undefined,
    })

    expect(userRepository.uploadUserAvatar).toHaveBeenCalledWith(
      "user-1",
      mockAvatarFile,
      undefined,
    )
    expect(result).toEqual({
      success: true,
      avatarUrl: uploadedAvatarUrl,
    })
    expect(useAuthStore.getState().user?.avatarUrl).toBe(uploadedAvatarUrl)
  })

  it("returns repository error message when upload fails", async () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true })
    vi.mocked(userRepository.uploadUserAvatar).mockRejectedValue(
      new Error("Storage upload failed"),
    )

    const result = await uploadAvatar({ file: mockAvatarFile })

    expect(result).toEqual({
      success: false,
      message: "Storage upload failed",
    })
  })

  it("returns fallback message for non-error throwables", async () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true })
    vi.mocked(userRepository.uploadUserAvatar).mockRejectedValue("unexpected")

    const result = await uploadAvatar({ file: mockAvatarFile })

    expect(result).toEqual({
      success: false,
      message: "Failed to upload avatar",
    })
  })
})
