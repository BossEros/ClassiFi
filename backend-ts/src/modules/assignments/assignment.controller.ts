import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { AssignmentService } from "@/modules/assignments/assignment.service.js"
import { LatePenaltyService } from "@/services/latePenalty.service.js"
import { TestCaseService } from "@/modules/test-cases/test-case.service.js"
import { toJsonSchema } from "@/api/utils/swagger.js"
import { parsePositiveInt } from "@/shared/utils.js"
import { SuccessMessageSchema } from "@/api/schemas/common.schema.js"
import { TeacherIdQuerySchema } from "@/modules/classes/class.schema.js"
import {
  UpdateAssignmentRequestSchema,
  AssignmentIdParamSchema,
  GetAssignmentResponseSchema,
  UpdateAssignmentResponseSchema,
  type UpdateAssignmentRequest,
} from "@/modules/assignments/assignment.schema.js"
import {
  LatePenaltyUpdateBodySchema,
  LatePenaltyConfigResponseSchema,
  SuccessResponseSchema,
  type LatePenaltyUpdateBody,
} from "@/modules/gradebook/gradebook.schema.js"
import {
  CreateTestCaseRequestSchema,
  ReorderTestCasesRequestSchema,
  GetTestCasesResponseSchema,
  CreateTestCaseResponseSchema,
  type CreateTestCaseRequest,
  type ReorderTestCasesRequest,
} from "@/modules/test-cases/test-case.schema.js"
import { BadRequestError } from "@/api/middlewares/error-handler.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Parses and validates a date string or Date object.
 *
 * @param value - The date value to parse (string or Date).
 * @param fieldName - The name of the field for error messages.
 * @returns A valid Date object.
 * @throws BadRequestError if the date is invalid.
 */
function parseDate(value: string | Date, fieldName: string): Date {
  const date = new Date(value)

  if (isNaN(date.getTime())) {
    throw new BadRequestError(
      `Invalid ${fieldName}: "${value}" is not a valid date`,
    )
  }

  return date
}

/**
 * Registers all assignment-related routes under /api/v1/assignments/*.
 * Handles HTTP requests for assignment operations including CRUD operations,
 * late penalty configuration, and test case management.
 *
 * @param app - Fastify application instance to register routes on.
 */
