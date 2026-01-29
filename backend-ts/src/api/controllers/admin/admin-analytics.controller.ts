import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { AdminAnalyticsService } from "@/services/admin/admin-analytics.service.js"
import { authMiddleware } from "@/api/middlewares/auth.middleware.js"
import { adminMiddleware } from "@/api/middlewares/admin.middleware.js"
import { toJsonSchema } from "@/api/utils/swagger.js"
import {
  AdminStatsResponseSchema,
  ActivityQuerySchema,
  ActivityResponseSchema,
  type ActivityQuery,
} from "@/api/schemas/admin.schema.js"

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
    "AdminAnalyticsService",
  )
  const preHandlerMiddlewares = [authMiddleware, adminMiddleware]

  /**
   * GET /stats
   * Get dashboard statistics
   */
  app.get("/stats", {
    preHandler: preHandlerMiddlewares,
    schema: {
      tags: ["Admin - Analytics"],
      summary: "Get dashboard statistics",
      description:
        "Retrieves system-wide statistics including user counts, class counts, and activity metrics",
      security: [{ bearerAuth: [] }],
      response: { 200: toJsonSchema(AdminStatsResponseSchema) },
    },
    handler: async (_request, reply) => {
      const systemStatistics = await adminAnalyticsService.getAdminStats()

      return reply.send({ success: true, stats: systemStatistics })
    },
  })

  /**
   * GET /activity
   * Get recent activity
   */
  app.get<{ Querystring: ActivityQuery }>("/activity", {
    preHandler: preHandlerMiddlewares,
    schema: {
      tags: ["Admin - Analytics"],
      summary: "Get recent activity",
      description:
        "Retrieves recent platform activity with optional limit parameter",
      security: [{ bearerAuth: [] }],
      querystring: toJsonSchema(ActivityQuerySchema),
      response: { 200: toJsonSchema(ActivityResponseSchema) },
    },
    handler: async (request, reply) => {
      const activityLimit = request.query.limit

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
