import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { PlagiarismService } from "@/modules/plagiarism/plagiarism.service.js"
import { validateParams } from "@/api/plugins/zod-validation.js"
import {
  ReportIdParamSchema,
  PlagiarismAssignmentIdParamSchema,
  ReportPairParamsSchema,
  ResultIdParamSchema,
  type ReportIdParam,
  type PlagiarismAssignmentIdParam,
  type ReportPairParams,
  type ResultIdParam,
} from "@/modules/plagiarism/plagiarism.schema.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"
import { authMiddleware } from "@/api/middlewares/auth.middleware.js"
import { UnauthorizedError } from "@/shared/errors.js"

/**
 * Registers all plagiarism detection routes.
 *
 * These routes cover the full similarity review flow:
 * running analysis on an assignment, checking if a fresh report exists,
 * loading report data, drilling into specific pair comparisons, and deleting reports.
 *
 * @param app - The Fastify application instance.
 * @returns A promise that resolves when all routes are registered.
 */
export async function plagiarismRoutes(app: FastifyInstance): Promise<void> {
  // Pull the plagiarism service from the DI container.
  // This is the main entry point for all similarity detection logic
  // (structural fingerprinting, semantic scoring, DB persistence, etc.).
  const plagiarismService = container.resolve<PlagiarismService>(
    DI_TOKENS.services.plagiarism,
  )

  /**
   * POST /analyze/assignment/:assignmentId
   * Analyze all submissions for an assignment
   *
   * This is the main trigger for plagiarism detection. The teacher clicks "Run Analysis"
   * on the frontend and this fires. Under the hood, the service runs Winnowing fingerprinting
   * (structural) + GraphCodeBERT (semantic) scoring across all submissions, then saves
   * everything to the database.
   *
   * If a fresh report already exists and nothing has changed since it was generated
   * (same submissions, no re-uploads), it skips re-analysis and returns the cached
   * report — saving time and avoiding redundant computation.
   */
  app.post("/analyze/assignment/:assignmentId", {
    preHandler: [
      authMiddleware,
      validateParams(PlagiarismAssignmentIdParamSchema),
    ],
    handler: async (request, reply) => {
      // Step 1: Get the assignment ID from the validated route params.
      const { assignmentId } = request.validatedParams as PlagiarismAssignmentIdParam

      // Step 2: Make sure the request came from a logged-in user.
      // We pass the teacher's ID to the service so it can be recorded on the report.
      if (!request.user?.id) {
        throw new UnauthorizedError("User authentication required")
      }

      // Step 3: Run the analysis (or load a cached report if one is still fresh).
      // The service handles the heavy lifting — detection, DB persistence, penalty application.
      const authenticatedTeacherId = request.user.id
      const analysisResult = await plagiarismService.analyzeAssignmentSubmissions(
        assignmentId,
        authenticatedTeacherId,
      )

      // Step 4: Pick a response message that reflects what actually happened.
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
   *
   * The frontend calls this when a teacher opens the Similarity tab to decide
   * which button to show: "Run Analysis" (no fresh report) or "Review" (report exists).
   *
   * It's intentionally lightweight — it only checks if a valid report exists
   * and returns its ID, without loading any report data.
   */
  app.get("/analyze/assignment/:assignmentId/status", {
    preHandler: [
      authMiddleware,
      validateParams(PlagiarismAssignmentIdParamSchema),
    ],
    handler: async (request, reply) => {
      // Step 1: Get the assignment ID from the route.
      const { assignmentId } =
        request.validatedParams as PlagiarismAssignmentIdParam

      // Step 2: Verify the user is authenticated.
      if (!request.user?.id) {
        throw new UnauthorizedError("User authentication required")
      }

      // Step 3: Check if a non-stale report exists for this assignment.
      // Returns { hasReusableReport: boolean, reusableReportId: string | null }.
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
   *
   * Fetches a previously generated report by its numeric database ID.
   * This is what the frontend loads when the teacher opens the similarity review page.
   * The response includes the overview summary, all submission files, and per-pair scores.
   */
  app.get("/reports/:reportId", {
    preHandler: validateParams(ReportIdParamSchema),
    handler: async (request, reply) => {
      // Step 1: Get the report ID from the route.
      const { reportId } = request.validatedParams as ReportIdParam

      // Step 2: Load the report from the database.
      // Returns null if no report with this ID exists.
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
   *
   * When a teacher clicks on a specific pair in the similarity report, this endpoint
   * loads the full side-by-side comparison view — both students' code, their scores,
   * and the matched fragment positions so the frontend can highlight overlapping sections.
   */
  app.get("/reports/:reportId/pairs/:pairId", {
    preHandler: validateParams(ReportPairParamsSchema),
    handler: async (request, reply) => {
      // Step 1: Pull both IDs from the route — the report provides context,
      // the pair ID points to the specific two-student comparison we want.
      const { reportId, pairId } = request.validatedParams as ReportPairParams

      // Step 2: Fetch the pair details: similarity scores, both files' source code,
      // and matched fragment positions for the diff/highlight view.
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
   *
   * Permanently removes a report and all its associated results and fragments
   * from the database. Useful when a teacher wants to start fresh — for example,
   * after students have resubmitted and the old report is no longer relevant.
   */
  app.delete("/reports/:reportId", {
    preHandler: validateParams(ReportIdParamSchema),
    handler: async (request, reply) => {
      // Step 1: Get the report ID to delete.
      const { reportId } = request.validatedParams as ReportIdParam

      // Step 2: Delete the report from the database.
      // The service returns a boolean, but we don't surface it — absence of error means success.
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
   *
   * A "result" is a single comparison row between exactly two submissions.
   * This endpoint returns the full detail view for that result: both scores,
   * both students' actual source code (fetched live from cloud storage),
   * and all fragment match positions.
   *
   * It's similar to GET /reports/:reportId/pairs/:pairId, but accessed directly
   * by result ID — used for deep links, e.g. when a teacher navigates
   * from a similarity notification directly to the comparison view.
   */
  app.get("/results/:resultId/details", {
    preHandler: validateParams(ResultIdParamSchema),
    handler: async (request, reply) => {
      // Step 1: Get the result ID from the route.
      const { resultId } = request.validatedParams as ResultIdParam

      // Step 2: Load the full result — scores, matched fragments, and both files' source code.
      // Note: file content is downloaded from cloud storage here, not stored in the DB.
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
