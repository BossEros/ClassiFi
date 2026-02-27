import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MockedObject } from "vitest"
import { UserService } from "../../src/modules/users/user.service.js"
import type { UserRepository } from "../../src/modules/users/user.repository.js"
import type { SubmissionRepository } from "../../src/modules/submissions/submission.repository.js"
import type { StorageService } from "../../src/services/storage.service.js"
import type { SupabaseAuthAdapter } from "../../src/services/supabase-auth.adapter.js"
import { UserNotFoundError } from "../../src/shared/errors.js"
import { createMockUser, createMockSubmission } from "../utils/factories.js"

describe("UserService", () => {
  let service: UserService
  let userRepositoryMock: Partial<MockedObject<UserRepository>>
  let submissionRepositoryMock: Partial<MockedObject<SubmissionRepository>>
  let storageServiceMock: Partial<MockedObject<StorageService>>
  let authAdapterMock: Partial<MockedObject<SupabaseAuthAdapter>>

  beforeEach(() => {
    userRepositoryMock = {
      getUserById: vi.fn(),
      deleteUser: vi.fn(),
      updateUser: vi.fn(),
    } as any

    submissionRepositoryMock = {
      getSubmissionsByStudent: vi.fn(),
    } as any

    storageServiceMock = {
      deleteAvatar: vi.fn(),
      deleteSubmissionFiles: vi.fn(),
    } as any

    authAdapterMock = {
      deleteUser: vi.fn(),
    } as any

    service = new UserService(
      userRepositoryMock as UserRepository,
      submissionRepositoryMock as SubmissionRepository,
      storageServiceMock as StorageService,
      authAdapterMock as SupabaseAuthAdapter,
    )
  })

  describe("deleteAccount", () => {
    it("throws UserNotFoundError when user does not exist", async () => {
      userRepositoryMock.getUserById!.mockResolvedValue(undefined)

      await expect(service.deleteAccount(999)).rejects.toThrow(UserNotFoundError)
    })

    it("deletes avatar, submission files, local user, and Supabase user", async () => {
      const user = createMockUser({
        id: 10,
        supabaseUserId: "supabase-10",
        avatarUrl: "https://cdn.classifi.com/avatars/10.png",
      })
      const submissions = [
        createMockSubmission({ filePath: "submissions/10/1.py" }),
        createMockSubmission({ filePath: "submissions/10/2.py" }),
      ]

      userRepositoryMock.getUserById!.mockResolvedValue(user)
      submissionRepositoryMock.getSubmissionsByStudent!.mockResolvedValue(
        submissions,
      )
      userRepositoryMock.deleteUser!.mockResolvedValue(true)

      await service.deleteAccount(10)

      expect(storageServiceMock.deleteAvatar).toHaveBeenCalledWith(
        "https://cdn.classifi.com/avatars/10.png",
      )
      expect(submissionRepositoryMock.getSubmissionsByStudent).toHaveBeenCalledWith(
        10,
        false,
      )
      expect(storageServiceMock.deleteSubmissionFiles).toHaveBeenCalledWith([
        "submissions/10/1.py",
        "submissions/10/2.py",
      ])
      expect(userRepositoryMock.deleteUser).toHaveBeenCalledWith(10)
      expect(authAdapterMock.deleteUser).toHaveBeenCalledWith("supabase-10")
    })

    it("continues deletion when submission cleanup fails", async () => {
      const user = createMockUser({
        id: 11,
        supabaseUserId: "supabase-11",
        avatarUrl: null,
      })

      userRepositoryMock.getUserById!.mockResolvedValue(user)
      submissionRepositoryMock.getSubmissionsByStudent!.mockRejectedValue(
        new Error("cleanup failed"),
      )
      userRepositoryMock.deleteUser!.mockResolvedValue(true)

      await service.deleteAccount(11)

      expect(userRepositoryMock.deleteUser).toHaveBeenCalledWith(11)
      expect(authAdapterMock.deleteUser).toHaveBeenCalledWith("supabase-11")
      expect(storageServiceMock.deleteSubmissionFiles).not.toHaveBeenCalled()
    })

    it("skips submission-file deletion when user has no submissions", async () => {
      const user = createMockUser({
        id: 12,
        supabaseUserId: "supabase-12",
        avatarUrl: null,
      })

      userRepositoryMock.getUserById!.mockResolvedValue(user)
      submissionRepositoryMock.getSubmissionsByStudent!.mockResolvedValue([])
      userRepositoryMock.deleteUser!.mockResolvedValue(true)

      await service.deleteAccount(12)

      expect(storageServiceMock.deleteSubmissionFiles).not.toHaveBeenCalled()
    })

    it("throws when local database deletion fails", async () => {
      const user = createMockUser({
        id: 13,
        supabaseUserId: "supabase-13",
        avatarUrl: null,
      })

      userRepositoryMock.getUserById!.mockResolvedValue(user)
      submissionRepositoryMock.getSubmissionsByStudent!.mockResolvedValue([])
      userRepositoryMock.deleteUser!.mockResolvedValue(false)

      await expect(service.deleteAccount(13)).rejects.toThrow(
        "Failed to delete user from database",
      )
      expect(authAdapterMock.deleteUser).not.toHaveBeenCalled()
    })

    it("skips Supabase delete when user has no supabaseUserId", async () => {
      const user = createMockUser({
        id: 14,
        supabaseUserId: null,
        avatarUrl: null,
      })

      userRepositoryMock.getUserById!.mockResolvedValue(user)
      submissionRepositoryMock.getSubmissionsByStudent!.mockResolvedValue([])
      userRepositoryMock.deleteUser!.mockResolvedValue(true)

      await service.deleteAccount(14)

      expect(authAdapterMock.deleteUser).not.toHaveBeenCalled()
    })
  })

  describe("updateAvatarUrl", () => {
    it("throws UserNotFoundError when user does not exist", async () => {
      userRepositoryMock.getUserById!.mockResolvedValue(undefined)

      await expect(
        service.updateAvatarUrl(1, "https://cdn.classifi.com/avatars/1.png"),
      ).rejects.toThrow(UserNotFoundError)
    })

    it("updates avatar URL for existing user", async () => {
      userRepositoryMock.getUserById!.mockResolvedValue(createMockUser({ id: 1 }))

      await service.updateAvatarUrl(
        1,
        "https://cdn.classifi.com/avatars/1.png",
      )

      expect(userRepositoryMock.updateUser).toHaveBeenCalledWith(1, {
        avatarUrl: "https://cdn.classifi.com/avatars/1.png",
      })
    })
  })

  describe("getUserById", () => {
    it("returns user from repository", async () => {
      const user = createMockUser({ id: 77 })
      userRepositoryMock.getUserById!.mockResolvedValue(user)

      const result = await service.getUserById(77)

      expect(result).toEqual(user)
      expect(userRepositoryMock.getUserById).toHaveBeenCalledWith(77)
    })
  })
})
