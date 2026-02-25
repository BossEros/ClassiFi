import { beforeEach, describe, expect, it, vi } from "vitest"
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { submissionRoutes } from "../../src/modules/submissions/submission.controller.js"
import { DI_TOKENS } from "../../src/shared/di/tokens.js"

vi.mock("tsyringe", () => ({
  container: {
    resolve: vi.fn(),
  },
  injectable: () => () => {},
  inject: () => () => {},
}))

vi.mock("../../src/api/plugins/zod-validation.js", () => ({
  validateParams: () => async () => {},
  validateBody: () => async () => {},
  validateQuery: () => async () => {},
}))

describe("Submission Controller", () => {
  let mockSubmissionService: Record<string, ReturnType<typeof vi.fn>>
  let mockCodeTestService: Record<string, ReturnType<typeof vi.fn>>
  let mockApp: FastifyInstance
  let mockRequest: any
  let mockReply: Partial<FastifyReply>

  beforeEach(async () => {
    mockSubmissionService = {
      submitAssignment: vi.fn(),
      getSubmissionHistory: vi.fn(),
      getAssignmentSubmissions: vi.fn(),
      getStudentSubmissions: vi.fn(),
      getSubmissionDownloadUrl: vi.fn(),
      getSubmissionContent: vi.fn(),
    }

    mockCodeTestService = {
      getTestResults: vi.fn(),
      runTestsForSubmission: vi.fn(),
    }

    const { container } = await import("tsyringe")
    vi.mocked(container.resolve).mockImplementation((token: string) => {
      if (token === DI_TOKENS.services.submission) {
        return mockSubmissionService as never
      }

      if (token === DI_TOKENS.services.codeTest) {
        return mockCodeTestService as never
      }

      throw new Error(`Unexpected resolve token: ${token}`)
    })

    mockReply = {
      send: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
    }

    mockRequest = {
      user: { id: 1, email: "student@test.com", role: "student" },
      validatedParams: { submissionId: 10 },
      validatedQuery: { includeHiddenDetails: true },
    }

    mockApp = {
      post: vi.fn(),
      get: vi.fn(),
    } as unknown as FastifyInstance
  })

  const getTestResultsHandler = async () => {
    await submissionRoutes(mockApp)

    const routeCall = vi
      .mocked(mockApp.get)
      .mock.calls.find((call) => call[0] === "/:submissionId/test-results")

    if (!routeCall) {
      throw new Error("Test-results route was not registered")
    }

    return (routeCall[1] as { handler: (req: FastifyRequest, rep: FastifyReply) => Promise<void> }).handler
  }

  it("forces includeHiddenDetails to false for student users", async () => {
    vi.mocked(mockCodeTestService.getTestResults).mockResolvedValue({
      submissionId: 10,
      passed: 1,
      total: 1,
      percentage: 100,
      results: [],
    })

    const handler = await getTestResultsHandler()

    await handler(mockRequest as FastifyRequest, mockReply as FastifyReply)

    expect(mockCodeTestService.getTestResults).toHaveBeenCalledWith(10, false)
  })

  it("allows includeHiddenDetails=true for teacher users", async () => {
    vi.mocked(mockCodeTestService.getTestResults).mockResolvedValue({
      submissionId: 10,
      passed: 1,
      total: 1,
      percentage: 100,
      results: [],
    })
    mockRequest.user.role = "teacher"

    const handler = await getTestResultsHandler()

    await handler(mockRequest as FastifyRequest, mockReply as FastifyReply)

    expect(mockCodeTestService.getTestResults).toHaveBeenCalledWith(10, true)
  })
})
