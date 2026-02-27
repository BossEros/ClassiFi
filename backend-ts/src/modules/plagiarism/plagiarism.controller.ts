import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { PlagiarismService } from "@/modules/plagiarism/plagiarism.service.js"
import { validateParams, validateBody } from "@/api/plugins/zod-validation.js"
import {
  AnalyzeRequestSchema,
  ReportIdParamSchema,
  PlagiarismAssignmentIdParamSchema,
  ReportPairParamsSchema,
  ResultIdParamSchema,
  type AnalyzeRequest,
  type ReportIdParam,
  type PlagiarismAssignmentIdParam,
  type ReportPairParams,
  type ResultIdParam,
} from "@/modules/plagiarism/plagiarism.schema.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"
import { authMiddleware } from "@/api/middlewares/auth.middleware.js"
import { UnauthorizedError } from "@/shared/errors.js"

/**
 * Registers plagiarism detection routes for analyzing code submissions.
 *
 * @param app - The Fastify application instance.
 * @returns A promise that resolves when all routes are registered.
 */
export async function plagiarismRoutes(app: FastifyInstance): Promise<void> {
  const plagiarismService = container.resolve<PlagiarismService>(
    DI_TOKENS.services.plagiarism,
  )

  /**
   * POST /analyze
   * Analyze files for plagiarism detection
   */
  app.post("/analyze", {
    preHandler: validateBody(AnalyzeRequestSchema),
    handler: async (request, reply) => {
      const analyzeRequestData = request.validatedBody as AnalyzeRequest
      const analysisResult =
        await plagiarismService.analyzeFiles(analyzeRequestData)

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
  app.post("/analyze/assignment/:assignmentId", {
    preHandler: [
      authMiddleware,
      validateParams(PlagiarismAssignmentIdParamSchema),
    ],
    handler: async (request, reply) => {
      const { assignmentId } =
        request.validatedParams as PlagiarismAssignmentIdParam

      if (!request.user?.id) {
        throw new UnauthorizedError("User authentication required")
      }

      const authenticatedTeacherId = request.user.id

      const analysisResult =
        await plagiarismService.analyzeAssignmentSubmissions(
          assignmentId,
          authenticatedTeacherId,
        )

      const responseMessage = analysisResult.isReusedReport
        ? "Existing similarity report loaded successfully"
        : "Assignment submissions analyzed successfully"

      return reply.send({
        success: true,
        message: responseMessage,
        ...analysisResult,
      })
    },
  })

  /**
   * GET /analyze/assignment/:assignmentId/status
   * Get assignment similarity-report review status
   */
  app.get("/analyze/assignment/:assignmentId/status", {
    preHandler: [
      authMiddleware,
      validateParams(PlagiarismAssignmentIdParamSchema),
    ],
    handler: async (request, reply) => {
      const { assignmentId } =
        request.validatedParams as PlagiarismAssignmentIdParam

      if (!request.user?.id) {
        throw new UnauthorizedError("User authentication required")
      }

      const similarityStatus =
        await plagiarismService.getAssignmentSimilarityStatus(assignmentId)

      return reply.send({
        success: true,
        message: "Assignment similarity status retrieved successfully",
        ...similarityStatus,
      })
    },
  })

  /**
   * GET /reports/:reportId
   * Get plagiarism report by ID
   */
  app.get("/reports/:reportId", {
    preHandler: validateParams(ReportIdParamSchema),
    handler: async (request, reply) => {
      const { reportId } = request.validatedParams as ReportIdParam
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
  app.get("/reports/:reportId/pairs/:pairId", {
    preHandler: validateParams(ReportPairParamsSchema),
    handler: async (request, reply) => {
      const { reportId, pairId } = request.validatedParams as ReportPairParams

      const pairDetailsData = await plagiarismService.getPairDetails(
        reportId,
        pairId,
      )

      return reply.send({
        success: true,
        message: "Pair details retrieved successfully",
        ...pairDetailsData,
      })
    },
  })

  /**
   * DELETE /reports/:reportId
   * Delete a plagiarism report
   */
  app.delete("/reports/:reportId", {
    preHandler: validateParams(ReportIdParamSchema),
    handler: async (request, reply) => {
      const { reportId } = request.validatedParams as ReportIdParam

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
  app.get("/results/:resultId/details", {
    preHandler: validateParams(ResultIdParamSchema),
    handler: async (request, reply) => {
      const { resultId } = request.validatedParams as ResultIdParam

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
