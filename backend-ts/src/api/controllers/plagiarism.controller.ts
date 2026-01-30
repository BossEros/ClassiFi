import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { PlagiarismService } from "../../services/plagiarism.service.js"
import { toJsonSchema } from "../utils/swagger.js"
import { UnauthorizedError } from "../middlewares/error-handler.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"
import { parsePositiveInt } from "../../shared/utils.js"
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
  type AnalyzeRequest,
} from "../schemas/plagiarism.schema.js"

/**
 * Registers plagiarism detection routes for analyzing code submissions.
 *
 * @param app - The Fastify application instance.
 * @returns A promise that resolves when all routes are registered.
 */
export async function plagiarismRoutes(app: FastifyInstance): Promise<void> {
  const plagiarismService =
    container.resolve<PlagiarismService>("PlagiarismService")

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
}
