/**
 * IT-011: Grade Override Triggers Notification And Email
 *
 * Module: Gradebook
 * Unit: Override grade
 * Date Tested: 4/13/26
 * Description: Verify that overriding a grade triggers notification and email.
 * Expected Result: The student receives a notification and email.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-011 Integration Test Pass - Grade Override Triggers Notification And Email
 * Suggested Figure Title (System UI): Gradebook UI - Student receives Assignment Grade Override Notification
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { container } from "tsyringe"
import { NotificationService } from "../../backend-ts/src/modules/notifications/notification.service.js"
import { GradebookService } from "../../backend-ts/src/modules/gradebook/gradebook.service.js"

vi.mock("../../backend-ts/src/shared/transaction.js", () => ({
  withTransaction: vi.fn(async (callback: (ctx: unknown) => Promise<unknown>) =>
    callback({}),
  ),
}))

describe("IT-011: Grade Override Triggers Notification And Email", () => {
  let gradebookService: GradebookService
  let mockNotificationRepo: any
  let mockEmailService: any
  let mockSubmissionRepo: any
  let mockAssignmentRepo: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockNotificationRepo = {
      create: vi.fn(),
      findByUserId: vi.fn(),
      countByUserId: vi.fn(),
      countUnreadByUserId: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsReadByUserId: vi.fn(),
      delete: vi.fn(),
      findById: vi.fn(),
      withContext: vi.fn().mockReturnThis(),
    }
    const mockUserRepo = {
      getUserById: vi.fn((userId: number) =>
        Promise.resolve({
          id: userId,
          email: `user${userId}@test.com`,
          emailNotificationsEnabled: true,
          inAppNotificationsEnabled: true,
        }),
      ),
      withContext: vi.fn().mockReturnThis(),
    }
    mockEmailService = { sendEmail: vi.fn().mockResolvedValue(undefined) }
    mockSubmissionRepo = {
      getSubmissionById: vi.fn(),
      setGradeOverride: vi.fn(),
      updateGrade: vi.fn(),
      removeGradeOverride: vi.fn(),
      withContext: vi.fn().mockReturnThis(),
    }
    mockAssignmentRepo = { getAssignmentById: vi.fn() }

    const notificationService = new NotificationService(
      mockNotificationRepo,
      mockUserRepo as any,
      mockEmailService,
    )

    gradebookService = new GradebookService(
      {} as any,
      mockSubmissionRepo,
      mockAssignmentRepo,
      {} as any,
      {} as any,
      notificationService,
      { getMaxSimilarityScoresBySubmissionIds: vi.fn().mockResolvedValue(new Map()) } as any,
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

  it("should create a notification and send an email after overriding a grade", async () => {
    mockSubmissionRepo.getSubmissionById.mockResolvedValue({
      id: 1,
      assignmentId: 1,
      studentId: 10,
    })
    mockAssignmentRepo.getAssignmentById.mockResolvedValue({
      id: 1,
      assignmentName: "Test Assignment",
      totalScore: 100,
    })
    mockSubmissionRepo.setGradeOverride.mockResolvedValue(undefined)

    await gradebookService.overrideGrade(1, 85, "Great job")

    expect(mockNotificationRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 10, type: "SUBMISSION_GRADED" }),
    )
    expect(mockEmailService.sendEmail).toHaveBeenCalledTimes(1)
  })
})
