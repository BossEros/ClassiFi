import { describe, it, expect, beforeEach, vi } from "vitest"
import { NotificationService } from "../../src/modules/notifications/notification.service.js"
import type { NotificationRepository } from "../../src/modules/notifications/notification.repository.js"
import type { UserRepository } from "../../src/modules/users/user.repository.js"
import type { IEmailService } from "../../src/services/interfaces/email.interface.js"
import type { Notification } from "../../src/models/index.js"
import { NotFoundError, ForbiddenError } from "../../src/shared/errors.js"

describe("NotificationService", () => {
  let service: NotificationService
  let mockNotificationRepo: NotificationRepository
  let mockUserRepo: UserRepository
  let mockEmailService: IEmailService

  beforeEach(() => {
    mockNotificationRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findRecentUnread: vi.fn(),
      countByUserId: vi.fn(),
      countUnreadByUserId: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsReadByUserId: vi.fn(),
      delete: vi.fn(),
    } as any

    mockUserRepo = {
      getUserById: vi.fn().mockResolvedValue({
        id: 1,
        email: "student@example.com",
        emailNotificationsEnabled: true,
        inAppNotificationsEnabled: true,
      }),
    } as any

    mockEmailService = {
      sendEmail: vi.fn().mockResolvedValue(undefined),
    }

    service = new NotificationService(
      mockNotificationRepo,
      mockUserRepo,
      mockEmailService,
    )
  })

  describe("createNotification", () => {
    it("creates an in-app notification and sends email when both channels are enabled", async () => {
      const mockNotification: Notification = {
        id: 1,
        userId: 1,
        type: "ASSIGNMENT_CREATED",
        title: "CS101: New Assignment Posted",
        message:
          'Your teacher has posted a new assignment "Test Assignment" in CS101, due on 2024-12-31.',
        metadata: {
          assignmentId: 1,
          assignmentTitle: "Test Assignment",
          className: "CS101",
          classId: 1,
          dueDate: "2024-12-31",
          assignmentUrl: "http://example.com",
        },
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      }

      vi.mocked(mockNotificationRepo.create).mockResolvedValue(mockNotification)

      const result = await service.createNotification(1, "ASSIGNMENT_CREATED", {
        assignmentTitle: "Test Assignment",
        className: "CS101",
        dueDate: "2024-12-31",
        assignmentUrl: "http://example.com",
        assignmentId: 1,
        classId: 1,
      })

      expect(result).toEqual(mockNotification)
      expect(mockNotificationRepo.create).toHaveBeenCalledWith({
        userId: 1,
        type: "ASSIGNMENT_CREATED",
        title: "CS101: New Assignment Posted",
        message: expect.stringContaining("Test Assignment"),
        metadata: {
          assignmentId: 1,
          assignmentTitle: "Test Assignment",
          className: "CS101",
          classId: 1,
          dueDate: "2024-12-31",
          assignmentUrl: "http://example.com",
        },
      })
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "student@example.com",
          subject: "CS101: New Assignment Posted",
        }),
      )
    })

    it("returns null when both channels are disabled", async () => {
      vi.mocked(mockUserRepo.getUserById).mockResolvedValue({
        id: 1,
        email: "student@example.com",
        emailNotificationsEnabled: false,
        inAppNotificationsEnabled: false,
      } as any)

      const result = await service.createNotification(1, "ASSIGNMENT_CREATED", {
        assignmentTitle: "Test Assignment",
        className: "CS101",
        dueDate: "2024-12-31",
        assignmentUrl: "http://example.com",
        assignmentId: 1,
        classId: 1,
      })

      expect(result).toBeNull()
      expect(mockNotificationRepo.create).not.toHaveBeenCalled()
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled()
    })

    it("creates only an in-app notification when email is disabled", async () => {
      const mockNotification: Notification = {
        id: 1,
        userId: 1,
        type: "ASSIGNMENT_CREATED",
        title: "CS101: New Assignment Posted",
        message: "Test message",
        metadata: {
          assignmentId: 1,
          assignmentTitle: "Test Assignment",
          className: "CS101",
          classId: 1,
          dueDate: "2024-12-31",
          assignmentUrl: "http://example.com",
        },
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      }

      vi.mocked(mockUserRepo.getUserById).mockResolvedValue({
        id: 1,
        email: "student@example.com",
        emailNotificationsEnabled: false,
        inAppNotificationsEnabled: true,
      } as any)
      vi.mocked(mockNotificationRepo.create).mockResolvedValue(mockNotification)

      const result = await service.createNotification(1, "ASSIGNMENT_CREATED", {
        assignmentTitle: "Test Assignment",
        className: "CS101",
        dueDate: "2024-12-31",
        assignmentUrl: "http://example.com",
        assignmentId: 1,
        classId: 1,
      })

      expect(result).toEqual(mockNotification)
      expect(mockNotificationRepo.create).toHaveBeenCalledTimes(1)
      expect(mockEmailService.sendEmail).not.toHaveBeenCalled()
    })

    it("sends only email when in-app notifications are disabled", async () => {
      vi.mocked(mockUserRepo.getUserById).mockResolvedValue({
        id: 1,
        email: "student@example.com",
        emailNotificationsEnabled: true,
        inAppNotificationsEnabled: false,
      } as any)

      const result = await service.createNotification(1, "ASSIGNMENT_CREATED", {
        assignmentTitle: "Test Assignment",
        className: "CS101",
        dueDate: "2024-12-31",
        assignmentUrl: "http://example.com",
        assignmentId: 1,
        classId: 1,
      })

      expect(result).toBeNull()
      expect(mockNotificationRepo.create).not.toHaveBeenCalled()
      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1)
    })

    it("does not reject when email sending fails after creating an in-app notification", async () => {
      const mockNotification: Notification = {
        id: 1,
        userId: 1,
        type: "ASSIGNMENT_CREATED",
        title: "CS101: New Assignment Posted",
        message: "Test message",
        metadata: {
          assignmentId: 1,
          assignmentTitle: "Test Assignment",
          className: "CS101",
          classId: 1,
          dueDate: "2024-12-31",
          assignmentUrl: "http://example.com",
        },
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      }

      vi.mocked(mockNotificationRepo.create).mockResolvedValue(mockNotification)
      vi.mocked(mockEmailService.sendEmail).mockRejectedValue(
        new Error("SMTP unavailable"),
      )

      await expect(
        service.createNotification(1, "ASSIGNMENT_CREATED", {
          assignmentTitle: "Test Assignment",
          className: "CS101",
          dueDate: "2024-12-31",
          assignmentUrl: "http://example.com",
          assignmentId: 1,
          classId: 1,
        }),
      ).resolves.toEqual(mockNotification)

      await Promise.resolve()

      expect(mockNotificationRepo.create).toHaveBeenCalledTimes(1)
      expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1)
    })

    it("throws an error for an unknown notification type", async () => {
      await expect(
        service.createNotification(1, "UNKNOWN_TYPE" as any, {}),
      ).rejects.toThrow("Unknown notification type: UNKNOWN_TYPE")
    })
  })

  describe("getUserNotifications", () => {
    it("returns paginated notifications", async () => {
      const mockNotifications: Notification[] = [
        {
          id: 1,
          userId: 1,
          type: "ASSIGNMENT_CREATED",
          title: "Test 1",
          message: "Message 1",
          metadata: { assignmentId: 1 },
          isRead: false,
          readAt: null,
          createdAt: new Date(),
        },
        {
          id: 2,
          userId: 1,
          type: "SUBMISSION_GRADED",
          title: "Test 2",
          message: "Message 2",
          metadata: {
            assignmentId: 1,
            submissionId: 1,
            grade: 85,
            maxGrade: 100,
          },
          isRead: true,
          readAt: new Date(),
          createdAt: new Date(),
        },
      ]

      vi.mocked(mockNotificationRepo.findByUserId).mockResolvedValue(
        mockNotifications,
      )
      vi.mocked(mockNotificationRepo.countByUserId).mockResolvedValue(25)

      const result = await service.getUserNotifications(1, 1, 10)

      expect(result).toEqual({
        notifications: mockNotifications,
        total: 25,
        hasMore: true,
      })
      expect(mockNotificationRepo.findByUserId).toHaveBeenCalledWith(1, 10, 0)
    })

    it("returns unread notifications when unreadOnly is true", async () => {
      const mockUnreadNotifications: Notification[] = [
        {
          id: 1,
          userId: 1,
          type: "ASSIGNMENT_CREATED",
          title: "Unread 1",
          message: "Message 1",
          metadata: { assignmentId: 1 },
          isRead: false,
          readAt: null,
          createdAt: new Date(),
        },
      ]

      vi.mocked(mockNotificationRepo.findRecentUnread).mockResolvedValue(
        mockUnreadNotifications,
      )
      vi.mocked(mockNotificationRepo.countUnreadByUserId).mockResolvedValue(1)

      const result = await service.getUserNotifications(1, 1, 10, true)

      expect(result).toEqual({
        notifications: mockUnreadNotifications,
        total: 1,
        hasMore: false,
      })
      expect(mockNotificationRepo.findRecentUnread).toHaveBeenCalledWith(
        1,
        10,
        0,
      )
    })
  })

  describe("getUnreadCount", () => {
    it("returns unread count for a user", async () => {
      vi.mocked(mockNotificationRepo.countUnreadByUserId).mockResolvedValue(5)

      const result = await service.getUnreadCount(1)

      expect(result).toBe(5)
      expect(mockNotificationRepo.countUnreadByUserId).toHaveBeenCalledWith(1)
    })
  })

  describe("markAsRead", () => {
    it("marks a notification as read", async () => {
      const mockNotification: Notification = {
        id: 1,
        userId: 1,
        type: "ASSIGNMENT_CREATED",
        title: "Test",
        message: "Message",
        metadata: { assignmentId: 1 },
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      }

      vi.mocked(mockNotificationRepo.findById).mockResolvedValue(
        mockNotification,
      )
      vi.mocked(mockNotificationRepo.markAsRead).mockResolvedValue(undefined)

      await service.markAsRead(1, 1)

      expect(mockNotificationRepo.markAsRead).toHaveBeenCalledWith(1)
    })

    it("throws NotFoundError when the notification does not exist", async () => {
      vi.mocked(mockNotificationRepo.findById).mockResolvedValue(undefined)

      await expect(service.markAsRead(1, 1)).rejects.toThrow(NotFoundError)
    })

    it("throws ForbiddenError when the user is not authorized", async () => {
      vi.mocked(mockNotificationRepo.findById).mockResolvedValue({
        id: 1,
        userId: 2,
      } as any)

      await expect(service.markAsRead(1, 1)).rejects.toThrow(ForbiddenError)
    })
  })

  describe("markAllAsRead", () => {
    it("marks all notifications as read for the user", async () => {
      vi.mocked(mockNotificationRepo.markAllAsReadByUserId).mockResolvedValue(
        undefined,
      )

      await service.markAllAsRead(1)

      expect(mockNotificationRepo.markAllAsReadByUserId).toHaveBeenCalledWith(1)
    })
  })

  describe("deleteNotification", () => {
    it("deletes a notification", async () => {
      vi.mocked(mockNotificationRepo.findById).mockResolvedValue({
        id: 1,
        userId: 1,
      } as any)
      vi.mocked(mockNotificationRepo.delete).mockResolvedValue(true as any)

      await service.deleteNotification(1, 1)

      expect(mockNotificationRepo.delete).toHaveBeenCalledWith(1)
    })

    it("throws NotFoundError when the notification does not exist", async () => {
      vi.mocked(mockNotificationRepo.findById).mockResolvedValue(undefined)

      await expect(service.deleteNotification(1, 1)).rejects.toThrow(
        NotFoundError,
      )
    })

    it("throws ForbiddenError when the user is not authorized", async () => {
      vi.mocked(mockNotificationRepo.findById).mockResolvedValue({
        id: 1,
        userId: 2,
      } as any)

      await expect(service.deleteNotification(1, 1)).rejects.toThrow(
        ForbiddenError,
      )
    })
  })
})
