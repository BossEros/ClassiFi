import { describe, it, expect, vi, beforeEach } from "vitest"
import * as notificationService from "@/business/services/notificationService"
import { notificationRepository } from "@/data/repositories/notificationRepository"
import type {
  Notification,
  NotificationListResponse,
} from "@/business/models/notification/types"

// Mock the notification repository
vi.mock("@/data/repositories/notificationRepository", () => ({
  notificationRepository: {
    getNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
  },
}))

describe("notificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // Fixtures
  // ============================================================================

  const mockNotification: Notification = {
    id: 1,
    userId: 1,
    type: "ASSIGNMENT_CREATED",
    title: "New Assignment: Hello World",
    message:
      'Your teacher has created a new assignment "Hello World" due on 2024-12-31.',
    metadata: {
      assignmentId: 1,
      assignmentTitle: "Hello World",
      className: "CS101",
      classId: 1,
      dueDate: "2024-12-31",
      assignmentUrl: "/assignments/1",
    },
    isRead: false,
    readAt: null,
    createdAt: "2024-01-15T10:00:00Z",
  }

  const mockNotificationListResponse: NotificationListResponse = {
    success: true,
    notifications: [mockNotification],
    total: 1,
    hasMore: false,
  }

  // ============================================================================
  // getNotifications Tests
  // ============================================================================

  describe("getNotifications", () => {
    it("fetches notifications successfully", async () => {
      vi.mocked(notificationRepository.getNotifications).mockResolvedValue({
        data: mockNotificationListResponse,
        status: 200,
      })

      const result = await notificationService.getNotifications(1, 20)

      expect(notificationRepository.getNotifications).toHaveBeenCalledWith(
        1,
        20,
      )
      expect(result).toEqual(mockNotificationListResponse)
    })

    it("uses default pagination parameters", async () => {
      vi.mocked(notificationRepository.getNotifications).mockResolvedValue({
        data: mockNotificationListResponse,
        status: 200,
      })

      await notificationService.getNotifications()

      expect(notificationRepository.getNotifications).toHaveBeenCalledWith(
        1,
        20,
      )
    })

    it("throws error when repository returns error", async () => {
      vi.mocked(notificationRepository.getNotifications).mockResolvedValue({
        error: "Failed to fetch notifications",
        status: 500,
      })

      await expect(notificationService.getNotifications()).rejects.toThrow(
        "Failed to fetch notifications",
      )
    })

    it("throws error when data is missing", async () => {
      vi.mocked(notificationRepository.getNotifications).mockResolvedValue({
        data: undefined,
        status: 200,
      })

      await expect(notificationService.getNotifications()).rejects.toThrow(
        "Failed to fetch notifications",
      )
    })
  })

  // ============================================================================
  // getUnreadCount Tests
  // ============================================================================

  describe("getUnreadCount", () => {
    it("fetches unread count successfully", async () => {
      vi.mocked(notificationRepository.getUnreadCount).mockResolvedValue({
        data: { success: true, unreadCount: 5 },
        status: 200,
      })

      const result = await notificationService.getUnreadCount()

      expect(notificationRepository.getUnreadCount).toHaveBeenCalled()
      expect(result).toBe(5)
    })

    it("returns zero when no unread notifications", async () => {
      vi.mocked(notificationRepository.getUnreadCount).mockResolvedValue({
        data: { success: true, unreadCount: 0 },
        status: 200,
      })

      const result = await notificationService.getUnreadCount()

      expect(result).toBe(0)
    })

    it("throws error when repository returns error", async () => {
      vi.mocked(notificationRepository.getUnreadCount).mockResolvedValue({
        error: "Failed to fetch unread count",
        status: 500,
      })

      await expect(notificationService.getUnreadCount()).rejects.toThrow(
        "Failed to fetch unread count",
      )
    })

    it("throws error when data is missing", async () => {
      vi.mocked(notificationRepository.getUnreadCount).mockResolvedValue({
        data: undefined,
        status: 200,
      })

      await expect(notificationService.getUnreadCount()).rejects.toThrow(
        "Failed to fetch unread count",
      )
    })
  })

  // ============================================================================
  // markAsRead Tests
  // ============================================================================

  describe("markAsRead", () => {
    it("marks notification as read successfully", async () => {
      vi.mocked(notificationRepository.markAsRead).mockResolvedValue({
        data: { success: true, message: "Marked as read" },
        status: 200,
      })

      await notificationService.markAsRead(1)

      expect(notificationRepository.markAsRead).toHaveBeenCalledWith(1)
    })

    it("throws error when repository returns error", async () => {
      vi.mocked(notificationRepository.markAsRead).mockResolvedValue({
        error: "Notification not found",
        status: 404,
      })

      await expect(notificationService.markAsRead(999)).rejects.toThrow(
        "Notification not found",
      )
    })
  })

  // ============================================================================
  // markAllAsRead Tests
  // ============================================================================

  describe("markAllAsRead", () => {
    it("marks all notifications as read successfully", async () => {
      vi.mocked(notificationRepository.markAllAsRead).mockResolvedValue({
        data: { success: true, message: "All marked as read" },
        status: 200,
      })

      await notificationService.markAllAsRead()

      expect(notificationRepository.markAllAsRead).toHaveBeenCalled()
    })

    it("throws error when repository returns error", async () => {
      vi.mocked(notificationRepository.markAllAsRead).mockResolvedValue({
        error: "Failed to mark all as read",
        status: 500,
      })

      await expect(notificationService.markAllAsRead()).rejects.toThrow(
        "Failed to mark all as read",
      )
    })
  })

  // ============================================================================
  // deleteNotification Tests
  // ============================================================================

  describe("deleteNotification", () => {
    it("deletes notification successfully", async () => {
      vi.mocked(notificationRepository.deleteNotification).mockResolvedValue({
        data: { success: true, message: "Notification deleted" },
        status: 200,
      })

      await notificationService.deleteNotification(1)

      expect(notificationRepository.deleteNotification).toHaveBeenCalledWith(1)
    })

    it("throws error when repository returns error", async () => {
      vi.mocked(notificationRepository.deleteNotification).mockResolvedValue({
        error: "Not authorized to delete this notification",
        status: 403,
      })

      await expect(notificationService.deleteNotification(1)).rejects.toThrow(
        "Not authorized to delete this notification",
      )
    })
  })

  // ============================================================================
  // formatNotificationTime Tests
  // ============================================================================

  describe("formatNotificationTime", () => {
    it('returns "Just now" for very recent notifications', () => {
      const now = new Date().toISOString()
      const result = notificationService.formatNotificationTime(now)

      expect(result).toBe("Just now")
    })

    it("returns minutes ago for notifications within an hour", () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60000).toISOString()
      const result = notificationService.formatNotificationTime(fiveMinutesAgo)

      expect(result).toBe("5m ago")
    })

    it("returns hours ago for notifications within a day", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString()
      const result = notificationService.formatNotificationTime(twoHoursAgo)

      expect(result).toBe("2h ago")
    })

    it("returns days ago for notifications within a week", () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString()
      const result = notificationService.formatNotificationTime(threeDaysAgo)

      expect(result).toBe("3d ago")
    })

    it("returns formatted date for notifications older than a week", () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString()
      const result = notificationService.formatNotificationTime(tenDaysAgo)

      // Should return a date string like "1/5/2024"
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
    })

    it("handles edge case of exactly 1 minute", () => {
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()
      const result = notificationService.formatNotificationTime(oneMinuteAgo)

      expect(result).toBe("1m ago")
    })

    it("handles edge case of exactly 1 hour", () => {
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString()
      const result = notificationService.formatNotificationTime(oneHourAgo)

      expect(result).toBe("1h ago")
    })

    it("handles edge case of exactly 1 day", () => {
      const oneDayAgo = new Date(Date.now() - 86400000).toISOString()
      const result = notificationService.formatNotificationTime(oneDayAgo)

      expect(result).toBe("1d ago")
    })
  })

  // ============================================================================
  // getNotificationIcon Tests
  // ============================================================================

  describe("getNotificationIcon", () => {
    it("returns FileText icon for ASSIGNMENT_CREATED", () => {
      const result =
        notificationService.getNotificationIcon("ASSIGNMENT_CREATED")

      expect(result).toBe("FileText")
    })

    it("returns CheckCircle icon for SUBMISSION_GRADED", () => {
      const result =
        notificationService.getNotificationIcon("SUBMISSION_GRADED")

      expect(result).toBe("CheckCircle")
    })

    it("returns Megaphone icon for CLASS_ANNOUNCEMENT", () => {
      const result =
        notificationService.getNotificationIcon("CLASS_ANNOUNCEMENT")

      expect(result).toBe("Megaphone")
    })

    it("returns Clock icon for DEADLINE_REMINDER", () => {
      const result =
        notificationService.getNotificationIcon("DEADLINE_REMINDER")

      expect(result).toBe("Clock")
    })

    it("returns UserPlus icon for ENROLLMENT_CONFIRMED", () => {
      const result = notificationService.getNotificationIcon(
        "ENROLLMENT_CONFIRMED",
      )

      expect(result).toBe("UserPlus")
    })

    it("returns Bell icon for unknown notification type", () => {
      // @ts-expect-error Testing fallback behavior for unknown type input
      const result = notificationService.getNotificationIcon("UNKNOWN_TYPE")

      expect(result).toBe("Bell")
    })
  })
})


