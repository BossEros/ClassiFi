import { describe, it, expect, beforeEach, vi } from "vitest"
import type { MockedObject } from "vitest"
import { AdminUserService } from "../../src/modules/admin/admin-user.service.js"
import type { UserRepository } from "../../src/modules/users/user.repository.js"
import type { ClassService } from "../../src/modules/classes/class.service.js"
import type { SupabaseAuthAdapter } from "../../src/services/supabase-auth.adapter.js"
import type { NotificationService } from "../../src/modules/notifications/notification.service.js"
import {
  UserNotFoundError,
  InvalidRoleError,
  TeacherHasAssignedClassesError,
} from "../../src/shared/errors.js"
import { createMockUser, createMockTeacher } from "../utils/factories.js"

describe("AdminUserService", () => {
  let adminUserService: AdminUserService
  let mockUserRepo: Partial<MockedObject<UserRepository>>
  let mockClassService: Partial<MockedObject<ClassService>>
  let mockNotificationService: Partial<MockedObject<NotificationService>>
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

    mockClassService = {
      deleteClassesByTeacher: vi.fn(),
      getAssignedClassCountByTeacher: vi.fn(),
    } as any
    mockClassService.getAssignedClassCountByTeacher!.mockResolvedValue(0)

    mockNotificationService = {
      sendEmailNotificationIfEnabled: vi.fn(),
    } as any

    mockAuthAdapter = {
      createUser: vi.fn(),
      updateUserEmail: vi.fn(),
    } as any

    adminUserService = new AdminUserService(
      mockUserRepo as unknown as UserRepository,
      mockClassService as unknown as ClassService,
      mockNotificationService as unknown as NotificationService,
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
      expect(result.data[0].assignedClassCount).toBe(0)
      expect(result.data[1].assignedClassCount).toBe(0)
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
      expect(result.assignedClassCount).toBe(0)
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
      mockUserRepo.getUserById!.mockResolvedValue(mockUser)
      mockUserRepo.toggleActiveStatus!.mockResolvedValue(toggledUser)

      const result = await adminUserService.toggleUserStatus(1)

      expect(result.isActive).toBe(false)
      expect(
        mockNotificationService.sendEmailNotificationIfEnabled,
      ).not.toHaveBeenCalled()
    })

    it("should send an approval email when an inactive teacher is activated", async () => {
      const pendingTeacher = createMockTeacher({ id: 25, isActive: false })
      const approvedTeacher = { ...pendingTeacher, isActive: true }
      mockUserRepo.getUserById!.mockResolvedValue(pendingTeacher)
      mockUserRepo.toggleActiveStatus!.mockResolvedValue(approvedTeacher)

      const result = await adminUserService.toggleUserStatus(25)

      expect(result.isActive).toBe(true)
      expect(
        mockNotificationService.sendEmailNotificationIfEnabled,
      ).toHaveBeenCalledWith(25, "TEACHER_APPROVED", {
        teacherName: `${approvedTeacher.firstName} ${approvedTeacher.lastName}`,
        loginUrl: "http://localhost:5173/login",
      })
    })

    it("should not send an approval email when a teacher is deactivated", async () => {
      const activeTeacher = createMockTeacher({ id: 30, isActive: true })
      const deactivatedTeacher = { ...activeTeacher, isActive: false }
      mockUserRepo.getUserById!.mockResolvedValue(activeTeacher)
      mockUserRepo.toggleActiveStatus!.mockResolvedValue(deactivatedTeacher)

      await adminUserService.toggleUserStatus(30)

      expect(
        mockNotificationService.sendEmailNotificationIfEnabled,
      ).not.toHaveBeenCalled()
    })

    it("should throw UserNotFoundError when user does not exist", async () => {
      mockUserRepo.getUserById!.mockResolvedValue(null)

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

  describe("deactivateUser", () => {
    it("should deactivate a student user without deleting records", async () => {
      const deactivatedUser = createMockUser({ isActive: false })
      mockUserRepo.getUserById!.mockResolvedValue(mockUser)
      mockUserRepo.updateUser!.mockResolvedValue(deactivatedUser)

      await adminUserService.deactivateUser(1)

      expect(mockClassService.deleteClassesByTeacher).not.toHaveBeenCalled()
      expect(
        mockClassService.getAssignedClassCountByTeacher,
      ).not.toHaveBeenCalled()
      expect(mockUserRepo.updateUser).toHaveBeenCalledWith(1, {
        isActive: false,
      })
    })

    it("should deactivate a teacher when no classes are assigned", async () => {
      const deactivatedTeacher = createMockTeacher({ isActive: false })
      mockUserRepo.getUserById!.mockResolvedValue(mockTeacher)
      mockClassService.getAssignedClassCountByTeacher!.mockResolvedValue(0)
      mockUserRepo.updateUser!.mockResolvedValue(deactivatedTeacher)

      await adminUserService.deactivateUser(mockTeacher.id)

      expect(mockClassService.getAssignedClassCountByTeacher).toHaveBeenCalledWith(
        mockTeacher.id,
      )
      expect(mockUserRepo.updateUser).toHaveBeenCalledWith(mockTeacher.id, {
        isActive: false,
      })
    })

    it("should block teacher deactivation when classes are still assigned", async () => {
      mockUserRepo.getUserById!.mockResolvedValue(mockTeacher)
      mockClassService.getAssignedClassCountByTeacher!.mockResolvedValue(2)

      await expect(
        adminUserService.deactivateUser(mockTeacher.id),
      ).rejects.toThrow(TeacherHasAssignedClassesError)

      expect(mockUserRepo.updateUser).not.toHaveBeenCalled()
    })

    it("should throw UserNotFoundError when user does not exist", async () => {
      mockUserRepo.getUserById!.mockResolvedValue(null)

      await expect(adminUserService.deactivateUser(999)).rejects.toThrow(
        UserNotFoundError,
      )
    })

    it("should keep deleteUser as a compatibility wrapper", async () => {
      const deactivatedUser = createMockUser({ isActive: false })
      mockUserRepo.getUserById!.mockResolvedValue(mockUser)
      mockUserRepo.updateUser!.mockResolvedValue(deactivatedUser)

      await adminUserService.deleteUser(1)

      expect(mockUserRepo.updateUser).toHaveBeenCalledWith(1, {
        isActive: false,
      })
    })
  })

  describe("getAllTeachers", () => {
    it("should return all teachers mapped to DTOs", async () => {
      mockUserRepo.getUsersByRole!.mockResolvedValue([mockTeacher])

      const result = await adminUserService.getAllTeachers()

      expect(result).toHaveLength(1)
      expect(result[0].role).toBe("teacher")
      expect(result[0].assignedClassCount).toBe(0)
      expect(mockUserRepo.getUsersByRole).toHaveBeenCalledWith("teacher")
    })
  })
})
