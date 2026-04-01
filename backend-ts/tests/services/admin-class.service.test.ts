import { describe, it, expect, beforeEach, vi } from "vitest"
import type { MockedObject } from "vitest"
import { AdminClassService } from "../../src/modules/admin/admin-class.service.js"
import type { ClassRepository } from "../../src/modules/classes/class.repository.js"
import type { UserRepository } from "../../src/modules/users/user.repository.js"
import type { SubmissionRepository } from "../../src/modules/submissions/submission.repository.js"
import type { ClassService } from "../../src/modules/classes/class.service.js"
import {
  ClassNotFoundError,
  UserNotFoundError,
  InvalidRoleError,
} from "../../src/shared/errors.js"
import {
  createMockClass,
  createMockTeacher,
  createMockUser,
} from "../utils/factories.js"

describe("AdminClassService", () => {
  let adminClassService: AdminClassService
  let mockClassRepo: Partial<MockedObject<ClassRepository>>
  let mockUserRepo: Partial<MockedObject<UserRepository>>
  let mockSubmissionRepo: Partial<MockedObject<SubmissionRepository>>
  let mockClassService: Partial<MockedObject<ClassService>>

  const mockTeacher = createMockTeacher()
  const mockClass = createMockClass({ teacherId: mockTeacher.id })

  beforeEach(() => {
    vi.clearAllMocks()

    mockClassRepo = {
      getAllClassesFiltered: vi.fn(),
      getClassWithTeacher: vi.fn(),
      getClassById: vi.fn(),
      getStudentCount: vi.fn(),
      createClass: vi.fn(),
      updateClass: vi.fn(),
      checkClassCodeExists: vi.fn(),
    } as any

    mockUserRepo = {
      getUserById: vi.fn(),
    } as any

    mockSubmissionRepo = {
      getSubmissionsByAssignment: vi.fn(),
    } as any

    mockClassService = {
      forceDeleteClass: vi.fn(),
      getClassAssignments: vi.fn(),
    } as any

    adminClassService = new AdminClassService(
      mockClassRepo as unknown as ClassRepository,
      mockUserRepo as unknown as UserRepository,
      mockSubmissionRepo as unknown as SubmissionRepository,
      mockClassService as unknown as ClassService,
    )
  })

  describe("getAllClasses", () => {
    it("should return paginated classes with teacher info", async () => {
      const classRow = {
        ...mockClass,
        teacherName: "Test Teacher",
        teacherEmail: "teacher@example.com",
        teacherAvatarUrl: null,
        studentCount: 5,
      }
      mockClassRepo.getAllClassesFiltered!.mockResolvedValue({
        data: [classRow],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      })

      const result = await adminClassService.getAllClasses({
        page: 1,
        limit: 10,
        status: "all",
      })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].teacherName).toBe("Test Teacher")
      expect(mockClassRepo.getAllClassesFiltered).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        teacherId: undefined,
        status: undefined,
        semester: undefined,
        academicYear: undefined,
      })
    })

    it("should pass through specific filters", async () => {
      mockClassRepo.getAllClassesFiltered!.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      })

      await adminClassService.getAllClasses({
        page: 1,
        limit: 10,
        status: "active",
        teacherId: 2,
        semester: 1,
        academicYear: "2024-2025",
      })

      expect(mockClassRepo.getAllClassesFiltered).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "active",
          teacherId: 2,
          semester: 1,
          academicYear: "2024-2025",
        }),
      )
    })
  })

  describe("getClassById", () => {
    it("should return class with teacher info and student count", async () => {
      const classWithTeacher = {
        ...mockClass,
        teacherName: "Test Teacher",
        teacherEmail: "teacher@example.com",
        teacherAvatarUrl: null,
      }
      mockClassRepo.getClassWithTeacher!.mockResolvedValue(classWithTeacher)
      mockClassRepo.getStudentCount!.mockResolvedValue(10)

      const result = await adminClassService.getClassById(1)

      expect(result.teacherName).toBe("Test Teacher")
      expect(result.studentCount).toBe(10)
    })

    it("should throw ClassNotFoundError when class does not exist", async () => {
      mockClassRepo.getClassWithTeacher!.mockResolvedValue(null)

      await expect(adminClassService.getClassById(999)).rejects.toThrow(
        ClassNotFoundError,
      )
    })
  })

  describe("createClass", () => {
    it("should create a class with valid teacher", async () => {
      mockUserRepo.getUserById!.mockResolvedValue(mockTeacher)
      mockClassRepo.checkClassCodeExists!.mockResolvedValue(false)
      mockClassRepo.createClass!.mockResolvedValue(mockClass)

      const result = await adminClassService.createClass({
        teacherId: mockTeacher.id,
        className: "New Class",
        semester: 1,
        academicYear: "2024-2025",
        schedule: {
          days: ["monday"],
          startTime: "09:00",
          endTime: "10:30",
        },
      })

      expect(result.className).toBeDefined()
    })

    it("should throw UserNotFoundError when teacher does not exist", async () => {
      mockUserRepo.getUserById!.mockResolvedValue(null)

      await expect(
        adminClassService.createClass({
          teacherId: 999,
          className: "New Class",
          semester: 1,
          academicYear: "2024-2025",
          schedule: {
            days: ["monday"],
            startTime: "09:00",
            endTime: "10:30",
          },
        }),
      ).rejects.toThrow(UserNotFoundError)
    })

    it("should throw InvalidRoleError when user is not a teacher", async () => {
      const student = createMockUser({ role: "student" })
      mockUserRepo.getUserById!.mockResolvedValue(student)

      await expect(
        adminClassService.createClass({
          teacherId: student.id,
          className: "New Class",
          semester: 1,
          academicYear: "2024-2025",
          schedule: {
            days: ["monday"],
            startTime: "09:00",
            endTime: "10:30",
          },
        }),
      ).rejects.toThrow(InvalidRoleError)
    })
  })

  describe("updateClass", () => {
    it("should update class properties", async () => {
      const updatedClass = { ...mockClass, className: "Updated Class" }
      mockClassRepo.getClassById!.mockResolvedValue(mockClass)
      mockClassRepo.updateClass!.mockResolvedValue(updatedClass)
      mockClassRepo.getStudentCount!.mockResolvedValue(5)

      const result = await adminClassService.updateClass(1, {
        className: "Updated Class",
      })

      expect(result.className).toBe("Updated Class")
    })

    it("should validate new teacher when reassigning", async () => {
      const newTeacher = createMockTeacher({ id: 3 })
      mockClassRepo.getClassById!.mockResolvedValue(mockClass)
      mockUserRepo.getUserById!.mockResolvedValue(newTeacher)
      mockClassRepo.updateClass!.mockResolvedValue({
        ...mockClass,
        teacherId: 3,
      })
      mockClassRepo.getStudentCount!.mockResolvedValue(5)

      await adminClassService.updateClass(1, { teacherId: 3 })

      expect(mockUserRepo.getUserById).toHaveBeenCalledWith(3)
    })

    it("should throw when reassigning to non-teacher role", async () => {
      const student = createMockUser({ id: 3, role: "student" })
      mockClassRepo.getClassById!.mockResolvedValue(mockClass)
      mockUserRepo.getUserById!.mockResolvedValue(student)

      await expect(
        adminClassService.updateClass(1, { teacherId: 3 }),
      ).rejects.toThrow(InvalidRoleError)
    })

    it("should throw ClassNotFoundError when class does not exist", async () => {
      mockClassRepo.getClassById!.mockResolvedValue(null)

      await expect(
        adminClassService.updateClass(999, { className: "Test" }),
      ).rejects.toThrow(ClassNotFoundError)
    })
  })

  describe("deleteClass", () => {
    it("should delegate to classService forceDeleteClass", async () => {
      mockClassService.forceDeleteClass!.mockResolvedValue(undefined)

      await adminClassService.deleteClass(1)

      expect(mockClassService.forceDeleteClass).toHaveBeenCalledWith(1)
    })
  })

  describe("archiveClass", () => {
    it("should set class to inactive and return updated class", async () => {
      const archivedClass = {
        ...mockClass,
        isActive: false,
        teacherName: "Test Teacher",
        teacherEmail: "teacher@example.com",
        teacherAvatarUrl: null,
      }

      mockClassRepo.getClassById!.mockResolvedValue(mockClass)
      mockClassRepo.updateClass!.mockResolvedValue({
        ...mockClass,
        isActive: false,
      })
      mockClassRepo.getStudentCount!.mockResolvedValue(5)
      mockClassRepo.getClassWithTeacher!.mockResolvedValue(archivedClass)

      const result = await adminClassService.archiveClass(1)

      expect(result.isActive).toBe(false)
    })
  })

  describe("getClassAssignments", () => {
    it("should return assignments with submission counts", async () => {
      const assignment = {
        id: 1,
        assignmentName: "Test Assignment",
        instructions: "Do something",
        deadline: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      }
      mockClassRepo.getClassById!.mockResolvedValue(mockClass)
      mockClassService.getClassAssignments!.mockResolvedValue([assignment])
      mockSubmissionRepo.getSubmissionsByAssignment!.mockResolvedValue([])

      const result = await adminClassService.getClassAssignments(1)

      expect(result).toHaveLength(1)
      expect(result[0].submissionCount).toBe(0)
    })

    it("should throw ClassNotFoundError when class does not exist", async () => {
      mockClassRepo.getClassById!.mockResolvedValue(null)

      await expect(
        adminClassService.getClassAssignments(999),
      ).rejects.toThrow(ClassNotFoundError)
    })
  })
})