export async function assignmentRoutes(app: FastifyInstance): Promise<void> {
  const assignmentService =
    container.resolve<AssignmentService>(DI_TOKENS.services.assignment)
  const latePenaltyService =
    container.resolve<LatePenaltyService>(DI_TOKENS.services.latePenalty)
  const testCaseService = container.resolve<TestCaseService>(DI_TOKENS.services.testCase)

  /**
   * GET /:assignmentId
   * Get assignment details
   */
  app.get<{
    Params: { assignmentId: string }
  }>("/:assignmentId", {
    schema: {
      tags: ["Assignments"],
      summary: "Get assignment details",
      description: "Retrieves detailed information about a specific assignment",
      params: toJsonSchema(AssignmentIdParamSchema),
      response: {
        200: toJsonSchema(GetAssignmentResponseSchema),
      },
    },
    async handler(request, reply) {
      const assignmentId = parsePositiveInt(
        request.params.assignmentId,
        "Assignment ID",
      )

      const assignment =
        await assignmentService.getAssignmentDetails(assignmentId)

      return reply.send({
        success: true,
        message: "Assignment retrieved successfully",
        assignment,
      })
    },
  })

  /**
   * PUT /:assignmentId
   * Update an assignment
   */
  app.put<{ Params: { assignmentId: string }; Body: UpdateAssignmentRequest }>(
    "/:assignmentId",
    {
      schema: {
        tags: ["Assignments"],
        summary: "Update an assignment",
        description:
          "Updates assignment details including title, instructions, and deadlines",
        params: toJsonSchema(AssignmentIdParamSchema),
        body: toJsonSchema(UpdateAssignmentRequestSchema),
        response: {
          200: toJsonSchema(UpdateAssignmentResponseSchema),
        },
      },
      async handler(request, reply) {
        const assignmentId = parsePositiveInt(
          request.params.assignmentId,
          "Assignment ID",
        )

        const { teacherId, ...assignmentUpdateData } = request.body

        const parsedDeadline =
          assignmentUpdateData.deadline === undefined
            ? undefined
            : assignmentUpdateData.deadline === null
              ? null
              : parseDate(assignmentUpdateData.deadline, "deadline")

        const updateRequestWithParsedDates = {
          assignmentId,
          teacherId,
          ...assignmentUpdateData,
          deadline: parsedDeadline,
          scheduledDate: assignmentUpdateData.scheduledDate
            ? parseDate(assignmentUpdateData.scheduledDate, "scheduledDate")
            : undefined,
        }

        const updatedAssignment = await assignmentService.updateAssignment(
          updateRequestWithParsedDates,
        )

        return reply.send({
          success: true,
          message: "Assignment updated successfully",
          assignment: updatedAssignment,
        })
      },
    },
  )

  /**
   * DELETE /:assignmentId
   * Delete an assignment
   */
  app.delete<{
    Params: { assignmentId: string }
    Querystring: { teacherId: string }
  }>("/:assignmentId", {
    schema: {
      tags: ["Assignments"],
      summary: "Delete an assignment",
      description: "Permanently deletes an assignment and all associated data",
      params: toJsonSchema(AssignmentIdParamSchema),
      querystring: toJsonSchema(TeacherIdQuerySchema),
      response: {
        200: toJsonSchema(SuccessMessageSchema),
      },
    },
    async handler(request, reply) {
      const assignmentId = parsePositiveInt(
        request.params.assignmentId,
        "Assignment ID",
      )
      const teacherId = parsePositiveInt(request.query.teacherId, "Teacher ID")

      await assignmentService.deleteAssignment(assignmentId, teacherId)

      return reply.send({
        success: true,
        message: "Assignment deleted successfully",
      })
    },
  })

  /**
   * GET /:assignmentId/late-penalty
   * Get late penalty configuration for an assignment
   */
  app.get<{ Params: { assignmentId: string } }>("/:assignmentId/late-penalty", {
    schema: {
      tags: ["Assignments"],
      summary: "Get late penalty config",
      description:
        "Retrieves the late submission penalty configuration for an assignment",
      params: toJsonSchema(AssignmentIdParamSchema),
      response: {
        200: toJsonSchema(LatePenaltyConfigResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const assignmentId = parsePositiveInt(
        request.params.assignmentId,
        "Assignment ID",
      )

      const latePenaltyConfig =
        await latePenaltyService.getAssignmentConfig(assignmentId)

      return reply.send({
        success: true,
        enabled: latePenaltyConfig.enabled,
        config: latePenaltyConfig.config,
      })
    },
  })

  /**
   * PUT /:assignmentId/late-penalty
   * Update late penalty configuration for an assignment
   */
  app.put<{
    Params: { assignmentId: string }
    Body: LatePenaltyUpdateBody
  }>("/:assignmentId/late-penalty", {
    schema: {
      tags: ["Assignments"],
      summary: "Update late penalty config",
      description:
        "Updates the late submission penalty configuration for an assignment",
      params: toJsonSchema(AssignmentIdParamSchema),
      body: toJsonSchema(LatePenaltyUpdateBodySchema),
      response: {
        200: toJsonSchema(SuccessResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const assignmentId = parsePositiveInt(
        request.params.assignmentId,
        "Assignment ID",
      )

      const { enabled: isLatePenaltyEnabled, config: providedConfig } =
        request.body

      const latePenaltyConfigToApply =
        providedConfig ?? latePenaltyService.getDefaultConfig()

      await latePenaltyService.setAssignmentConfig(
        assignmentId,
        isLatePenaltyEnabled,
        latePenaltyConfigToApply,
      )

      return reply.send({
        success: true,
        message: "Late penalty configuration updated successfully",
      })
    },
  })

  /**
   * GET /:assignmentId/test-cases
   * Get all test cases for an assignment
   */
  app.get<{ Params: { assignmentId: string } }>("/:assignmentId/test-cases", {
    schema: {
      tags: ["Assignments"],
      summary: "Get test cases for an assignment",
      description:
        "Retrieves all test cases associated with a specific assignment",
      params: toJsonSchema(AssignmentIdParamSchema),
      response: {
        200: toJsonSchema(GetTestCasesResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const assignmentId = parsePositiveInt(
        request.params.assignmentId,
        "Assignment ID",
      )

      const testCasesList =
        await testCaseService.getTestCasesByAssignment(assignmentId)

      const testCasesWithFormattedDates = testCasesList.map((testCase) => ({
        ...testCase,
        createdAt: testCase.createdAt.toISOString(),
      }))

      return reply.send({
        success: true,
        message: "Test cases retrieved successfully",
        testCases: testCasesWithFormattedDates,
      })
    },
  })

  /**
   * POST /:assignmentId/test-cases
   * Create a new test case for an assignment
   */
  app.post<{ Params: { assignmentId: string }; Body: CreateTestCaseRequest }>(
    "/:assignmentId/test-cases",
    {
      schema: {
        tags: ["Assignments"],
        summary: "Create a test case",
        description: "Creates a new test case for automated code evaluation",
        params: toJsonSchema(AssignmentIdParamSchema),
        body: toJsonSchema(CreateTestCaseRequestSchema),
        response: {
          201: toJsonSchema(CreateTestCaseResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const assignmentId = parsePositiveInt(
          request.params.assignmentId,
          "Assignment ID",
        )

        const createdTestCase = await testCaseService.createTestCase(
          assignmentId,
          request.body,
        )

        const testCaseWithFormattedDate = {
          ...createdTestCase,
          createdAt: createdTestCase.createdAt.toISOString(),
        }

        return reply.status(201).send({
          success: true,
          message: "Test case created successfully",
          testCase: testCaseWithFormattedDate,
        })
      },
    },
  )

  /**
   * PUT /:assignmentId/test-cases/reorder
   * Reorder test cases
   */
  app.put<{ Params: { assignmentId: string }; Body: ReorderTestCasesRequest }>(
    "/:assignmentId/test-cases/reorder",
    {
      schema: {
        tags: ["Assignments"],
        summary: "Reorder test cases",
        description:
          "Updates the display order of test cases for an assignment",
        params: toJsonSchema(AssignmentIdParamSchema),
        body: toJsonSchema(ReorderTestCasesRequestSchema),
        response: {
          200: toJsonSchema(SuccessMessageSchema),
        },
      },
      handler: async (request, reply) => {
        const assignmentId = parsePositiveInt(
          request.params.assignmentId,
          "Assignment ID",
        )
        const newTestCaseOrder = request.body.order

        await testCaseService.reorderTestCasesForAssignment(
          assignmentId,
          newTestCaseOrder,
        )

        return reply.send({
          success: true,
          message: "Test cases reordered successfully",
        })
      },
    },
  )

  /**
   * POST /:assignmentId/send-reminder
   * Send deadline reminder to students who haven't submitted
   */
  app.post<{
    Params: { assignmentId: string }
    Querystring: { teacherId: string }
  }>("/:assignmentId/send-reminder", {
    schema: {
      tags: ["Assignments"],
      summary: "Send reminder to non-submitters",
      description:
        "Sends deadline reminder notifications to students who haven't submitted the assignment",
      params: toJsonSchema(AssignmentIdParamSchema),
      querystring: toJsonSchema(TeacherIdQuerySchema),
      response: {
        200: toJsonSchema(SuccessMessageSchema),
      },
    },
    handler: async (request, reply) => {
      const assignmentId = parsePositiveInt(
        request.params.assignmentId,
        "Assignment ID",
      )
      const teacherId = parsePositiveInt(request.query.teacherId, "Teacher ID")

      const result = await assignmentService.sendReminderToNonSubmitters(
        assignmentId,
        teacherId,
      )

      return reply.send({
        success: true,
        message: `Reminder sent to ${result.remindersSent} student${result.remindersSent !== 1 ? "s" : ""}`,
      })
    },
  })
}