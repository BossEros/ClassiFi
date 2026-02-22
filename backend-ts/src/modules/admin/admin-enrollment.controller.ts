import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { AdminEnrollmentService } from "@/modules/admin/admin-enrollment.service.js"
import { adminMiddleware } from "@/api/middlewares/admin.middleware.js"
import { validateParams, validateBody } from "@/api/plugins/zod-validation.js"
import {
  ClassParamsSchema,
  EnrollStudentBodySchema,
  StudentEnrollmentParamsSchema,
  type ClassParams,
  type EnrollStudentBody,
  type StudentEnrollmentParams,
} from "@/modules/admin/admin.schema.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

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
  const preHandlerMiddlewares = [adminMiddleware]

  /**
   * GET /classes/:id/students
   * Get enrolled students in a class
   */
  app.get("/classes/:id/students", {
    preHandler: [...preHandlerMiddlewares, validateParams(ClassParamsSchema)],
    handler: async (request, reply) => {
      const { id: classId } = request.validatedParams as ClassParams

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
  app.post("/classes/:id/students", {
    preHandler: [
      ...preHandlerMiddlewares,
      validateParams(ClassParamsSchema),
      validateBody(EnrollStudentBodySchema),
    ],
    handler: async (request, reply) => {
      const { id: classId } = request.validatedParams as ClassParams
      const { studentId } = request.validatedBody as EnrollStudentBody

      await adminEnrollmentService.addStudentToClass(classId, studentId)

      return reply.send({
        success: true,
        message: "Student enrolled successfully",
      })
    },
  })

  /**
   * DELETE /classes/:id/students/:studentId
   * Remove a student from a class
   */
  app.delete("/classes/:id/students/:studentId", {
    preHandler: [
      ...preHandlerMiddlewares,
      validateParams(StudentEnrollmentParamsSchema),
    ],
    handler: async (request, reply) => {
      const { id: classId, studentId } =
        request.validatedParams as StudentEnrollmentParams

      await adminEnrollmentService.removeStudentFromClass(classId, studentId)

      return reply.send({
        success: true,
        message: "Student removed successfully",
      })
    },
  })
}
