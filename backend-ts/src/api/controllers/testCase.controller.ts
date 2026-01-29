import type { FastifyInstance } from "fastify"
import { container } from "tsyringe"
import { toJsonSchema } from "../utils/swagger.js"
import { parsePositiveInt } from "@/shared/utils.js"
import { SuccessMessageSchema } from "../schemas/common.schema.js"
import { CodeTestService } from "@/services/codeTest.service.js"
import { TestCaseService } from "@/services/test-case.service.js"
import {
  UpdateTestCaseRequestSchema,
  RunTestsPreviewRequestSchema,
  CreateTestCaseResponseSchema,
  TestResultsResponseSchema,
  type UpdateTestCaseRequest,
  type RunTestsPreviewRequest,
} from "../schemas/testCase.schema.js"

/**
 * Registers test case routes for managing test cases and running code tests.
 *
 * @param app - The Fastify application instance.
 * @returns A promise that resolves when all routes are registered.
 */
export async function testCaseRoutes(app: FastifyInstance): Promise<void> {
  const testCaseService = container.resolve<TestCaseService>("TestCaseService")
  const codeTestService = container.resolve<CodeTestService>("CodeTestService")

  /**
   * PUT /:testCaseId
   * Update a test case
   */
  app.put<{ Params: { testCaseId: string }; Body: UpdateTestCaseRequest }>(
    "/:testCaseId",
    {
      schema: {
        tags: ["Test Cases"],
        summary: "Update a test case",
        description:
          "Updates an existing test case with new input, expected output, or visibility settings",
        params: {
          type: "object",
          properties: { testCaseId: { type: "string" } },
        },
        body: toJsonSchema(UpdateTestCaseRequestSchema),
        response: {
          200: toJsonSchema(CreateTestCaseResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const testCaseId = parsePositiveInt(
          request.params.testCaseId,
          "Test Case ID",
        )

        const updatedTestCase = await testCaseService.updateTestCase(
          testCaseId,
          request.body,
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
    },
  )

  /**
   * DELETE /:testCaseId
   * Delete a test case
   */
  app.delete<{ Params: { testCaseId: string } }>("/:testCaseId", {
    schema: {
      tags: ["Test Cases"],
      summary: "Delete a test case",
      description:
        "Permanently removes a test case from an assignment. This action cannot be undone.",
      params: {
        type: "object",
        properties: { testCaseId: { type: "string" } },
      },
      response: {
        200: toJsonSchema(SuccessMessageSchema),
      },
    },
    handler: async (request, reply) => {
      const testCaseId = parsePositiveInt(
        request.params.testCaseId,
        "Test Case ID",
      )

      await testCaseService.deleteTestCase(testCaseId)

      return reply.send({
        success: true,
        message: "Test case deleted successfully",
      })
    },
  })

  /**
   * POST /code/run-tests
   * Run tests in preview mode (without saving)
   */
  app.post<{ Body: RunTestsPreviewRequest }>("/code/run-tests", {
    schema: {
      tags: ["Code Testing"],
      summary: "Run tests preview (without submission)",
      description:
        "Executes code against assignment test cases without creating a submission record. Used for testing code before final submission.",
      body: toJsonSchema(RunTestsPreviewRequestSchema),
      response: {
        200: toJsonSchema(TestResultsResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const { sourceCode, language, assignmentId } = request.body

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
   * GET /code/health
   * Check if code execution service is healthy
   */
  app.get("/code/health", {
    schema: {
      tags: ["Code Testing"],
      summary: "Check code execution service health",
      description:
        "Verifies that the Judge0 code execution service is available and responding correctly",
      response: {
        200: { type: "object", properties: { healthy: { type: "boolean" } } },
      },
    },
    handler: async (_request, reply) => {
      const isServiceHealthy = await codeTestService.healthCheck()

      return reply.send({ healthy: isServiceHealthy })
    },
  })
}
