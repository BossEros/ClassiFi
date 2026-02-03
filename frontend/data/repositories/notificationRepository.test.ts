import { describe, it, expect, vi, beforeEach } from "vitest"
import { NotificationRepository } from "./notificationRepository"
import { apiClient } from "@/data/api/apiClient"
import type {
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
} from "@/business/models/notification/types"

// Mock the apiClient module
vi.mock("@/data/api/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe("NotificationRepository", () => {
  let repository: NotificationRepository

  beforeEach(() => {
    vi.clearAllMocks()
    repository = new NotificationRepository()
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

  const mockUnreadCountResponse: UnreadCountResponse = {
    success: true,
    unreadCount: 5,
  }

  const mockSuccessResponse = {
    success: true,
    message: "Operation successful",
  }

  // ============================================================================
  // getNotifications Tests
  // ============================================================================

  describe("getNotifications", () => {
    it("fetches notifications with default pagination", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockNotificationListResponse,
        status: 200,
      })

      const result = await repository.getNotifications()

      expect(apiClient.get).toHaveBeenCalledWith(
        "/notifications?page=1&limit=20",
      )
      expect(result.data?.notifications).toHaveLength(1)
      expect(result.data?.success).toBe(true)
    })

    it("fetches notifications with custom pagination", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockNotificationListResponse,
        status: 200,
      })

      await repository.getNotifications(2, 10)

      expect(apiClient.get).toHaveBeenCalledWith(
        "/notifications?page=2&limit=10",
      )
    })

    it("returns paginated results with hasMore flag", async () => {
      const paginatedResponse: NotificationListResponse = {
        success: true,
        notifications: Array(20).fill(mockNotification),
        total: 50,
        hasMore: true,
      }

      vi.mocked(apiClient.get).mockResolvedValue({
        data: paginatedResponse,
        status: 200,
      })

      const result = await repository.getNotifications(1, 20)

      expect(result.data?.hasMore).toBe(true)
      expect(result.data?.total).toBe(50)
    })

    it("returns empty array when no notifications exist", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          success: true,
          notifications: [],
          total: 0,
          hasMore: false,
        },
        status: 200,
      })

      const result = await repository.getNotifications()

      expect(result.data?.notifications).toHaveLength(0)
      expect(result.data?.total).toBe(0)
    })

    it("returns error when API fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Failed to fetch notifications",
        status: 500,
      })

      const result = await repository.getNotifications()

      expect(result.error).toBe("Failed to fetch notifications")
      expect(result.status).toBe(500)
    })

    it("returns error when unauthorized", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Unauthorized",
        status: 401,
      })

      const result = await repository.getNotifications()

      expect(result.error).toBe("Unauthorized")
      expect(result.status).toBe(401)
    })
  })

  // ============================================================================
  // getUnreadCount Tests
  // ============================================================================

  describe("getUnreadCount", () => {
    it("fetches unread notification count", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockUnreadCountResponse,
        status: 200,
      })

      const result = await repository.getUnreadCount()

      expect(apiClient.get).toHaveBeenCalledWith("/notifications/unread-count")
      expect(result.data?.unreadCount).toBe(5)
      expect(result.data?.success).toBe(true)
    })

    it("returns zero count when no unread notifications", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { success: true, unreadCount: 0 },
        status: 200,
      })

      const result = await repository.getUnreadCount()

      expect(result.data?.unreadCount).toBe(0)
    })

    it("returns error when API fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        error: "Failed to fetch unread count",
        status: 500,
      })

      const result = await repository.getUnreadCount()

      expect(result.error).toBe("Failed to fetch unread count")
    })
  })

  // ============================================================================
  // markAsRead Tests
  // ============================================================================

  describe("markAsRead", () => {
    it("marks a notification as read", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        data: mockSuccessResponse,
        status: 200,
      })

      const result = await repository.markAsRead(1)

      expect(apiClient.patch).toHaveBeenCalledWith("/notifications/1/read", {})
      expect(result.data?.success).toBe(true)
    })

    it("returns error when notification not found", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        error: "Notification not found",
        status: 404,
      })

      const result = await repository.markAsRead(999)

      expect(result.error).toBe("Notification not found")
      expect(result.status).toBe(404)
    })

    it("returns error when user not authorized", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        error: "Not authorized to access this notification",
        status: 403,
      })

      const result = await repository.markAsRead(1)

      expect(result.error).toBe("Not authorized to access this notification")
      expect(result.status).toBe(403)
    })
  })

  // ============================================================================
  // markAllAsRead Tests
  // ============================================================================

  describe("markAllAsRead", () => {
    it("marks all notifications as read", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        data: {
          success: true,
          message: "All notifications marked as read",
        },
        status: 200,
      })

      const result = await repository.markAllAsRead()

      expect(apiClient.patch).toHaveBeenCalledWith(
        "/notifications/read-all",
        {},
      )
      expect(result.data?.success).toBe(true)
    })

    it("returns error when API fails", async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({
        error: "Failed to mark all as read",
        status: 500,
      })

      const result = await repository.markAllAsRead()

      expect(result.error).toBe("Failed to mark all as read")
    })
  })

  // ============================================================================
  // deleteNotification Tests
  // ============================================================================

  describe("deleteNotification", () => {
    it("deletes a notification successfully", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        data: {
          success: true,
          message: "Notification deleted",
        },
        status: 200,
      })

      const result = await repository.deleteNotification(1)

      expect(apiClient.delete).toHaveBeenCalledWith("/notifications/1")
      expect(result.data?.success).toBe(true)
    })

    it("returns error when notification not found", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        error: "Notification not found",
        status: 404,
      })

      const result = await repository.deleteNotification(999)

      expect(result.error).toBe("Notification not found")
      expect(result.status).toBe(404)
    })

    it("returns error when user not authorized to delete", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        error: "Not authorized to delete this notification",
        status: 403,
      })

      const result = await repository.deleteNotification(1)

      expect(result.error).toBe("Not authorized to delete this notification")
      expect(result.status).toBe(403)
    })
  })
})
