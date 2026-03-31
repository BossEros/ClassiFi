import { describe, it, expect, beforeEach, vi } from "vitest"
import type { MockedObject } from "vitest"
import { AdminUserService } from "../../src/modules/admin/admin-user.service.js"
import type { UserRepository } from "../../src/modules/users/user.repository.js"
import type { UserService } from "../../src/modules/users/user.service.js"
import type { ClassService } from "../../src/modules/classes/class.service.js"
import type { SupabaseAuthAdapter } from "../../src/services/supabase-auth.adapter.js"
import {
  UserNotFoundError,
  InvalidRoleError,
} from "../../src/shared/errors.js"
import { createMockUser, createMockTeacher } from "../utils/factories.js"

describe("AdminUserService", () => {
  let adminUserService: AdminUserService
  let mockUserRepo: Partial<MockedObject<UserRepository>>
  let mockUserService: Partial<MockedObject<UserService>>
  let mockClassService: Partial<MockedObject<ClassService>>
  let mockAuthAdapter: Partial<MockedObject<SupabaseAuthAdapter>>

  const mockUser = createMockUser()
  const mockTeacher = createMockTeacher()

  beforeEach(() => {
    vi.clearAllMocks()

    mockUserRepo = {
      getAllUsersFiltered: vi.fn(),
      getUserById: vi.fn(),
      getUserByEmail: vi.fn(),
      getUsersByRole: vi.fn(),
      updateUser: vi.fn(),
      toggleActiveStatus: vi.fn(),
      checkEmailExists: vi.fn(),
      createUser: vi.fn(),
    } as any

    mockUserService = {
      deleteAccount: vi.fn(),
    } as any

    mockClassService = {
      deleteClassesByTeacher: vi.fn(),
    } as any

    mockAuthAdapter = {
      createUser: vi.fn(),
      updateUserEmail: vi.fn(),
    } as any

    adminUserService = new AdminUserService(
      mockUserRepo as unknown as UserRepository,
      mockUserService as unknown as UserService,
      mockClassService as unknown as ClassService,
      mockAuthAdapter as unknown as SupabaseAuthAdapter,
    )
  })

  describe("getAllUsers", () => {
    it("should return paginated users mapped to DTOs", async () => {
      const paginatedResult = {
        data: [mockUser, mockTeacher],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      }
      mockUserRepo.getAllUsersFiltered!.mockResolvedValue(paginatedResult)

      const result = await adminUserService.getAllUsers({
        page: 1,
        limit: 10,
        role: "all",
        status: "all",
      })

      expect(result.data).toHaveLength(2)
      expect(result.data[0].email).toBe(mockUser.email)
      expect(mockUserRepo.getAllUsersFiltered).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        role: undefined,
        status: undefined,
      })
    })

    it("should pass specific role and status filters to repository", async () => {
      mockUserRepo.getAllUsersFiltered!.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      })

      await adminUserService.getAllUsers({
        page: 1,
        limit: 10,
        search: "test",
        role: "teacher",
        status: "active",
      })

      expect(mockUserRepo.getAllUsersFiltered).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "test",
        role: "teacher",
        status: "active",
      })
    })
  })

  describe("getUserById", () => {
    it("should return user DTO when user exists", async () => {
      mockUserRepo.getUserById!.mockResolvedValue(mockUser)

      const result = await adminUserService.getUserById(1)

      expect(result.id).toBe(mockUser.id)
      expect(result.email).toBe(mockUser.email)
    })

    it("should throw UserNotFoundError when user does not exist", async () => {
      mockUserRepo.getUserById!.mockResolvedValue(null)

      await expect(adminUserService.getUserById(999)).rejects.toThrow(
        UserNotFoundError,
      )
    })
  })

  describe("updateUserRole", () => {
    it("should update user role successfully", async () => {
      const updatedUser = { ...mockUser, role: "teacher" as const }
      mockUserRepo.getUserById!.mockResolvedValue(mockUser)
      mockUserRepo.updateUser!.mockResolvedValue(updatedUser)

      const result = await adminUserService.updateUserRole(1, "teacher")

      expect(result.role).toBe("teacher")
      expect(mockUserRepo.updateUser).toHaveBeenCalledWith(1, {
        role: "teacher",
      })
    })

    it("should throw UserNotFoundError when user does not exist", async () => {
      mockUserRepo.getUserById!.mockResolvedValue(null)

      await expect(
        adminUserService.updateUserRole(999, "teacher"),
      ).rejects.toThrow(UserNotFoundError)
    })

    it("should throw InvalidRoleError for invalid role", async () => {
      mockUserRepo.getUserById!.mockResolvedValue(mockUser)

      await expect(
        adminUserService.updateUserRole(1, "superadmin" as any),
      ).rejects.toThrow(InvalidRoleError)
    })
  })

  describe("updateUserDetails", () => {
    it("should update user first and last name", async () => {
      const updatedUser = {
        ...mockUser,
        firstName: "Updated",
        lastName: "Name",
      }
      mockUserRepo.getUserById!.mockResolvedValue(mockUser)
      mockUserRepo.updateUser!.mockResolvedValue(updatedUser)

      const result = await adminUserService.updateUserDetails(1, {
        firstName: "Updated",
        lastName: "Name",
      })

      expect(result.firstName).toBe("Updated")
      expect(result.lastName).toBe("Name")
    })

    it("should throw UserNotFoundError when user does not exist", async () => {
      mockUserRepo.getUserById!.mockResolvedValue(null)

      await expect(
        adminUserService.updateUserDetails(999, { firstName: "New" }),
      ).rejects.toThrow(UserNotFoundError)
    })
  })

  describe("updateUserEmail", () => {
    it("should update email in both Supabase and local DB", async () => {
      const updatedUser = { ...mockUser, email: "new@example.com" }
      mockUserRepo.getUserById!.mockResolvedValue(mockUser)
      mockUserRepo.getUserByEmail!.mockResolvedValue(null)
      mockAuthAdapter.updateUserEmail!.mockResolvedValue(undefined)
      mockUserRepo.updateUser!.mockResolvedValue(updatedUser)

      const result = await adminUserService.updateUserEmail(
        1,
        "new@example.com",
      )

      expect(result.email).toBe("new@example.com")
      expect(mockAuthAdapter.updateUserEmail).toHaveBeenCalledWith(
        mockUser.supabaseUserId,
        "new@example.com",
      )
    })

    it("should throw when email is already in use by another user", async () => {
      const otherUser = createMockUser({ id: 99, email: "taken@example.com" })
      mockUserRepo.getUserById!.mockResolvedValue(mockUser)
      mockUserRepo.getUserByEmail!.mockResolvedValue(otherUser)

      await expect(
        adminUserService.updateUserEmail(1, "taken@example.com"),
      ).rejects.toThrow("Email address is already in use by another account")
    })

    it("should throw when user has no Supabase auth account", async () => {
      const userNoAuth = createMockUser({ supabaseUserId: null })
      mockUserRepo.getUserById!.mockResolvedValue(userNoAuth)
      mockUserRepo.getUserByEmail!.mockResolvedValue(null)

      await expect(
        adminUserService.updateUserEmail(1, "new@example.com"),
      ).rejects.toThrow(
        "User does not have a linked Supabase auth account",
      )
    })

    it("should throw UserNotFoundError when user does not exist", async () => {
      mockUserRepo.getUserById!.mockResolvedValue(null)

      await expect(
        adminUserService.updateUserEmail(999, "new@example.com"),
      ).rejects.toThrow(UserNotFoundError)
    })
  })

  describe("toggleUserStatus", () => {
    it("should toggle user active status", async () => {
      const toggledUser = { ...mockUser, isActive: false }
      mockUserRepo.toggleActiveStatus!.mockResolvedValue(toggledUser)

      const result = await adminUserService.toggleUserStatus(1)

      expect(result.isActive).toBe(false)
    })

    it("should throw UserNotFoundError when user does not exist", async () => {
      mockUserRepo.toggleActiveStatus!.mockResolvedValue(null)

      await expect(
        adminUserService.toggleUserStatus(999),
      ).rejects.toThrow(UserNotFoundError)
    })
  })

  describe("createUser", () => {
    it("should create user in Supabase Auth and local DB", async () => {
      mockUserRepo.checkEmailExists!.mockResolvedValue(false)
      mockAuthAdapter.createUser!.mockResolvedValue({ id: "supabase-new-id" })
      mockUserRepo.createUser!.mockResolvedValue(mockUser)

      const result = await adminUserService.createUser({
        email: "new@example.com",
        password: "StrongPass1!",
        firstName: "New",
        lastName: "User",
        role: "student",
      })

      expect(result.email).toBe(mockUser.email)
      expect(mockAuthAdapter.createUser).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "StrongPass1!",
        emailConfirm: true,
      })
    })

    it("should throw when email already exists", async () => {
      mockUserRepo.checkEmailExists!.mockResolvedValue(true)

      await expect(
        adminUserService.createUser({
          email: "existing@example.com",
          password: "StrongPass1!",
          firstName: "Test",
          lastName: "User",
          role: "student",
        }),
      ).rejects.toThrow("already exists")
    })
  })

  describe("deleteUser", () => {
    it("should delete a student user", async () => {
      mockUserRepo.getUserById!.mockResolvedValue(mockUser)
      mockUserService.deleteAccount!.mockResolvedValue(undefined)

      await adminUserService.deleteUser(1)

      expect(mockClassService.deleteClassesByTeacher).not.toHaveBeenCalled()
      expect(mockUserService.deleteAccount).toHaveBeenCalledWith(1)
    })

    it("should delete teacher classes before deleting teacher", async () => {
      mockUserRepo.getUserById!.mockResolvedValue(mockTeacher)
      mockClassService.deleteClassesByTeacher!.mockResolvedValue(undefined)
      mockUserService.deleteAccount!.mockResolvedValue(undefined)

      await adminUserService.deleteUser(mockTeacher.id)

      expect(mockClassService.deleteClassesByTeacher).toHaveBeenCalledWith(
        mockTeacher.id,
      )
      expect(mockUserService.deleteAccount).toHaveBeenCalledWith(
        mockTeacher.id,
      )
    })

    it("should throw UserNotFoundError when user does not exist", async () => {
      mockUserRepo.getUserById!.mockResolvedValue(null)

      await expect(adminUserService.deleteUser(999)).rejects.toThrow(
        UserNotFoundError,
      )
    })
  })

  describe("getAllTeachers", () => {
    it("should return all teachers mapped to DTOs", async () => {
      mockUserRepo.getUsersByRole!.mockResolvedValue([mockTeacher])

      const result = await adminUserService.getAllTeachers()

      expect(result).toHaveLength(1)
      expect(result[0].role).toBe("teacher")
      expect(mockUserRepo.getUsersByRole).toHaveBeenCalledWith("teacher")
    })
  })
})
