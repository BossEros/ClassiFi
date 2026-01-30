import { describe, it, expect, beforeEach, vi } from "vitest"
import { ClassService } from "../../src/services/class.service.js"
import type { ClassRepository } from "../../src/repositories/class.repository.js"
import type { AssignmentRepository } from "../../src/repositories/assignment.repository.js"
import type { EnrollmentRepository } from "../../src/repositories/enrollment.repository.js"
import type { UserRepository } from "../../src/repositories/user.repository.js"
import {
  ClassNotFoundError,
  NotClassOwnerError,
  InvalidRoleError,
} from "../../src/shared/errors.js"
import {
  createMockClass,
  createMockTeacher,
  createMockUser,
} from "../utils/factories.js"

describe("ClassService", () => {
  let classService: ClassService
  let mockClassRepo: Partial<jest.Mocked<ClassRepository>>
  let mockAssignmentRepo: Partial<jest.Mocked<AssignmentRepository>>
  let mockEnrollmentRepo: Partial<jest.Mocked<EnrollmentRepository>>
  let mockUserRepo: Partial<jest.Mocked<UserRepository>>

  beforeEach(() => {
    mockClassRepo = {
      createClass: vi.fn(),
      getClassById: vi.fn(),
      checkClassCodeExists: vi.fn(),
      getStudentCount: vi.fn(),
      getClassesWithStudentCounts: vi.fn(),
      updateClass: vi.fn(),
      deleteClass: vi.fn(),
    } as any

    mockAssignmentRepo = {} as any
    mockEnrollmentRepo = {} as any

    mockUserRepo = {
      getUserById: vi.fn(),
    } as any

    classService = new ClassService(
      mockClassRepo as ClassRepository,
      mockAssignmentRepo as AssignmentRepository,
      mockEnrollmentRepo as EnrollmentRepository,
      mockUserRepo as UserRepository,
    )
  })

  describe("createClass", () => {
    it("should create a class successfully", async () => {
      const teacher = createMockTeacher()
      const newClass = createMockClass({ teacherId: teacher.id })

      mockUserRepo.getUserById!.mockResolvedValue(teacher)
      mockClassRepo.checkClassCodeExists!.mockResolvedValue(false)
      mockClassRepo.createClass!.mockResolvedValue(newClass)
      mockClassRepo.getStudentCount!.mockResolvedValue(0)

      const result = await classService.createClass(
        teacher.id,
        newClass.className,
        "ABC12345", // Passed directly, though service generates code if needed, but here code is passed
        newClass.yearLevel,
        newClass.semester,
        newClass.academicYear,
        newClass.schedule,
      )

      expect(result).toBeDefined()
      expect(result.id).toBe(newClass.id)
      expect(result.studentCount).toBe(0)
      expect(mockClassRepo.createClass).toHaveBeenCalled()
    })

    it("should throw InvalidRoleError if user is not found", async () => {
      mockUserRepo.getUserById!.mockResolvedValue(undefined)

      await expect(
        classService.createClass(
          999,
          "Test Class",
          "ABCDEFGH",
          1,
          1,
          "2024-2025",
          { days: ["monday"], startTime: "10:00", endTime: "11:00" },
        ),
      ).rejects.toThrow(InvalidRoleError)
    })

    it("should throw InvalidRoleError if user is not a teacher", async () => {
      const student = createMockUser({ role: "student" })
      mockUserRepo.getUserById!.mockResolvedValue(student)

      await expect(
        classService.createClass(student.id, "Test", "ABCDEFGH", 1, 1, "2024", {
          days: ["monday"],
          startTime: "10:00",
          endTime: "11:00",
        }),
      ).rejects.toThrow(InvalidRoleError)
    })

    it("should retry code generation if collision occurs", async () => {
      // Note: generateClassCode is private-ish, but used internally.
      // We test the side-effect via checkClassCodeExists mocks if we were using generateClassCode.
      // However, createClass accepts a classCode string, so generation happens in the controller mostly?
      // Checking service: createClass accepts classCode.
      // The service has generateClassCode() public method. Let's test that separately.
    })
  })

  describe("generateClassCode", () => {
    it("should generate a unique code and retry on collision", async () => {
      mockClassRepo
        .checkClassCodeExists!.mockResolvedValueOnce(true) // First attempt exists
        .mockResolvedValueOnce(false) // Second attempt is unique

      const code = await classService.generateClassCode()

      expect(code).toHaveLength(8)
      expect(mockClassRepo.checkClassCodeExists).toHaveBeenCalledTimes(2)
    })
  })

  describe("getClassById", () => {
    it("should return class details successfully", async () => {
      const mockClass = createMockClass()
      mockClassRepo.getClassById!.mockResolvedValue(mockClass)
      mockClassRepo.getStudentCount!.mockResolvedValue(5)

      const result = await classService.getClassById(1)

      expect(result.id).toBe(mockClass.id)
      expect(result.studentCount).toBe(5)
    })

    it("should verify ownership validly", async () => {
      const mockClass = createMockClass({ teacherId: 10 })
      mockClassRepo.getClassById!.mockResolvedValue(mockClass)
      mockClassRepo.getStudentCount!.mockResolvedValue(0)

      // Same teacher ID -> success
      await expect(classService.getClassById(1, 10)).resolves.not.toThrow()
    })

    it("should throw NotClassOwnerError if teacher mismatch", async () => {
      const mockClass = createMockClass({ teacherId: 10 })
      mockClassRepo.getClassById!.mockResolvedValue(mockClass)

      // Different teacher ID -> error
      await expect(classService.getClassById(1, 999)).rejects.toThrow(
        NotClassOwnerError,
      )
    })

    it("should throw ClassNotFoundError if class does not exist", async () => {
      mockClassRepo.getClassById!.mockResolvedValue(undefined)

      await expect(classService.getClassById(999)).rejects.toThrow(
        ClassNotFoundError,
      )
    })
  })

  describe("getClassesByTeacher", () => {
    it("should return classes with student counts using optimized method", async () => {
      const classesWithCounts = [
        { ...createMockClass({ id: 1 }), studentCount: 10 },
        { ...createMockClass({ id: 2 }), studentCount: 5 },
      ]

      mockClassRepo.getClassesWithStudentCounts!.mockResolvedValue(
        classesWithCounts,
      )

      const result = await classService.getClassesByTeacher(1)

      expect(result).toHaveLength(2)
      expect(result[0].studentCount).toBe(10)
      expect(result[1].studentCount).toBe(5)
      expect(mockClassRepo.getClassesWithStudentCounts).toHaveBeenCalledWith(
        1,
        true,
      )
    })
  })

  describe("updateClass", () => {
    it("should update class successfully", async () => {
      const existingClass = createMockClass({ teacherId: 1 })
      const updatedData = { ...existingClass, className: "Updated" }

      mockClassRepo.getClassById!.mockResolvedValue(existingClass)
      mockClassRepo.updateClass!.mockResolvedValue(updatedData)
      mockClassRepo.getStudentCount!.mockResolvedValue(0)

      const result = await classService.updateClass(1, 1, {
        className: "Updated",
      })

      expect(result.className).toBe("Updated")
    })

    it("should throw ClassNotFoundError if class missing", async () => {
      mockClassRepo.getClassById!.mockResolvedValue(undefined)

      await expect(classService.updateClass(1, 1, {})).rejects.toThrow(
        ClassNotFoundError,
      )
    })

    it("should throw NotClassOwnerError if not owner", async () => {
      const existingClass = createMockClass({ teacherId: 1 })
      mockClassRepo.getClassById!.mockResolvedValue(existingClass)

      await expect(classService.updateClass(1, 999, {})).rejects.toThrow(
        NotClassOwnerError,
      )
    })
  })

  describe("deleteClass", () => {
    it("should delete class successfully", async () => {
      const existingClass = createMockClass({ teacherId: 1 })
      mockClassRepo.getClassById!.mockResolvedValue(existingClass)
      mockClassRepo.deleteClass!.mockResolvedValue(true)

      await classService.deleteClass(1, 1)

      expect(mockClassRepo.deleteClass).toHaveBeenCalledWith(1)
    })

    it("should throw ClassNotFoundError if class missing", async () => {
      mockClassRepo.getClassById!.mockResolvedValue(undefined)

      await expect(classService.deleteClass(1, 1)).rejects.toThrow(
        ClassNotFoundError,
      )
    })

    it("should throw NotClassOwnerError if not owner", async () => {
      const existingClass = createMockClass({ teacherId: 1 })
      mockClassRepo.getClassById!.mockResolvedValue(existingClass)

      await expect(classService.deleteClass(1, 999)).rejects.toThrow(
        NotClassOwnerError,
      )
    })
  })
})
