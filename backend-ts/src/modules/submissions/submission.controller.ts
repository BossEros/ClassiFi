import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { SubmissionService } from "@/modules/submissions/submission.service.js"
import { CodeTestService } from "@/modules/test-cases/code-test.service.js"
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/api/plugins/zod-validation.js"
import { parsePositiveInt } from "@/shared/utils.js"
import {
  LatestOnlyQuerySchema,
  type LatestOnlyQuery,
} from "@/api/schemas/common.schema.js"
import {
  AssignmentIdParamSchema,
  type AssignmentIdParam,
} from "@/modules/assignments/assignment.schema.js"
import {
  StudentIdParamSchema,
  type StudentIdParam,
} from "@/modules/classes/class.schema.js"
import {
  SubmissionIdParamSchema,
  TestResultsQuerySchema,
  HistoryParamsSchema,
  SaveFeedbackBodySchema,
  type SaveFeedbackBody,
  type SubmissionIdParam,
  type HistoryParams,
  type TestResultsQuery,
} from "@/modules/submissions/submission.schema.js"
import {
  BadRequestError,
  NotFoundError,
} from "@/api/middlewares/error-handler.js"
import { settings } from "@/shared/config.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Type definition for multipart form field values.
 * Used when parsing form data from file upload requests.
 */
interface MultipartField {
  value: string
}

/**
 * Thrown when a test execution run exceeds the configured time limit.
 * Having a dedicated class lets the catch block do a clean `instanceof` check
 * instead of pattern-matching against an error message string.
 */
class TestExecutionTimeoutError extends Error {
  constructor(timeoutSeconds: number) {
    super(
      `Tests did not complete within ${timeoutSeconds} seconds. ` +
        `This may indicate an infinite loop, excessive computation, or system overload.`,
    )
    this.name = "TestExecutionTimeoutError"
  }
}

/**
 * Races a promise against a timeout. Throws TestExecutionTimeoutError if the
 * timeout fires first. Always cleans up the timer regardless of outcome.
 *
 * @param operation - The async operation to run.
 * @param timeoutSeconds - How long to wait before giving up.
 */
