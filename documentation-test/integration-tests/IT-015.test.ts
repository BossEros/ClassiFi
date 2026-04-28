/**
 * IT-015: Test Execution Grades Submission And Notifies Student
 *
 * Module: Code Submission
 * Unit: Run tests
 * Date Tested: 4/13/26
 * Description: Verify that running tests grades the submission and notifies the student.
 * Expected Result: The student receives a grade notification and email.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-015 Integration Test Pass - Test Execution Grades Submission And Notifies Student
 * Suggested Figure Title (System UI): Code Submission UI - Student receives Assignment Graded Notification
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { container } from "tsyringe"
import { NotificationService } from "../../backend-ts/src/modules/notifications/notification.service.js"
import { CodeTestService } from "../../backend-ts/src/modules/test-cases/code-test.service.js"
import { createMockAssignment, createMockSubmission } from "../../backend-ts/tests/utils/factories.js"

vi.mock("../../backend-ts/src/shared/transaction.js", () => ({
  withTransaction: vi.fn(async (callback: (ctx: unknown) => Promise<unknown>) =>
    callback({}),
  ),
}))
vi.mock("../../backend-ts/src/shared/database.js", () => ({
  db: {
    transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({}),
    ),
  },
}))

describe("IT-015: Test Execution Grades Submission And Notifies Student", () => {
  let codeTestService: CodeTestService
  let mockNotificationRepo: any
  let mockEmailService: any

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

    const notificationService = new NotificationService(
      mockNotificationRepo,
      mockUserRepo as any,
      mockEmailService,
    )

    codeTestService = new CodeTestService(
      {
        executeBatch: vi.fn().mockResolvedValue([
          {
            stdout: "4",
            stderr: "",
            exitCode: 0,
            executionTimeMs: 10,
            memoryUsedKb: 512,
          },
          {
            stdout: "9",
            stderr: "",
            exitCode: 0,
            executionTimeMs: 10,
            memoryUsedKb: 512,
          },
        ]),
      } as any,
      {
        getByAssignmentId: vi.fn().mockResolvedValue([
          {
            id: 1,
            assignmentId: 1,
            name: "Test 1",
            input: "2",
            expectedOutput: "4",
            isHidden: false,
            timeLimit: 2,
          },
          {
            id: 2,
            assignmentId: 1,
            name: "Test 2",
            input: "3",
            expectedOutput: "9",
            isHidden: false,
            timeLimit: 2,
          },
        ]),
      } as any,
      {
        deleteBySubmissionId: vi.fn().mockResolvedValue(undefined),
        createMany: vi.fn().mockResolvedValue(undefined),
        calculateScore: vi.fn().mockResolvedValue({
          passed: 2,
          total: 2,
          percentage: 100,
        }),
      } as any,
      {
        getSubmissionById: vi.fn().mockResolvedValue(
          createMockSubmission({
            id: 1,
            assignmentId: 1,
            studentId: 10,
            filePath: "submissions/1/code.py",
          }),
        ),
        withContext: vi.fn().mockReturnValue({
          updateGrade: vi.fn().mockResolvedValue(undefined),
          updateOriginalGrade: vi.fn().mockResolvedValue(undefined),
        }),
      } as any,
      {
        getAssignmentById: vi.fn().mockResolvedValue(
          createMockAssignment({
            id: 1,
            assignmentName: "Functions Exercise",
            totalScore: 100,
          }),
        ),
      } as any,
      {
        download: vi.fn().mockResolvedValue("def square(n): return n * n"),
      } as any,
      notificationService,
    )

    mockNotificationRepo.create.mockImplementation(async (data: any) => ({
      id: 1,
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      metadata: data.metadata,
      isRead: false,
      readAt: null,
      createdAt: new Date(),
    }))
  })

  afterEach(() => {
    container.clearInstances()
  })

  it("should notify the student after grading the submission", async () => {
    const result = await codeTestService.runTestsForSubmission(1)

    expect(result.passed).toBe(2)
    expect(mockNotificationRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 10, type: "SUBMISSION_GRADED" }),
    )
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1)
  })
})

