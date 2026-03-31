/**
 * IT-003: Code Test Execution → Submission Graded Notification Flow
 *
 * Module: Code Testing
 * Unit: Submission Graded Notification
 * Date Tested: 3/29/26
 * Description: Verify that running tests for a submission grades the student and sends a notification.
 * Expected Result: Student receives a "submission graded" in-app notification and email.
 * Actual Result: As Expected.
 * Remarks: Passed
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { container } from "tsyringe"
import { NotificationService } from "../../backend-ts/src/modules/notifications/notification.service.js"
import { CodeTestService } from "../../backend-ts/src/modules/test-cases/code-test.service.js"
import { createMockAssignment, createMockSubmission } from "../../backend-ts/tests/utils/factories.js"

vi.mock("../../backend-ts/src/shared/transaction.js", () => ({
  withTransaction: vi.fn(async (callback: (ctx: unknown) => Promise<unknown>) => callback({})),
}))

describe("IT-003: Code Test Execution → Submission Graded Notification Flow", () => {
  let codeTestService: CodeTestService
  let mockNotificationRepo: any
  let mockEmailService: any
  let mockExecutor: any
  let mockTestCaseRepo: any
  let mockTestResultRepo: any
  let mockSubmissionRepo: any
  let mockAssignmentRepo: any
  let mockStorageService: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockNotificationRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
      countByUserId: vi.fn(),
      countUnreadByUserId: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsReadByUserId: vi.fn(),
      delete: vi.fn(),
      withContext: vi.fn().mockReturnThis(),
    }

    const mockUserRepo = {
      getUserById: vi.fn().mockResolvedValue({
        id: 10,
        email: "student@test.com",
        emailNotificationsEnabled: true,
        inAppNotificationsEnabled: true,
      }),
      withContext: vi.fn().mockReturnThis(),
    }

    mockEmailService = { sendEmail: vi.fn().mockResolvedValue(undefined) }

    mockExecutor = {
      executeBatch: vi.fn().mockResolvedValue([
        { stdout: "4", stderr: "", exitCode: 0, executionTimeMs: 10, memoryUsedKb: 512 },
        { stdout: "9", stderr: "", exitCode: 0, executionTimeMs: 10, memoryUsedKb: 512 },
      ]),
    }

    mockTestCaseRepo = {
      getByAssignmentId: vi.fn().mockResolvedValue([
        { id: 1, assignmentId: 1, name: "Test 1", input: "2", expectedOutput: "4", isHidden: false, timeLimit: 2 },
        { id: 2, assignmentId: 1, name: "Test 2", input: "3", expectedOutput: "9", isHidden: false, timeLimit: 2 },
      ]),
    }

    mockTestResultRepo = {
      deleteBySubmissionId: vi.fn().mockResolvedValue(undefined),
      createMany: vi.fn().mockResolvedValue(undefined),
      calculateScore: vi.fn().mockResolvedValue({ passed: 2, total: 2, percentage: 100 }),
    }

    const mockTransactionalSubmissionRepo = { updateGrade: vi.fn().mockResolvedValue(undefined) }
    mockSubmissionRepo = {
      getSubmissionById: vi.fn().mockResolvedValue(
        createMockSubmission({ id: 1, assignmentId: 1, studentId: 10, filePath: "submissions/1/code.py" }),
      ),
      withContext: vi.fn().mockReturnValue(mockTransactionalSubmissionRepo),
    }

    mockAssignmentRepo = {
      getAssignmentById: vi.fn().mockResolvedValue(
        createMockAssignment({ id: 1, assignmentName: "Functions Exercise", totalScore: 100 }),
      ),
    }

    mockStorageService = {
      download: vi.fn().mockResolvedValue("def square(n): return n * n"),
    }

    mockNotificationRepo.create.mockImplementation(async (data: any) => ({
      id: 1, userId: data.userId, type: data.type, title: data.title,
      message: data.message, metadata: data.metadata, isRead: false, readAt: null, createdAt: new Date(),
    }))

    const notificationService = new NotificationService(mockNotificationRepo, mockUserRepo as any, mockEmailService)

    codeTestService = new CodeTestService(
      mockExecutor,
      mockTestCaseRepo,
      mockTestResultRepo,
      mockSubmissionRepo,
      mockAssignmentRepo,
      mockStorageService,
      notificationService,
    )
  })

  afterEach(() => { container.clearInstances() })

  it("grades the submission and notifies the student when tests pass", async () => {
    const result = await codeTestService.runTestsForSubmission(1)

    expect(result.passed).toBe(2)
    expect(result.total).toBe(2)
    expect(mockNotificationRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 10, type: "SUBMISSION_GRADED" }),
    )
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1)
  })
})
