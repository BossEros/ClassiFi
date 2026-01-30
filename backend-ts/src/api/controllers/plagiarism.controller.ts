import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { PlagiarismService } from "../../services/plagiarism.service.js"
import { toJsonSchema } from "../utils/swagger.js"
import { BadRequestError } from "../middlewares/error-handler.js"
import { authMiddleware } from "../middlewares/auth.middleware.js"
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

/** Plagiarism detection routes - /api/v1/plagiarism/* */
export async function plagiarismRoutes(app: FastifyInstance): Promise<void> {
  const plagiarismService =
    container.resolve<PlagiarismService>("PlagiarismService")

  /**
   * POST /analyze
   * Analyze files for plagiarism
   */
  app.post<{ Body: AnalyzeRequest }>("/analyze", {
    schema: {
      tags: ["Plagiarism"],
      summary: "Analyze files for plagiarism detection",
      body: toJsonSchema(AnalyzeRequestSchema),
      response: {
        200: toJsonSchema(AnalyzeResponseSchema),
      },
    },
    handler: async (request, reply) => {
      try {
        const result = await plagiarismService.analyzeFiles(request.body)
        return reply.send({
          success: true,
          message: "Plagiarism analysis completed successfully",
          ...result,
        })
      } catch (error) {
        throw new BadRequestError((error as Error).message)
      }
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
          "Fetches all latest submissions for the specified assignment, downloads their content, and runs plagiarism detection.",
        params: toJsonSchema(PlagiarismAssignmentIdParamSchema),
        response: {
          200: toJsonSchema(AnalyzeResponseSchema),
        },
      },
      preHandler: [authMiddleware],
      handler: async (request, reply) => {
        const assignmentId = parseInt(request.params.assignmentId, 10)

        if (isNaN(assignmentId)) {
          throw new BadRequestError("Invalid assignment ID")
        }

        try {
          // Get teacher ID from authenticated user
          const teacherId = request.user?.id

          const result = await plagiarismService.analyzeAssignmentSubmissions(
            assignmentId,
            teacherId,
          )
          return reply.send({
            success: true,
            message: "Assignment submissions analyzed successfully",
            ...result,
          })
        } catch (error) {
          throw new BadRequestError((error as Error).message)
        }
      },
    },
  )

  /**
   * GET /reports/:reportId
   * Get a report by ID
   */
  app.get<{ Params: { reportId: string } }>("/reports/:reportId", {
    schema: {
      tags: ["Plagiarism"],
      summary: "Get plagiarism report by ID",
      params: toJsonSchema(ReportIdParamSchema),
      response: {
        200: toJsonSchema(GetReportResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const { reportId } = request.params
      const result = await plagiarismService.getReport(reportId)

      if (!result) {
        return reply.status(404).send({ error: "Report not found" })
      }

      return reply.send({
        success: true,
        message: "Report retrieved successfully",
        ...result,
      })
    },
  })

  /**
   * GET /reports/:reportId/pairs/:pairId
   * Get pair details with fragments
   */
  app.get<{ Params: { reportId: string; pairId: string } }>(
    "/reports/:reportId/pairs/:pairId",
    {
      schema: {
        tags: ["Plagiarism"],
        summary: "Get pair details with matching fragments",
        params: toJsonSchema(ReportPairParamsSchema),
        response: {
          200: toJsonSchema(PairDetailsResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const { reportId, pairId } = request.params
        const pairIdNum = parseInt(pairId, 10)

        if (isNaN(pairIdNum)) {
          throw new BadRequestError("Invalid pair ID")
        }

        try {
          const result = await plagiarismService.getPairDetails(
            reportId,
            pairIdNum,
          )
          return reply.send({
            success: true,
            message: "Pair details retrieved successfully",
            ...result,
          })
        } catch (error) {
          return reply.status(404).send({ error: (error as Error).message })
        }
      },
    },
  )

  /**
   * DELETE /reports/:reportId
   * Delete a report
   */
  app.delete<{ Params: { reportId: string } }>("/reports/:reportId", {
    schema: {
      tags: ["Plagiarism"],
      summary: "Delete a plagiarism report",
      params: toJsonSchema(ReportIdParamSchema),
      response: {
        200: toJsonSchema(DeleteReportResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const { reportId } = request.params
      const deleted = await plagiarismService.deleteReport(reportId)

      if (!deleted) {
        return reply.status(404).send({ error: "Report not found" })
      }

      return reply.send({
        success: true,
        message: "Report deleted successfully",
      })
    },
  })

  /**
   * GET /results/:resultId/details
   * Get result details with fragments and file content (from database)
   */
  app.get<{ Params: { resultId: string } }>("/results/:resultId/details", {
    schema: {
      tags: ["Plagiarism"],
      summary: "Get result details with fragments and file content",
      params: toJsonSchema(ResultIdParamSchema),
      response: {
        200: toJsonSchema(ResultDetailsResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const resultId = parseInt(request.params.resultId, 10)

      if (isNaN(resultId)) {
        throw new BadRequestError("Invalid result ID")
      }

      try {
        const details = await plagiarismService.getResultDetails(resultId)
        return reply.send({
          success: true,
          message: "Result details retrieved successfully",
          ...details,
        })
      } catch (error) {
        return reply.status(404).send({ error: (error as Error).message })
      }
    },
  })
}
