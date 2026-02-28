import { beforeEach, describe, expect, it, vi } from "vitest"
import { uploadUserAvatar } from "@/data/repositories/userRepository"
import { apiClient } from "@/data/api/apiClient"

const { mockStorageFrom, mockUpload, mockGetPublicUrl, mockRemove, mockPatch } =
  vi.hoisted(() => ({
    mockStorageFrom: vi.fn(),
    mockUpload: vi.fn(),
    mockGetPublicUrl: vi.fn(),
    mockRemove: vi.fn(),
    mockPatch: vi.fn(),
  }))

vi.mock("@/data/api/supabaseClient", () => ({
  supabase: {
    storage: {
      from: mockStorageFrom,
    },
  },
}))

vi.mock("@/data/api/apiClient", () => ({
  apiClient: {
    patch: mockPatch,
  },
}))

describe("userRepository.uploadUserAvatar", () => {
  const fixedTimestampMs = 1735689600000
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
  const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(fixedTimestampMs)

  beforeEach(() => {
    vi.clearAllMocks()
    errorSpy.mockClear()
    dateNowSpy.mockReturnValue(fixedTimestampMs)

    mockStorageFrom.mockReturnValue({
      upload: mockUpload,
      getPublicUrl: mockGetPublicUrl,
      remove: mockRemove,
    })

    mockUpload.mockResolvedValue({ error: null })
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://cdn.classifi.com/avatars/user-1.png" },
    })
    mockRemove.mockResolvedValue({ error: null })
    mockPatch.mockResolvedValue({ data: { success: true }, status: 200 })
  })

  it("uploads avatar, deletes old avatar file, and persists the new URL", async () => {
    const file = new File(["binary"], "avatar.png", { type: "image/png" })

    const result = await uploadUserAvatar(
      "user-1",
      file,
      "https://cdn.classifi.com/storage/v1/object/public/avatars/old.png?version=1",
    )

    expect(mockStorageFrom).toHaveBeenCalledWith("avatars")
    expect(mockRemove).toHaveBeenCalledWith(["old.png"])
    expect(mockUpload).toHaveBeenCalledWith("user-1.png", file, {
      cacheControl: "3600",
      upsert: true,
    })
    expect(mockGetPublicUrl).toHaveBeenCalledWith("user-1.png")
    expect(apiClient.patch).toHaveBeenCalledWith("/user/me/avatar", {
      avatarUrl: `https://cdn.classifi.com/avatars/user-1.png?v=${fixedTimestampMs}`,
    })
    expect(result).toBe(
      `https://cdn.classifi.com/avatars/user-1.png?v=${fixedTimestampMs}`,
    )
  })

  it("derives file extension from MIME type when filename has no extension", async () => {
    const file = new File(["binary"], "avatar", { type: "image/jpeg" })

    await uploadUserAvatar("user-1", file)

    expect(mockUpload).toHaveBeenCalledWith(
      "user-1.jpg",
      file,
      expect.any(Object),
    )
  })

  it("falls back to jpg when MIME type is unknown and filename has no extension", async () => {
    const file = new File(["binary"], "avatar", { type: "image/unknown" })

    await uploadUserAvatar("user-1", file)

    expect(mockUpload).toHaveBeenCalledWith(
      "user-1.jpg",
      file,
      expect.any(Object),
    )
  })

  it("does not attempt old-avatar deletion for non-avatar URLs", async () => {
    const file = new File(["binary"], "avatar.png", { type: "image/png" })

    await uploadUserAvatar(
      "user-1",
      file,
      "https://cdn.classifi.com/profile.png",
    )

    expect(mockRemove).not.toHaveBeenCalled()
  })

  it("does not attempt old-avatar deletion when avatar URL has no file path", async () => {
    const file = new File(["binary"], "avatar.png", { type: "image/png" })

    await uploadUserAvatar(
      "user-1",
      file,
      "https://cdn.classifi.com/storage/v1/object/public/avatars/",
    )

    expect(mockRemove).not.toHaveBeenCalled()
  })

  it("continues upload when deleting the old avatar throws", async () => {
    const file = new File(["binary"], "avatar.png", { type: "image/png" })
    mockRemove.mockRejectedValueOnce(new Error("delete failed"))

    const result = await uploadUserAvatar(
      "user-1",
      file,
      "https://cdn.classifi.com/storage/v1/object/public/avatars/old.png",
    )

    expect(errorSpy).toHaveBeenCalled()
    expect(result).toBe(
      `https://cdn.classifi.com/avatars/user-1.png?v=${fixedTimestampMs}`,
    )
  })

  it("maps bucket/not-found upload errors to configured-storage message", async () => {
    const file = new File(["binary"], "avatar.png", { type: "image/png" })
    mockUpload.mockResolvedValueOnce({
      error: { message: "bucket not found" },
    })

    await expect(uploadUserAvatar("user-1", file)).rejects.toThrow(
      "Avatar storage is not configured. Please contact support.",
    )
  })

  it("surfaces generic upload errors", async () => {
    const file = new File(["binary"], "avatar.png", { type: "image/png" })
    mockUpload.mockResolvedValueOnce({
      error: { message: "Failed to upload image to storage" },
    })

    await expect(uploadUserAvatar("user-1", file)).rejects.toThrow(
      "Failed to upload image to storage",
    )
  })

  it("falls back to generic upload failure message when provider error message is empty", async () => {
    const file = new File(["binary"], "avatar.png", { type: "image/png" })
    mockUpload.mockResolvedValueOnce({
      error: { message: "" },
    })

    await expect(uploadUserAvatar("user-1", file)).rejects.toThrow(
      "Failed to upload image",
    )
  })

  it("continues and returns URL when backend persistence fails", async () => {
    const file = new File(["binary"], "avatar.png", { type: "image/png" })
    mockPatch.mockRejectedValueOnce(new Error("backend unavailable"))

    const result = await uploadUserAvatar("user-1", file)

    expect(errorSpy).toHaveBeenCalled()
    expect(result).toBe(
      `https://cdn.classifi.com/avatars/user-1.png?v=${fixedTimestampMs}`,
    )
  })
})
