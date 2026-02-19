import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { NotificationService } from "../../services/notification/notification.service.js"
import { toJsonSchema } from "../utils/swagger.js"
import { parsePositiveInt } from "../../shared/utils.js"
import {
  NotificationQueryParamsSchema,
  NotificationParamsSchema,
  NotificationsResponseSchema,
  UnreadCountResponseSchema,
  SuccessResponseSchema,
  ListNotificationsDto,
  type NotificationQueryParams,
  type NotificationParams,
} from "../schemas/notification.schema.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Registers all notification-related routes under /api/v1/notifications/*.
 * Handles HTTP requests for notification operations including listing,
 * marking as read, and deletion.
 *
 * @param app - Fastify application instance to register routes on.
 */
export async function notificationRoutes(app: FastifyInstance): Promise<void> {
  const notificationService = container.resolve<NotificationService>(
    DI_TOKENS.services.notification,
  )

  /**
   * GET /
   * Get user's notifications with pagination
   */
  app.get<{ Querystring: NotificationQueryParams }>("/", {
    schema: {
      tags: ["Notifications"],
      summary: "Get user's notifications",
      description:
        "Retrieves paginated list of notifications for the authenticated user",
      security: [{ bearerAuth: [] }],
      querystring: toJsonSchema(NotificationQueryParamsSchema),
      response: {
        200: toJsonSchema(NotificationsResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user!.id
      const dto = new ListNotificationsDto(request.query)

      const result = await notificationService.getUserNotifications(
        userId,
        dto.page,
        dto.limit,
        dto.unreadOnly,
      )

      return reply.send({
        success: true,
        notifications: result.notifications,
        total: result.total,
        hasMore: result.hasMore,
      })
    },
  })

  /**
   * GET /unread-count
   * Get count of unread notifications
   */
  app.get("/unread-count", {
    schema: {
      tags: ["Notifications"],
      summary: "Get unread notification count",
      description:
        "Returns the total count of unread notifications for the authenticated user",
      security: [{ bearerAuth: [] }],
      response: {
        200: toJsonSchema(UnreadCountResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user!.id
      const unreadCount = await notificationService.getUnreadCount(userId)

      return reply.send({
        success: true,
        unreadCount,
      })
    },
  })

  /**
   * PATCH /:id/read
   * Mark notification as read
   */
  app.patch<{ Params: NotificationParams }>("/:id/read", {
    schema: {
      tags: ["Notifications"],
      summary: "Mark notification as read",
      description:
        "Marks a specific notification as read for the authenticated user",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(NotificationParamsSchema),
      response: {
        200: toJsonSchema(SuccessResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const notificationId = parsePositiveInt(
        request.params.id,
        "Notification ID",
      )
      const userId = request.user!.id

      await notificationService.markAsRead(notificationId, userId)

      return reply.send({
        success: true,
        message: "Notification marked as read",
      })
    },
  })

  /**
   * PATCH /read-all
   * Mark all notifications as read
   */
  app.patch("/read-all", {
    schema: {
      tags: ["Notifications"],
      summary: "Mark all notifications as read",
      description: "Marks all notifications as read for the authenticated user",
      security: [{ bearerAuth: [] }],
      response: {
        200: toJsonSchema(SuccessResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user!.id

      await notificationService.markAllAsRead(userId)

      return reply.send({
        success: true,
        message: "All notifications marked as read",
      })
    },
  })

  /**
   * DELETE /:id
   * Delete a notification
   */
  app.delete<{ Params: NotificationParams }>("/:id", {
    schema: {
      tags: ["Notifications"],
      summary: "Delete a notification",
      description:
        "Permanently deletes a notification for the authenticated user",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(NotificationParamsSchema),
      response: {
        200: toJsonSchema(SuccessResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const notificationId = parsePositiveInt(
        request.params.id,
        "Notification ID",
      )
      const userId = request.user!.id

      await notificationService.deleteNotification(notificationId, userId)

      return reply.send({
        success: true,
        message: "Notification deleted",
      })
    },
  })
}
