import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { PlagiarismService } from "@/modules/plagiarism/plagiarism.service.js"
import { toJsonSchema } from "@/api/utils/swagger.js"
import { UnauthorizedError } from "@/api/middlewares/error-handler.js"
import { authMiddleware } from "@/api/middlewares/auth.middleware.js"
import { parsePositiveInt } from "@/shared/utils.js"
import {
  AnalyzeRequestSchema,
  AnalyzeResponseSchema,
  ReportIdParamSchema,
  PlagiarismAssignmentIdParamSchema,
  ReportPairParamsSchema,
  ResultIdParamSchema,
  GetReportResponseSchema,
  PairDetailsResponseSchema,
  ResultDetailsResponseSchema,
  DeleteReportResponseSchema,
  StudentSummaryResponseSchema,
  StudentPairsParamsSchema,
  StudentPairsResponseSchema,
  type AnalyzeRequest,
} from "@/modules/plagiarism/plagiarism.schema.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Registers plagiarism detection routes for analyzing code submissions.
 *
 * @param app - The Fastify application instance.
 * @returns A promise that resolves when all routes are registered.
 */
export async function plagiarismRoutes(app: FastifyInstance): Promise<void> {
  const plagiarismService =
    container.resolve<PlagiarismService>(DI_TOKENS.services.plagiarism)

  /**
   * POST /analyze
   * Analyze files for plagiarism detection
   */
  app.post<{ Body: AnalyzeRequest }>("/analyze", {
    schema: {
      tags: ["Plagiarism"],
      summary: "Analyze files for plagiarism detection",
      description: "Performs plagiarism detection on provided code files",
      body: toJsonSchema(AnalyzeRequestSchema),
      response: {
        200: toJsonSchema(AnalyzeResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const analysisResult = await plagiarismService.analyzeFiles(request.body)

      return reply.send({
        success: true,
        message: "Plagiarism analysis completed successfully",
        ...analysisResult,
      })
    },
  })

  /**
   * POST /analyze/assignment/:assignmentId
   * Analyze all submissions for an assignment
   */
  app.post<{ Params: { assignmentId: string } }>(
    "/analyze/assignment/:assignmentId",
    {
      schema: {
        tags: ["Plagiarism"],
        summary: "Analyze all submissions for an assignment",
        description:
          "Fetches all latest submissions for the specified assignment, downloads their content, and runs plagiarism detection",
        security: [{ bearerAuth: [] }],
        params: toJsonSchema(PlagiarismAssignmentIdParamSchema),
        response: {
          200: toJsonSchema(AnalyzeResponseSchema),
        },
      },
      preHandler: [authMiddleware],
      handler: async (request, reply) => {
        const assignmentId = parsePositiveInt(
          request.params.assignmentId,
          "Assignment ID",
        )

        if (!request.user?.id) {
          throw new UnauthorizedError("User authentication required")
        }

        const authenticatedTeacherId = request.user.id

        const analysisResult =
          await plagiarismService.analyzeAssignmentSubmissions(
            assignmentId,
            authenticatedTeacherId,
          )

        return reply.send({
          success: true,
          message: "Assignment submissions analyzed successfully",
          ...analysisResult,
        })
      },
    },
  )

  /**
   * GET /reports/:reportId
   * Get plagiarism report by ID
   */
  app.get<{ Params: { reportId: string } }>("/reports/:reportId", {
    schema: {
      tags: ["Plagiarism"],
      summary: "Get plagiarism report by ID",
      description:
        "Retrieves a complete plagiarism report with all similarity results",
      params: toJsonSchema(ReportIdParamSchema),
      response: {
        200: toJsonSchema(GetReportResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const { reportId } = request.params
      const reportData = await plagiarismService.getReport(reportId)

      return reply.send({
        success: true,
        message: "Report retrieved successfully",
        ...reportData,
      })
    },
  })

  /**
   * GET /reports/:reportId/pairs/:pairId
   * Get pair details with matching fragments
   */
  app.get<{ Params: { reportId: string; pairId: string } }>(
    "/reports/:reportId/pairs/:pairId",
    {
      schema: {
        tags: ["Plagiarism"],
        summary: "Get pair details with matching fragments",
        description:
          "Retrieves detailed comparison between two submissions including matching code fragments",
        params: toJsonSchema(ReportPairParamsSchema),
        response: {
          200: toJsonSchema(PairDetailsResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const { reportId, pairId } = request.params
        const pairIdAsNumber = parsePositiveInt(pairId, "Pair ID")

        const pairDetailsData = await plagiarismService.getPairDetails(
          reportId,
          pairIdAsNumber,
        )

        return reply.send({
          success: true,
          message: "Pair details retrieved successfully",
          ...pairDetailsData,
        })
      },
    },
  )

  /**
   * DELETE /reports/:reportId
   * Delete a plagiarism report
   */
  app.delete<{ Params: { reportId: string } }>("/reports/:reportId", {
    schema: {
      tags: ["Plagiarism"],
      summary: "Delete a plagiarism report",
      description:
        "Permanently removes a plagiarism report and all associated results",
      params: toJsonSchema(ReportIdParamSchema),
      response: {
        200: toJsonSchema(DeleteReportResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const { reportId } = request.params

      await plagiarismService.deleteReport(reportId)

      return reply.send({
        success: true,
        message: "Report deleted successfully",
      })
    },
  })

  /**
   * GET /results/:resultId/details
   * Get result details with fragments and file content
   */
  app.get<{ Params: { resultId: string } }>("/results/:resultId/details", {
    schema: {
      tags: ["Plagiarism"],
      summary: "Get result details with fragments and file content",
      description:
        "Retrieves detailed similarity result including matching fragments and full file content from database",
      params: toJsonSchema(ResultIdParamSchema),
      response: {
        200: toJsonSchema(ResultDetailsResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const resultId = parsePositiveInt(request.params.resultId, "Result ID")

      const resultDetailsData =
        await plagiarismService.getResultDetails(resultId)

      return reply.send({
        success: true,
        message: "Result details retrieved successfully",
        ...resultDetailsData,
      })
    },
  })

  /**
   * GET /reports/:reportId/students
   * Get student-centric summary for a plagiarism report
   */
  app.get<{ Params: { reportId: string } }>("/reports/:reportId/students", {
    schema: {
      tags: ["Plagiarism"],
      summary: "Get student-centric summary for a plagiarism report",
      description:
        "Returns originality scores and statistics for all students in the report",
      security: [{ bearerAuth: [] }],
      params: toJsonSchema(ReportIdParamSchema),
      response: {
        200: toJsonSchema(StudentSummaryResponseSchema),
      },
    },
    preHandler: [authMiddleware],
    handler: async (request, reply) => {
      const params = ReportIdParamSchema.parse(request.params)
      const reportId = parsePositiveInt(params.reportId, "Report ID")
      const userId = request.user!.id

      const students = await plagiarismService.getStudentSummary(
        reportId,
        userId,
      )

      return reply.send({
        success: true,
        message: "Student summary retrieved successfully",
        students,
      })
    },
  })

  /**
   * GET /reports/:reportId/students/:submissionId/pairs
   * Get all pairwise comparisons for a specific student
   */
  app.get<{ Params: { reportId: string; submissionId: string } }>(
    "/reports/:reportId/students/:submissionId/pairs",
    {
      schema: {
        tags: ["Plagiarism"],
        summary: "Get all pairwise comparisons for a specific student",
        description:
          "Returns all similarity pairs involving the specified student's submission",
        security: [{ bearerAuth: [] }],
        params: toJsonSchema(StudentPairsParamsSchema),
        response: {
          200: toJsonSchema(StudentPairsResponseSchema),
        },
      },
      preHandler: [authMiddleware],
      handler: async (request, reply) => {
        const params = StudentPairsParamsSchema.parse(request.params)
        const reportId = parsePositiveInt(params.reportId, "Report ID")
        const submissionId = parsePositiveInt(
          params.submissionId,
          "Submission ID",
        )
        const userId = request.user!.id

        const pairs = await plagiarismService.getStudentPairs(
          reportId,
          submissionId,
          userId,
        )

        return reply.send({
          success: true,
          message: "Student pairs retrieved successfully",
          pairs,
        })
      },
    },
  )
}