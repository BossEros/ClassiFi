import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { AssignmentService } from "@/modules/assignments/assignment.service.js"
import { LatePenaltyService } from "@/modules/assignments/late-penalty.service.js"
import { TestCaseService } from "@/modules/test-cases/test-case.service.js"

import {
  TeacherIdQuery,
  TeacherIdQuerySchema,
} from "@/modules/classes/class.schema.js"
import {
  validateBody,
  validateParams,
  validateQuery,
} from "@/api/plugins/zod-validation.js"
import {
  UpdateAssignmentRequestSchema,
  AssignmentIdParamSchema,
  type UpdateAssignmentRequest,
  type AssignmentIdParam,
} from "@/modules/assignments/assignment.schema.js"
import {
  LatePenaltyUpdateBodySchema,
  type LatePenaltyUpdateBody,
} from "@/modules/gradebook/gradebook.schema.js"
import {
  CreateTestCaseRequestSchema,
  type CreateTestCaseRequest,
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
  const assignmentService = container.resolve<AssignmentService>(
    DI_TOKENS.services.assignment,
  )
  const latePenaltyService = container.resolve<LatePenaltyService>(
    DI_TOKENS.services.latePenalty,
  )
  const testCaseService = container.resolve<TestCaseService>(
    DI_TOKENS.services.testCase,
  )

  /**
   * GET /:assignmentId
   * Get assignment details
   */
  app.get("/:assignmentId", {
    preHandler: validateParams(AssignmentIdParamSchema),
    async handler(request, reply) {
      const { assignmentId } = request.validatedParams as AssignmentIdParam

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
  app.put("/:assignmentId", {
    preHandler: [
      validateParams(AssignmentIdParamSchema),
      validateBody(UpdateAssignmentRequestSchema),
    ],
    async handler(request, reply) {
      const { assignmentId } = request.validatedParams as AssignmentIdParam

      const { teacherId, ...assignmentUpdateData } =
        request.validatedBody as UpdateAssignmentRequest

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
  })

  /**
   * DELETE /:assignmentId
   * Delete an assignment
   */
  app.delete("/:assignmentId", {
    preHandler: [
      validateParams(AssignmentIdParamSchema),
      validateQuery(TeacherIdQuerySchema),
    ],
    async handler(request, reply) {
      const { assignmentId } = request.validatedParams as AssignmentIdParam
      const { teacherId } = request.validatedQuery as TeacherIdQuery

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
  app.get("/:assignmentId/late-penalty", {
    preHandler: validateParams(AssignmentIdParamSchema),
    handler: async (request, reply) => {
      const { assignmentId } = request.validatedParams as AssignmentIdParam

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
  app.put("/:assignmentId/late-penalty", {
    preHandler: [
      validateParams(AssignmentIdParamSchema),
      validateBody(LatePenaltyUpdateBodySchema),
    ],
    handler: async (request, reply) => {
      const { assignmentId } = request.validatedParams as AssignmentIdParam

      const { enabled: isLatePenaltyEnabled, config: providedConfig } =
        request.validatedBody as LatePenaltyUpdateBody

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
  app.get("/:assignmentId/test-cases", {
    preHandler: validateParams(AssignmentIdParamSchema),
    handler: async (request, reply) => {
      const { assignmentId } = request.validatedParams as AssignmentIdParam

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
  app.post("/:assignmentId/test-cases", {
    preHandler: [
      validateParams(AssignmentIdParamSchema),
      validateBody(CreateTestCaseRequestSchema),
    ],
    handler: async (request, reply) => {
      const { assignmentId } = request.validatedParams as AssignmentIdParam

      const createdTestCase = await testCaseService.createTestCase(
        assignmentId,
        request.validatedBody as CreateTestCaseRequest,
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
  })

  /**
   * POST /:assignmentId/send-reminder
   * Send deadline reminder to students who haven't submitted
   */
  app.post("/:assignmentId/send-reminder", {
    preHandler: [
      validateParams(AssignmentIdParamSchema),
      validateQuery(TeacherIdQuerySchema),
    ],
    handler: async (request, reply) => {
      const { assignmentId } = request.validatedParams as AssignmentIdParam
      const { teacherId } = request.validatedQuery as TeacherIdQuery

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
