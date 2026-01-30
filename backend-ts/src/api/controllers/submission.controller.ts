import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import { container } from "tsyringe"
import { SubmissionService } from "@/services/submission.service.js"
import { toJsonSchema } from "@/api/utils/swagger.js"
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
import { BadRequestError } from "@/api/middlewares/error-handler.js"

/** Type definition for multipart form field */
interface MultipartField {
  value: string
}

/** Submission routes - /api/v1/submissions/* */
export async function submissionRoutes(app: FastifyInstance): Promise<void> {
  const submissionService =
    container.resolve<SubmissionService>("SubmissionService")

  /**
   * POST /
   * Submit an assignment (file upload)
   * Note: File upload endpoints use multipart/form-data and need special handling
   */
  app.post("/", {
    schema: {
      tags: ["Submissions"],
      summary: "Submit an assignment (file upload)",
      consumes: ["multipart/form-data"],
      response: {
        201: toJsonSchema(SubmitAssignmentResponseSchema),
      },
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const data = await request.file()

      if (!data) {
        throw new BadRequestError("No file uploaded")
      }

      // Extract and type multipart form fields
      const assignmentIdField = data.fields.assignment_id as
        | MultipartField
        | undefined
      const studentIdField = data.fields.student_id as
        | MultipartField
        | undefined

      const assignmentId = parseInt(assignmentIdField?.value ?? "0", 10)
      const studentId = parseInt(studentIdField?.value ?? "0", 10)

      if (
        isNaN(assignmentId) ||
        isNaN(studentId) ||
        !Number.isInteger(assignmentId) ||
        !Number.isInteger(studentId) ||
        assignmentId <= 0 ||
        studentId <= 0
      ) {
        throw new BadRequestError(
          "Assignment ID and Student ID must be positive integers",
        )
      }

      const buffer = await data.toBuffer()

      const submission = await submissionService.submitAssignment(
        assignmentId,
        studentId,
        {
          filename: data.filename,
          data: buffer,
          mimetype: data.mimetype,
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
        params: toJsonSchema(HistoryParamsSchema),
        response: {
          200: toJsonSchema(SubmissionHistoryResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const assignmentId = parseInt(request.params.assignmentId, 10)
        const studentId = parseInt(request.params.studentId, 10)

        if (
          !Number.isInteger(assignmentId) ||
          !Number.isInteger(studentId) ||
          assignmentId <= 0 ||
          studentId <= 0
        ) {
          throw new BadRequestError("Invalid parameters")
        }

        const submissions = await submissionService.getSubmissionHistory(
          assignmentId,
          studentId,
        )

        return reply.send({
          success: true,
          message: "Submission history retrieved successfully",
          submissions,
          totalSubmissions: submissions.length,
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
      params: toJsonSchema(AssignmentIdParamSchema),
      querystring: toJsonSchema(LatestOnlyQuerySchema),
      response: {
        200: toJsonSchema(SubmissionListResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const assignmentId = parseInt(request.params.assignmentId, 10)
      const { latestOnly } = request.query

      if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
        throw new BadRequestError("Invalid assignment ID")
      }

      const submissions = await submissionService.getAssignmentSubmissions(
        assignmentId,
        latestOnly,
      )

      return reply.send({
        success: true,
        message: "Submissions retrieved successfully",
        submissions,
        totalSubmissions: submissions.length,
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
      params: toJsonSchema(StudentIdParamSchema),
      querystring: toJsonSchema(LatestOnlyQuerySchema),
      response: {
        200: toJsonSchema(SubmissionListResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const studentId = parseInt(request.params.studentId, 10)
      const { latestOnly } = request.query

      if (!Number.isInteger(studentId) || studentId <= 0) {
        throw new BadRequestError("Invalid student ID")
      }

      const submissions = await submissionService.getStudentSubmissions(
        studentId,
        latestOnly,
      )

      return reply.send({
        success: true,
        message: "Submissions retrieved successfully",
        submissions,
        totalSubmissions: submissions.length,
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
      params: toJsonSchema(SubmissionIdParamSchema),
      response: {
        200: toJsonSchema(DownloadResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const submissionId = parseInt(request.params.submissionId, 10)

      if (!Number.isInteger(submissionId) || submissionId <= 0) {
        throw new BadRequestError("Invalid parameters")
      }

      // Verify authorization and generate signed URL
      const downloadUrl =
        await submissionService.getSubmissionDownloadUrl(submissionId)

      return reply.send({
        success: true,
        message: "Download URL generated successfully",
        downloadUrl,
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
      params: toJsonSchema(SubmissionIdParamSchema),
      response: {
        200: toJsonSchema(SubmissionContentResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const submissionId = parseInt(request.params.submissionId, 10)

      if (!Number.isInteger(submissionId) || submissionId <= 0) {
        throw new BadRequestError("Invalid submission ID")
      }

      const result = await submissionService.getSubmissionContent(submissionId)

      return reply.send({
        success: true,
        message: "Submission content retrieved successfully",
        content: result.content,
        language: result.language,
      })
    },
  })
}
