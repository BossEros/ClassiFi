/**
 * IT-004: Teacher Feedback → Student Notification Flow
 *
 * Module: Submission
 * Unit: Teacher Feedback Notification
 * Date Tested: 3/29/26
 * Description: Verify that saving teacher feedback notifies the student via in-app and email.
 * Expected Result: Student receives a "feedback given" in-app notification and email.
 * Actual Result: As Expected.
 * Remarks: Passed
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { container } from "tsyringe"
import { NotificationService } from "../../backend-ts/src/modules/notifications/notification.service.js"
import { SubmissionService } from "../../backend-ts/src/modules/submissions/submission.service.js"
import { createMockAssignment, createMockSubmission } from "../../backend-ts/tests/utils/factories.js"

vi.mock("../../backend-ts/src/shared/transaction.js", () => ({
  withTransaction: vi.fn(async (callback: (ctx: unknown) => Promise<unknown>) => callback({})),
}))

describe("IT-004: Teacher Feedback → Student Notification Flow", () => {
  let submissionService: SubmissionService
  let mockNotificationRepo: any
  let mockEmailService: any
  let mockSubmissionRepo: any
  let mockAssignmentRepo: any

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

    const mockTransactionalNotificationRepo = {
      ...mockNotificationRepo,
      create: vi.fn().mockImplementation(async (data: any) => ({
        id: 1, userId: data.userId, type: data.type, title: data.title,
        message: data.message, metadata: data.metadata, isRead: false, readAt: null, createdAt: new Date(),
      })),
      withContext: vi.fn().mockReturnThis(),
    }

    const notificationService = new NotificationService(
      mockNotificationRepo,
      mockUserRepo as any,
      mockEmailService,
    )

    const savedSubmission = createMockSubmission({
      id: 1, assignmentId: 1, studentId: 10, teacherFeedback: "Great structured approach!",
    })

    const mockTransactionalSubmissionRepo = {
      saveTeacherFeedback: vi.fn().mockResolvedValue(savedSubmission),
    }

    mockSubmissionRepo = {
      getSubmissionById: vi.fn().mockResolvedValue(
        createMockSubmission({ id: 1, assignmentId: 1, studentId: 10 }),
      ),
      withContext: vi.fn().mockReturnValue(mockTransactionalSubmissionRepo),
    }

    mockAssignmentRepo = {
      getAssignmentById: vi.fn().mockResolvedValue(
        createMockAssignment({ id: 1, assignmentName: "Functions Exercise", totalScore: 100 }),
      ),
    }

    mockNotificationRepo.create.mockImplementation(async (data: any) => ({
      id: 1, userId: data.userId, type: data.type, title: data.title,
      message: data.message, metadata: data.metadata, isRead: false, readAt: null, createdAt: new Date(),
    }))

    submissionService = new SubmissionService(
      mockSubmissionRepo,
      mockAssignmentRepo,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      notificationService,
      { scheduleFromSubmission: vi.fn().mockResolvedValue(undefined) } as any,
    )
  })

  afterEach(() => { container.clearInstances() })

  it("notifies student with in-app notification and email when teacher saves feedback", async () => {
    await submissionService.saveTeacherFeedback(1, "Prof. Smith", "Great structured approach!")

    expect(mockNotificationRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 10, type: "SUBMISSION_FEEDBACK_GIVEN" }),
    )
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1)
  })
})
