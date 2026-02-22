import { describe, it, expect, beforeEach, vi } from "vitest"
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import { notificationRoutes } from "../../src/modules/notifications/notification.controller.js"
import type { NotificationService } from "../../src/modules/notifications/notification.service.js"
import type { Notification } from "../../src/models/index.js"
import { NotFoundError, ForbiddenError } from "../../src/shared/errors.js"
import { NotificationParamsSchema } from "../../src/modules/notifications/notification.schema.js"

// Mock container
vi.mock("tsyringe", () => ({
  container: {
    resolve: vi.fn(),
  },
  injectable: () => () => {},
  inject: () => () => {},
}))

// Mock zod-validation plugin (validators are bypassed in unit tests)
vi.mock("../../src/api/plugins/zod-validation.js", () => ({
  validateParams: () => async () => {},
  validateBody: () => async () => {},
  validateQuery: () => async () => {},
}))

describe("Notification Controller", () => {
  let mockNotificationService: NotificationService
  let mockApp: FastifyInstance
  let mockRequest: any
  let mockReply: Partial<FastifyReply>

  const mockNotification: Notification = {
    id: 1,
    userId: 1,
    type: "ASSIGNMENT_CREATED",
    title: "New Assignment",
    message: "Test message",
    metadata: { assignmentId: 1 },
    isRead: false,
    readAt: null,
    createdAt: new Date("2024-01-01"),
  }

  beforeEach(async () => {
    // Create mock service
    mockNotificationService = {
      getUserNotifications: vi.fn(),
      getUnreadCount: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      deleteNotification: vi.fn(),
    } as any

    // Mock container resolve
    const { container } = await import("tsyringe")
    vi.mocked(container.resolve).mockReturnValue(mockNotificationService)

    // Create mock reply
    mockReply = {
      send: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    }

    // Create mock request
    mockRequest = {
      user: { id: 1, email: "test@example.com", role: "student" },
      query: {},
      params: {},
    } as any

    // Create mock Fastify app
    mockApp = {
      get: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    } as any
  })

  describe("GET /", () => {
    it("should return paginated notifications", async () => {
      const mockResult = {
        notifications: [mockNotification],
        total: 1,
        hasMore: false,
      }

      vi.mocked(mockNotificationService.getUserNotifications).mockResolvedValue(
        mockResult,
      )

      await notificationRoutes(mockApp)

      // Get the handler from the first GET call
      const getCall = vi.mocked(mockApp.get).mock.calls[0]
      const handler = getCall[1].handler

      mockRequest.validatedQuery = { page: 1, limit: 20 }

      await handler(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockNotificationService.getUserNotifications).toHaveBeenCalledWith(
        1,
        1,
        20,
        undefined,
      )
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        notifications: [mockNotification],
        total: 1,
        hasMore: false,
      })
    })

    it("should support unreadOnly filter", async () => {
      const mockResult = {
        notifications: [mockNotification],
        total: 1,
        hasMore: false,
      }

      vi.mocked(mockNotificationService.getUserNotifications).mockResolvedValue(
        mockResult,
      )

      await notificationRoutes(mockApp)

      const getCall = vi.mocked(mockApp.get).mock.calls[0]
      const handler = getCall[1].handler

      mockRequest.validatedQuery = { page: 1, limit: 20, unreadOnly: true }

      await handler(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockNotificationService.getUserNotifications).toHaveBeenCalledWith(
        1,
        1,
        20,
        true,
      )
    })

    it("should use default pagination values", async () => {
      const mockResult = {
        notifications: [],
        total: 0,
        hasMore: false,
      }

      vi.mocked(mockNotificationService.getUserNotifications).mockResolvedValue(
        mockResult,
      )

      await notificationRoutes(mockApp)

      const getCall = vi.mocked(mockApp.get).mock.calls[0]
      const handler = getCall[1].handler

      mockRequest.validatedQuery = {}

      await handler(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockNotificationService.getUserNotifications).toHaveBeenCalledWith(
        1,
        1,
        20,
        undefined,
      )
    })
  })

  describe("GET /unread-count", () => {
    it("should return unread count", async () => {
      vi.mocked(mockNotificationService.getUnreadCount).mockResolvedValue(5)

      await notificationRoutes(mockApp)

      // Get the handler from the second GET call
      const getCall = vi.mocked(mockApp.get).mock.calls[1]
      const handler = getCall[1].handler

      await handler(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockNotificationService.getUnreadCount).toHaveBeenCalledWith(1)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        unreadCount: 5,
      })
    })

    it("should return zero when no unread notifications", async () => {
      vi.mocked(mockNotificationService.getUnreadCount).mockResolvedValue(0)

      await notificationRoutes(mockApp)

      const getCall = vi.mocked(mockApp.get).mock.calls[1]
      const handler = getCall[1].handler

      await handler(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        unreadCount: 0,
      })
    })
  })

  describe("PATCH /:id/read", () => {
    it("should mark notification as read", async () => {
      vi.mocked(mockNotificationService.markAsRead).mockResolvedValue(undefined)

      await notificationRoutes(mockApp)

      // Get the handler from the first PATCH call
      const patchCall = vi.mocked(mockApp.patch).mock.calls[0]
      const handler = patchCall[1].handler

      mockRequest.validatedParams = { id: 1 }

      await handler(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(1, 1)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: "Notification marked as read",
      })
    })

    it("should reject invalid notification ID via schema", () => {
      const result = NotificationParamsSchema.safeParse({ id: "invalid" })

      expect(result.success).toBe(false)
    })

    it("should handle NotFoundError", async () => {
      vi.mocked(mockNotificationService.markAsRead).mockRejectedValue(
        new NotFoundError("Notification not found"),
      )

      await notificationRoutes(mockApp)

      const patchCall = vi.mocked(mockApp.patch).mock.calls[0]
      const handler = patchCall[1].handler

      mockRequest.validatedParams = { id: 999 }

      await expect(
        handler(mockRequest as FastifyRequest, mockReply as FastifyReply),
      ).rejects.toThrow(NotFoundError)
    })

    it("should handle ForbiddenError", async () => {
      vi.mocked(mockNotificationService.markAsRead).mockRejectedValue(
        new ForbiddenError("Not authorized"),
      )

      await notificationRoutes(mockApp)

      const patchCall = vi.mocked(mockApp.patch).mock.calls[0]
      const handler = patchCall[1].handler

      mockRequest.validatedParams = { id: 1 }

      await expect(
        handler(mockRequest as FastifyRequest, mockReply as FastifyReply),
      ).rejects.toThrow(ForbiddenError)
    })
  })

  describe("PATCH /read-all", () => {
    it("should mark all notifications as read", async () => {
      vi.mocked(mockNotificationService.markAllAsRead).mockResolvedValue(
        undefined,
      )

      await notificationRoutes(mockApp)

      // Get the handler from the second PATCH call
      const patchCall = vi.mocked(mockApp.patch).mock.calls[1]
      const handler = patchCall[1].handler

      await handler(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockNotificationService.markAllAsRead).toHaveBeenCalledWith(1)
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: "All notifications marked as read",
      })
    })
  })

  describe("DELETE /:id", () => {
    it("should delete notification", async () => {
      vi.mocked(mockNotificationService.deleteNotification).mockResolvedValue(
        undefined,
      )

      await notificationRoutes(mockApp)

      // Get the handler from the DELETE call
      const deleteCall = vi.mocked(mockApp.delete).mock.calls[0]
      const handler = deleteCall[1].handler

      mockRequest.validatedParams = { id: 1 }

      await handler(mockRequest as FastifyRequest, mockReply as FastifyReply)

      expect(mockNotificationService.deleteNotification).toHaveBeenCalledWith(
        1,
        1,
      )
      expect(mockReply.send).toHaveBeenCalledWith({
        success: true,
        message: "Notification deleted",
      })
    })

    it("should reject invalid notification ID via schema", () => {
      const result = NotificationParamsSchema.safeParse({ id: "invalid" })

      expect(result.success).toBe(false)
    })

    it("should handle NotFoundError", async () => {
      vi.mocked(mockNotificationService.deleteNotification).mockRejectedValue(
        new NotFoundError("Notification not found"),
      )

      await notificationRoutes(mockApp)

      const deleteCall = vi.mocked(mockApp.delete).mock.calls[0]
      const handler = deleteCall[1].handler

      mockRequest.validatedParams = { id: 999 }

      await expect(
        handler(mockRequest as FastifyRequest, mockReply as FastifyReply),
      ).rejects.toThrow(NotFoundError)
    })

    it("should handle ForbiddenError", async () => {
      vi.mocked(mockNotificationService.deleteNotification).mockRejectedValue(
        new ForbiddenError("Not authorized"),
      )

      await notificationRoutes(mockApp)

      const deleteCall = vi.mocked(mockApp.delete).mock.calls[0]
      const handler = deleteCall[1].handler

      mockRequest.validatedParams = { id: 1 }

      await expect(
        handler(mockRequest as FastifyRequest, mockReply as FastifyReply),
      ).rejects.toThrow(ForbiddenError)
    })
  })
})
