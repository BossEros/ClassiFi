/**
 * IT-021: Teacher Sets Grade Successfully
 *
 * Module: Gradebook
 * Unit: Set grade
 * Date Tested: 4/13/26
 * Description: Verify that a teacher can set a manual grade.
 * Expected Result: The manual grade is saved successfully.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): IT-021 Integration Test Pass - Teacher Sets Grade Successfully
 * Suggested Figure Title (System UI): Gradebook UI - Assignment View with Set Grade Success Notification
 */ 

import { beforeEach, describe, expect, it, vi } from "vitest"
import { GradebookService } from "../../backend-ts/src/modules/gradebook/gradebook.service.js"
import { NotificationService } from "../../backend-ts/src/modules/notifications/notification.service.js"

vi.mock("../../backend-ts/src/shared/transaction.js", () => ({
  withTransaction: vi.fn(async (callback: (context: unknown) => Promise<unknown>) =>
    callback({}),
  ),
}))

describe("IT-021: Teacher Sets Grade Successfully", () => {
  let gradebookService: GradebookService
  let mockSubmissionRepo: any
  let mockAssignmentRepo: any
  let mockNotificationRepo: any
  let mockUserRepo: any
  let mockEmailService: any

  beforeEach(() => {
    mockSubmissionRepo = {
      getSubmissionById: vi.fn(),
      setManualGrade: vi.fn(),
      withContext: vi.fn().mockReturnThis(),
    }

    mockAssignmentRepo = {
      getAssignmentById: vi.fn(),
    }

    mockNotificationRepo = {
      create: vi.fn().mockResolvedValue({ id: 1 }),
      withContext: vi.fn().mockReturnThis(),
    }
    mockUserRepo = {
      getUserById: vi.fn().mockResolvedValue({
        id: 5,
        email: "student@test.com",
        emailNotificationsEnabled: true,
        inAppNotificationsEnabled: true,
      }),
      withContext: vi.fn().mockReturnThis(),
    }
    mockEmailService = {
      sendEmail: vi.fn().mockResolvedValue(undefined),
    }

    const notificationService = new NotificationService(
      mockNotificationRepo,
      mockUserRepo,
      mockEmailService,
    )

    gradebookService = new GradebookService(
      {} as any,
      mockSubmissionRepo,
      mockAssignmentRepo,
      {} as any,
      {} as any,
      notificationService,
      {} as any,
      { scheduleFromSubmission: vi.fn().mockResolvedValue(undefined) } as any,
    )
  })

  it("should save the manual grade for the submission", async () => {
    mockSubmissionRepo.getSubmissionById.mockResolvedValue({
      id: 1,
      assignmentId: 10,
      studentId: 5,
      penaltyApplied: 0,
    })
    mockAssignmentRepo.getAssignmentById.mockResolvedValue({
      id: 10,
      assignmentName: "Quiz 1",
      totalScore: 100,
    })

    await gradebookService.setManualGrade(1, 92)

    expect(mockSubmissionRepo.setManualGrade).toHaveBeenCalledWith(1, 92, 92)
  })
})
