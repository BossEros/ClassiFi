/**
 * TC-026: Notification Preference
 *
 * Module: Notifications
 * Unit: Manage Notification Preferences
 * Date Tested: 3/29/26
 * Description: Verify that notification delivery follows user notification settings.
 * Expected Result: Notifications are sent only through channels enabled by the user.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-026 Unit Test Pass - Notification Preferences Applied Correctly
 * Suggested Figure Title (System UI): User Settings UI - Notification Preference Controls
 */
import { describe, it, expect, beforeEach, vi } from "vitest"
import { NotificationService } from "../../backend-ts/src/modules/notifications/notification.service.js"

describe("TC-026: Notification Preference", () => {
  let notificationService: NotificationService
  let mockNotificationRepo: any
  let mockUserRepo: any
  let mockEmailService: any

  const payload = {
    assignmentId: 1,
    assignmentTitle: "Functions Exercise",
    className: "Programming 101",
    classId: 1,
    dueDate: "12/31/2026",
    assignmentUrl: "http://localhost:5173/dashboard/assignments/1",
  }

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

    mockUserRepo = {
      getUserById: vi.fn(),
      withContext: vi.fn().mockReturnThis(),
    }

    mockEmailService = {
      sendEmail: vi.fn().mockResolvedValue(undefined),
    }

    notificationService = new NotificationService(
      mockNotificationRepo,
      mockUserRepo,
      mockEmailService,
    )
  })

  it("creates in-app notification but skips email when email notifications are disabled", async () => {
    mockUserRepo.getUserById.mockResolvedValue({
      id: 1,
      email: "student@test.com",
      emailNotificationsEnabled: false,
      inAppNotificationsEnabled: true,
    })
    mockNotificationRepo.create.mockResolvedValue({ id: 1 })

    await notificationService.createNotification(1, "ASSIGNMENT_CREATED", payload)
    await notificationService.sendEmailNotificationIfEnabled(1, "ASSIGNMENT_CREATED", payload)

    expect(mockNotificationRepo.create).toHaveBeenCalledTimes(1)
    expect(mockEmailService.sendEmail).not.toHaveBeenCalled()
  })

  it("skips all notifications when user disables both channels", async () => {
    mockUserRepo.getUserById.mockResolvedValue({
      id: 1,
      email: "student@test.com",
      emailNotificationsEnabled: false,
      inAppNotificationsEnabled: false,
    })

    const result = await notificationService.createNotification(1, "ASSIGNMENT_CREATED", payload)
    await notificationService.sendEmailNotificationIfEnabled(1, "ASSIGNMENT_CREATED", payload)

    expect(result).toBeNull()
    expect(mockNotificationRepo.create).not.toHaveBeenCalled()
    expect(mockEmailService.sendEmail).not.toHaveBeenCalled()
  })
})
