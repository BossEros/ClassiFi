import { describe, it, expect, beforeEach, vi } from "vitest"
import { NotificationService } from "../../src/services/notification/notification.service.js"
import type { NotificationRepository } from "../../src/repositories/notification.repository.js"
import type { NotificationQueueService } from "../../src/services/notification/queue.service.js"
import type { NotificationPreferenceService } from "../../src/services/notification/preference.service.js"
import type { Notification } from "../../src/models/index.js"
import { NotFoundError, ForbiddenError } from "../../src/shared/errors.js"

describe("NotificationService", () => {
  let service: NotificationService
  let mockNotificationRepo: NotificationRepository
  let mockQueueService: NotificationQueueService
  let mockPreferenceService: NotificationPreferenceService

  beforeEach(() => {
    // Create mock repositories and services
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

    mockQueueService = {
      enqueueDelivery: vi.fn(),
    } as any

    mockPreferenceService = {
      getEnabledChannels: vi.fn().mockResolvedValue(["EMAIL", "IN_APP"]),
      getPreference: vi.fn(),
      getAllPreferences: vi.fn(),
      updatePreference: vi.fn(),
    } as any

    service = new NotificationService(
      mockNotificationRepo,
      mockQueueService,
      mockPreferenceService,
    )
  })

  describe("createNotification", () => {
    it("should create notification with correct data", async () => {
      const mockNotification: Notification = {
        id: 1,
        userId: 1,
        type: "ASSIGNMENT_CREATED",
        title: "New Assignment: Test Assignment",
        message:
          'Your teacher has created a new assignment "Test Assignment" due on 2024-12-31.',
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
      vi.mocked(mockQueueService.enqueueDelivery).mockResolvedValue(undefined)

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
    })

    it("should queue delivery for all channels", async () => {
      const mockNotification: Notification = {
        id: 1,
        userId: 1,
        type: "ASSIGNMENT_CREATED",
        title: "Test",
        message: "Test",
        metadata: {
          assignmentId: 1,
          assignmentTitle: "Test",
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
      vi.mocked(mockQueueService.enqueueDelivery).mockResolvedValue(undefined)

      await service.createNotification(1, "ASSIGNMENT_CREATED", {
        assignmentTitle: "Test",
        className: "CS101",
        dueDate: "2024-12-31",
        assignmentUrl: "http://example.com",
        assignmentId: 1,
        classId: 1,
      })

      // ASSIGNMENT_CREATED has both EMAIL and IN_APP channels
      expect(mockQueueService.enqueueDelivery).toHaveBeenCalledTimes(2)
      expect(mockQueueService.enqueueDelivery).toHaveBeenCalledWith(
        1,
        "EMAIL",
        expect.any(Object),
      )
      expect(mockQueueService.enqueueDelivery).toHaveBeenCalledWith(
        1,
        "IN_APP",
        expect.any(Object),
      )
    })

    it("should throw error for unknown notification type", async () => {
      await expect(
        service.createNotification(1, "UNKNOWN_TYPE" as any, {}),
      ).rejects.toThrow("Unknown notification type: UNKNOWN_TYPE")
    })
  })

  describe("getUserNotifications", () => {
    it("should return paginated notifications", async () => {
      const mockNotifications: Notification[] = [
        {
          id: 1,
          userId: 1,
          type: "ASSIGNMENT_CREATED",
          title: "Test 1",
          message: "Message 1",
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
        },
        {
          id: 2,
          userId: 1,
          type: "SUBMISSION_GRADED",
          title: "Test 2",
          message: "Message 2",
          metadata: {
            assignmentId: 1,
            assignmentTitle: "Test Assignment",
            submissionId: 1,
            grade: 85,
            maxGrade: 100,
            submissionUrl: "http://example.com",
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

    it("should calculate correct offset for pagination", async () => {
      vi.mocked(mockNotificationRepo.findByUserId).mockResolvedValue([])
      vi.mocked(mockNotificationRepo.countByUserId).mockResolvedValue(0)

      await service.getUserNotifications(1, 3, 20)

      expect(mockNotificationRepo.findByUserId).toHaveBeenCalledWith(1, 20, 40)
    })

    it("should set hasMore to false when on last page", async () => {
      const mockNotifications: Notification[] = [
        {
          id: 1,
          userId: 1,
          type: "ASSIGNMENT_CREATED",
          title: "Test",
          message: "Message",
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
        },
      ]

      vi.mocked(mockNotificationRepo.findByUserId).mockResolvedValue(
        mockNotifications,
      )
      vi.mocked(mockNotificationRepo.countByUserId).mockResolvedValue(1)

      const result = await service.getUserNotifications(1, 1, 10)

      expect(result.hasMore).toBe(false)
    })

    it("should return only unread notifications when unreadOnly is true", async () => {
      const mockUnreadNotifications: Notification[] = [
        {
          id: 1,
          userId: 1,
          type: "ASSIGNMENT_CREATED",
          title: "Unread 1",
          message: "Message 1",
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
        },
        {
          id: 2,
          userId: 1,
          type: "SUBMISSION_GRADED",
          title: "Unread 2",
          message: "Message 2",
          metadata: {
            assignmentId: 1,
            assignmentTitle: "Test Assignment",
            submissionId: 1,
            grade: 85,
            maxGrade: 100,
            submissionUrl: "http://example.com",
          },
          isRead: false,
          readAt: null,
          createdAt: new Date(),
        },
      ]

      vi.mocked(mockNotificationRepo.findRecentUnread).mockResolvedValue(
        mockUnreadNotifications,
      )
      vi.mocked(mockNotificationRepo.countUnreadByUserId).mockResolvedValue(15)

      const result = await service.getUserNotifications(1, 2, 10, true)

      expect(result).toEqual({
        notifications: mockUnreadNotifications,
        total: 15,
        hasMore: true,
      })

      expect(mockNotificationRepo.findRecentUnread).toHaveBeenCalledWith(
        1,
        10,
        10,
      )
      expect(mockNotificationRepo.countUnreadByUserId).toHaveBeenCalledWith(1)
    })
  })

  describe("getUnreadCount", () => {
    it("should return unread count for user", async () => {
      vi.mocked(mockNotificationRepo.countUnreadByUserId).mockResolvedValue(5)

      const result = await service.getUnreadCount(1)

      expect(result).toBe(5)
      expect(mockNotificationRepo.countUnreadByUserId).toHaveBeenCalledWith(1)
    })

    it("should return 0 when user has no unread notifications", async () => {
      vi.mocked(mockNotificationRepo.countUnreadByUserId).mockResolvedValue(0)

      const result = await service.getUnreadCount(1)

      expect(result).toBe(0)
    })
  })

  describe("markAsRead", () => {
    it("should mark notification as read", async () => {
      const mockNotification: Notification = {
        id: 1,
        userId: 1,
        type: "ASSIGNMENT_CREATED",
        title: "Test",
        message: "Message",
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

      vi.mocked(mockNotificationRepo.findById).mockResolvedValue(
        mockNotification,
      )
      vi.mocked(mockNotificationRepo.markAsRead).mockResolvedValue(undefined)

      await service.markAsRead(1, 1)

      expect(mockNotificationRepo.markAsRead).toHaveBeenCalledWith(1)
    })

    it("should throw NotFoundError if notification does not exist", async () => {
      vi.mocked(mockNotificationRepo.findById).mockResolvedValue(undefined)

      await expect(service.markAsRead(1, 1)).rejects.toThrow(NotFoundError)
      await expect(service.markAsRead(1, 1)).rejects.toThrow(
        "Notification not found",
      )
    })

    it("should throw ForbiddenError if user is not authorized", async () => {
      const mockNotification: Notification = {
        id: 1,
        userId: 2, // Different user
        type: "ASSIGNMENT_CREATED",
        title: "Test",
        message: "Message",
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

      vi.mocked(mockNotificationRepo.findById).mockResolvedValue(
        mockNotification,
      )

      await expect(service.markAsRead(1, 1)).rejects.toThrow(ForbiddenError)
      await expect(service.markAsRead(1, 1)).rejects.toThrow(
        "Not authorized to access this notification",
      )
    })
  })

  describe("markAllAsRead", () => {
    it("should mark all notifications as read for user", async () => {
      vi.mocked(mockNotificationRepo.markAllAsReadByUserId).mockResolvedValue(
        undefined,
      )

      await service.markAllAsRead(1)

      expect(mockNotificationRepo.markAllAsReadByUserId).toHaveBeenCalledWith(1)
    })
  })

  describe("deleteNotification", () => {
    it("should delete notification", async () => {
      const mockNotification: Notification = {
        id: 1,
        userId: 1,
        type: "ASSIGNMENT_CREATED",
        title: "Test",
        message: "Message",
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

      vi.mocked(mockNotificationRepo.findById).mockResolvedValue(
        mockNotification,
      )
      vi.mocked(mockNotificationRepo.delete).mockResolvedValue(true)

      await service.deleteNotification(1, 1)

      expect(mockNotificationRepo.delete).toHaveBeenCalledWith(1)
    })

    it("should throw NotFoundError if notification does not exist", async () => {
      vi.mocked(mockNotificationRepo.findById).mockResolvedValue(undefined)

      await expect(service.deleteNotification(1, 1)).rejects.toThrow(
        NotFoundError,
      )
      await expect(service.deleteNotification(1, 1)).rejects.toThrow(
        "Notification not found",
      )
    })

    it("should throw ForbiddenError if user is not authorized", async () => {
      const mockNotification: Notification = {
        id: 1,
        userId: 2, // Different user
        type: "ASSIGNMENT_CREATED",
        title: "Test",
        message: "Message",
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

      vi.mocked(mockNotificationRepo.findById).mockResolvedValue(
        mockNotification,
      )

      await expect(service.deleteNotification(1, 1)).rejects.toThrow(
        ForbiddenError,
      )
      await expect(service.deleteNotification(1, 1)).rejects.toThrow(
        "Not authorized to delete this notification",
      )
    })
  })
})
