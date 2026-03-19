import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { validateParams, validateBody } from "@/api/plugins/zod-validation.js"
import { CodeTestService } from "@/modules/test-cases/code-test.service.js"
import { TestCaseService } from "@/modules/test-cases/test-case.service.js"
import {
  UpdateTestCaseRequestSchema,
  RunTestsPreviewRequestSchema,
  TestCaseIdParamSchema,
  type UpdateTestCaseRequest,
  type RunTestsPreviewRequest,
  type TestCaseIdParam,
} from "@/modules/test-cases/test-case.schema.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Registers test case CRUD routes.
 *
 * @param app - The Fastify application instance.
 * @returns A promise that resolves when all routes are registered.
 */
export async function testCaseRoutes(app: FastifyInstance): Promise<void> {
  const testCaseService = container.resolve<TestCaseService>(
    DI_TOKENS.services.testCase,
  )

  /**
   * PUT /:testCaseId
   * Update a test case
   */
  app.put("/:testCaseId", {
    preHandler: [
      validateParams(TestCaseIdParamSchema),
      validateBody(UpdateTestCaseRequestSchema),
    ],
    handler: async (request, reply) => {
      const { testCaseId } = request.validatedParams as TestCaseIdParam
      const updateData = request.validatedBody as UpdateTestCaseRequest

      const updatedTestCase = await testCaseService.updateTestCase(
        testCaseId,
        updateData,
      )

      return reply.send({
        success: true,
        message: "Test case updated successfully",
        testCase: {
          ...updatedTestCase,
          createdAt: updatedTestCase.createdAt.toISOString(),
        },
      })
    },
  })

  /**
   * DELETE /:testCaseId
   * Delete a test case
   */
  app.delete("/:testCaseId", {
    preHandler: validateParams(TestCaseIdParamSchema),
    handler: async (request, reply) => {
      const { testCaseId } = request.validatedParams as TestCaseIdParam

      await testCaseService.deleteTestCase(testCaseId)

      return reply.send({
        success: true,
        message: "Test case deleted successfully",
      })
    },
  })
}

/**
 * Registers code preview and health routes.
 *
 * @param app - The Fastify application instance.
 * @returns A promise that resolves when all routes are registered.
 */
export async function codeTestRoutes(app: FastifyInstance): Promise<void> {
  const codeTestService = container.resolve<CodeTestService>(
    DI_TOKENS.services.codeTest,
  )

  /**
   * POST /run-tests
   * Run tests in preview mode (without saving)
   */
  app.post("/run-tests", {
    preHandler: validateBody(RunTestsPreviewRequestSchema),
    handler: async (request, reply) => {
      const { sourceCode, language, assignmentId } =
        request.validatedBody as RunTestsPreviewRequest

      const testExecutionResults = await codeTestService.runTestsPreview(
        sourceCode,
        language,
        assignmentId,
      )

      return reply.send({
        success: true,
        message: "Tests executed successfully",
        data: testExecutionResults,
      })
    },
  })

  /**
   * GET /health
   * Check if code execution service is healthy
   */
  app.get("/health", {
    handler: async (_request, reply) => {
      const isServiceHealthy = await codeTestService.healthCheck()

      return reply.send({ healthy: isServiceHealthy })
    },
  })
}
