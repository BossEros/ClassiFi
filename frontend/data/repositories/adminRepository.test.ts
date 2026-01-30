import { describe, it, expect, vi, beforeEach } from "vitest"

import * as adminRepository from "./adminRepository"
import { apiClient } from "@/data/api/apiClient"

// Mock the apiClient module
vi.mock("@/data/api/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe("adminRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // Fixtures
  // ============================================================================

  const mockUser = {
    id: 1,
    email: "user@example.com",
    firstName: "John",
    lastName: "Doe",
    role: "student",
    isActive: true,
    createdAt: "2024-01-01T00:00:00Z",
  }

  const mockClass = {
    id: 1,
    className: "Introduction to Programming",
    classCode: "CS101",
    teacherId: 1,
    teacherName: "Prof. Smith",
    studentCount: 30,
    isActive: true,
    yearLevel: 1,
    semester: 1,
    academicYear: "2024-2025",
    createdAt: "2024-01-01T00:00:00Z",
  }

  // ============================================================================
  // User Management Tests
  // ============================================================================

  describe("getAllUsersWithPaginationAndFilters", () => {
    const mockPaginatedResponse = {
      data: [mockUser],
      totalCount: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    }

    it("fetches all users with default options", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockPaginatedResponse,
        status: 200,
      })

      const result = await adminRepository.getAllUsersWithPaginationAndFilters(
        {},
      )

      expect(apiClient.get).toHaveBeenCalledWith("/admin/users?")
      expect(result).toEqual(mockPaginatedResponse)
    })

    it("passes pagination and filter options", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockPaginatedResponse,
        status: 200,
      })

      await adminRepository.getAllUsersWithPaginationAndFilters({
        pageNumber: 2,
        itemsPerPage: 20,
        searchQuery: "john",
        userRole: "student",
        accountStatus: "active",
      })

      expect(apiClient.get).toHaveBeenCalledWith(
        "/admin/users?page=2&limit=20&search=john&role=student&status=active",
      )
    })

    it("throws error when API fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Unauthorized",
        status: 401,
      })

      await expect(
        adminRepository.getAllUsersWithPaginationAndFilters({}),
      ).rejects.toThrow("Unauthorized")
    })
  })

  describe("getAdminUserDetailsById", () => {
    it("fetches a user by ID", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, user: mockUser },
        status: 200,
      })

      const result = await adminRepository.getAdminUserDetailsById(1)

      expect(apiClient.get).toHaveBeenCalledWith("/admin/users/1")
      expect(result.user).toEqual(mockUser)
    })

    it("throws error when user not found", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "User not found",
        status: 404,
      })

      await expect(
        adminRepository.getAdminUserDetailsById(999),
      ).rejects.toThrow("User not found")
    })
  })

  describe("createNewUserAccount", () => {
    const createData = {
      email: "newuser@example.com",
      firstName: "New",
      lastName: "User",
      role: "student" as const,
      password: "securePassword123",
    }

    it("creates a new user", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: true, user: { ...mockUser, ...createData } },
        status: 201,
      })

      const result = await adminRepository.createNewUserAccount(createData)

      expect(apiClient.post).toHaveBeenCalledWith("/admin/users", createData)
      expect(result.success).toBe(true)
    })

    it("throws error for duplicate email", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        error: "Email already exists",
        status: 409,
      })

      await expect(
        adminRepository.createNewUserAccount(createData),
      ).rejects.toThrow("Email already exists")
    })
  })

  describe("updateUserRoleById", () => {
    it("updates user role", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        data: { success: true, user: { ...mockUser, role: "teacher" } },
        status: 200,
      })

      const result = await adminRepository.updateUserRoleById(1, "teacher")

      expect(apiClient.patch).toHaveBeenCalledWith("/admin/users/1/role", {
        role: "teacher",
      })
      expect(result.user!.role).toBe("teacher")
    })

    it("throws error for invalid role", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        error: "Invalid role",
        status: 400,
      })

      await expect(
        adminRepository.updateUserRoleById(1, "invalid"),
      ).rejects.toThrow("Invalid role")
    })
  })

  describe("updateUserPersonalDetailsById", () => {
    it("updates user details", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        data: {
          success: true,
          user: { ...mockUser, firstName: "Jane", lastName: "Smith" },
        },
        status: 200,
      })

      const result = await adminRepository.updateUserPersonalDetailsById(1, {
        firstName: "Jane",
        lastName: "Smith",
      })

      expect(apiClient.patch).toHaveBeenCalledWith("/admin/users/1/details", {
        firstName: "Jane",
        lastName: "Smith",
      })
      expect(result.user!.firstName).toBe("Jane")
    })

    it("throws error when update fails", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        error: "Update failed",
        status: 500,
      })

      await expect(
        adminRepository.updateUserPersonalDetailsById(1, { firstName: "Jane" }),
      ).rejects.toThrow("Update failed")
    })
  })

  describe("updateUserEmailAddressById", () => {
    it("updates user email", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        data: {
          success: true,
          user: { ...mockUser, email: "new@example.com" },
        },
        status: 200,
      })

      const result = await adminRepository.updateUserEmailAddressById(
        1,
        "new@example.com",
      )

      expect(apiClient.patch).toHaveBeenCalledWith("/admin/users/1/email", {
        email: "new@example.com",
      })
      expect(result.user!.email).toBe("new@example.com")
    })

    it("throws error for duplicate email", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        error: "Email already in use",
        status: 409,
      })

      await expect(
        adminRepository.updateUserEmailAddressById(1, "existing@example.com"),
      ).rejects.toThrow("Email already in use")
    })
  })

  describe("toggleUserAccountStatusById", () => {
    it("toggles user active status", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        data: { success: true, user: { ...mockUser, isActive: false } },
        status: 200,
      })

      const result = await adminRepository.toggleUserAccountStatusById(1)

      expect(apiClient.patch).toHaveBeenCalledWith("/admin/users/1/status", {})
      expect(result.user!.isActive).toBe(false)
    })

    it("throws error when toggle fails", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        error: "Cannot deactivate admin",
        status: 403,
      })

      await expect(
        adminRepository.toggleUserAccountStatusById(1),
      ).rejects.toThrow("Cannot deactivate admin")
    })
  })

  describe("deleteUserAccountById", () => {
    it("deletes a user", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        data: { success: true, message: "User deleted" },
        status: 200,
      })

      const result = await adminRepository.deleteUserAccountById(1)

      expect(apiClient.delete).toHaveBeenCalledWith("/admin/users/1")
      expect(result.success).toBe(true)
    })

    it("throws error when deletion fails", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        error: "Cannot delete user with active enrollments",
        status: 400,
      })

      await expect(adminRepository.deleteUserAccountById(1)).rejects.toThrow(
        "Cannot delete user with active enrollments",
      )
    })
  })

  // ============================================================================
  // Analytics Tests
  // ============================================================================

  describe("getAdminDashboardStatistics", () => {
    const mockStats = {
      totalUsers: 100,
      totalStudents: 80,
      totalTeachers: 15,
      totalAdmins: 5,
      totalClasses: 25,
      activeClasses: 20,
      totalAssignments: 150,
    }

    it("fetches admin statistics", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockStats,
        status: 200,
      })

      const result = await adminRepository.getAdminDashboardStatistics()

      expect(apiClient.get).toHaveBeenCalledWith("/admin/stats")
      expect(result).toEqual(mockStats)
    })

    it("throws error when fetching fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Failed to fetch statistics",
        status: 500,
      })

      await expect(
        adminRepository.getAdminDashboardStatistics(),
      ).rejects.toThrow("Failed to fetch statistics")
    })
  })

  describe("getRecentAdminActivityLog", () => {
    const mockActivity = {
      activities: [
        {
          id: 1,
          type: "user_created",
          userId: 1,
          timestamp: "2024-01-01T00:00:00Z",
        },
      ],
    }

    it("fetches recent activity with default limit", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockActivity,
        status: 200,
      })

      const result = await adminRepository.getRecentAdminActivityLog()

      expect(apiClient.get).toHaveBeenCalledWith("/admin/activity?limit=10")
      expect(result).toEqual(mockActivity)
    })

    it("passes custom limit to API", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockActivity,
        status: 200,
      })

      await adminRepository.getRecentAdminActivityLog(20)

      expect(apiClient.get).toHaveBeenCalledWith("/admin/activity?limit=20")
    })

    it("throws error when fetching fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Activity log unavailable",
        status: 503,
      })

      await expect(adminRepository.getRecentAdminActivityLog()).rejects.toThrow(
        "Activity log unavailable",
      )
    })
  })

  // ============================================================================
  // Class Management Tests
  // ============================================================================

  describe("getAllClassesWithPaginationAndFilters", () => {
    const mockPaginatedResponse = {
      data: [mockClass],
      totalCount: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    }

    it("fetches all classes with default options", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockPaginatedResponse,
        status: 200,
      })

      const result =
        await adminRepository.getAllClassesWithPaginationAndFilters({})

      expect(apiClient.get).toHaveBeenCalledWith("/admin/classes?")
      expect(result).toEqual(mockPaginatedResponse)
    })

    it("passes all filter options", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockPaginatedResponse,
        status: 200,
      })

      await adminRepository.getAllClassesWithPaginationAndFilters({
        pageNumber: 1,
        itemsPerPage: 10,
        searchQuery: "intro",
        teacherId: 1,
        classStatus: "active",
        yearLevel: 1,
        semesterNumber: 1,
        academicYear: "2024-2025",
      })

      expect(apiClient.get).toHaveBeenCalledWith(
        "/admin/classes?page=1&limit=10&search=intro&teacherId=1&status=active&yearLevel=1&semester=1&academicYear=2024-2025",
      )
    })

    it("throws error when API fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Unauthorized",
        status: 401,
      })

      await expect(
        adminRepository.getAllClassesWithPaginationAndFilters({}),
      ).rejects.toThrow("Unauthorized")
    })
  })

  describe("getAdminClassDetailsById", () => {
    it("fetches a class by ID", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, class: mockClass },
        status: 200,
      })

      const result = await adminRepository.getAdminClassDetailsById(1)

      expect(apiClient.get).toHaveBeenCalledWith("/admin/classes/1")
      expect(result.class).toEqual(mockClass)
    })

    it("throws error when class not found", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Class not found",
        status: 404,
      })

      await expect(
        adminRepository.getAdminClassDetailsById(999),
      ).rejects.toThrow("Class not found")
    })
  })

  describe("createClass", () => {
    const createData = {
      className: "New Class",
      classCode: "NEW101",
      teacherId: 1,
      description: "A new class",
      yearLevel: 1,
      semester: 1,
      academicYear: "2024-2025",
      schedule: {
        days: ["monday" as const],
        startTime: "09:00",
        endTime: "10:30",
      },
    }

    it("creates a new class", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: true, class: { ...mockClass, ...createData } },
        status: 201,
      })

      const result = await adminRepository.createNewClass(createData)

      expect(apiClient.post).toHaveBeenCalledWith("/admin/classes", createData)
      expect(result.success).toBe(true)
    })

    it("throws error for duplicate class code", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        error: "Class code already exists",
        status: 409,
      })

      await expect(adminRepository.createNewClass(createData)).rejects.toThrow(
        "Class code already exists",
      )
    })
  })

  describe("updateClassDetailsById", () => {
    it("updates a class", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({
        data: { success: true, class: { ...mockClass, className: "Updated" } },
        status: 200,
      })

      const result = await adminRepository.updateClassDetailsById(1, {
        className: "Updated",
      })

      expect(apiClient.put).toHaveBeenCalledWith("/admin/classes/1", {
        className: "Updated",
      })
      expect(result.class!.className).toBe("Updated")
    })

    it("throws error when update fails", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({
        error: "Validation error",
        status: 400,
      })

      await expect(
        adminRepository.updateClassDetailsById(1, { className: "" }),
      ).rejects.toThrow("Validation error")
    })
  })

  describe("deleteClassById", () => {
    it("deletes a class", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        data: { success: true, message: "Class deleted" },
        status: 200,
      })

      const result = await adminRepository.deleteClassById(1)

      expect(apiClient.delete).toHaveBeenCalledWith("/admin/classes/1")
      expect(result.success).toBe(true)
    })

    it("throws error when class has students", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        error: "Cannot delete class with enrolled students",
        status: 400,
      })

      await expect(adminRepository.deleteClassById(1)).rejects.toThrow(
        "Cannot delete class with enrolled students",
      )
    })
  })

  describe("reassignClassTeacherById", () => {
    it("reassigns a class to a different teacher", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        data: { success: true, class: { ...mockClass, teacherId: 2 } },
        status: 200,
      })

      const result = await adminRepository.reassignClassTeacherById(1, 2)

      expect(apiClient.patch).toHaveBeenCalledWith(
        "/admin/classes/1/reassign",
        {
          teacherId: 2,
        },
      )
      expect(result.class!.teacherId).toBe(2)
    })

    it("throws error for invalid teacher", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        error: "Teacher not found",
        status: 404,
      })

      await expect(
        adminRepository.reassignClassTeacherById(1, 999),
      ).rejects.toThrow("Teacher not found")
    })
  })

  describe("archiveClassById", () => {
    it("archives a class", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        data: { success: true, class: { ...mockClass, isActive: false } },
        status: 200,
      })

      const result = await adminRepository.archiveClassById(1)

      expect(apiClient.patch).toHaveBeenCalledWith(
        "/admin/classes/1/archive",
        {},
      )
      expect(result.class!.isActive).toBe(false)
    })

    it("throws error when archive fails", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        error: "Archive failed",
        status: 500,
      })

      await expect(adminRepository.archiveClassById(1)).rejects.toThrow(
        "Archive failed",
      )
    })
  })

  describe("getAllTeacherAccounts", () => {
    const mockTeachers = {
      teachers: [
        {
          id: 1,
          firstName: "John",
          lastName: "Smith",
          email: "john@example.com",
        },
      ],
    }

    it("fetches all teachers", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockTeachers,
        status: 200,
      })

      const result = await adminRepository.getAllTeacherAccounts()

      expect(apiClient.get).toHaveBeenCalledWith("/admin/teachers")
      expect(result.teachers).toHaveLength(1)
    })

    it("throws error when fetching fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Failed to fetch teachers",
        status: 500,
      })

      await expect(adminRepository.getAllTeacherAccounts()).rejects.toThrow(
        "Failed to fetch teachers",
      )
    })
  })

  // ============================================================================
  // Class Enrollment Management Tests
  // ============================================================================

  describe("getEnrolledStudentsInClassById", () => {
    const mockStudents = {
      students: [
        {
          id: 1,
          firstName: "Jane",
          lastName: "Doe",
          email: "jane@example.com",
        },
      ],
    }

    it("fetches students for a class", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockStudents,
        status: 200,
      })

      const result = await adminRepository.getEnrolledStudentsInClassById(1)

      expect(apiClient.get).toHaveBeenCalledWith("/admin/classes/1/students")
      expect(result.students).toHaveLength(1)
    })

    it("throws error when class not found", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Class not found",
        status: 404,
      })

      await expect(
        adminRepository.getEnrolledStudentsInClassById(999),
      ).rejects.toThrow("Class not found")
    })
  })

  describe("getAllAssignmentsInClassById", () => {
    const mockAssignments = {
      assignments: [
        { id: 1, assignmentName: "Test", deadline: "2024-12-31T23:59:59Z" },
      ],
    }

    it("fetches assignments for a class", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockAssignments,
        status: 200,
      })

      const result = await adminRepository.getAllAssignmentsInClassById(1)

      expect(apiClient.get).toHaveBeenCalledWith("/admin/classes/1/assignments")
      expect(result.assignments).toHaveLength(1)
    })

    it("throws error when class not found", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Class not found",
        status: 404,
      })

      await expect(
        adminRepository.getAllAssignmentsInClassById(999),
      ).rejects.toThrow("Class not found")
    })
  })

  describe("enrollStudentInClassById", () => {
    it("adds a student to a class", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { success: true, message: "Student added" },
        status: 200,
      })

      const result = await adminRepository.enrollStudentInClassById(1, 10)

      expect(apiClient.post).toHaveBeenCalledWith("/admin/classes/1/students", {
        studentId: 10,
      })
      expect(result.success).toBe(true)
    })

    it("throws error when student already enrolled", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        error: "Student already enrolled",
        status: 409,
      })

      await expect(
        adminRepository.enrollStudentInClassById(1, 10),
      ).rejects.toThrow("Student already enrolled")
    })
  })

  describe("unenrollStudentFromClassById", () => {
    it("removes a student from a class", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        data: { success: true, message: "Student removed" },
        status: 200,
      })

      const result = await adminRepository.unenrollStudentFromClassById(1, 10)

      expect(apiClient.delete).toHaveBeenCalledWith(
        "/admin/classes/1/students/10",
      )
      expect(result.success).toBe(true)
    })

    it("throws error when student not enrolled", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        error: "Student not enrolled in class",
        status: 400,
      })

      await expect(
        adminRepository.unenrollStudentFromClassById(1, 999),
      ).rejects.toThrow("Student not enrolled in class")
    })
  })
})
