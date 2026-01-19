import type { FastifyInstance } from "fastify";
import { container } from "tsyringe";
import { toJsonSchema } from "../utils/swagger.js";
import { SuccessMessageSchema } from "../schemas/common.schema.js";
import {
  BadRequestError,
  NotFoundError,
} from "../middlewares/error-handler.js";
import { TestCaseRepository } from "@/repositories/testCase.repository.js";
import { CodeTestService } from "@/services/codeTest.service.js";
import {
  CreateTestCaseRequestSchema,
  UpdateTestCaseRequestSchema,
  ReorderTestCasesRequestSchema,
  RunTestsPreviewRequestSchema,
  GetTestCasesResponseSchema,
  CreateTestCaseResponseSchema,
  TestResultsResponseSchema,
  type CreateTestCaseRequest,
  type UpdateTestCaseRequest,
  type ReorderTestCasesRequest,
  type RunTestsPreviewRequest,
} from "../schemas/testCase.schema.js";

/** Test Case routes - /api/v1/test-cases/* */
export async function testCaseRoutes(app: FastifyInstance): Promise<void> {
  const testCaseRepo =
    container.resolve<TestCaseRepository>("TestCaseRepository");
  const codeTestService = container.resolve<CodeTestService>("CodeTestService");

  // =========================================================================
  // Test Case CRUD
  // =========================================================================

  /**
   * GET /assignments/:assignmentId/test-cases
   * Get all test cases for an assignment
   */
  app.get<{ Params: { assignmentId: string } }>(
    "/assignments/:assignmentId/test-cases",
    {
      schema: {
        tags: ["Test Cases"],
        summary: "Get test cases for an assignment",
        params: {
          type: "object",
          properties: { assignmentId: { type: "string" } },
        },
        response: {
          200: toJsonSchema(GetTestCasesResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const assignmentId = parseInt(request.params.assignmentId, 10);

        if (isNaN(assignmentId)) {
          throw new BadRequestError("Invalid assignment ID");
        }

        const testCases = await testCaseRepo.getByAssignmentId(assignmentId);

        return reply.send({
          success: true,
          message: "Test cases retrieved successfully",
          testCases: testCases.map((tc) => ({
            ...tc,
            createdAt: tc.createdAt.toISOString(),
          })),
        });
      },
    },
  );

  /**
   * POST /assignments/:assignmentId/test-cases
   * Create a new test case for an assignment
   */
  app.post<{ Params: { assignmentId: string }; Body: CreateTestCaseRequest }>(
    "/assignments/:assignmentId/test-cases",
    {
      schema: {
        tags: ["Test Cases"],
        summary: "Create a test case",
        params: {
          type: "object",
          properties: { assignmentId: { type: "string" } },
        },
        body: toJsonSchema(CreateTestCaseRequestSchema),
        response: {
          201: toJsonSchema(CreateTestCaseResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const assignmentId = parseInt(request.params.assignmentId, 10);

        if (isNaN(assignmentId)) {
          throw new BadRequestError("Invalid assignment ID");
        }

        // Get next sort order if not provided
        const sortOrder =
          request.body.sortOrder ??
          (await testCaseRepo.getNextSortOrder(assignmentId));

        const testCase = await testCaseRepo.create({
          assignmentId,
          name: request.body.name,
          input: request.body.input ?? "",
          expectedOutput: request.body.expectedOutput,
          isHidden: request.body.isHidden ?? false,
          timeLimit: request.body.timeLimit ?? 5,
          sortOrder,
        });

        return reply.status(201).send({
          success: true,
          message: "Test case created successfully",
          testCase: {
            ...testCase,
            createdAt: testCase.createdAt.toISOString(),
          },
        });
      },
    },
  );

  /**
   * PUT /test-cases/:testCaseId
   * Update a test case
   */
  app.put<{ Params: { testCaseId: string }; Body: UpdateTestCaseRequest }>(
    "/test-cases/:testCaseId",
    {
      schema: {
        tags: ["Test Cases"],
        summary: "Update a test case",
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
        const testCaseId = parseInt(request.params.testCaseId, 10);

        if (isNaN(testCaseId)) {
          throw new BadRequestError("Invalid test case ID");
        }

        const testCase = await testCaseRepo.update(testCaseId, request.body);

        if (!testCase) {
          throw new NotFoundError("Test case not found");
        }

        return reply.send({
          success: true,
          message: "Test case updated successfully",
          testCase: {
            ...testCase,
            createdAt: testCase.createdAt.toISOString(),
          },
        });
      },
    },
  );

  /**
   * DELETE /test-cases/:testCaseId
   * Delete a test case
   */
  app.delete<{ Params: { testCaseId: string } }>("/test-cases/:testCaseId", {
    schema: {
      tags: ["Test Cases"],
      summary: "Delete a test case",
      params: {
        type: "object",
        properties: { testCaseId: { type: "string" } },
      },
      response: {
        200: toJsonSchema(SuccessMessageSchema),
      },
    },
    handler: async (request, reply) => {
      const testCaseId = parseInt(request.params.testCaseId, 10);

      if (isNaN(testCaseId)) {
        throw new BadRequestError("Invalid test case ID");
      }

      const deleted = await testCaseRepo.delete(testCaseId);

      if (!deleted) {
        throw new NotFoundError("Test case not found");
      }

      return reply.send({
        success: true,
        message: "Test case deleted successfully",
      });
    },
  });

  /**
   * PUT /assignments/:assignmentId/test-cases/reorder
   * Reorder test cases
   */
  app.put<{ Params: { assignmentId: string }; Body: ReorderTestCasesRequest }>(
    "/assignments/:assignmentId/test-cases/reorder",
    {
      schema: {
        tags: ["Test Cases"],
        summary: "Reorder test cases",
        params: {
          type: "object",
          properties: { assignmentId: { type: "string" } },
        },
        body: toJsonSchema(ReorderTestCasesRequestSchema),
        response: {
          200: toJsonSchema(SuccessMessageSchema),
        },
      },
      handler: async (request, reply) => {
        await testCaseRepo.updateSortOrder(request.body.order);

        return reply.send({
          success: true,
          message: "Test cases reordered successfully",
        });
      },
    },
  );

  // =========================================================================
  // Code Testing
  // =========================================================================

  /**
   * POST /code/run-tests
   * Run tests in preview mode (without saving)
   */
  app.post<{ Body: RunTestsPreviewRequest }>("/code/run-tests", {
    schema: {
      tags: ["Code Testing"],
      summary: "Run tests preview (without submission)",
      body: toJsonSchema(RunTestsPreviewRequestSchema),
      response: {
        200: toJsonSchema(TestResultsResponseSchema),
      },
    },
    handler: async (request, reply) => {
      const { sourceCode, language, assignmentId } = request.body;

      const result = await codeTestService.runTestsPreview(
        sourceCode,
        language,
        assignmentId,
      );

      return reply.send({
        success: true,
        message: "Tests executed successfully",
        data: result,
      });
    },
  });

  /**
   * GET /submissions/:submissionId/test-results
   * Get test results for a submission
   */
  app.get<{ Params: { submissionId: string } }>(
    "/submissions/:submissionId/test-results",
    {
      schema: {
        tags: ["Code Testing"],
        summary: "Get test results for a submission",
        params: {
          type: "object",
          properties: { submissionId: { type: "string" } },
        },
        response: {
          200: toJsonSchema(TestResultsResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const submissionId = parseInt(request.params.submissionId, 10);

        if (isNaN(submissionId)) {
          throw new BadRequestError("Invalid submission ID");
        }

        const result = await codeTestService.getTestResults(submissionId);

        if (!result) {
          throw new NotFoundError("No test results found for this submission");
        }

        return reply.send({
          success: true,
          message: "Test results retrieved successfully",
          data: result,
        });
      },
    },
  );

  /**
   * POST /submissions/:submissionId/run-tests
   * Manually trigger test execution for a submission
   */
  app.post<{ Params: { submissionId: string } }>(
    "/submissions/:submissionId/run-tests",
    {
      schema: {
        tags: ["Code Testing"],
        summary: "Run tests for a submission",
        params: {
          type: "object",
          properties: { submissionId: { type: "string" } },
        },
        response: {
          200: toJsonSchema(TestResultsResponseSchema),
        },
      },
      handler: async (request, reply) => {
        const submissionId = parseInt(request.params.submissionId, 10);

        if (isNaN(submissionId)) {
          throw new BadRequestError("Invalid submission ID");
        }

        const result =
          await codeTestService.runTestsForSubmission(submissionId);

        return reply.send({
          success: true,
          message: "Tests executed successfully",
          data: result,
        });
      },
    },
  );

  /**
   * GET /code/health
   * Check if code execution service is healthy
   */
  app.get("/code/health", {
    schema: {
      tags: ["Code Testing"],
      summary: "Check code execution service health",
      response: {
        200: { type: "object", properties: { healthy: { type: "boolean" } } },
      },
    },
    handler: async (_request, reply) => {
      const healthy = await codeTestService.healthCheck();
      return reply.send({ healthy });
    },
  });
}
