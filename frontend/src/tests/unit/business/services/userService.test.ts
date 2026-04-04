import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  uploadAvatar,
  updateNotificationPreferences,
} from "@/business/services/userService"
import { useAuthStore } from "@/shared/store/useAuthStore"
import * as userRepository from "@/data/repositories/userRepository"
import type { User } from "@/shared/types/auth"

vi.mock("@/data/repositories/userRepository")

describe("userService.uploadAvatar", () => {
  const mockUser: User = {
    id: "user-1",
    email: "student@classifi.com",
    firstName: "Student",
    lastName: "User",
    role: "student",
    emailNotificationsEnabled: true,
    inAppNotificationsEnabled: true,
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

describe("userService.updateNotificationPreferences", () => {
  const mockUser: User = {
    id: "user-2",
    email: "student@classifi.com",
    firstName: "Student",
    lastName: "User",
    role: "student",
    emailNotificationsEnabled: true,
    inAppNotificationsEnabled: true,
    createdAt: new Date(),
    avatarUrl: undefined,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ user: null, isAuthenticated: false })
  })

  it("throws when the user is not authenticated", async () => {
    await expect(updateNotificationPreferences(false, true)).rejects.toThrow(
      "You must be logged in to update notification preferences",
    )

    expect(userRepository.updateNotificationPreferences).not.toHaveBeenCalled()
  })

  it("updates notification preferences and syncs the auth store", async () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true })
    vi.mocked(userRepository.updateNotificationPreferences).mockResolvedValue({
      emailNotificationsEnabled: false,
      inAppNotificationsEnabled: true,
    })

    const result = await updateNotificationPreferences(false, true)

    expect(userRepository.updateNotificationPreferences).toHaveBeenCalledWith(
      false,
      true,
    )
    expect(result).toEqual({
      emailNotificationsEnabled: false,
      inAppNotificationsEnabled: true,
    })
    expect(useAuthStore.getState().user).toEqual({
      ...mockUser,
      emailNotificationsEnabled: false,
      inAppNotificationsEnabled: true,
    })
  })
})
