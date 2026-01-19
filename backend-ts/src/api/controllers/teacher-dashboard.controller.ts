import type { FastifyInstance } from "fastify";
import { container } from "tsyringe";
import { TeacherDashboardService } from "@/services/teacher-dashboard.service.js";
import { toJsonSchema } from "@/api/utils/swagger.js";
import { LimitQuerySchema } from "@/api/schemas/common.schema.js";
import { TeacherIdParamSchema } from "@/api/schemas/class.schema.js";
import {
  TeacherDashboardResponseSchema,
  TeacherDashboardQuerySchema,
  DashboardClassListResponseSchema,
  TaskListResponseSchema,
} from "@/api/schemas/dashboard.schema.js";

/** Teacher dashboard routes - /api/v1/teacher/dashboard/* */
export async function teacherDashboardRoutes(
  app: FastifyInstance,
): Promise<void> {
  const dashboardService = container.resolve<TeacherDashboardService>(
    "TeacherDashboardService",
  );

  /**
   * GET /:teacherId
   * Get complete dashboard data for a teacher
   */
  app.get<{
    Params: { teacherId: number };
    Querystring: { recentClassesLimit?: number; pendingTasksLimit?: number };
  }>("/:teacherId", {
    schema: {
      tags: ["Teacher Dashboard"],
      summary: "Get complete dashboard data for a teacher",
      params: toJsonSchema(TeacherIdParamSchema),
      querystring: toJsonSchema(TeacherDashboardQuerySchema),
      response: {
        200: toJsonSchema(TeacherDashboardResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const { teacherId } = request.params;
      const { recentClassesLimit = 12, pendingTasksLimit = 10 } = request.query;

      const data = await dashboardService.getDashboardData(
        teacherId,
        recentClassesLimit,
        pendingTasksLimit,
      );

      return reply.send({
        success: true,
        message: "Dashboard data retrieved successfully",
        recentClasses: data.recentClasses,
        pendingTasks: data.pendingTasks,
      });
    },
  });

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
        params: toJsonSchema(TeacherIdParamSchema),
        querystring: toJsonSchema(LimitQuerySchema),
        response: {
          200: toJsonSchema(DashboardClassListResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const { teacherId } = request.params;
        const { limit = 5 } = request.query;

        const classes = await dashboardService.getRecentClasses(
          teacherId,
          limit,
        );

        return reply.send({
          success: true,
          message: "Recent classes retrieved successfully",
          classes,
        });
      },
    },
  );

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
        params: toJsonSchema(TeacherIdParamSchema),
        querystring: toJsonSchema(LimitQuerySchema),
        response: {
          200: toJsonSchema(TaskListResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const { teacherId } = request.params;
        const { limit = 10 } = request.query;

        const tasks = await dashboardService.getPendingTasks(teacherId, limit);

        return reply.send({
          success: true,
          message: "Pending tasks retrieved successfully",
          tasks,
        });
      },
    },
  );
}
