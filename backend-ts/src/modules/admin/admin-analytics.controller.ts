import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { AdminAnalyticsService } from "@/modules/admin/admin-analytics.service.js"
import { adminMiddleware } from "@/api/middlewares/admin.middleware.js"
import { validateQuery } from "@/api/plugins/zod-validation.js"
import {
  ActivityQuerySchema,
  type ActivityQuery,
} from "@/modules/admin/admin.schema.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Registers admin analytics and statistics routes for system monitoring.
 *
 * Provides endpoints for administrators to retrieve system-wide statistics
 * and monitor recent platform activity.
 * All routes require authentication and admin privileges.
 *
 * @param app - The Fastify application instance to register routes on.
 * @returns A promise that resolves when all routes are registered.
 */
export async function adminAnalyticsRoutes(
  app: FastifyInstance,
): Promise<void> {
  const adminAnalyticsService = container.resolve<AdminAnalyticsService>(
    DI_TOKENS.services.adminAnalytics,
  )
  const preHandlerMiddlewares = [adminMiddleware]

  /**
   * GET /stats
   * Get dashboard statistics
   */
  app.get("/stats", {
    preHandler: preHandlerMiddlewares,
    handler: async (_request, reply) => {
      const systemStatistics = await adminAnalyticsService.getAdminStats()

      return reply.send({ success: true, stats: systemStatistics })
    },
  })

  /**
   * GET /activity
   * Get recent activity
   */
  app.get("/activity", {
    preHandler: [...preHandlerMiddlewares, validateQuery(ActivityQuerySchema)],
    handler: async (request, reply) => {
      const { limit: activityLimit } = request.validatedQuery as ActivityQuery

      const recentActivityList =
        await adminAnalyticsService.getRecentActivity(activityLimit)

      const serializedActivityList = recentActivityList.map((activityItem) => ({
        ...activityItem,
        timestamp: activityItem.timestamp.toISOString(),
      }))

      return reply.send({
        success: true,
        activity: serializedActivityList,
      })
    },
  })
}