async function runWithTimeout<T>(
  operation: Promise<T>,
  timeoutSeconds: number,
): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TestExecutionTimeoutError(timeoutSeconds))
    }, timeoutSeconds * 1000)
  })

  try {
    return await Promise.race([operation, timeoutPromise])
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Registers all submission-related routes.
 * Handles assignment submissions, history, downloads, and test execution.
 *
 * @param app - The Fastify application instance.
 * @returns A promise that resolves when all routes are registered.
 */
export async function submissionRoutes(app: FastifyInstance): Promise<void> {
  const submissionService = container.resolve<SubmissionService>(
    DI_TOKENS.services.submission,
  )
  const codeTestService = container.resolve<CodeTestService>(
    DI_TOKENS.services.codeTest,
  )
  const hiddenDetailAuthorizedRoles = new Set(["teacher", "admin"])

  /**
   * POST /
   * Submit an assignment (file upload)
   */
  app.post("/", {
    handler: async (request, reply) => {
      // STEP 1: Pull the uploaded file out of the multipart form.
      // If the student somehow sent the request without a file, bail out immediately.
      const uploadedFile = await request.file()

      if (!uploadedFile) {
        throw new BadRequestError("No file uploaded")
      }

      // STEP 2: Extract the assignment ID and student ID that came along with the file.
      // These are sent as extra form fields alongside the file in the multipart request.
      const assignmentIdField = uploadedFile.fields.assignment_id as
        | MultipartField
        | undefined
      const studentIdField = uploadedFile.fields.student_id as
        | MultipartField
        | undefined

      const assignmentId = parsePositiveInt(
        assignmentIdField?.value,
        "Assignment ID",
      )
      const studentId = parsePositiveInt(studentIdField?.value, "Student ID")

      // STEP 3: Load the file contents into memory as a buffer.
      // We need the raw bytes to upload it to storage.
      const fileBuffer = await uploadedFile.toBuffer()

      // STEP 4: Hand everything off to the service.
      // It validates the assignment window, uploads the file to storage, and writes the DB record.
      const submission = await submissionService.submitAssignment(
        assignmentId,
        studentId,
        {
          filename: uploadedFile.filename,
          data: fileBuffer,
          mimetype: uploadedFile.mimetype,
        },
      )

      return reply.status(201).send({
        success: true,
        message: "Assignment submitted successfully",
        submission,
      })
    },
  })

  /**
   * GET /history/:assignmentId/:studentId
   * Get submission history for a student on an assignment
   */
  app.get("/history/:assignmentId/:studentId", {
    preHandler: validateParams(HistoryParamsSchema),
    handler: async (request, reply) => {
      const { assignmentId, studentId } =
        request.validatedParams as HistoryParams

      const submissionHistoryList =
        await submissionService.getSubmissionHistory(assignmentId, studentId)

      return reply.send({
        success: true,
        message: "Submission history retrieved successfully",
        submissions: submissionHistoryList,
        totalSubmissions: submissionHistoryList.length,
      })
    },
  })

  /**
   * GET /assignment/:assignmentId
   * Get all submissions for an assignment
   */
  app.get("/assignment/:assignmentId", {
    preHandler: [
      validateParams(AssignmentIdParamSchema),
      validateQuery(LatestOnlyQuerySchema),
    ],
    handler: async (request, reply) => {
      const { assignmentId } = request.validatedParams as AssignmentIdParam

      const { latestOnly: shouldReturnLatestOnly } =
        request.validatedQuery as LatestOnlyQuery

      const submissionsList = await submissionService.getAssignmentSubmissions(
        assignmentId,
        shouldReturnLatestOnly,
      )

      return reply.send({
        success: true,
        message: "Submissions retrieved successfully",
        submissions: submissionsList,
        totalSubmissions: submissionsList.length,
      })
    },
  })

  /**
   * GET /student/:studentId
   * Get all submissions by a student
   */
  app.get("/student/:studentId", {
    preHandler: [
      validateParams(StudentIdParamSchema),
      validateQuery(LatestOnlyQuerySchema),
    ],
    handler: async (request, reply) => {
      const { studentId } = request.validatedParams as StudentIdParam
      const { latestOnly: shouldReturnLatestOnly } =
        request.validatedQuery as LatestOnlyQuery

      const studentSubmissionsList =
        await submissionService.getStudentSubmissions(
          studentId,
          shouldReturnLatestOnly,
        )

      return reply.send({
        success: true,
        message: "Submissions retrieved successfully",
        submissions: studentSubmissionsList,
        totalSubmissions: studentSubmissionsList.length,
      })
    },
  })

  /**
   * GET /:submissionId/download
   * Get download URL for a submission
   */
  app.get("/:submissionId/download", {
    preHandler: validateParams(SubmissionIdParamSchema),
    handler: async (request, reply) => {
      const { submissionId } = request.validatedParams as SubmissionIdParam

      const signedDownloadUrl =
        await submissionService.getSubmissionDownloadUrl(submissionId)

      return reply.send({
        success: true,
        message: "Download URL generated successfully",
        downloadUrl: signedDownloadUrl,
      })
    },
  })

  /**
   * GET /:submissionId/content
   * Get submission content for preview
   */
  app.get("/:submissionId/content", {
    preHandler: validateParams(SubmissionIdParamSchema),
    handler: async (request, reply) => {
      const { submissionId } = request.validatedParams as SubmissionIdParam

      const submissionContentData =
        await submissionService.getSubmissionContent(submissionId)

      return reply.send({
        success: true,
        message: "Submission content retrieved successfully",
        content: submissionContentData.content,
        language: submissionContentData.language,
      })
    },
  })

  /**
   * GET /:submissionId/test-results
   * Get test results for a submission
   */
  app.get("/:submissionId/test-results", {
    preHandler: [
      validateParams(SubmissionIdParamSchema),
      validateQuery(TestResultsQuerySchema),
    ],
    handler: async (request, reply) => {
      const { submissionId } = request.validatedParams as SubmissionIdParam
      const { includeHiddenDetails } =
        request.validatedQuery as TestResultsQuery

      // Only teachers and admins are allowed to see hidden test case details (input/expected output).
      // If a student sends includeHiddenDetails=true, the flag gets silently ignored here.
      const requesterRole = request.user?.role ?? "student"
      const shouldIncludeHiddenDetails =
        includeHiddenDetails && hiddenDetailAuthorizedRoles.has(requesterRole)

      const testResultsData = await codeTestService.getTestResults(
        submissionId,
        shouldIncludeHiddenDetails,
      )

      // null means the submission exists but tests haven't been run yet
      if (!testResultsData) {
        throw new NotFoundError("No test results found for this submission")
      }

      return reply.send({
        success: true,
        message: "Test results retrieved successfully",
        data: testResultsData,
      })
    },
  })

  /**
   * POST /:submissionId/run-tests
   * Run tests for a submission with timeout protection
   */
  app.post("/:submissionId/run-tests", {
    preHandler: validateParams(SubmissionIdParamSchema),
    handler: async (request, reply) => {
      const { submissionId } = request.validatedParams as SubmissionIdParam

      try {
        // Run all test cases, but give up if Judge0 takes longer than the configured limit.
        // runWithTimeout handles the timer setup, the race, and the cleanup internally.
        const executedTestResults = await runWithTimeout(
          codeTestService.runTestsForSubmission(submissionId),
          settings.testExecutionTimeoutSeconds,
        )

        return reply.send({
          success: true,
          message: "Tests executed successfully",
          data: executedTestResults,
        })
      } catch (error) {
        // The test run timed out — tell the student clearly so they know what happened
        if (error instanceof TestExecutionTimeoutError) {
          return reply.status(504).send({
            success: false,
            message: "Test execution timeout",
            error: error.message,
          })
        }

        // Something else went wrong — let the global error handler deal with it
        throw error
      }
    },
  })

  /**
   * PATCH /:submissionId/feedback
   * Save (or update) teacher feedback on a submission.
   * Accessible by teachers and admins only.
   */
  app.patch("/:submissionId/feedback", {
    preHandler: [
      validateParams(SubmissionIdParamSchema),
      validateBody(SaveFeedbackBodySchema),
    ],
    handler: async (request, reply) => {
      const requesterRole = request.user?.role ?? "student"

      if (requesterRole !== "teacher" && requesterRole !== "admin") {
        return reply.status(403).send({
          success: false,
          message: "Only teachers or admins can leave feedback.",
        })
      }

      const { submissionId } = request.validatedParams as SubmissionIdParam
      const body = request.validatedBody as SaveFeedbackBody
      const normalizedFeedback = body.feedback.trim()

      if (normalizedFeedback.length === 0) {
        return reply.status(400).send({
          success: false,
          message: "Feedback cannot be empty.",
        })
      }

      const userRecord = (request.user ?? {}) as Record<string, unknown>
      const firstName =
        typeof userRecord.firstName === "string" ? userRecord.firstName : ""
      const lastName =
        typeof userRecord.lastName === "string" ? userRecord.lastName : ""
      const displayName =
        typeof userRecord.displayName === "string" ? userRecord.displayName : ""
      const username =
        typeof userRecord.username === "string" ? userRecord.username : ""
      const fullName = `${firstName} ${lastName}`.trim()
      const teacherName =
        fullName || displayName.trim() || username.trim() || "Unknown Teacher"

      const updated = await submissionService.saveTeacherFeedback(
        submissionId,
        teacherName,
        normalizedFeedback,
      )

      return reply.send({
        success: true,
        message: "Feedback saved.",
        data: updated,
      })
    },
  })
}
