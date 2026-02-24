import { describe, it, expect, beforeEach, vi } from "vitest"
import type { MockedObject } from "vitest"
import { ClassService } from "../../src/modules/classes/class.service.js"
import type { ClassRepository } from "../../src/modules/classes/class.repository.js"
import type { AssignmentRepository } from "../../src/modules/assignments/assignment.repository.js"
import type { EnrollmentRepository } from "../../src/modules/enrollments/enrollment.repository.js"
import type { UserRepository } from "../../src/modules/users/user.repository.js"
import type { SubmissionRepository } from "../../src/modules/submissions/submission.repository.js"
import type { StorageService } from "../../src/services/storage.service.js"
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
  let mockClassRepo: Partial<MockedObject<ClassRepository>>
  let mockAssignmentRepo: Partial<MockedObject<AssignmentRepository>>
  let mockEnrollmentRepo: Partial<MockedObject<EnrollmentRepository>>
  let mockUserRepo: Partial<MockedObject<UserRepository>>
  let mockSubmissionRepo: Partial<MockedObject<SubmissionRepository>>
  let mockStorageService: Partial<MockedObject<StorageService>>

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

    mockAssignmentRepo = {
      getAssignmentsByClassId: vi.fn(),
    } as any
    mockEnrollmentRepo = {} as any

    mockUserRepo = {
      getUserById: vi.fn(),
    } as any

    mockSubmissionRepo = {
      getSubmissionsByClass: vi.fn(),
      getLatestSubmissionCountsByAssignmentIds: vi.fn(),
    } as any
    mockStorageService = {
      deleteSubmissionFiles: vi.fn(),
      deleteAssignmentInstructionsImage: vi.fn(),
    } as any

    classService = new ClassService(
      mockClassRepo as unknown as ClassRepository,
      mockAssignmentRepo as unknown as AssignmentRepository,
      mockEnrollmentRepo as unknown as EnrollmentRepository,
      mockUserRepo as unknown as UserRepository,
      mockSubmissionRepo as unknown as SubmissionRepository,
      mockStorageService as unknown as StorageService,
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

      const result = await classService.createClass({
        teacherId: teacher.id,
        className: newClass.className,
        classCode: "ABC12345",
        yearLevel: newClass.yearLevel,
        semester: newClass.semester,
        academicYear: newClass.academicYear,
        schedule: newClass.schedule,
      })

      expect(result).toBeDefined()
      expect(result.id).toBe(newClass.id)
      expect(result.studentCount).toBe(0)
      expect(mockClassRepo.createClass).toHaveBeenCalled()
    })

    it("should throw InvalidRoleError if user is not found", async () => {
      mockUserRepo.getUserById!.mockResolvedValue(undefined)

      await expect(
        classService.createClass({
          teacherId: 999,
          className: "Test Class",
          classCode: "ABCDEFGH",
          yearLevel: 1,
          semester: 1,
          academicYear: "2024-2025",
          schedule: { days: ["monday"], startTime: "10:00", endTime: "11:00" },
        }),
      ).rejects.toThrow(InvalidRoleError)
    })

    it("should throw InvalidRoleError if user is not a teacher", async () => {
      const student = createMockUser({ role: "student" })
      mockUserRepo.getUserById!.mockResolvedValue(student)

      await expect(
        classService.createClass({
          teacherId: student.id,
          className: "Test",
          classCode: "ABCDEFGH",
          yearLevel: 1,
          semester: 1,
          academicYear: "2024",
          schedule: {
            days: ["monday"],
            startTime: "10:00",
            endTime: "11:00",
          },
        }),
      ).rejects.toThrow(InvalidRoleError)
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

  describe("getClassAssignments", () => {
    it("should return assignments with submission and student counts", async () => {
      const classAssignments = [
        {
          id: 11,
          classId: 1,
          assignmentName: "Intro Quiz",
          instructions: "Test",
          instructionsImageUrl: null,
          programmingLanguage: "python",
          deadline: null,
          allowResubmission: true,
          maxAttempts: null,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          isActive: true,
          templateCode: null,
          totalScore: 100,
          scheduledDate: null,
          allowLateSubmissions: false,
          latePenaltyConfig: null,
          lastReminderSentAt: null,
        },
      ]

      mockAssignmentRepo.getAssignmentsByClassId!.mockResolvedValue(
        classAssignments as any,
      )
      mockClassRepo.getStudentCount!.mockResolvedValue(30)
      mockSubmissionRepo.getLatestSubmissionCountsByAssignmentIds!.mockResolvedValue(
        new Map([[11, 12]]),
      )

      const result = await classService.getClassAssignments(1)

      expect(result).toHaveLength(1)
      expect(result[0].submissionCount).toBe(12)
      expect(result[0].studentCount).toBe(30)
      expect(
        mockSubmissionRepo.getLatestSubmissionCountsByAssignmentIds,
      ).toHaveBeenCalledWith([11])
    })

    it("should default submission count to zero when no submissions exist", async () => {
      const classAssignments = [
        {
          id: 22,
          classId: 1,
          assignmentName: "No Submissions Yet",
          instructions: "Test",
          instructionsImageUrl: null,
          programmingLanguage: "python",
          deadline: null,
          allowResubmission: true,
          maxAttempts: null,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          isActive: true,
          templateCode: null,
          totalScore: 100,
          scheduledDate: null,
          allowLateSubmissions: false,
          latePenaltyConfig: null,
          lastReminderSentAt: null,
        },
      ]

      mockAssignmentRepo.getAssignmentsByClassId!.mockResolvedValue(
        classAssignments as any,
      )
      mockClassRepo.getStudentCount!.mockResolvedValue(18)
      mockSubmissionRepo.getLatestSubmissionCountsByAssignmentIds!.mockResolvedValue(
        new Map(),
      )

      const result = await classService.getClassAssignments(1)

      expect(result).toHaveLength(1)
      expect(result[0].submissionCount).toBe(0)
      expect(result[0].studentCount).toBe(18)
    })
  })

  describe("updateClass", () => {
    it("should update class successfully", async () => {
      const existingClass = createMockClass({ teacherId: 1 })
      const updatedData = { ...existingClass, className: "Updated" }

      mockClassRepo.getClassById!.mockResolvedValue(existingClass)
      mockClassRepo.updateClass!.mockResolvedValue(updatedData)
      mockClassRepo.getStudentCount!.mockResolvedValue(0)

      const result = await classService.updateClass({
        classId: 1,
        teacherId: 1,
        className: "Updated",
      })

      expect(result.className).toBe("Updated")
    })

    it("should throw ClassNotFoundError if class missing", async () => {
      mockClassRepo.getClassById!.mockResolvedValue(undefined)

      await expect(
        classService.updateClass({ classId: 1, teacherId: 1 }),
      ).rejects.toThrow(ClassNotFoundError)
    })

    it("should throw NotClassOwnerError if not owner", async () => {
      const existingClass = createMockClass({ teacherId: 1 })
      mockClassRepo.getClassById!.mockResolvedValue(existingClass)

      await expect(
        classService.updateClass({ classId: 1, teacherId: 999 }),
      ).rejects.toThrow(NotClassOwnerError)
    })
  })

  describe("deleteClass", () => {
    it("should delete class successfully", async () => {
      const existingClass = createMockClass({ teacherId: 1 })
      mockClassRepo.getClassById!.mockResolvedValue(existingClass)
      mockClassRepo.deleteClass!.mockResolvedValue(true)
      mockSubmissionRepo.getSubmissionsByClass!.mockResolvedValue([])
      mockAssignmentRepo.getAssignmentsByClassId!.mockResolvedValue([])

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
