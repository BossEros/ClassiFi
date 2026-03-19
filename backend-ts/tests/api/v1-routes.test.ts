import { beforeEach, describe, expect, it, vi } from "vitest"
import type { FastifyInstance } from "fastify"
import { apiV1Routes } from "../../src/api/routes/v1/index.js"

vi.mock("../../src/modules/auth/index.js", () => ({
  authRoutes: vi.fn(),
}))

vi.mock("../../src/modules/classes/index.js", () => ({
  classRoutes: vi.fn(),
}))

vi.mock("../../src/modules/assignments/index.js", () => ({
  assignmentRoutes: vi.fn(),
}))

vi.mock("../../src/modules/submissions/index.js", () => ({
  submissionRoutes: vi.fn(),
}))

vi.mock("../../src/modules/dashboard/index.js", () => ({
  studentDashboardRoutes: vi.fn(),
  teacherDashboardRoutes: vi.fn(),
}))

vi.mock("../../src/modules/plagiarism/index.js", () => ({
  plagiarismRoutes: vi.fn(),
}))

vi.mock("../../src/modules/users/index.js", () => ({
  userRoutes: vi.fn(),
}))

vi.mock("../../src/modules/admin/index.js", () => ({
  adminRoutes: vi.fn(),
}))

vi.mock("../../src/modules/test-cases/index.js", () => ({
  testCaseRoutes: vi.fn(),
  codeTestRoutes: vi.fn(),
}))

vi.mock("../../src/modules/gradebook/index.js", () => ({
  gradebookRoutes: vi.fn(),
}))

vi.mock("../../src/modules/modules/index.js", () => ({
  moduleClassRoutes: vi.fn(),
  moduleRoutes: vi.fn(),
}))

vi.mock("../../src/modules/notifications/index.js", () => ({
  notificationRoutes: vi.fn(),
}))

vi.mock("../../src/api/middlewares/auth.middleware.js", () => ({
  authMiddleware: vi.fn(),
}))

describe("API v1 route registration", () => {
  let mockProtectedApp: FastifyInstance
  let mockRootApp: FastifyInstance

  beforeEach(() => {
    mockProtectedApp = {
      addHook: vi.fn(),
      register: vi.fn(async () => {}),
    } as unknown as FastifyInstance

    mockRootApp = {
      register: vi.fn(async (routePlugin: unknown, options?: { prefix?: string }) => {
        if (typeof routePlugin === "function" && !options?.prefix) {
          await routePlugin(mockProtectedApp)
        }
      }),
    } as unknown as FastifyInstance
  })

  it("registers test case CRUD routes under /test-cases and code routes under /code", async () => {
    const { authRoutes } = await import("../../src/modules/auth/index.js")
    const { testCaseRoutes, codeTestRoutes } = await import(
      "../../src/modules/test-cases/index.js"
    )

    await apiV1Routes(mockRootApp)

    expect(vi.mocked(mockRootApp.register)).toHaveBeenCalledWith(authRoutes, {
      prefix: "/auth",
    })

    expect(vi.mocked(mockProtectedApp.register)).toHaveBeenCalledWith(
      testCaseRoutes,
      { prefix: "/test-cases" },
    )
    expect(vi.mocked(mockProtectedApp.register)).toHaveBeenCalledWith(
      codeTestRoutes,
      { prefix: "/code" },
    )
  })
})
