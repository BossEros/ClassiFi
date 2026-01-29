import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { SubmissionService } from "@/services/submission.service.js"
import { CodeTestService } from "@/services/codeTest.service.js"
import { toJsonSchema } from "@/api/utils/swagger.js"
import { parsePositiveInt } from "@/shared/utils.js"
import { LatestOnlyQuerySchema } from "@/api/schemas/common.schema.js"
import { AssignmentIdParamSchema } from "@/api/schemas/assignment.schema.js"
import { StudentIdParamSchema } from "@/api/schemas/class.schema.js"
import {
  SubmitAssignmentResponseSchema,
  SubmissionListResponseSchema,
  SubmissionHistoryResponseSchema,
  SubmissionIdParamSchema,
  HistoryParamsSchema,
  DownloadResponseSchema,
  SubmissionContentResponseSchema,
} from "@/api/schemas/submission.schema.js"
import { TestResultsResponseSchema } from "@/api/schemas/testCase.schema.js"
import { BadRequestError, NotFoundError } from "@/api/middlewares/error-handler.js"
import { settings } from "@/shared/config.js"

/**
 * Type definition for multipart form field values.
 * Used when parsing form data from file upload requests.
 */
interface MultipartField {
  value: string
}

/**
 * Registers all submission-related routes.
 * Handles assignment submissions, history, downloads, and test execution.
 *
 * @param app - The Fastify application instance.
 * @returns A promise that resolves when all routes are registered.
 */
