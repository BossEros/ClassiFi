import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { TeacherDashboardService } from "@/services/teacher-dashboard.service.js"
import { toJsonSchema } from "@/api/utils/swagger.js"
import { LimitQuerySchema } from "@/api/schemas/common.schema.js"
import { TeacherIdParamSchema } from "@/api/schemas/class.schema.js"
import {
  TeacherDashboardResponseSchema,
  TeacherDashboardQuerySchema,
  DashboardClassListResponseSchema,
  TaskListResponseSchema,
} from "@/api/schemas/dashboard.schema.js"

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
    "TeacherDashboardService",
  )

  /**
   * GET /:teacherId
   * Get complete dashboard data for a teacher
   */
  app.get<{
    Params: { teacherId: number }
    Querystring: { recentClassesLimit?: number; pendingTasksLimit?: number }
  }>("/:teacherId", {
    schema: {
      tags: ["Teacher Dashboard"],
      summary: "Get complete dashboard data for a teacher",
      description:
        "Returns recent classes and pending tasks for the teacher's dashboard overview",
      params: toJsonSchema(TeacherIdParamSchema),
      querystring: toJsonSchema(TeacherDashboardQuerySchema),
      response: {
        200: toJsonSchema(TeacherDashboardResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const { teacherId } = request.params
      const { recentClassesLimit = 12, pendingTasksLimit = 10 } = request.query

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
  app.get<{ Params: { teacherId: number }; Querystring: { limit?: number } }>(
    "/:teacherId/classes",
    {
      schema: {
        tags: ["Teacher Dashboard"],
        summary: "Get recent classes for a teacher",
        description:
          "Returns a list of the teacher's most recently updated classes",
        params: toJsonSchema(TeacherIdParamSchema),
        querystring: toJsonSchema(LimitQuerySchema),
        response: {
          200: toJsonSchema(DashboardClassListResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const { teacherId } = request.params
        const { limit = 5 } = request.query

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
    },
  )

  /**
   * GET /:teacherId/tasks
   * Get pending tasks for a teacher
   */
  app.get<{ Params: { teacherId: number }; Querystring: { limit?: number } }>(
    "/:teacherId/tasks",
    {
      schema: {
        tags: ["Teacher Dashboard"],
        summary: "Get pending tasks for a teacher",
        description:
          "Returns a list of pending grading tasks (ungraded submissions) for the teacher",
        params: toJsonSchema(TeacherIdParamSchema),
        querystring: toJsonSchema(LimitQuerySchema),
        response: {
          200: toJsonSchema(TaskListResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const { teacherId } = request.params
        const { limit = 10 } = request.query

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
    },
  )
}
