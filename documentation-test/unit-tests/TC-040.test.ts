/**
 * TC-040: Delete Notification
 *
 * Module: Notifications
 * Unit: View and Manage Notifications
 * Date Tested: 4/11/26
 * Description: Verify that a user can delete one of their own notifications.
 * Expected Result: The notification is removed from the user's notification list.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-040 Unit Test Pass - Notification Deleted Successfully
 * Suggested Figure Title (System UI): Notifications UI - Delete Notification Action
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NotificationService } from "../../backend-ts/src/modules/notifications/notification.service.js"
import { NotFoundError, ForbiddenError } from "../../backend-ts/src/shared/errors.js"

describe("TC-040: Delete Notification", () => {
  let notificationService: NotificationService
  let mockNotificationRepo: any
  let mockUserRepo: any
  let mockEmailService: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockNotificationRepo = {
      create: vi.fn(), findById: vi.fn(), findByUserId: vi.fn(),
      findRecentUnread: vi.fn(), countByUserId: vi.fn(),
      countUnreadByUserId: vi.fn(), markAsRead: vi.fn(),
      markAllAsReadByUserId: vi.fn(), delete: vi.fn(),
      withContext: vi.fn().mockReturnThis(),
    }
    mockUserRepo = {
      getUserById: vi.fn(),
      withContext: vi.fn().mockReturnThis(),
    }
    mockEmailService = { sendEmail: vi.fn().mockResolvedValue(undefined) }

    notificationService = new NotificationService(mockNotificationRepo, mockUserRepo, mockEmailService)
  })

  afterEach(() => { vi.clearAllMocks() })

  it("should delete the notification when it belongs to the requesting user", async () => {
    const notification = {
      id: 5, userId: 10, type: "ASSIGNMENT_CREATED",
      title: "New Assignment", message: "Assignment posted",
      isRead: false, createdAt: new Date(),
    }

    mockNotificationRepo.findById.mockResolvedValue(notification)
    mockNotificationRepo.delete.mockResolvedValue(undefined)

    await expect(notificationService.deleteNotification(5, 10)).resolves.toBeUndefined()
    expect(mockNotificationRepo.delete).toHaveBeenCalledWith(5)
  })

  it("should throw NotFoundError when the notification does not exist", async () => {
    mockNotificationRepo.findById.mockResolvedValue(undefined)

    await expect(notificationService.deleteNotification(999, 10)).rejects.toThrow(NotFoundError)
  })

  it("should throw ForbiddenError when the notification belongs to a different user", async () => {
    const notification = {
      id: 5, userId: 99, type: "ASSIGNMENT_CREATED",
      title: "New Assignment", message: "Assignment posted",
      isRead: false, createdAt: new Date(),
    }

    mockNotificationRepo.findById.mockResolvedValue(notification)

    await expect(notificationService.deleteNotification(5, 10)).rejects.toThrow(ForbiddenError)
  })
})