export async function submissionRoutes(app: FastifyInstance): Promise<void> {
  const submissionService = container.resolve<SubmissionService>("SubmissionService")
  const codeTestService = container.resolve<CodeTestService>("CodeTestService")

  /**
   * POST /
   * Submit an assignment (file upload)
   */
  app.post("/", {
    schema: {
      tags: ["Submissions"],
      summary: "Submit an assignment (file upload)",
      description: "Upload code file for assignment submission using multipart/form-data",
      consumes: ["multipart/form-data"],
      response: {
        201: toJsonSchema(SubmitAssignmentResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const uploadedFile = await request.file()

      if (!uploadedFile) {
        throw new BadRequestError("No file uploaded")
      }

      const assignmentIdField = uploadedFile.fields.assignment_id as MultipartField | undefined
      const studentIdField = uploadedFile.fields.student_id as MultipartField | undefined

      const assignmentId = parsePositiveInt(assignmentIdField?.value, "Assignment ID")
      const studentId = parsePositiveInt(studentIdField?.value, "Student ID")

      const fileBuffer = await uploadedFile.toBuffer()

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
  app.get<{ Params: { assignmentId: string; studentId: string } }>(
    "/history/:assignmentId/:studentId",
    {
      schema: {
        tags: ["Submissions"],
        summary: "Get submission history for a student on an assignment",
        description: "Returns all past submissions for a specific student-assignment pair",
        params: toJsonSchema(HistoryParamsSchema),
        response: {
          200: toJsonSchema(SubmissionHistoryResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const assignmentId = parsePositiveInt(request.params.assignmentId, "Assignment ID")
        const studentId = parsePositiveInt(request.params.studentId, "Student ID")

        const submissionHistoryList = await submissionService.getSubmissionHistory(
          assignmentId,
          studentId,
        )

        return reply.send({
          success: true,
          message: "Submission history retrieved successfully",
          submissions: submissionHistoryList,
          totalSubmissions: submissionHistoryList.length,
        })
      },
    },
  )

  /**
   * GET /assignment/:assignmentId
   * Get all submissions for an assignment
   */
  app.get<{
    Params: { assignmentId: string }
    Querystring: { latestOnly: boolean }
  }>("/assignment/:assignmentId", {
    schema: {
      tags: ["Submissions"],
      summary: "Get all submissions for an assignment",
      description: "Returns submissions from all students for a specific assignment. Use latestOnly=true to get only the most recent submission per student",
      params: toJsonSchema(AssignmentIdParamSchema),
      querystring: toJsonSchema(LatestOnlyQuerySchema),
      response: {
        200: toJsonSchema(SubmissionListResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const assignmentId = parsePositiveInt(request.params.assignmentId, "Assignment ID")
      const { latestOnly: shouldReturnLatestOnly } = request.query

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
  app.get<{
    Params: { studentId: string }
    Querystring: { latestOnly: boolean }
  }>("/student/:studentId", {
    schema: {
      tags: ["Submissions"],
      summary: "Get all submissions by a student",
      description: "Returns all submissions across all assignments for a specific student. Use latestOnly=true to get only the most recent submission per assignment",
      params: toJsonSchema(StudentIdParamSchema),
      querystring: toJsonSchema(LatestOnlyQuerySchema),
      response: {
        200: toJsonSchema(SubmissionListResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const studentId = parsePositiveInt(request.params.studentId, "Student ID")
      const { latestOnly: shouldReturnLatestOnly } = request.query

      const studentSubmissionsList = await submissionService.getStudentSubmissions(
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
  app.get<{ Params: { submissionId: string } }>("/:submissionId/download", {
    schema: {
      tags: ["Submissions"],
      summary: "Get download URL for a submission",
      description: "Generates a signed URL for downloading the submission file from storage",
      params: toJsonSchema(SubmissionIdParamSchema),
      response: {
        200: toJsonSchema(DownloadResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const submissionId = parsePositiveInt(request.params.submissionId, "Submission ID")

      const signedDownloadUrl = await submissionService.getSubmissionDownloadUrl(submissionId)

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
  app.get<{ Params: { submissionId: string } }>("/:submissionId/content", {
    schema: {
      tags: ["Submissions"],
      summary: "Get submission content for preview",
      description: "Retrieves the raw code content and detected programming language for in-browser preview",
      params: toJsonSchema(SubmissionIdParamSchema),
      response: {
        200: toJsonSchema(SubmissionContentResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const submissionId = parsePositiveInt(request.params.submissionId, "Submission ID")

      const submissionContentData = await submissionService.getSubmissionContent(submissionId)

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
  app.get<{ Params: { submissionId: string } }>(
    "/:submissionId/test-results",
    {
      schema: {
        tags: ["Submissions"],
        summary: "Get test results for a submission",
        description: "Retrieves the test execution results including pass/fail status for each test case",
        params: toJsonSchema(SubmissionIdParamSchema),
        response: {
          200: toJsonSchema(TestResultsResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const submissionId = parsePositiveInt(request.params.submissionId, "Submission ID")

        const testResultsData = await codeTestService.getTestResults(submissionId)

        if (!testResultsData) {
          throw new NotFoundError("No test results found for this submission")
        }

        return reply.send({
          success: true,
          message: "Test results retrieved successfully",
          data: testResultsData,
        })
      },
    },
  )

  /**
   * POST /:submissionId/run-tests
   * Run tests for a submission with timeout protection
   */
  app.post<{ Params: { submissionId: string } }>(
    "/:submissionId/run-tests",
    {
      schema: {
        tags: ["Submissions"],
        summary: "Run tests for a submission",
        description: `Manually triggers test execution for a submission and returns the results. Request will timeout after ${settings.testExecutionTimeoutSeconds} seconds if tests take too long to execute.`,
        params: toJsonSchema(SubmissionIdParamSchema),
        response: {
          200: toJsonSchema(TestResultsResponseSchema),
          504: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
              error: { type: "string" },
            },
          },
        },
      },
      handler: async (request, reply) => {
        const submissionId = parsePositiveInt(request.params.submissionId, "Submission ID")

        // Create timeout promise
        const timeoutMs = settings.testExecutionTimeoutSeconds * 1000
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                `Test execution exceeded timeout of ${settings.testExecutionTimeoutSeconds} seconds`,
              ),
            )
          }, timeoutMs)
        })

        try {
          // Race between test execution and timeout
          const executedTestResults = await Promise.race([
            codeTestService.runTestsForSubmission(submissionId),
            timeoutPromise,
          ])

          return reply.send({
            success: true,
            message: "Tests executed successfully",
            data: executedTestResults,
          })
        } catch (error) {
          // Check if it's a timeout error
          if (
            error instanceof Error &&
            error.message.includes("exceeded timeout")
          ) {
            return reply.status(504).send({
              success: false,
              message: "Test execution timeout",
              error: `Tests did not complete within ${settings.testExecutionTimeoutSeconds} seconds. This may indicate an infinite loop, excessive computation, or system overload.`,
            })
          }

          // Re-throw other errors to be handled by global error handler
          throw error
        }
      },
    },
  )
}
