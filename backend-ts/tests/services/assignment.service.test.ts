import { describe, it, expect, beforeEach, vi } from "vitest"
import type { MockedObject } from "vitest"
import { AssignmentService } from "../../src/services/assignment.service.js"
import type { ClassRepository } from "../../src/repositories/class.repository.js"
import type { AssignmentRepository } from "../../src/repositories/assignment.repository.js"
import type { TestCaseRepository } from "../../src/repositories/testCase.repository.js"
import type { EnrollmentRepository } from "../../src/repositories/enrollment.repository.js"
import type { NotificationService } from "../../src/services/notification/notification.service.js"
import {
  ClassNotFoundError,
  NotClassOwnerError,
  AssignmentNotFoundError,
} from "../../src/shared/errors.js"
import { createMockClass, createMockAssignment } from "../utils/factories.js"

describe("AssignmentService", () => {
  let assignmentService: AssignmentService
  let mockClassRepo: Partial<MockedObject<ClassRepository>>
  let mockAssignmentRepo: Partial<MockedObject<AssignmentRepository>>
  let mockTestCaseRepo: Partial<MockedObject<TestCaseRepository>>
  let mockEnrollmentRepo: Partial<MockedObject<EnrollmentRepository>>
  let mockNotificationService: Partial<MockedObject<NotificationService>>

  beforeEach(() => {
    mockClassRepo = {
      getClassById: vi.fn(),
    }

    mockAssignmentRepo = {
      createAssignment: vi.fn(),
      getAssignmentById: vi.fn(),
      getAssignmentsByClassId: vi.fn(),
      updateAssignment: vi.fn(),
      deleteAssignment: vi.fn(),
    }

    mockTestCaseRepo = {
      getByAssignmentId: vi.fn(),
    }

    mockEnrollmentRepo = {
      getEnrolledStudentsWithInfo: vi.fn(),
    }

    mockNotificationService = {
      createNotification: vi.fn(),
    }

    assignmentService = new AssignmentService(
      mockAssignmentRepo as unknown as AssignmentRepository,
      mockClassRepo as unknown as ClassRepository,
      mockTestCaseRepo as unknown as TestCaseRepository,
      mockEnrollmentRepo as unknown as EnrollmentRepository,
      mockNotificationService as unknown as NotificationService,
    )
  })

  // ============================================
  // createAssignment Tests
  // ============================================
  describe("createAssignment", () => {
    const validAssignmentData = {
      assignmentName: "Test Assignment",
      description: "Test description for the assignment",
      programmingLanguage: "python" as const,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      allowResubmission: true,
      maxAttempts: 3,
    }

    it("should create an assignment successfully", async () => {
      const mockClass = createMockClass({ teacherId: 1 })
      const mockAssignment = createMockAssignment({ classId: 1 })

      mockClassRepo.getClassById!.mockResolvedValue(mockClass)
      mockAssignmentRepo.createAssignment!.mockResolvedValue(mockAssignment)
      mockEnrollmentRepo.getEnrolledStudentsWithInfo!.mockResolvedValue([])

      const result = await assignmentService.createAssignment({
        classId: 1,
        teacherId: 1,
        ...validAssignmentData,
      })

      expect(result).toBeDefined()
      expect(result.id).toBe(mockAssignment.id)
      expect(result.assignmentName).toBe(mockAssignment.assignmentName)
      expect(mockAssignmentRepo.createAssignment).toHaveBeenCalledWith({
        classId: 1,
        ...validAssignmentData,
      })
    })

    it("should create notifications for all enrolled students", async () => {
      const mockClass = createMockClass({
        id: 1,
        teacherId: 1,
        className: "Test Class",
      })
      const mockAssignment = createMockAssignment({
        id: 1,
        classId: 1,
        assignmentName: "Test Assignment",
        deadline: new Date("2024-12-31"),
      })

      const mockEnrolledStudents = [
        {
          user: {
            id: 10,
            email: "student1@test.com",
            firstName: "Student",
            lastName: "One",
            avatarUrl: null,
            role: "student",
            isActive: true,
            createdAt: new Date(),
          },
          enrolledAt: new Date(),
        },
        {
          user: {
            id: 11,
            email: "student2@test.com",
            firstName: "Student",
            lastName: "Two",
            avatarUrl: null,
            role: "student",
            isActive: true,
            createdAt: new Date(),
          },
          enrolledAt: new Date(),
        },
      ]

      mockClassRepo.getClassById!.mockResolvedValue(mockClass)
      mockAssignmentRepo.createAssignment!.mockResolvedValue(mockAssignment)
      mockEnrollmentRepo.getEnrolledStudentsWithInfo!.mockResolvedValue(
        mockEnrolledStudents,
      )
      mockNotificationService.createNotification!.mockResolvedValue({} as any)

      await assignmentService.createAssignment({
        classId: 1,
        teacherId: 1,
        ...validAssignmentData,
      })

      // Wait for async notification promises to resolve
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(
        mockEnrollmentRepo.getEnrolledStudentsWithInfo,
      ).toHaveBeenCalledWith(1)
      expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(
        2,
      )

      // Verify first student notification
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        10,
        "ASSIGNMENT_CREATED",
        expect.objectContaining({
          assignmentId: 1,
          assignmentTitle: "Test Assignment",
          className: "Test Class",
          dueDate: expect.any(String),
          assignmentUrl: expect.stringContaining("/dashboard/assignments/1"),
        }),
      )

      // Verify second student notification
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        11,
        "ASSIGNMENT_CREATED",
        expect.objectContaining({
          assignmentId: 1,
          assignmentTitle: "Test Assignment",
          className: "Test Class",
        }),
      )
    })

    it("should handle notification failures gracefully without blocking assignment creation", async () => {
      const mockClass = createMockClass({ teacherId: 1 })
      const mockAssignment = createMockAssignment({ classId: 1 })
      const mockEnrolledStudents = [
        {
          user: {
            id: 10,
            email: "student@test.com",
            firstName: "Student",
            lastName: "One",
            avatarUrl: null,
            role: "student",
            isActive: true,
            createdAt: new Date(),
          },
          enrolledAt: new Date(),
        },
      ]

      mockClassRepo.getClassById!.mockResolvedValue(mockClass)
      mockAssignmentRepo.createAssignment!.mockResolvedValue(mockAssignment)
      mockEnrollmentRepo.getEnrolledStudentsWithInfo!.mockResolvedValue(
        mockEnrolledStudents,
      )
      mockNotificationService.createNotification!.mockRejectedValue(
        new Error("Notification service error"),
      )

      // Should not throw even if notifications fail
      const result = await assignmentService.createAssignment({
        classId: 1,
        teacherId: 1,
        ...validAssignmentData,
      })

      expect(result).toBeDefined()
      expect(result.id).toBe(mockAssignment.id)
    })

    it("should format deadline correctly in notification", async () => {
      const mockClass = createMockClass({
        id: 1,
        teacherId: 1,
        className: "Test Class",
      })
      const deadline = new Date("2024-12-25T10:00:00Z")
      const mockAssignment = createMockAssignment({
        id: 1,
        classId: 1,
        assignmentName: "Holiday Assignment",
        deadline,
      })

      const mockEnrolledStudents = [
        {
          user: {
            id: 10,
            email: "student@test.com",
            firstName: "Student",
            lastName: "One",
            avatarUrl: null,
            role: "student",
            isActive: true,
            createdAt: new Date(),
          },
          enrolledAt: new Date(),
        },
      ]

      mockClassRepo.getClassById!.mockResolvedValue(mockClass)
      mockAssignmentRepo.createAssignment!.mockResolvedValue(mockAssignment)
      mockEnrollmentRepo.getEnrolledStudentsWithInfo!.mockResolvedValue(
        mockEnrolledStudents,
      )
      mockNotificationService.createNotification!.mockResolvedValue({} as any)

      await assignmentService.createAssignment({
        classId: 1,
        teacherId: 1,
        assignmentName: "Holiday Assignment",
        description: "Test",
        programmingLanguage: "python",
        deadline,
      })

      // Wait for async notification promises
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        10,
        "ASSIGNMENT_CREATED",
        expect.objectContaining({
          dueDate: deadline.toLocaleString("en-US", {
            month: "numeric",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
        }),
      )
    })
    it("should format deadline correctly in notification for future date", async () => {
      const mockClass = createMockClass({
        id: 1,
        teacherId: 1,
        className: "Test Class",
      })
      const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      const mockAssignment = createMockAssignment({
        id: 1,
        classId: 1,
        assignmentName: "Future Assignment",
        deadline,
      })

      const mockEnrolledStudents = [
        {
          user: {
            id: 10,
            email: "student@test.com",
            firstName: "Student",
            lastName: "One",
            avatarUrl: null,
            role: "student",
            isActive: true,
            createdAt: new Date(),
          },
          enrolledAt: new Date(),
        },
      ]

      mockClassRepo.getClassById!.mockResolvedValue(mockClass)
      mockAssignmentRepo.createAssignment!.mockResolvedValue(mockAssignment)
      mockEnrollmentRepo.getEnrolledStudentsWithInfo!.mockResolvedValue(
        mockEnrolledStudents,
      )
      mockNotificationService.createNotification!.mockResolvedValue({} as any)

      await assignmentService.createAssignment({
        classId: 1,
        teacherId: 1,
        assignmentName: "Future Assignment",
        description: "Test",
        programmingLanguage: "python",
        deadline,
      })

      // Wait for async notification promises
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(
        10,
        "ASSIGNMENT_CREATED",
        expect.objectContaining({
          dueDate: deadline.toLocaleString("en-US", {
            month: "numeric",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
        }),
      )
    })

    it("should not create notifications when no students are enrolled", async () => {
      const mockClass = createMockClass({ teacherId: 1 })
      const mockAssignment = createMockAssignment({ classId: 1 })

      mockClassRepo.getClassById!.mockResolvedValue(mockClass)
      mockAssignmentRepo.createAssignment!.mockResolvedValue(mockAssignment)
      mockEnrollmentRepo.getEnrolledStudentsWithInfo!.mockResolvedValue([])

      await assignmentService.createAssignment({
        classId: 1,
        teacherId: 1,
        ...validAssignmentData,
      })

      // Wait for async notification promises
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mockNotificationService.createNotification).not.toHaveBeenCalled()
    })

    it("should throw ClassNotFoundError if class does not exist", async () => {
      mockClassRepo.getClassById!.mockResolvedValue(undefined)

      await expect(
        assignmentService.createAssignment({
          classId: 999,
          teacherId: 1,
          ...validAssignmentData,
        }),
      ).rejects.toThrow(ClassNotFoundError)
    })

    it("should throw NotClassOwnerError if teacher is not the class owner", async () => {
      const mockClass = createMockClass({ teacherId: 1 })
      mockClassRepo.getClassById!.mockResolvedValue(mockClass)

      // Teacher ID 999 is different from class owner (1)
      await expect(
        assignmentService.createAssignment({
          classId: 1,
          teacherId: 999,
          ...validAssignmentData,
        }),
      ).rejects.toThrow(NotClassOwnerError)
    })

    it("should create assignment with default allowResubmission", async () => {
      const mockClass = createMockClass({ teacherId: 1 })
      const mockAssignment = createMockAssignment()

      mockClassRepo.getClassById!.mockResolvedValue(mockClass)
      mockAssignmentRepo.createAssignment!.mockResolvedValue(mockAssignment)
      mockEnrollmentRepo.getEnrolledStudentsWithInfo!.mockResolvedValue([])

      const dataWithoutResubmission = {
        assignmentName: "Test",
        description: "Test description",
        programmingLanguage: "java" as const,
        deadline: new Date(Date.now() + 86400000),
      }

      await assignmentService.createAssignment({
        classId: 1,
        teacherId: 1,
        ...dataWithoutResubmission,
      })

      expect(mockAssignmentRepo.createAssignment).toHaveBeenCalledWith(
        expect.objectContaining({
          classId: 1,
          assignmentName: "Test",
        }),
      )
    })
  })

  // ============================================
  // getClassAssignments Tests
  // ============================================
  describe("getClassAssignments", () => {
    it("should return all assignments for a class", async () => {
      const mockAssignments = [
        createMockAssignment({ id: 1, assignmentName: "Assignment 1" }),
        createMockAssignment({ id: 2, assignmentName: "Assignment 2" }),
        createMockAssignment({ id: 3, assignmentName: "Assignment 3" }),
      ]

      mockAssignmentRepo.getAssignmentsByClassId!.mockResolvedValue(
        mockAssignments,
      )

      const result = await assignmentService.getClassAssignments(1)

      expect(result).toHaveLength(3)
      expect(result[0].assignmentName).toBe("Assignment 1")
      expect(result[1].assignmentName).toBe("Assignment 2")
      expect(mockAssignmentRepo.getAssignmentsByClassId).toHaveBeenCalledWith(1)
    })

    it("should return empty array when class has no assignments", async () => {
      mockAssignmentRepo.getAssignmentsByClassId!.mockResolvedValue([])

      const result = await assignmentService.getClassAssignments(1)

      expect(result).toHaveLength(0)
      expect(result).toEqual([])
    })
  })

  // ============================================
  // getAssignmentDetails Tests
  // ============================================
  describe("getAssignmentDetails", () => {
    it("should return assignment details with class name", async () => {
      const mockAssignment = createMockAssignment({ id: 1, classId: 1 })
      const mockClass = createMockClass({ id: 1, className: "Test Class" })

      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment)
      mockClassRepo.getClassById!.mockResolvedValue(mockClass)
      const mockTestCases = [{ id: 1, name: "Test 1", isHidden: false }]
      mockTestCaseRepo.getByAssignmentId!.mockResolvedValue(mockTestCases)

      const result = await assignmentService.getAssignmentDetails(1)

      expect(result).toBeDefined()
      expect(result.id).toBe(1)
      expect(result.className).toBe("Test Class")
      expect(result.testCases).toEqual(mockTestCases)
    })

    it("should throw AssignmentNotFoundError if assignment does not exist", async () => {
      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(undefined)

      await expect(assignmentService.getAssignmentDetails(999)).rejects.toThrow(
        AssignmentNotFoundError,
      )
    })

    it("should return assignment even if class is null", async () => {
      const mockAssignment = createMockAssignment({ id: 1, classId: 999 })

      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment)
      mockClassRepo.getClassById!.mockResolvedValue(undefined)
      mockTestCaseRepo.getByAssignmentId!.mockResolvedValue([])

      const result = await assignmentService.getAssignmentDetails(1)

      expect(result).toBeDefined()
      expect(result.className).toBeUndefined()
    })
  })

  // ============================================
  // updateAssignment Tests
  // ============================================
  describe("updateAssignment", () => {
    it("should update assignment successfully", async () => {
      const mockAssignment = createMockAssignment({ id: 1, classId: 1 })
      const mockClass = createMockClass({ id: 1, teacherId: 1 })
      const updatedAssignment = {
        ...mockAssignment,
        assignmentName: "Updated Name",
      }

      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment)
      mockClassRepo.getClassById!.mockResolvedValue(mockClass)
      mockAssignmentRepo.updateAssignment!.mockResolvedValue(updatedAssignment)

      const result = await assignmentService.updateAssignment({
        assignmentId: 1,
        teacherId: 1,
        assignmentName: "Updated Name",
      })

      expect(result.assignmentName).toBe("Updated Name")
      expect(mockAssignmentRepo.updateAssignment).toHaveBeenCalledWith(1, {
        assignmentName: "Updated Name",
      })
    })

    it("should throw AssignmentNotFoundError if assignment does not exist", async () => {
      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(undefined)

      await expect(
        assignmentService.updateAssignment({
          assignmentId: 999,
          teacherId: 1,
          assignmentName: "New",
        }),
      ).rejects.toThrow(AssignmentNotFoundError)
    })

    it("should throw NotClassOwnerError if teacher is not the class owner", async () => {
      const mockAssignment = createMockAssignment({ id: 1, classId: 1 })
      const mockClass = createMockClass({ id: 1, teacherId: 1 })

      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment)
      mockClassRepo.getClassById!.mockResolvedValue(mockClass)

      // Teacher ID 999 is different from class owner (1)
      await expect(
        assignmentService.updateAssignment({
          assignmentId: 1,
          teacherId: 999,
          assignmentName: "New",
        }),
      ).rejects.toThrow(NotClassOwnerError)
    })

    it("should throw ClassNotFoundError if class is not found during update", async () => {
      const mockAssignment = createMockAssignment({ id: 1, classId: 1 })

      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment)
      mockClassRepo.getClassById!.mockResolvedValue(undefined)

      await expect(
        assignmentService.updateAssignment({
          assignmentId: 1,
          teacherId: 1,
          assignmentName: "New",
        }),
      ).rejects.toThrow(ClassNotFoundError)
    })

    it("should throw AssignmentNotFoundError if update returns undefined", async () => {
      const mockAssignment = createMockAssignment({ id: 1, classId: 1 })
      const mockClass = createMockClass({ id: 1, teacherId: 1 })

      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment)
      mockClassRepo.getClassById!.mockResolvedValue(mockClass)
      mockAssignmentRepo.updateAssignment!.mockResolvedValue(undefined)

      await expect(
        assignmentService.updateAssignment({
          assignmentId: 1,
          teacherId: 1,
          assignmentName: "New",
        }),
      ).rejects.toThrow(AssignmentNotFoundError)
    })

    it("should update multiple fields at once", async () => {
      const mockAssignment = createMockAssignment({ id: 1, classId: 1 })
      const mockClass = createMockClass({ id: 1, teacherId: 1 })
      const newDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      const updatedData = {
        assignmentId: 1,
        teacherId: 1,
        assignmentName: "Updated",
        description: "New description",
        programmingLanguage: "java" as const,
        deadline: newDeadline,
        allowResubmission: false,
        maxAttempts: 5,
      }
      const updatedAssignment = { ...mockAssignment, ...updatedData }

      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment)
      mockClassRepo.getClassById!.mockResolvedValue(mockClass)
      mockAssignmentRepo.updateAssignment!.mockResolvedValue(updatedAssignment)

      const result = await assignmentService.updateAssignment(updatedData)

      expect(result.assignmentName).toBe("Updated")
      expect(result.description).toBe("New description")
      expect(mockAssignmentRepo.updateAssignment).toHaveBeenCalledWith(1, {
        assignmentName: "Updated",
        description: "New description",
        programmingLanguage: "java",
        deadline: newDeadline,
        allowResubmission: false,
        maxAttempts: 5,
      })
    })
  })

  // ============================================
  // deleteAssignment Tests
  // ============================================
  describe("deleteAssignment", () => {
    it("should delete assignment successfully", async () => {
      const mockAssignment = createMockAssignment({ id: 1, classId: 1 })
      const mockClass = createMockClass({ id: 1, teacherId: 1 })

      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment)
      mockClassRepo.getClassById!.mockResolvedValue(mockClass)
      mockAssignmentRepo.deleteAssignment!.mockResolvedValue(true)

      await assignmentService.deleteAssignment(1, 1)

      expect(mockAssignmentRepo.deleteAssignment).toHaveBeenCalledWith(1)
    })

    it("should throw AssignmentNotFoundError if assignment does not exist", async () => {
      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(undefined)

      await expect(assignmentService.deleteAssignment(999, 1)).rejects.toThrow(
        AssignmentNotFoundError,
      )
    })

    it("should throw NotClassOwnerError if teacher is not the class owner", async () => {
      const mockAssignment = createMockAssignment({ id: 1, classId: 1 })
      const mockClass = createMockClass({ id: 1, teacherId: 1 })

      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment)
      mockClassRepo.getClassById!.mockResolvedValue(mockClass)

      // Teacher ID 999 is different from class owner (1)
      await expect(assignmentService.deleteAssignment(1, 999)).rejects.toThrow(
        NotClassOwnerError,
      )
    })

    it("should throw ClassNotFoundError if class is not found during delete", async () => {
      const mockAssignment = createMockAssignment({ id: 1, classId: 1 })

      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment)
      mockClassRepo.getClassById!.mockResolvedValue(undefined)

      await expect(assignmentService.deleteAssignment(1, 1)).rejects.toThrow(
        ClassNotFoundError,
      )
    })
  })

  // ============================================
  // getAssignmentById Tests
  // ============================================
  describe("getAssignmentById", () => {
    it("should return assignment DTO when found", async () => {
      const mockAssignment = createMockAssignment({ id: 1 })
      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(mockAssignment)

      const result = await assignmentService.getAssignmentById(1)

      expect(result).toBeDefined()
      expect(result?.id).toBe(1)
    })

    it("should return null when assignment not found", async () => {
      mockAssignmentRepo.getAssignmentById!.mockResolvedValue(undefined)

      const result = await assignmentService.getAssignmentById(999)

      expect(result).toBeNull()
    })
  })
})
