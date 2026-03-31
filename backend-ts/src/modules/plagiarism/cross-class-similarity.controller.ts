import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { CrossClassSimilarityService } from "@/modules/plagiarism/cross-class-similarity.service.js"
import { validateParams } from "@/api/plugins/zod-validation.js"
import {
  CrossClassAssignmentIdParamSchema,
  CrossClassReportIdParamSchema,
  CrossClassResultIdParamSchema,
  type CrossClassAssignmentIdParam,
  type CrossClassReportIdParam,
  type CrossClassResultIdParam,
} from "@/modules/plagiarism/cross-class-similarity.schema.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"
import { authMiddleware } from "@/api/middlewares/auth.middleware.js"
import { UnauthorizedError } from "@/shared/errors.js"

/**
 * Registers cross-class similarity detection routes.
 *
 * @param app - The Fastify application instance.
 * @returns A promise that resolves when all routes are registered.
 */
export async function crossClassSimilarityRoutes(app: FastifyInstance): Promise<void> {
  const crossClassService = container.resolve<CrossClassSimilarityService>(
    DI_TOKENS.services.crossClassSimilarity,
  )

  /**
   * POST /analyze/assignment/:assignmentId
   * Trigger cross-class similarity analysis for an assignment
   */
  app.post("/analyze/assignment/:assignmentId", {
    preHandler: [
      authMiddleware,
      validateParams(CrossClassAssignmentIdParamSchema),
    ],
    handler: async (request, reply) => {
      const { assignmentId } = request.validatedParams as CrossClassAssignmentIdParam

      if (!request.user?.id) {
        throw new UnauthorizedError("User authentication required")
      }

      const analysisResult = await crossClassService.analyzeCrossClassSimilarity(
        assignmentId,
        request.user.id,
      )

      return reply.send({
        success: true,
        message: analysisResult.matchedAssignments.length > 0
          ? "Cross-class similarity analysis completed successfully"
          : "No matching assignments found across your classes",
        ...analysisResult,
      })
    },
  })

  /**
   * GET /reports/:reportId
   * Get a cross-class similarity report by ID
   */
  app.get("/reports/:reportId", {
    preHandler: [
      authMiddleware,
      validateParams(CrossClassReportIdParamSchema),
    ],
    handler: async (request, reply) => {
      const { reportId } = request.validatedParams as CrossClassReportIdParam

      if (!request.user?.id) {
        throw new UnauthorizedError("User authentication required")
      }

      const reportData = await crossClassService.getReport(reportId, request.user.id)

      return reply.send({
        success: true,
        message: "Cross-class report retrieved successfully",
        ...reportData,
      })
    },
  })

  /**
   * GET /reports/assignment/:assignmentId/latest
   * Get the latest cross-class report for a source assignment
   */
  app.get("/reports/assignment/:assignmentId/latest", {
    preHandler: [
      authMiddleware,
      validateParams(CrossClassAssignmentIdParamSchema),
    ],
    handler: async (request, reply) => {
      const { assignmentId } = request.validatedParams as CrossClassAssignmentIdParam

      if (!request.user?.id) {
        throw new UnauthorizedError("User authentication required")
      }

      const reportData = await crossClassService.getLatestReport(assignmentId, request.user.id)

      if (!reportData) {
        return reply.send({
          success: true,
          message: "No cross-class report found for this assignment",
          report: null,
        })
      }

      return reply.send({
        success: true,
        message: "Latest cross-class report retrieved successfully",
        ...reportData,
      })
    },
  })

  /**
   * GET /results/:resultId/details
   * Get cross-class result details with code contents and fragments
   */
  app.get("/results/:resultId/details", {
    preHandler: [
      authMiddleware,
      validateParams(CrossClassResultIdParamSchema),
    ],
    handler: async (request, reply) => {
      const { resultId } = request.validatedParams as CrossClassResultIdParam

      if (!request.user?.id) {
        throw new UnauthorizedError("User authentication required")
      }

      const resultDetails = await crossClassService.getResultDetails(resultId, request.user.id)

      return reply.send({
        success: true,
        message: "Cross-class result details retrieved successfully",
        ...resultDetails,
      })
    },
  })

  /**
   * DELETE /reports/:reportId
   * Delete a cross-class similarity report
   */
  app.delete("/reports/:reportId", {
    preHandler: [
      authMiddleware,
      validateParams(CrossClassReportIdParamSchema),
    ],
    handler: async (request, reply) => {
      const { reportId } = request.validatedParams as CrossClassReportIdParam

      if (!request.user?.id) {
        throw new UnauthorizedError("User authentication required")
      }

      await crossClassService.deleteReport(reportId, request.user.id)

      return reply.send({
        success: true,
        message: "Cross-class report deleted successfully",
      })
    },
  })
}
