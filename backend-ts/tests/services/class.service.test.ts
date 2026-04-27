import { describe, it, expect, beforeEach, vi } from "vitest"
import type { MockedObject } from "vitest"
import { ClassService } from "../../src/modules/classes/class.service.js"
import type { ClassRepository } from "../../src/modules/classes/class.repository.js"
import type { AssignmentRepository } from "../../src/modules/assignments/assignment.repository.js"
import type { EnrollmentRepository } from "../../src/modules/enrollments/enrollment.repository.js"
import type { UserRepository } from "../../src/modules/users/user.repository.js"
import type { SubmissionRepository } from "../../src/modules/submissions/submission.repository.js"
import type { StorageService } from "../../src/services/storage.service.js"
import type { NotificationService } from "../../src/modules/notifications/notification.service.js"
import {
  BadRequestError,
  ClassNotFoundError,
  InvalidRoleError,
  NotClassOwnerError,
  StudentNotInClassError,
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
  let mockNotificationService: Partial<MockedObject<NotificationService>>

  beforeEach(() => {
    mockClassRepo = {
      createClass: vi.fn(),
      getClassById: vi.fn(),
      checkClassCodeExists: vi.fn(),
      getStudentCount: vi.fn(),
      getActiveStudentCount: vi.fn(),
      getClassesWithStudentCounts: vi.fn(),
      updateClass: vi.fn(),
      deleteClass: vi.fn(),
    } as any

    mockAssignmentRepo = {
      getAssignmentsByClassId: vi.fn(),
    } as any
    mockEnrollmentRepo = {
      isEnrolled: vi.fn(),
      unenrollStudent: vi.fn(),
      getEnrolledStudentsWithInfo: vi.fn(),
    } as any

    mockUserRepo = {
      getUserById: vi.fn(),
    } as any

    mockSubmissionRepo = {
      getSubmissionsByClass: vi.fn(),
      getLatestSubmissionCountsByAssignmentIds: vi.fn(),
      getLatestSubmissionsByStudentAndAssignmentIds: vi.fn(),
    } as any
    mockStorageService = {
      deleteSubmissionFiles: vi.fn(),
      deleteAssignmentInstructionsImage: vi.fn(),
    } as any
    mockNotificationService = {
      createNotification: vi.fn().mockResolvedValue(null),
      sendEmailNotificationIfEnabled: vi.fn().mockResolvedValue(undefined),
    } as any

    classService = new ClassService(
      mockClassRepo as unknown as ClassRepository,
      mockAssignmentRepo as unknown as AssignmentRepository,
      mockEnrollmentRepo as unknown as EnrollmentRepository,
      mockUserRepo as unknown as UserRepository,
      mockSubmissionRepo as unknown as SubmissionRepository,
      mockStorageService as unknown as StorageService,
      mockNotificationService as unknown as NotificationService,
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
      const existingClass = createMockClass({ id: 1, className: "Mobile Systems" })
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

      mockClassRepo.getClassById!.mockResolvedValue(existingClass)
      mockAssignmentRepo.getAssignmentsByClassId!.mockResolvedValue(
        classAssignments as any,
      )
      mockClassRepo.getActiveStudentCount!.mockResolvedValue(28)
      mockSubmissionRepo.getLatestSubmissionCountsByAssignmentIds!.mockResolvedValue(
        new Map([[11, 12]]),
      )

      const result = await classService.getClassAssignments(1)

      expect(result).toHaveLength(1)
      expect(result[0].className).toBe("Mobile Systems")
      expect(result[0].studentCount).toBe(28)
      expect(mockClassRepo.getActiveStudentCount).toHaveBeenCalledWith(1)
      expect(result[0].submissionCount).toBe(12)
      expect(
        mockSubmissionRepo.getLatestSubmissionCountsByAssignmentIds,
      ).toHaveBeenCalledWith([11])
    })

    it("should default submission count to zero when no submissions exist", async () => {
      const existingClass = createMockClass({
        id: 1,
        className: "Software Engineering",
      })
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

      mockClassRepo.getClassById!.mockResolvedValue(existingClass)
      mockAssignmentRepo.getAssignmentsByClassId!.mockResolvedValue(
        classAssignments as any,
      )
      mockClassRepo.getStudentCount!.mockResolvedValue(18)
      mockSubmissionRepo.getLatestSubmissionCountsByAssignmentIds!.mockResolvedValue(
        new Map(),
      )

      const result = await classService.getClassAssignments(1)

      expect(result).toHaveLength(1)
      expect(result[0].className).toBe("Software Engineering")
      expect(result[0].submissionCount).toBe(0)
      expect(result[0].studentCount).toBe(18)
    })

    it("should throw ClassNotFoundError when the class does not exist", async () => {
      mockClassRepo.getClassById!.mockResolvedValue(undefined)

      await expect(classService.getClassAssignments(999)).rejects.toThrow(
        ClassNotFoundError,
      )
      expect(mockAssignmentRepo.getAssignmentsByClassId).not.toHaveBeenCalled()
    })
  })

  describe("getClassAssignmentsForStudent", () => {
    it("should enrich class assignments with student submission metadata", async () => {
      const existingClass = createMockClass({
        id: 1,
        className: "Intro to Programming",
      })
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

      const latestSubmission = {
        id: 1001,
        assignmentId: 11,
        studentId: 99,
        fileName: "solution.py",
        filePath: "submissions/11/99/1_solution.py",
        fileSize: 200,
        submissionNumber: 1,
        submittedAt: new Date("2026-01-02T10:00:00.000Z"),
        isLatest: true,
        grade: 91,
        isLate: false,
        penaltyApplied: 0,
        isGradeOverridden: false,
        overrideReason: null,
        overriddenAt: null,
        teacherFeedback: null,
        feedbackGivenAt: null,
      }

      mockClassRepo.getClassById!.mockResolvedValue(existingClass)
      mockAssignmentRepo.getAssignmentsByClassId!.mockResolvedValue(
        classAssignments as any,
      )
      mockClassRepo.getStudentCount!.mockResolvedValue(30)
      mockSubmissionRepo.getLatestSubmissionCountsByAssignmentIds!.mockResolvedValue(
        new Map([[11, 12]]),
      )
      mockSubmissionRepo.getLatestSubmissionsByStudentAndAssignmentIds!.mockResolvedValue(
        new Map([[11, latestSubmission as any]]),
      )
      mockEnrollmentRepo.isEnrolled!.mockResolvedValue(true)

      const result = await classService.getClassAssignmentsForStudent(1, 99)

      expect(result).toHaveLength(1)
      expect(result[0].submissionCount).toBe(12)
      expect(result[0].studentCount).toBe(30)
      expect(result[0].className).toBe("Intro to Programming")
      expect(result[0].hasSubmitted).toBe(true)
      expect(result[0].submittedAt).toBe("2026-01-02T10:00:00.000Z")
      expect(result[0].grade).toBe(91)
      expect(
        mockSubmissionRepo.getLatestSubmissionsByStudentAndAssignmentIds,
      ).toHaveBeenCalledWith(99, [11])
    })

    it("should set default student fields when no latest submission exists", async () => {
      const existingClass = createMockClass({ id: 1, className: "Discrete Math" })
      const classAssignments = [
        {
          id: 22,
          classId: 1,
          assignmentName: "No Submission Yet",
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

      mockClassRepo.getClassById!.mockResolvedValue(existingClass)
      mockAssignmentRepo.getAssignmentsByClassId!.mockResolvedValue(
        classAssignments as any,
      )
      mockClassRepo.getStudentCount!.mockResolvedValue(18)
      mockSubmissionRepo.getLatestSubmissionCountsByAssignmentIds!.mockResolvedValue(
        new Map(),
      )
      mockSubmissionRepo.getLatestSubmissionsByStudentAndAssignmentIds!.mockResolvedValue(
        new Map(),
      )
      mockEnrollmentRepo.isEnrolled!.mockResolvedValue(true)

      const result = await classService.getClassAssignmentsForStudent(1, 77)

      expect(result).toHaveLength(1)
      expect(result[0].className).toBe("Discrete Math")
      expect(result[0].hasSubmitted).toBe(false)
      expect(result[0].submittedAt).toBeNull()
      expect(result[0].grade).toBeNull()
      expect(
        mockSubmissionRepo.getLatestSubmissionsByStudentAndAssignmentIds,
      ).toHaveBeenCalledWith(77, [22])
    })


    it("should throw BadRequestError when student ID is not positive", async () => {
      await expect(classService.getClassAssignmentsForStudent(1, 0)).rejects.toThrow(
        BadRequestError,
      )
      expect(mockEnrollmentRepo.isEnrolled).not.toHaveBeenCalled()
    })

    it("should throw StudentNotInClassError when student is not enrolled", async () => {
      mockEnrollmentRepo.isEnrolled!.mockResolvedValue(false)

      await expect(classService.getClassAssignmentsForStudent(1, 55)).rejects.toThrow(
        StudentNotInClassError,
      )
      expect(mockAssignmentRepo.getAssignmentsByClassId).not.toHaveBeenCalled()
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

  describe("removeStudent", () => {
    it("should remove the student and notify only the removed student", async () => {
      const existingClass = createMockClass({ id: 15, teacherId: 21, className: "Algorithms" })
      const teacher = createMockTeacher({ id: 21, firstName: "Tina", lastName: "Teacher" })
      const student = createMockUser({
        id: 34,
        role: "student",
        firstName: "Sam",
        lastName: "Student",
        email: "sam.student@classifi.test",
      })

      mockClassRepo.getClassById!.mockResolvedValue(existingClass)
      mockEnrollmentRepo.isEnrolled!.mockResolvedValue(true)
      mockEnrollmentRepo.unenrollStudent!.mockResolvedValue(true)
      mockUserRepo.getUserById!
        .mockResolvedValueOnce(teacher)
        .mockResolvedValueOnce(student)

      await classService.removeStudent({
        classId: 15,
        studentId: 34,
        teacherId: 21,
      })

      expect(mockEnrollmentRepo.unenrollStudent).toHaveBeenCalledWith(34, 15)
      expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(1)
      expect(mockNotificationService.sendEmailNotificationIfEnabled).toHaveBeenCalledTimes(1)
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        34,
        "REMOVED_FROM_CLASS",
        {
          classId: 15,
          className: "Algorithms",
          instructorName: "Tina Teacher",
        },
      )
      expect(mockNotificationService.sendEmailNotificationIfEnabled).toHaveBeenCalledWith(
        34,
        "REMOVED_FROM_CLASS",
        {
          classId: 15,
          className: "Algorithms",
          instructorName: "Tina Teacher",
        },
      )
      expect(mockNotificationService.createNotification).not.toHaveBeenCalledWith(
        21,
        "STUDENT_UNENROLLED",
        expect.anything(),
      )
    })

    it("should throw StudentNotInClassError when the student is not enrolled", async () => {
      const existingClass = createMockClass({ id: 15, teacherId: 21 })
      mockClassRepo.getClassById!.mockResolvedValue(existingClass)
      mockEnrollmentRepo.isEnrolled!.mockResolvedValue(false)

      await expect(
        classService.removeStudent({
          classId: 15,
          studentId: 34,
          teacherId: 21,
        }),
      ).rejects.toThrow(StudentNotInClassError)

      expect(mockEnrollmentRepo.unenrollStudent).not.toHaveBeenCalled()
      expect(mockNotificationService.createNotification).not.toHaveBeenCalled()
    })
  })

  describe("getClassStudents", () => {
    it("should return only inactive students when the inactive filter is requested", async () => {
      const existingClass = createMockClass({ id: 9 })

      mockClassRepo.getClassById!.mockResolvedValue(existingClass)
      mockEnrollmentRepo.getEnrolledStudentsWithInfo!.mockResolvedValue([
        {
          user: createMockUser({
            id: 41,
            role: "student",
            firstName: "Inactive",
            lastName: "Student",
            email: "inactive@student.test",
            isActive: false,
          }),
          enrolledAt: new Date("2026-04-01T00:00:00.000Z"),
        },
      ])

      const result = await classService.getClassStudents(9, "inactive")

      expect(mockEnrollmentRepo.getEnrolledStudentsWithInfo).toHaveBeenCalledWith(
        9,
        "inactive",
      )
      expect(result).toEqual([
        {
          id: 41,
          email: "inactive@student.test",
          firstName: "Inactive",
          lastName: "Student",
          avatarUrl: null,
          isActive: false,
        },
      ])
    })
  })
})





