import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { NotificationPreferenceService } from "@/modules/notifications/notification-preference.service.js"
import { toJsonSchema } from "@/api/utils/swagger.js"
import {
  UpdateNotificationPreferenceSchema,
  NotificationPreferencesResponseSchema,
  NotificationPreferenceResponseSchema,
  type UpdateNotificationPreferenceRequest,
} from "@/modules/notifications/notification-preference.schema.js"
import { ErrorResponseSchema } from "@/modules/auth/auth.schema.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Registers all notification preference routes under /api/v1/notification-preferences/*.
 * Handles HTTP requests for managing user notification preferences.
 *
 * @param app - Fastify application instance to register routes on.
 */
export async function notificationPreferenceRoutes(
  app: FastifyInstance,
): Promise<void> {
  const preferenceService = container.resolve<NotificationPreferenceService>(
    DI_TOKENS.services.notificationPreference,
  )

  /**
   * GET /
   * Get user's notification preferences
   */
  app.get("/", {
    schema: {
      tags: ["Notification Preferences"],
      summary: "Get user's notification preferences",
      description:
        "Retrieves all notification preferences for the authenticated user",
      security: [{ bearerAuth: [] }],
      response: {
        200: toJsonSchema(NotificationPreferencesResponseSchema),
        401: toJsonSchema(ErrorResponseSchema),
        500: toJsonSchema(ErrorResponseSchema),
      },
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user!.id
        const preferences = await preferenceService.getAllPreferences(userId)

        return reply.send({
          success: true,
          preferences,
        })
      } catch (err) {
        request.log.error(err, "Failed to fetch notification preferences")

        return reply.code(500).send({
          success: false,
          message: "An unexpected error occurred. Please try again later.",
        })
      }
    },
  })

  /**
   * PUT /
   * Update notification preference
   */
  app.put<{ Body: UpdateNotificationPreferenceRequest }>("/", {
    schema: {
      tags: ["Notification Preferences"],
      summary: "Update notification preference",
      description:
        "Updates notification preferences for a specific notification type",
      security: [{ bearerAuth: [] }],
      body: toJsonSchema(UpdateNotificationPreferenceSchema),
      response: {
        200: toJsonSchema(NotificationPreferenceResponseSchema),
        400: toJsonSchema(ErrorResponseSchema),
        401: toJsonSchema(ErrorResponseSchema),
        500: toJsonSchema(ErrorResponseSchema),
      },
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user!.id
        const { notificationType, emailEnabled, inAppEnabled } = request.body

        const preference = await preferenceService.updatePreference(
          userId,
          notificationType,
          emailEnabled,
          inAppEnabled,
        )

        return reply.send({
          success: true,
          preference,
        })
      } catch (err) {
        request.log.error(err, "Failed to update notification preference")

        return reply.code(500).send({
          success: false,
          message: "An unexpected error occurred. Please try again later.",
        })
      }
    },
  })
}
