import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { GradebookService } from "@/modules/gradebook/gradebook.service.js"
import {
  toClassGradebookDTO,
  toStudentGradesDTO,
} from "@/modules/gradebook/gradebook.mapper.js"
import { validateBody, validateParams } from "@/api/plugins/zod-validation.js"
import {
  ClassIdParamSchema,
  StudentIdParamSchema,
  StudentClassParamsSchema,
  SubmissionIdParamSchema,
  GradeOverrideBodySchema,
  type GradeOverrideBody,
} from "@/modules/gradebook/gradebook.schema.js"
import { z } from "zod"

type ClassIdParam = z.infer<typeof ClassIdParamSchema>
type StudentIdParam = z.infer<typeof StudentIdParamSchema>
type StudentClassParams = z.infer<typeof StudentClassParamsSchema>
type SubmissionIdParam = z.infer<typeof SubmissionIdParamSchema>
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Registers all gradebook-related API routes.
 *
 * @param app - The Fastify application instance.
 * @returns A promise that resolves when all routes are registered.
 */
export async function gradebookRoutes(app: FastifyInstance): Promise<void> {
  const gradebookService = container.resolve<GradebookService>(
    DI_TOKENS.services.gradebook,
  )

  /**
   * GET /classes/:classId
   * Get class gradebook
   */
  app.get("/classes/:classId", {
    preHandler: validateParams(ClassIdParamSchema),
    handler: async (request, reply) => {
      const { classId } = request.validatedParams as ClassIdParam

      const classGradebookData =
        await gradebookService.getClassGradebook(classId)

      return reply.send({
        success: true,
        ...toClassGradebookDTO(classGradebookData),
      })
    },
  })

  /**
   * GET /classes/:classId/export
   * Export class gradebook as CSV
   */
  app.get("/classes/:classId/export", {
    preHandler: validateParams(ClassIdParamSchema),
    handler: async (request, reply) => {
      const { classId } = request.validatedParams as ClassIdParam

      const generatedCsvContent =
        await gradebookService.exportGradebookCSV(classId)

      return reply
        .header("Content-Type", "text/csv")
        .header(
          "Content-Disposition",
          `attachment; filename="gradebook-class-${classId}.csv"`,
        )
        .send(generatedCsvContent)
    },
  })

  /**
   * GET /students/:studentId
   * Get student grades
   */
  app.get("/students/:studentId", {
    preHandler: validateParams(StudentIdParamSchema),
    handler: async (request, reply) => {
      const { studentId } = request.validatedParams as StudentIdParam

      const studentGradesList =
        await gradebookService.getStudentGrades(studentId)

      return reply.send({
        success: true,
        grades: toStudentGradesDTO(studentGradesList),
      })
    },
  })

  /**
   * GET /students/:studentId/classes/:classId
   * Get student grades for a class
   */
  app.get("/students/:studentId/classes/:classId", {
    preHandler: validateParams(StudentClassParamsSchema),
    handler: async (request, reply) => {
      const { studentId, classId } =
        request.validatedParams as StudentClassParams

      const filteredStudentGrades = await gradebookService.getStudentGrades(
        studentId,
        classId,
      )

      return reply.send({
        success: true,
        grades: toStudentGradesDTO(filteredStudentGrades),
      })
    },
  })

  /**
   * GET /students/:studentId/classes/:classId/rank
   * Get student rank in class
   */
  app.get("/students/:studentId/classes/:classId/rank", {
    preHandler: validateParams(StudentClassParamsSchema),
    handler: async (request, reply) => {
      const { studentId, classId } =
        request.validatedParams as StudentClassParams

      const calculatedRankData = await gradebookService.getStudentRank(
        studentId,
        classId,
      )

      return reply.send({
        success: true,
        rank: calculatedRankData?.rank ?? null,
        totalStudents: calculatedRankData?.totalStudents ?? null,
        percentile: calculatedRankData?.percentile ?? null,
      })
    },
  })

  /**
   * POST /submissions/:submissionId/override
   * Override a grade
   */
  app.post("/submissions/:submissionId/override", {
    preHandler: [
      validateParams(SubmissionIdParamSchema),
      validateBody(GradeOverrideBodySchema),
    ],
    handler: async (request, reply) => {
      const { submissionId } = request.validatedParams as SubmissionIdParam
      const { grade: manualGradeValue, feedback: optionalFeedbackText } =
        request.validatedBody as GradeOverrideBody

      await gradebookService.overrideGrade(
        submissionId,
        manualGradeValue,
        optionalFeedbackText ?? null,
      )

      return reply.send({
        success: true,
        message: "Grade overridden successfully",
      })
    },
  })

  /**
   * DELETE /submissions/:submissionId/override
   * Remove grade override
   */
  app.delete("/submissions/:submissionId/override", {
    preHandler: validateParams(SubmissionIdParamSchema),
    handler: async (request, reply) => {
      const { submissionId } = request.validatedParams as SubmissionIdParam

      await gradebookService.removeOverride(submissionId)

      return reply.send({
        success: true,
        message: "Grade override removed successfully",
      })
    },
  })
}
