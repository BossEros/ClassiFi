import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { AdminEnrollmentService } from "@/modules/admin/admin-enrollment.service.js"
import { authMiddleware } from "@/api/middlewares/auth.middleware.js"
import { adminMiddleware } from "@/api/middlewares/admin.middleware.js"
import { toJsonSchema } from "@/api/utils/swagger.js"
import { z } from "zod"
import {
  ClassParamsSchema,
  EnrollStudentBodySchema,
  StudentEnrollmentParamsSchema,
  type ClassParams,
  type EnrollStudentBody,
  type StudentEnrollmentParams,
} from "@/modules/admin/admin.schema.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

const StudentEnrollmentDtoSchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
  enrolledAt: z.string(),
})

const GetClassStudentsResponseSchema = z.object({
  success: z.boolean(),
  students: z.array(StudentEnrollmentDtoSchema),
})

/**
 * Registers admin enrollment management routes for class student operations.
 *
 * Provides endpoints for administrators to view, add, and remove students from classes.
 * All routes require authentication and admin privileges.
 *
 * @param app - The Fastify application instance to register routes on.
 * @returns A promise that resolves when all routes are registered.
 */
export async function adminEnrollmentRoutes(
  app: FastifyInstance,
): Promise<void> {
  const adminEnrollmentService = container.resolve<AdminEnrollmentService>(
    DI_TOKENS.services.adminEnrollment,
  )
  const preHandlerMiddlewares = [authMiddleware, adminMiddleware]

  /**
   * GET /classes/:id/students
   * Get enrolled students in a class
   */
  app.get<{ Params: ClassParams }>("/classes/:id/students", {
    preHandler: preHandlerMiddlewares,
    schema: {
      tags: ["Admin - Enrollment"],
      summary: "Get enrolled students in a class",
      description:
        "Retrieves all students enrolled in a specific class with their enrollment details",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(ClassParamsSchema),
      response: {
        200: toJsonSchema(GetClassStudentsResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const classId = request.params.id

      const enrolledStudentsList =
        await adminEnrollmentService.getClassStudents(classId)

      const studentsResponseData = enrolledStudentsList.map((student) => ({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        avatarUrl: student.avatarUrl,
        enrolledAt: student.enrolledAt,
      }))

      return reply.send({
        success: true,
        students: studentsResponseData,
      })
    },
  })

  /**
   * POST /classes/:id/students
   * Enroll a student in a class
   */
  app.post<{ Params: ClassParams; Body: EnrollStudentBody }>(
    "/classes/:id/students",
    {
      preHandler: preHandlerMiddlewares,
      schema: {
        tags: ["Admin - Enrollment"],
        summary: "Enroll a student in a class",
        description: "Adds a student to a class enrollment roster",
        security: [{ bearerAuth: [] }],
        params: toJsonSchema(ClassParamsSchema),
        body: toJsonSchema(EnrollStudentBodySchema),
      },
      handler: async (request, reply) => {
        const classId = request.params.id
        const studentId = request.body.studentId

        await adminEnrollmentService.addStudentToClass(classId, studentId)

        return reply.send({
          success: true,
          message: "Student enrolled successfully",
        })
      },
    },
  )

  /**
   * DELETE /classes/:id/students/:studentId
   * Remove a student from a class
   */
  app.delete<{ Params: StudentEnrollmentParams }>(
    "/classes/:id/students/:studentId",
    {
      preHandler: preHandlerMiddlewares,
      schema: {
        tags: ["Admin - Enrollment"],
        summary: "Remove a student from a class",
        description: "Removes a student from a class enrollment roster",
        security: [{ bearerAuth: [] }],
        params: toJsonSchema(StudentEnrollmentParamsSchema),
      },
      handler: async (request, reply) => {
        const classId = request.params.id
        const studentId = request.params.studentId

        await adminEnrollmentService.removeStudentFromClass(classId, studentId)

        return reply.send({
          success: true,
          message: "Student removed successfully",
        })
      },
    },
  )
}
