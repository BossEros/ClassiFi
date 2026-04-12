/**
 * TC-025: Send Email Notification
 *
 * Module: Notifications
 * Unit: View and Manage Notifications
 * Date Tested: 3/28/26
 * Description: Verify that an email notification is sent to a user.
 * Expected Result: Email is sent to the user.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-025 Unit Test Pass - Email Notification Sent Successfully
 * Suggested Figure Title (System UI): Notifications UI - Email Notification Delivery Scenario
 */
import { describe, it, expect, beforeEach, vi } from "vitest"
import { NotificationService } from "../../backend-ts/src/modules/notifications/notification.service.js"

describe("TC-025: Send Email Notification", () => {
  let service: NotificationService
  let mockNotificationRepo: any
  let mockUserRepo: any
  let mockEmailService: any

  beforeEach(() => {
    mockNotificationRepo = {
      create: vi.fn(), findById: vi.fn(), findByUserId: vi.fn(),
      findRecentUnread: vi.fn(), countByUserId: vi.fn(),
      countUnreadByUserId: vi.fn(), markAsRead: vi.fn(),
      markAllAsReadByUserId: vi.fn(), delete: vi.fn(),
      withContext: vi.fn().mockReturnThis(),
    }
    mockUserRepo = {
      getUserById: vi.fn().mockResolvedValue({
        id: 1, email: "student@example.com",
        emailNotificationsEnabled: true, inAppNotificationsEnabled: true,
      }),
      withContext: vi.fn().mockReturnThis(),
    }
    mockEmailService = { sendEmail: vi.fn().mockResolvedValue(undefined) }

    service = new NotificationService(mockNotificationRepo, mockUserRepo, mockEmailService)
  })

  it("sends email when the email channel is enabled", async () => {
    await service.sendEmailNotificationIfEnabled(1, "ASSIGNMENT_CREATED", {
      assignmentTitle: "Test Assignment", className: "CS101",
      dueDate: "2024-12-31", assignmentUrl: "http://example.com",
      assignmentId: 1, classId: 1,
    })

    expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "student@example.com",
        subject: "CS101: New Assignment Posted",
      }),
    )
  })

  it("does nothing when email is disabled", async () => {
    vi.mocked(mockUserRepo.getUserById).mockResolvedValue({
      id: 1, email: "student@example.com",
      emailNotificationsEnabled: false, inAppNotificationsEnabled: true,
    } as any)

    await service.sendEmailNotificationIfEnabled(1, "ASSIGNMENT_CREATED", {
      assignmentTitle: "Test Assignment", className: "CS101",
      dueDate: "2024-12-31", assignmentUrl: "http://example.com",
      assignmentId: 1, classId: 1,
    })

    expect(mockEmailService.sendEmail).not.toHaveBeenCalled()
  })
})
