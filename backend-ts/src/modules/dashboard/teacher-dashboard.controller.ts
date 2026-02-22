import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { TeacherDashboardService } from "@/modules/dashboard/teacher-dashboard.service.js"
import {
  LimitQuerySchema,
  type LimitQuery,
} from "@/api/schemas/common.schema.js"
import { validateParams, validateQuery } from "@/api/plugins/zod-validation.js"
import { TeacherIdParamSchema } from "@/modules/classes/class.schema.js"
import {
  TeacherDashboardQuerySchema,
  type TeacherDashboardQuery,
} from "@/modules/dashboard/dashboard.schema.js"
import { z } from "zod"

type TeacherIdParam = z.infer<typeof TeacherIdParamSchema>
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Registers teacher dashboard routes for retrieving dashboard data, classes, and tasks.
 *
 * @param app - The Fastify application instance.
 * @returns A promise that resolves when all routes are registered.
 */
export async function teacherDashboardRoutes(
  app: FastifyInstance,
): Promise<void> {
  const teacherDashboardService = container.resolve<TeacherDashboardService>(
    DI_TOKENS.services.teacherDashboard,
  )

  /**
   * GET /:teacherId
   * Get complete dashboard data for a teacher
   */
  app.get("/:teacherId", {
    preHandler: [
      validateParams(TeacherIdParamSchema),
      validateQuery(TeacherDashboardQuerySchema),
    ],
    handler: async (request, reply) => {
      const { teacherId } = request.validatedParams as TeacherIdParam
      const { recentClassesLimit = 12, pendingTasksLimit = 10 } =
        request.validatedQuery as TeacherDashboardQuery

      const dashboardData = await teacherDashboardService.getDashboardData(
        teacherId,
        recentClassesLimit,
        pendingTasksLimit,
      )

      return reply.send({
        success: true,
        message: "Dashboard data retrieved successfully",
        recentClasses: dashboardData.recentClasses,
        pendingTasks: dashboardData.pendingTasks,
      })
    },
  })

  /**
   * GET /:teacherId/classes
   * Get recent classes for a teacher
   */
  app.get("/:teacherId/classes", {
    preHandler: [
      validateParams(TeacherIdParamSchema),
      validateQuery(LimitQuerySchema),
    ],
    handler: async (request, reply) => {
      const { teacherId } = request.validatedParams as TeacherIdParam
      const { limit = 5 } = request.validatedQuery as LimitQuery

      const recentClasses = await teacherDashboardService.getRecentClasses(
        teacherId,
        limit,
      )

      return reply.send({
        success: true,
        message: "Recent classes retrieved successfully",
        classes: recentClasses,
      })
    },
  })

  /**
   * GET /:teacherId/tasks
   * Get pending tasks for a teacher
   */
  app.get("/:teacherId/tasks", {
    preHandler: [
      validateParams(TeacherIdParamSchema),
      validateQuery(LimitQuerySchema),
    ],
    handler: async (request, reply) => {
      const { teacherId } = request.validatedParams as TeacherIdParam
      const { limit = 10 } = request.validatedQuery as LimitQuery

      const pendingTasks = await teacherDashboardService.getPendingTasks(
        teacherId,
        limit,
      )

      return reply.send({
        success: true,
        message: "Pending tasks retrieved successfully",
        tasks: pendingTasks,
      })
    },
  })
}
