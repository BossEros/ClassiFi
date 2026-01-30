/**
 * Admin Analytics Controller
 * Handles analytics and statistics endpoints.
 */
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

export async function adminAnalyticsRoutes(
  app: FastifyInstance,
): Promise<void> {
  const adminAnalyticsService = container.resolve<AdminAnalyticsService>(
    "AdminAnalyticsService",
  )
  const preHandler = [authMiddleware, adminMiddleware]

  // GET /stats
  app.get("/stats", {
    preHandler,
    schema: {
      tags: ["Admin - Analytics"],
      summary: "Get dashboard statistics",
      security: [{ bearerAuth: [] }],
      response: { 200: toJsonSchema(AdminStatsResponseSchema) },
    },
    handler: async (_request, reply) => {
      const stats = await adminAnalyticsService.getAdminStats()
      return reply.send({ success: true, stats })
    },
  })

  // GET /activity
  app.get<{ Querystring: ActivityQuery }>("/activity", {
    preHandler,
    schema: {
      tags: ["Admin - Analytics"],
      summary: "Get recent activity",
      security: [{ bearerAuth: [] }],
      querystring: toJsonSchema(ActivityQuerySchema),
      response: { 200: toJsonSchema(ActivityResponseSchema) },
    },
    handler: async (request, reply) => {
      const activity = await adminAnalyticsService.getRecentActivity(
        request.query.limit,
      )
      return reply.send({
        success: true,
        activity: activity.map((a) => ({
          ...a,
          timestamp: a.timestamp.toISOString(),
        })),
      })
    },
  })
}
