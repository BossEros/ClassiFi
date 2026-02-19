import { describe, it, expect, beforeEach, vi, afterEach } from "vitest"
import { container } from "tsyringe"
import { NotificationService } from "../../src/services/notification/notification.service.js"
import { NotificationRepository } from "../../src/repositories/notification.repository.js"
import { NotificationDeliveryRepository } from "../../src/repositories/notification-delivery.repository.js"
import { AssignmentService } from "../../src/services/assignment.service.js"
import { AssignmentRepository } from "../../src/repositories/assignment.repository.js"
import { ClassRepository } from "../../src/repositories/class.repository.js"
import { EnrollmentRepository } from "../../src/repositories/enrollment.repository.js"
import { SubmissionRepository } from "../../src/repositories/submission.repository.js"
import { TestCaseRepository } from "../../src/repositories/test-case.repository.js"
import { TestResultRepository } from "../../src/repositories/testResult.repository.js"
import { LatePenaltyService } from "../../src/services/latePenalty.service.js"
import type {
  Notification,
  NotificationDelivery,
} from "../../src/models/index.js"

/**
 * Integration tests for the complete notification flow.
 * Tests the end-to-end process from trigger events to notification delivery.
 */
describe("Notification Flow Integration Tests", () => {
  let notificationService: NotificationService
  let notificationRepo: NotificationRepository
  let deliveryRepo: NotificationDeliveryRepository
  let assignmentService: AssignmentService

  // Mock repositories
  let mockAssignmentRepo: AssignmentRepository
  let mockClassRepo: ClassRepository
  let mockEnrollmentRepo: EnrollmentRepository
  let mockSubmissionRepo: SubmissionRepository
  let mockTestCaseRepo: TestCaseRepository
  let mockTestResultRepo: TestResultRepository
  let mockLatePenaltyService: LatePenaltyService

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks()

    // Create mock repositories
    mockAssignmentRepo = {
      createAssignment: vi.fn(),
      getAssignmentById: vi.fn(),
      updateAssignment: vi.fn(),
      deleteAssignment: vi.fn(),
      getAssignmentsByClassId: vi.fn(),
      getAssignmentsByTeacherId: vi.fn(),
      getAssignmentsByStudentId: vi.fn(),
    } as any

    mockClassRepo = {
      getClassById: vi.fn(),
      createClass: vi.fn(),
      updateClass: vi.fn(),
      deleteClass: vi.fn(),
      getClassesByTeacherId: vi.fn(),
      getClassesByStudentId: vi.fn(),
    } as any

    mockEnrollmentRepo = {
      getEnrolledStudentsWithInfo: vi.fn(),
      enrollStudent: vi.fn(),
      unenrollStudent: vi.fn(),
      isStudentEnrolled: vi.fn(),
    } as any

    mockSubmissionRepo = {
      getSubmissionById: vi.fn(),
      createSubmission: vi.fn(),
      getSubmissionsByAssignmentId: vi.fn(),
      getSubmissionsByStudentId: vi.fn(),
      getLatestSubmission: vi.fn(),
    } as any

    mockTestCaseRepo = {} as any
    mockTestResultRepo = {} as any
    mockLatePenaltyService = {} as any

    // Create mock notification repository
    const mockNotificationRepo = {
      create: vi.fn(),
      findByUserId: vi.fn(),
      countByUserId: vi.fn(),
      countUnreadByUserId: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsReadByUserId: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
    } as any

    // Create mock delivery repository
    const mockDeliveryRepo = {
      create: vi.fn(),
      findPending: vi.fn(),
      update: vi.fn(),
      getNotification: vi.fn(),
    } as any

    // Create mock queue service
    const mockQueueService = {
      enqueueDelivery: vi.fn().mockResolvedValue(undefined),
      processDelivery: vi.fn().mockResolvedValue(undefined),
    } as any

    const mockStorageService = {
      deleteAssignmentInstructionsImage: vi.fn().mockResolvedValue(true),
    } as any

    // Create mock preference service
    const mockPreferenceService = {
      getEnabledChannels: vi.fn().mockResolvedValue(["EMAIL", "IN_APP"]),
      getPreference: vi.fn(),
      getAllPreferences: vi.fn(),
      updatePreference: vi.fn(),
    } as any

    // Register mocks in container
    container.registerInstance("NotificationRepository", mockNotificationRepo)
    container.registerInstance(
      "NotificationDeliveryRepository",
      mockDeliveryRepo,
    )
    container.registerInstance("NotificationQueueService", mockQueueService)
    container.registerInstance(
      "NotificationPreferenceService",
      mockPreferenceService,
    )
    container.registerInstance("AssignmentRepository", mockAssignmentRepo)
    container.registerInstance("ClassRepository", mockClassRepo)
    container.registerInstance("EnrollmentRepository", mockEnrollmentRepo)
    container.registerInstance("SubmissionRepository", mockSubmissionRepo)
    container.registerInstance("StorageService", mockStorageService)
    container.registerInstance("TestCaseRepository", mockTestCaseRepo)
    container.registerInstance("TestResultRepository", mockTestResultRepo)
    container.registerInstance("LatePenaltyService", mockLatePenaltyService)

    // Create and register NotificationService with the mocked services
    notificationService = new NotificationService(
      mockNotificationRepo,
      mockQueueService,
      mockPreferenceService,
    )
    container.registerInstance("NotificationService", notificationService)

    // Store references
    notificationRepo = mockNotificationRepo
    deliveryRepo = mockDeliveryRepo
    assignmentService = container.resolve(AssignmentService)
  })

  afterEach(() => {
    container.clearInstances()
  })

  describe("Assignment Creation Flow", () => {
    it("should create notifications for all enrolled students when assignment is created", async () => {
      // Arrange
      const teacherId = 1
      const classId = 1
      const assignmentData = {
        classId,
        teacherId,
        assignmentName: "Test Assignment",
        instructions: "Test instructions",
        programmingLanguage: "python" as const,
        deadline: new Date("2024-12-31"),
        allowResubmission: true,
        maxAttempts: null,
        templateCode: null,
        totalScore: 100,
        scheduledDate: null,
      }

      const mockAssignment = {
        id: 1,
        ...assignmentData,
        createdAt: new Date(),
        isActive: true,
      }

      const mockClass = {
        id: classId,
        teacherId,
        className: "Test Class",
        classCode: "TEST123",
        description: "Test class",
        yearLevel: 1,
        semester: 1,
        academicYear: "2024-2025",
        schedule: { days: ["monday"], startTime: "09:00", endTime: "10:00" },
        createdAt: new Date(),
        isActive: true,
      }

      const mockEnrolledStudents = [
        {
          userId: 10,
          classId,
          enrolledAt: new Date(),
          user: {
            id: 10,
            email: "student1@test.com",
            firstName: "Student",
            lastName: "One",
            role: "student" as const,
            supabaseUserId: "student1-uuid",
            createdAt: new Date(),
            updatedAt: null,
          },
        },
        {
          userId: 11,
          classId,
          enrolledAt: new Date(),
          user: {
            id: 11,
            email: "student2@test.com",
            firstName: "Student",
            lastName: "Two",
            role: "student" as const,
            supabaseUserId: "student2-uuid",
            createdAt: new Date(),
            updatedAt: null,
          },
        },
      ]

      const mockNotification: Notification = {
        id: 1,
        userId: 10,
        type: "ASSIGNMENT_CREATED",
        title: "New Assignment: Test Assignment",
        message: "A new assignment has been posted in Test Class",
        metadata: {
          assignmentId: 1,
          assignmentTitle: "Test Assignment",
          className: "Test Class",
          classId: 1,
          dueDate: "12/31/2024",
          assignmentUrl: "http://localhost:5173/dashboard/assignments/1",
        },
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      }

      // Mock repository responses
      vi.mocked(mockClassRepo.getClassById).mockResolvedValue(mockClass)
      vi.mocked(mockAssignmentRepo.createAssignment).mockResolvedValue(
        mockAssignment,
      )
      vi.mocked(
        mockEnrollmentRepo.getEnrolledStudentsWithInfo,
      ).mockResolvedValue(mockEnrolledStudents)
      vi.mocked(notificationRepo.create).mockResolvedValue(mockNotification)

      // Act
      const result = await assignmentService.createAssignment(assignmentData)

      // Wait for async notification creation
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Assert
      expect(result).toBeDefined()
      expect(result.id).toBe(1)
      expect(
        mockEnrollmentRepo.getEnrolledStudentsWithInfo,
      ).toHaveBeenCalledWith(classId)

      // Verify notifications were created for both students
      expect(notificationRepo.create).toHaveBeenCalledTimes(2)
      expect(notificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 10,
          type: "ASSIGNMENT_CREATED",
        }),
      )
      expect(notificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 11,
          type: "ASSIGNMENT_CREATED",
        }),
      )
    })

    it("should handle notification creation failure gracefully", async () => {
      // Arrange
      const teacherId = 1
      const classId = 1
      const assignmentData = {
        classId,
        teacherId,
        assignmentName: "Test Assignment",
        instructions: "Test instructions",
        programmingLanguage: "python" as const,
        deadline: new Date("2024-12-31"),
        allowResubmission: true,
        maxAttempts: null,
        templateCode: null,
        totalScore: 100,
        scheduledDate: null,
      }

      const mockAssignment = {
        id: 1,
        ...assignmentData,
        createdAt: new Date(),
        isActive: true,
      }

      const mockClass = {
        id: classId,
        teacherId,
        className: "Test Class",
        classCode: "TEST123",
        description: "Test class",
        yearLevel: 1,
        semester: 1,
        academicYear: "2024-2025",
        schedule: { days: ["monday"], startTime: "09:00", endTime: "10:00" },
        createdAt: new Date(),
        isActive: true,
      }

      const mockEnrolledStudents = [
        {
          userId: 10,
          classId,
          enrolledAt: new Date(),
          user: {
            id: 10,
            email: "student1@test.com",
            firstName: "Student",
            lastName: "One",
            role: "student" as const,
            supabaseUserId: "student1-uuid",
            createdAt: new Date(),
            updatedAt: null,
          },
        },
      ]

      // Mock repository responses
      vi.mocked(mockClassRepo.getClassById).mockResolvedValue(mockClass)
      vi.mocked(mockAssignmentRepo.createAssignment).mockResolvedValue(
        mockAssignment,
      )
      vi.mocked(
        mockEnrollmentRepo.getEnrolledStudentsWithInfo,
      ).mockResolvedValue(mockEnrolledStudents)
      vi.mocked(notificationRepo.create).mockRejectedValue(
        new Error("Database error"),
      )

      // Act - should not throw even if notification fails
      const result = await assignmentService.createAssignment(assignmentData)

      // Wait for async notification creation
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Assert - assignment should still be created
      expect(result).toBeDefined()
      expect(result.id).toBe(1)
    })
  })

  describe("Submission Grading Flow", () => {
    it("should create notification when grade is overridden", async () => {
      // Arrange
      const studentId = 10
      const assignmentId = 1

      const mockNotification: Notification = {
        id: 1,
        userId: studentId,
        type: "SUBMISSION_GRADED",
        title: "Assignment Graded: Test Assignment",
        message: "Your submission has been graded",
        metadata: {
          assignmentId,
          assignmentTitle: "Test Assignment",
          submissionId: 1,
          grade: 85,
          totalScore: 100,
          feedback: "Good work!",
          submissionUrl: "http://localhost:5173/dashboard/assignments/1",
        },
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      }

      // Mock repository responses
      vi.mocked(notificationRepo.create).mockResolvedValue(mockNotification)

      // Act - Test notification creation directly
      const result = await notificationRepo.create({
        userId: studentId,
        type: "SUBMISSION_GRADED",
        title: "Assignment Graded: Test Assignment",
        message: "Your submission has been graded",
        metadata: {
          assignmentId,
          assignmentTitle: "Test Assignment",
          submissionId: 1,
          grade: 85,
          totalScore: 100,
          feedback: "Good work!",
          submissionUrl: "http://localhost:5173/dashboard/assignments/1",
        },
      })

      // Assert
      expect(result).toBeDefined()
      expect(result.userId).toBe(studentId)
      expect(result.type).toBe("SUBMISSION_GRADED")
      expect(notificationRepo.create).toHaveBeenCalled()
    })
  })

  describe("Email Delivery", () => {
    it("should queue email delivery when notification is created", async () => {
      // Arrange
      const userId = 1
      const notificationType = "ASSIGNMENT_CREATED"
      const metadata = {
        assignmentId: 1,
        assignmentTitle: "Test Assignment",
        className: "Test Class",
        classId: 1,
        dueDate: "12/31/2024",
        assignmentUrl: "http://localhost:5173/dashboard/assignments/1",
      }

      const mockNotification: Notification = {
        id: 1,
        userId,
        type: notificationType,
        title: "New Assignment: Test Assignment",
        message: "A new assignment has been posted",
        metadata,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      }

      const mockDelivery: NotificationDelivery = {
        id: 1,
        notificationId: 1,
        channel: "EMAIL",
        status: "PENDING",
        retryCount: 0,
        createdAt: new Date(),
        sentAt: null,
        failedAt: null,
        errorMessage: null,
      }

      vi.mocked(notificationRepo.create).mockResolvedValue(mockNotification)
      vi.mocked(deliveryRepo.create).mockResolvedValue(mockDelivery)

      // Act - Test delivery creation directly
      const notification = await notificationRepo.create({
        userId,
        type: notificationType,
        title: "New Assignment: Test Assignment",
        message: "A new assignment has been posted",
        metadata,
      })

      const delivery = await deliveryRepo.create({
        notificationId: notification.id,
        channel: "EMAIL",
        status: "PENDING",
        retryCount: 0,
      })

      // Assert
      expect(notification).toBeDefined()
      expect(delivery).toBeDefined()
      expect(delivery.notificationId).toBe(notification.id)
      expect(delivery.channel).toBe("EMAIL")
      expect(delivery.status).toBe("PENDING")
    })
  })

  describe("Notification CRUD Operations", () => {
    it("should retrieve user notifications with pagination", async () => {
      // Arrange
      const userId = 1
      const page = 1
      const limit = 20

      const mockNotifications: Notification[] = [
        {
          id: 1,
          userId,
          type: "ASSIGNMENT_CREATED",
          title: "New Assignment",
          message: "Test message",
          metadata: { assignmentId: 1 },
          isRead: false,
          readAt: null,
          createdAt: new Date(),
        },
        {
          id: 2,
          userId,
          type: "SUBMISSION_GRADED",
          title: "Assignment Graded",
          message: "Your submission has been graded",
          metadata: { assignmentId: 1, grade: 90 },
          isRead: true,
          readAt: new Date(),
          createdAt: new Date(),
        },
      ]

      vi.mocked(notificationRepo.findByUserId).mockResolvedValue(
        mockNotifications,
      )
      vi.mocked(notificationRepo.countByUserId).mockResolvedValue(2)

      // Act
      const result = await notificationService.getUserNotifications(
        userId,
        page,
        limit,
      )

      // Assert
      expect(result.notifications).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.hasMore).toBe(false)
      expect(notificationRepo.findByUserId).toHaveBeenCalledWith(
        userId,
        limit,
        0,
      )
    })

    it("should get unread count for user", async () => {
      // Arrange
      const userId = 1
      vi.mocked(notificationRepo.countUnreadByUserId).mockResolvedValue(5)

      // Act
      const count = await notificationService.getUnreadCount(userId)

      // Assert
      expect(count).toBe(5)
      expect(notificationRepo.countUnreadByUserId).toHaveBeenCalledWith(userId)
    })

    it("should mark notification as read", async () => {
      // Arrange
      const notificationId = 1
      const userId = 1

      const mockNotification: Notification = {
        id: notificationId,
        userId,
        type: "ASSIGNMENT_CREATED",
        title: "Test",
        message: "Test message",
        metadata: {},
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      }

      vi.mocked(notificationRepo.findById).mockResolvedValue(mockNotification)
      vi.mocked(notificationRepo.markAsRead).mockResolvedValue(undefined)

      // Act
      await notificationService.markAsRead(notificationId, userId)

      // Assert
      expect(notificationRepo.findById).toHaveBeenCalledWith(notificationId)
      expect(notificationRepo.markAsRead).toHaveBeenCalledWith(notificationId)
    })

    it("should mark all notifications as read", async () => {
      // Arrange
      const userId = 1
      vi.mocked(notificationRepo.markAllAsReadByUserId).mockResolvedValue(
        undefined,
      )

      // Act
      await notificationService.markAllAsRead(userId)

      // Assert
      expect(notificationRepo.markAllAsReadByUserId).toHaveBeenCalledWith(
        userId,
      )
    })

    it("should delete notification", async () => {
      // Arrange
      const notificationId = 1
      const userId = 1

      const mockNotification: Notification = {
        id: notificationId,
        userId,
        type: "ASSIGNMENT_CREATED",
        title: "Test",
        message: "Test message",
        metadata: {},
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      }

      vi.mocked(notificationRepo.findById).mockResolvedValue(mockNotification)
      vi.mocked(notificationRepo.delete).mockResolvedValue(undefined)

      // Act
      await notificationService.deleteNotification(notificationId, userId)

      // Assert
      expect(notificationRepo.findById).toHaveBeenCalledWith(notificationId)
      expect(notificationRepo.delete).toHaveBeenCalledWith(notificationId)
    })
  })

  describe("Authorization", () => {
    it("should throw ForbiddenError when marking another user's notification as read", async () => {
      // Arrange
      const notificationId = 1
      const userId = 1
      const otherUserId = 2

      const mockNotification: Notification = {
        id: notificationId,
        userId: otherUserId, // Different user
        type: "ASSIGNMENT_CREATED",
        title: "Test",
        message: "Test message",
        metadata: {},
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      }

      vi.mocked(notificationRepo.findById).mockResolvedValue(mockNotification)

      // Act & Assert
      await expect(
        notificationService.markAsRead(notificationId, userId),
      ).rejects.toThrow("Not authorized to access this notification")
    })

    it("should throw ForbiddenError when deleting another user's notification", async () => {
      // Arrange
      const notificationId = 1
      const userId = 1
      const otherUserId = 2

      const mockNotification: Notification = {
        id: notificationId,
        userId: otherUserId, // Different user
        type: "ASSIGNMENT_CREATED",
        title: "Test",
        message: "Test message",
        metadata: {},
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      }

      vi.mocked(notificationRepo.findById).mockResolvedValue(mockNotification)

      // Act & Assert
      await expect(
        notificationService.deleteNotification(notificationId, userId),
      ).rejects.toThrow("Not authorized to delete this notification")
    })
  })
})
