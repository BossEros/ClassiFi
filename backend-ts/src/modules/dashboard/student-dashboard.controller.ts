import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { StudentDashboardService } from "@/modules/dashboard/student-dashboard.service.js"
import {
  LimitQuerySchema,
  type LimitQuery,
} from "@/api/schemas/common.schema.js"
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/api/plugins/zod-validation.js"
import { StudentIdParamSchema } from "@/modules/classes/class.schema.js"
import {
  JoinClassRequestSchema,
  LeaveClassRequestSchema,
  StudentDashboardQuerySchema,
  type JoinClassRequest,
  type LeaveClassRequest,
  type StudentDashboardQuery,
} from "@/modules/dashboard/dashboard.schema.js"
import { z } from "zod"

type StudentIdParam = z.infer<typeof StudentIdParamSchema>
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Registers student dashboard routes for managing student class enrollments and assignments.
 *
 * @param app - The Fastify application instance.
 * @returns A promise that resolves when all routes are registered.
 */
export async function studentDashboardRoutes(
  app: FastifyInstance,
): Promise<void> {
  const studentDashboardService = container.resolve<StudentDashboardService>(
    DI_TOKENS.services.studentDashboard,
  )

  /**
   * GET /:studentId
   * Get complete dashboard data for a student
   */
  app.get("/:studentId", {
    preHandler: [
      validateParams(StudentIdParamSchema),
      validateQuery(StudentDashboardQuerySchema),
    ],
    handler: async (request, reply) => {
      const { studentId } = request.validatedParams as StudentIdParam
      const { enrolledClassesLimit = 12, pendingAssignmentsLimit = 10 } =
        request.validatedQuery as StudentDashboardQuery

      const dashboardData = await studentDashboardService.getDashboardData(
        studentId,
        enrolledClassesLimit,
        pendingAssignmentsLimit,
      )

      return reply.send({
        success: true,
        message: "Dashboard data retrieved successfully",
        enrolledClasses: dashboardData.enrolledClasses,
        pendingAssignments: dashboardData.pendingAssignments,
      })
    },
  })

  /**
   * GET /:studentId/classes
   * Get enrolled classes for a student
   */
  app.get("/:studentId/classes", {
    preHandler: [
      validateParams(StudentIdParamSchema),
      validateQuery(LimitQuerySchema),
    ],
    handler: async (request, reply) => {
      const { studentId } = request.validatedParams as StudentIdParam
      const { limit: classesLimit = 12 } = request.validatedQuery as LimitQuery

      const enrolledClassesList =
        await studentDashboardService.getEnrolledClasses(
          studentId,
          classesLimit,
        )

      return reply.send({
        success: true,
        message: "Enrolled classes retrieved successfully",
        classes: enrolledClassesList,
      })
    },
  })

  /**
   * GET /:studentId/assignments
   * Get pending assignments for a student
   */
  app.get("/:studentId/assignments", {
    preHandler: [
      validateParams(StudentIdParamSchema),
      validateQuery(LimitQuerySchema),
    ],
    handler: async (request, reply) => {
      const { studentId } = request.validatedParams as StudentIdParam
      const { limit: assignmentsLimit = 10 } =
        request.validatedQuery as LimitQuery

      const pendingAssignmentsList =
        await studentDashboardService.getPendingAssignments(
          studentId,
          assignmentsLimit,
        )

      return reply.send({
        success: true,
        message: "Pending assignments retrieved successfully",
        assignments: pendingAssignmentsList,
      })
    },
  })

  /**
   * POST /join
   * Join a class using class code
   */
  app.post("/join", {
    preHandler: validateBody(JoinClassRequestSchema),
    handler: async (request, reply) => {
      const { studentId, classCode } = request.validatedBody as JoinClassRequest

      const enrolledClassInfo = await studentDashboardService.joinClass(
        studentId,
        classCode,
      )

      return reply.send({
        success: true,
        message: "Successfully joined the class!",
        classInfo: enrolledClassInfo,
      })
    },
  })

  /**
   * POST /leave
   * Leave a class
   */
  app.post("/leave", {
    preHandler: validateBody(LeaveClassRequestSchema),
    handler: async (request, reply) => {
      const { studentId, classId } = request.validatedBody as LeaveClassRequest

      await studentDashboardService.leaveClass(studentId, classId)

      return reply.send({
        success: true,
        message: "Successfully left the class.",
      })
    },
  })
}
