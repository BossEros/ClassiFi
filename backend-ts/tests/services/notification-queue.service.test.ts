import { describe, it, expect, beforeEach, vi } from "vitest"
import { NotificationQueueService } from "../../src/services/notification/queue.service.js"
import type { NotificationDeliveryRepository } from "../../src/repositories/notification-delivery.repository.js"
import type { UserRepository } from "../../src/repositories/user.repository.js"
import type { IEmailService } from "../../src/services/interfaces/email.interface.js"
import type {
  NotificationDelivery,
  Notification,
  User,
} from "../../src/models/index.js"

describe("NotificationQueueService", () => {
  let service: NotificationQueueService
  let mockDeliveryRepo: NotificationDeliveryRepository
  let mockEmailService: IEmailService
  let mockUserRepo: UserRepository

  beforeEach(() => {
    // Create mock repositories and services
    mockDeliveryRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      getNotification: vi.fn(),
    } as any

    mockEmailService = {
      sendEmail: vi.fn(),
    } as any

    mockUserRepo = {
      findById: vi.fn(),
    } as any

    service = new NotificationQueueService(
      mockDeliveryRepo,
      mockEmailService,
      mockUserRepo,
    )
  })

  describe("enqueueDelivery", () => {
    it("should create a delivery record with PENDING status and template data", async () => {
      const testData = {
        assignmentId: 1,
        assignmentTitle: "Test",
        className: "CS101",
        classId: 1,
        dueDate: "2024-12-31",
        assignmentUrl: "http://example.com",
      }
      const mockDelivery: NotificationDelivery = {
        id: 1,
        notificationId: 1,
        channel: "EMAIL",
        status: "PENDING",
        recipientEmail: null,
        templateData: testData,
        sentAt: null,
        failedAt: null,
        errorMessage: null,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: null,
      }

      vi.mocked(mockDeliveryRepo.create).mockResolvedValue(mockDelivery)
      vi.mocked(mockDeliveryRepo.findById).mockResolvedValue(undefined) // Skip processing

      await service.enqueueDelivery(1, "EMAIL", testData)

      expect(mockDeliveryRepo.create).toHaveBeenCalledWith({
        notificationId: 1,
        channel: "EMAIL",
        status: "PENDING",
        retryCount: 0,
        templateData: testData,
      })
    })

    it("should process delivery immediately after queueing", async () => {
      const testData = {
        assignmentId: 1,
        assignmentTitle: "Test",
        className: "CS101",
        classId: 1,
        dueDate: "2024-12-31",
        assignmentUrl: "http://example.com",
      }
      const mockDelivery: NotificationDelivery = {
        id: 1,
        notificationId: 1,
        channel: "IN_APP",
        status: "PENDING",
        recipientEmail: null,
        templateData: testData,
        sentAt: null,
        failedAt: null,
        errorMessage: null,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: null,
      }

      vi.mocked(mockDeliveryRepo.create).mockResolvedValue(mockDelivery)
      vi.mocked(mockDeliveryRepo.findById).mockResolvedValue(mockDelivery)
      vi.mocked(mockDeliveryRepo.update).mockResolvedValue(undefined)

      await service.enqueueDelivery(1, "IN_APP", testData)

      expect(mockDeliveryRepo.update).toHaveBeenCalledWith(1, {
        status: "SENT",
        sentAt: expect.any(Date),
      })
    })
  })

  describe("processDelivery", () => {
    it("should mark IN_APP delivery as SENT without sending email", async () => {
      const testData = {
        assignmentId: 1,
        assignmentTitle: "Test",
        className: "CS101",
        classId: 1,
        dueDate: "2024-12-31",
        assignmentUrl: "http://example.com",
      }
      const mockDelivery: NotificationDelivery = {
        id: 1,
        notificationId: 1,
        channel: "IN_APP",
        status: "PENDING",
        recipientEmail: null,
        templateData: testData,
        sentAt: null,
        failedAt: null,
        errorMessage: null,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: null,
      }

      vi.mocked(mockDeliveryRepo.findById).mockResolvedValue(mockDelivery)
      vi.mocked(mockDeliveryRepo.update).mockResolvedValue(undefined)

      await service.processDelivery(1, testData)

      expect(mockEmailService.sendEmail).not.toHaveBeenCalled()
      expect(mockDeliveryRepo.update).toHaveBeenCalledWith(1, {
        status: "SENT",
        sentAt: expect.any(Date),
      })
    })

    it("should send email for EMAIL delivery", async () => {
      const testData = {
        assignmentId: 1,
        assignmentTitle: "Test",
        className: "CS101",
        classId: 1,
        dueDate: "2024-12-31",
        assignmentUrl: "http://example.com",
      }
      const mockDelivery: NotificationDelivery = {
        id: 1,
        notificationId: 1,
        channel: "EMAIL",
        status: "PENDING",
        recipientEmail: null,
        templateData: testData,
        sentAt: null,
        failedAt: null,
        errorMessage: null,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: null,
      }

      const mockNotification: Notification = {
        id: 1,
        userId: 1,
        type: "ASSIGNMENT_CREATED",
        title: "New Assignment: Test",
        message: "Test message",
        metadata: null,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      }

      const mockUser: User = {
        id: 1,
        supabaseUserId: "test-uuid",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "student",
        avatarUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: null,
      }

      vi.mocked(mockDeliveryRepo.findById).mockResolvedValue(mockDelivery)
      vi.mocked(mockDeliveryRepo.getNotification).mockResolvedValue(
        mockNotification,
      )
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser)
      vi.mocked(mockEmailService.sendEmail).mockResolvedValue(undefined)
      vi.mocked(mockDeliveryRepo.update).mockResolvedValue(undefined)

      await service.processDelivery(1, testData)

      expect(mockEmailService.sendEmail).toHaveBeenCalledWith({
        to: "test@example.com",
        subject: "New Assignment: Test",
        html: expect.stringContaining("New Assignment Posted"),
      })

      expect(mockDeliveryRepo.update).toHaveBeenCalledWith(1, {
        status: "SENT",
        sentAt: expect.any(Date),
      })
    })

    it("should not process delivery if status is not PENDING or RETRYING", async () => {
      const mockDelivery: NotificationDelivery = {
        id: 1,
        notificationId: 1,
        channel: "EMAIL",
        status: "SENT",
        recipientEmail: null,
        templateData: null,
        sentAt: new Date(),
        failedAt: null,
        errorMessage: null,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: null,
      }

      vi.mocked(mockDeliveryRepo.findById).mockResolvedValue(mockDelivery)

      await service.processDelivery(1)

      expect(mockEmailService.sendEmail).not.toHaveBeenCalled()
      expect(mockDeliveryRepo.update).not.toHaveBeenCalled()
    })

    it("should process RETRYING delivery using persisted template data", async () => {
      const testData = {
        assignmentId: 1,
        assignmentTitle: "Test",
        className: "CS101",
        classId: 1,
        dueDate: "2024-12-31",
        assignmentUrl: "http://example.com",
      }
      const mockDelivery: NotificationDelivery = {
        id: 1,
        notificationId: 1,
        channel: "IN_APP",
        status: "RETRYING",
        recipientEmail: null,
        templateData: testData,
        sentAt: null,
        failedAt: null,
        errorMessage: "Previous error",
        retryCount: 1,
        createdAt: new Date(),
        updatedAt: null,
      }

      vi.mocked(mockDeliveryRepo.findById).mockResolvedValue(mockDelivery)
      vi.mocked(mockDeliveryRepo.update).mockResolvedValue(undefined)

      await service.processDelivery(1)

      expect(mockDeliveryRepo.update).toHaveBeenCalledWith(1, {
        status: "SENT",
        sentAt: expect.any(Date),
      })
    })

    it("should handle delivery failure and trigger retry logic", async () => {
      const testData = {
        assignmentId: 1,
        assignmentTitle: "Test",
        className: "CS101",
        classId: 1,
        dueDate: "2024-12-31",
        assignmentUrl: "http://example.com",
      }
      const mockDelivery: NotificationDelivery = {
        id: 1,
        notificationId: 1,
        channel: "EMAIL",
        status: "PENDING",
        recipientEmail: null,
        templateData: testData,
        sentAt: null,
        failedAt: null,
        errorMessage: null,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: null,
      }

      const mockNotification: Notification = {
        id: 1,
        userId: 1,
        type: "ASSIGNMENT_CREATED",
        title: "Test",
        message: "Test",
        metadata: null,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      }

      const mockUser: User = {
        id: 1,
        supabaseUserId: "test-uuid",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "student",
        avatarUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: null,
      }

      vi.mocked(mockDeliveryRepo.findById).mockResolvedValue(mockDelivery)
      vi.mocked(mockDeliveryRepo.getNotification).mockResolvedValue(
        mockNotification,
      )
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser)
      vi.mocked(mockEmailService.sendEmail).mockRejectedValue(
        new Error("Email service error"),
      )

      await service.processDelivery(1, testData)

      expect(mockDeliveryRepo.update).toHaveBeenCalledWith(1, {
        status: "RETRYING",
        retryCount: 1,
        errorMessage: "Email service error",
        templateData: testData,
      })
    })
  })

  describe("retry logic", () => {
    it("should retry up to 3 times before marking as FAILED", async () => {
      const testData = {
        assignmentId: 1,
        assignmentTitle: "Test",
        className: "CS101",
        classId: 1,
        dueDate: "2024-12-31",
        assignmentUrl: "http://example.com",
      }
      const mockDelivery: NotificationDelivery = {
        id: 1,
        notificationId: 1,
        channel: "EMAIL",
        status: "PENDING",
        recipientEmail: null,
        templateData: testData,
        sentAt: null,
        failedAt: null,
        errorMessage: null,
        retryCount: 2, // Already retried twice
        createdAt: new Date(),
        updatedAt: null,
      }

      const mockNotification: Notification = {
        id: 1,
        userId: 1,
        type: "ASSIGNMENT_CREATED",
        title: "Test",
        message: "Test",
        metadata: null,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      }

      const mockUser: User = {
        id: 1,
        supabaseUserId: "test-uuid",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "student",
        avatarUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: null,
      }

      vi.mocked(mockDeliveryRepo.findById).mockResolvedValue(mockDelivery)
      vi.mocked(mockDeliveryRepo.getNotification).mockResolvedValue(
        mockNotification,
      )
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser)
      vi.mocked(mockEmailService.sendEmail).mockRejectedValue(
        new Error("Email service error"),
      )

      await service.processDelivery(1, testData)

      expect(mockDeliveryRepo.update).toHaveBeenCalledWith(1, {
        status: "FAILED",
        failedAt: expect.any(Date),
        errorMessage: "Email service error",
      })
    })

    it("should set status to RETRYING for failures under max retries", async () => {
      const testData = {
        assignmentId: 1,
        assignmentTitle: "Test",
        className: "CS101",
        classId: 1,
        dueDate: "2024-12-31",
        assignmentUrl: "http://example.com",
      }
      const mockDelivery: NotificationDelivery = {
        id: 1,
        notificationId: 1,
        channel: "EMAIL",
        status: "PENDING",
        recipientEmail: null,
        templateData: testData,
        sentAt: null,
        failedAt: null,
        errorMessage: null,
        retryCount: 1,
        createdAt: new Date(),
        updatedAt: null,
      }

      const mockNotification: Notification = {
        id: 1,
        userId: 1,
        type: "ASSIGNMENT_CREATED",
        title: "Test",
        message: "Test",
        metadata: null,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      }

      const mockUser: User = {
        id: 1,
        supabaseUserId: "test-uuid",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        role: "student",
        avatarUrl: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: null,
      }

      vi.mocked(mockDeliveryRepo.findById).mockResolvedValue(mockDelivery)
      vi.mocked(mockDeliveryRepo.getNotification).mockResolvedValue(
        mockNotification,
      )
      vi.mocked(mockUserRepo.findById).mockResolvedValue(mockUser)
      vi.mocked(mockEmailService.sendEmail).mockRejectedValue(
        new Error("Email service error"),
      )

      await service.processDelivery(1, testData)

      expect(mockDeliveryRepo.update).toHaveBeenCalledWith(1, {
        status: "RETRYING",
        retryCount: 2,
        errorMessage: "Email service error",
        templateData: testData,
      })
    })
  })

  describe("error handling", () => {
    it("should handle missing notification gracefully", async () => {
      const testData = {
        assignmentId: 1,
        assignmentTitle: "Test",
        className: "CS101",
        classId: 1,
        dueDate: "2024-12-31",
        assignmentUrl: "http://example.com",
      }
      const mockDelivery: NotificationDelivery = {
        id: 1,
        notificationId: 999,
        channel: "EMAIL",
        status: "PENDING",
        recipientEmail: null,
        templateData: testData,
        sentAt: null,
        failedAt: null,
        errorMessage: null,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: null,
      }

      vi.mocked(mockDeliveryRepo.findById).mockResolvedValue(mockDelivery)
      vi.mocked(mockDeliveryRepo.getNotification).mockResolvedValue(undefined)

      await service.processDelivery(1, testData)

      expect(mockDeliveryRepo.update).toHaveBeenCalledWith(1, {
        status: "RETRYING",
        retryCount: 1,
        errorMessage:
          "Notification not found for delivery 1 (notificationId: 999)",
        templateData: testData,
      })
    })

    it("should handle unknown notification type gracefully", async () => {
      const testData = {
        assignmentId: 1,
        assignmentTitle: "Test",
        className: "CS101",
        classId: 1,
        dueDate: "2024-12-31",
        assignmentUrl: "http://example.com",
      }
      const mockDelivery: NotificationDelivery = {
        id: 1,
        notificationId: 1,
        channel: "EMAIL",
        status: "PENDING",
        recipientEmail: null,
        templateData: testData,
        sentAt: null,
        failedAt: null,
        errorMessage: null,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: null,
      }

      const mockNotification: Notification = {
        id: 1,
        userId: 1,
        type: "UNKNOWN_TYPE" as any,
        title: "Test",
        message: "Test",
        metadata: null,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      }

      vi.mocked(mockDeliveryRepo.findById).mockResolvedValue(mockDelivery)
      vi.mocked(mockDeliveryRepo.getNotification).mockResolvedValue(
        mockNotification,
      )

      await service.processDelivery(1, testData)

      expect(mockDeliveryRepo.update).toHaveBeenCalledWith(1, {
        status: "RETRYING",
        retryCount: 1,
        errorMessage:
          'Unknown notification type "UNKNOWN_TYPE" for notification 1 (delivery: 1)',
        templateData: testData,
      })
    })

    it("should handle missing user email gracefully", async () => {
      const testData = {
        assignmentId: 1,
        assignmentTitle: "Test",
        className: "CS101",
        classId: 1,
        dueDate: "2024-12-31",
        assignmentUrl: "http://example.com",
      }
      const mockDelivery: NotificationDelivery = {
        id: 1,
        notificationId: 1,
        channel: "EMAIL",
        status: "PENDING",
        recipientEmail: null,
        templateData: testData,
        sentAt: null,
        failedAt: null,
        errorMessage: null,
        retryCount: 0,
        createdAt: new Date(),
        updatedAt: null,
      }

      const mockNotification: Notification = {
        id: 1,
        userId: 1,
        type: "ASSIGNMENT_CREATED",
        title: "Test",
        message: "Test",
        metadata: null,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      }

      vi.mocked(mockDeliveryRepo.findById).mockResolvedValue(mockDelivery)
      vi.mocked(mockDeliveryRepo.getNotification).mockResolvedValue(
        mockNotification,
      )
      vi.mocked(mockUserRepo.findById).mockResolvedValue(undefined)

      await service.processDelivery(1, testData)

      expect(mockDeliveryRepo.update).toHaveBeenCalledWith(1, {
        status: "RETRYING",
        retryCount: 1,
        errorMessage:
          "User email not found for notification 1 (userId: 1, delivery: 1)",
        templateData: testData,
      })
    })
  })
})
