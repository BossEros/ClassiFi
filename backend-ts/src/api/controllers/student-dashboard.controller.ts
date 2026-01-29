import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { StudentDashboardService } from "@/services/student-dashboard.service.js"
import { toJsonSchema } from "@/api/utils/swagger.js"
import {
  SuccessMessageSchema,
  LimitQuerySchema,
} from "@/api/schemas/common.schema.js"
import { StudentIdParamSchema } from "@/api/schemas/class.schema.js"
import {
  JoinClassRequestSchema,
  LeaveClassRequestSchema,
  StudentDashboardResponseSchema,
  StudentDashboardQuerySchema,
  DashboardClassListResponseSchema,
  DashboardAssignmentListResponseSchema,
  JoinClassResponseSchema,
  type JoinClassRequest,
  type LeaveClassRequest,
} from "@/api/schemas/dashboard.schema.js"

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
    "StudentDashboardService",
  )

  /**
   * GET /:studentId
   * Get complete dashboard data for a student
   */
  app.get<{
    Params: { studentId: number }
    Querystring: {
      enrolledClassesLimit?: number
      pendingAssignmentsLimit?: number
    }
  }>("/:studentId", {
    schema: {
      tags: ["Student Dashboard"],
      summary: "Get complete dashboard data for a student",
      description: "Retrieves enrolled classes and pending assignments for the student dashboard",
      params: toJsonSchema(StudentIdParamSchema),
      querystring: toJsonSchema(StudentDashboardQuerySchema),
      response: {
        200: toJsonSchema(StudentDashboardResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const { studentId } = request.params
      const {
        enrolledClassesLimit = 12,
        pendingAssignmentsLimit = 10,
      } = request.query

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
  app.get<{ Params: { studentId: number }; Querystring: { limit?: number } }>(
    "/:studentId/classes",
    {
      schema: {
        tags: ["Student Dashboard"],
        summary: "Get enrolled classes for a student",
        description: "Retrieves a list of classes the student is currently enrolled in",
        params: toJsonSchema(StudentIdParamSchema),
        querystring: toJsonSchema(LimitQuerySchema),
        response: {
          200: toJsonSchema(DashboardClassListResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const { studentId } = request.params
        const { limit: classesLimit = 12 } = request.query

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
    },
  )

  /**
   * GET /:studentId/assignments
   * Get pending assignments for a student
   */
  app.get<{ Params: { studentId: number }; Querystring: { limit?: number } }>(
    "/:studentId/assignments",
    {
      schema: {
        tags: ["Student Dashboard"],
        summary: "Get pending assignments for a student",
        description: "Retrieves assignments that are due and not yet submitted by the student",
        params: toJsonSchema(StudentIdParamSchema),
        querystring: toJsonSchema(LimitQuerySchema),
        response: {
          200: toJsonSchema(DashboardAssignmentListResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const { studentId } = request.params
        const { limit: assignmentsLimit = 10 } = request.query

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
    },
  )

  /**
   * POST /join
   * Join a class using class code
   */
  app.post<{ Body: JoinClassRequest }>("/join", {
    schema: {
      tags: ["Student Dashboard"],
      summary: "Join a class using class code",
      description: "Enrolls a student in a class by validating and using the provided class code",
      body: toJsonSchema(JoinClassRequestSchema),
      response: {
        200: toJsonSchema(JoinClassResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const { studentId, classCode } = request.body

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
  app.post<{ Body: LeaveClassRequest }>("/leave", {
    schema: {
      tags: ["Student Dashboard"],
      summary: "Leave a class",
      description: "Removes a student's enrollment from a class",
      body: toJsonSchema(LeaveClassRequestSchema),
      response: {
        200: toJsonSchema(SuccessMessageSchema),
      },
    },
    handler: async (request, reply) => {
      const { studentId, classId } = request.body

      await studentDashboardService.leaveClass(studentId, classId)

      return reply.send({
        success: true,
        message: "Successfully left the class.",
      })
    },
  })
}
