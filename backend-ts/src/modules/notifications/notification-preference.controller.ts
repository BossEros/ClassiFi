import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { NotificationPreferenceService } from "@/modules/notifications/notification-preference.service.js"
import { validateBody } from "@/api/plugins/zod-validation.js"
import {
  UpdateNotificationPreferenceSchema,
  type UpdateNotificationPreferenceRequest,
} from "@/modules/notifications/notification-preference.schema.js"
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
    handler: async (request, reply) => {
      const userId = request.user!.id
      const preferences = await preferenceService.getAllPreferences(userId)

      return reply.send({
        success: true,
        preferences,
      })
    },
  })

  /**
   * PUT /
   * Update notification preference
   */
  app.put("/", {
    preHandler: validateBody(UpdateNotificationPreferenceSchema),
    handler: async (request, reply) => {
      const userId = request.user!.id
      const { notificationType, emailEnabled, inAppEnabled } =
        request.validatedBody as UpdateNotificationPreferenceRequest

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
    },
  })
}
