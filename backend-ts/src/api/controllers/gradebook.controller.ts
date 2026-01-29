import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { GradebookService } from "../../services/gradebook.service.js"
import { parsePositiveInt } from "../../shared/utils.js"
import {
  toClassGradebookDTO,
  toStudentGradesDTO,
} from "../../shared/mappers.js"
import { toJsonSchema } from "../utils/swagger.js"
import {
  ClassIdParamSchema,
  StudentIdParamSchema,
  StudentClassParamsSchema,
  ClassGradebookResponseSchema,
  StudentGradesResponseSchema,
  ClassStatisticsResponseSchema,
  StudentRankResponseSchema,
  GradeOverrideBodySchema,
  SuccessResponseSchema,
  SubmissionIdParamSchema,
  type GradeOverrideBody,
} from "../schemas/gradebook.schema.js"

/**
 * Registers all gradebook-related API routes.
 *
 * @param app - The Fastify application instance.
 * @returns A promise that resolves when all routes are registered.
 */
export async function gradebookRoutes(app: FastifyInstance): Promise<void> {
  const gradebookService = container.resolve<GradebookService>("GradebookService")

  /**
   * GET /classes/:classId
   * Get class gradebook
   */
  app.get<{ Params: { classId: string } }>("/classes/:classId", {
    schema: {
      tags: ["Gradebook"],
      summary: "Get class gradebook",
      description: "Returns all students with their grades for all assignments in the class",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(ClassIdParamSchema),
      response: {
        200: toJsonSchema(ClassGradebookResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const parsedClassId = parsePositiveInt(request.params.classId, "Class ID")

      const classGradebookData = await gradebookService.getClassGradebook(parsedClassId)

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
  app.get<{ Params: { classId: string } }>("/classes/:classId/export", {
    schema: {
      tags: ["Gradebook"],
      summary: "Export class gradebook as CSV",
      description: "Generates and downloads a CSV file containing all student grades for the class",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(ClassIdParamSchema),
    },
    handler: async (request, reply) => {
      const parsedClassId = parsePositiveInt(request.params.classId, "Class ID")

      const generatedCsvContent = await gradebookService.exportGradebookCSV(parsedClassId)

      return reply
        .header("Content-Type", "text/csv")
        .header(
          "Content-Disposition",
          `attachment; filename="gradebook-class-${parsedClassId}.csv"`,
        )
        .send(generatedCsvContent)
    },
  })

  /**
   * GET /classes/:classId/statistics
   * Get class statistics
   */
  app.get<{ Params: { classId: string } }>("/classes/:classId/statistics", {
    schema: {
      tags: ["Gradebook"],
      summary: "Get class statistics",
      description: "Returns statistical analysis including average grades, pass rates, and grade distribution",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(ClassIdParamSchema),
      response: {
        200: toJsonSchema(ClassStatisticsResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const parsedClassId = parsePositiveInt(request.params.classId, "Class ID")

      const calculatedStatistics = await gradebookService.getClassStatistics(parsedClassId)

      return reply.send({
        success: true,
        statistics: calculatedStatistics,
      })
    },
  })

  /**
   * GET /students/:studentId
   * Get student grades
   */
  app.get<{ Params: { studentId: string } }>("/students/:studentId", {
    schema: {
      tags: ["Gradebook"],
      summary: "Get student grades",
      description: "Returns all grades for a student across all enrolled classes",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(StudentIdParamSchema),
      response: {
        200: toJsonSchema(StudentGradesResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const parsedStudentId = parsePositiveInt(request.params.studentId, "Student ID")

      const studentGradesList = await gradebookService.getStudentGrades(parsedStudentId)

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
  app.get<{ Params: { studentId: string; classId: string } }>(
    "/students/:studentId/classes/:classId",
    {
      schema: {
        tags: ["Gradebook"],
        summary: "Get student grades for a class",
        description: "Returns all grades for a specific student within a specific class",
        security: [{ bearerAuth: [] }],
        params: toJsonSchema(StudentClassParamsSchema),
        response: {
          200: toJsonSchema(StudentGradesResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const parsedStudentId = parsePositiveInt(request.params.studentId, "Student ID")
        const parsedClassId = parsePositiveInt(request.params.classId, "Class ID")

        const filteredStudentGrades = await gradebookService.getStudentGrades(
          parsedStudentId,
          parsedClassId,
        )

        return reply.send({
          success: true,
          grades: toStudentGradesDTO(filteredStudentGrades),
        })
      },
    },
  )

  /**
   * GET /students/:studentId/classes/:classId/rank
   * Get student rank in class
   */
  app.get<{ Params: { studentId: string; classId: string } }>(
    "/students/:studentId/classes/:classId/rank",
    {
      schema: {
        tags: ["Gradebook"],
        summary: "Get student rank in class",
        description: "Returns the student's ranking position, total students, and percentile within the class",
        security: [{ bearerAuth: [] }],
        params: toJsonSchema(StudentClassParamsSchema),
        response: {
          200: toJsonSchema(StudentRankResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const parsedStudentId = parsePositiveInt(request.params.studentId, "Student ID")
        const parsedClassId = parsePositiveInt(request.params.classId, "Class ID")

        const calculatedRankData = await gradebookService.getStudentRank(
          parsedStudentId,
          parsedClassId,
        )

        return reply.send({
          success: true,
          rank: calculatedRankData?.rank ?? null,
          totalStudents: calculatedRankData?.totalStudents ?? null,
          percentile: calculatedRankData?.percentile ?? null,
        })
      },
    },
  )

  /**
   * POST /submissions/:submissionId/override
   * Override a grade
   */
  app.post<{ Params: { submissionId: string }; Body: GradeOverrideBody }>(
    "/submissions/:submissionId/override",
    {
      schema: {
        tags: ["Gradebook"],
        summary: "Override a grade",
        description: "Manually set a grade for a submission, overriding the auto-calculated grade (teacher only)",
        security: [{ bearerAuth: [] }],
        params: toJsonSchema(SubmissionIdParamSchema),
        body: toJsonSchema(GradeOverrideBodySchema),
        response: {
          200: toJsonSchema(SuccessResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const parsedSubmissionId = parsePositiveInt(
          request.params.submissionId,
          "Submission ID",
        )
        const { grade: manualGradeValue, feedback: optionalFeedbackText } = request.body

        await gradebookService.overrideGrade(
          parsedSubmissionId,
          manualGradeValue,
          optionalFeedbackText ?? null,
        )

        return reply.send({
          success: true,
          message: "Grade overridden successfully",
        })
      },
    },
  )

  /**
   * DELETE /submissions/:submissionId/override
   * Remove grade override
   */
  app.delete<{ Params: { submissionId: string } }>(
    "/submissions/:submissionId/override",
    {
      schema: {
        tags: ["Gradebook"],
        summary: "Remove grade override",
        description: "Removes manual grade override and reverts to auto-calculated grade based on test results",
        security: [{ bearerAuth: [] }],
        params: toJsonSchema(SubmissionIdParamSchema),
        response: {
          200: toJsonSchema(SuccessResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const parsedSubmissionId = parsePositiveInt(
          request.params.submissionId,
          "Submission ID",
        )

        await gradebookService.removeOverride(parsedSubmissionId)

        return reply.send({
          success: true,
          message: "Grade override removed successfully",
        })
      },
    },
  )
}
