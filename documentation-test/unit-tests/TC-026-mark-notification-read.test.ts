/**
 * TC-026: Mark Notification as Read
 *
 * Module: Notification
 * Unit: Mark as Read
 * Date Tested: 3/28/26
 * Description: Verify that a notification can be marked as read.
 * Expected Result: Notification status is updated to read.
 * Actual Result: As Expected.
 * Remarks: Passed
 */
import { describe, it, expect, beforeEach, vi } from "vitest"
import { NotificationService } from "../../backend-ts/src/modules/notifications/notification.service.js"
import type { Notification } from "../../backend-ts/src/models/index.js"
import { NotFoundError, ForbiddenError } from "../../backend-ts/src/shared/errors.js"

describe("TC-026: Mark Notification as Read", () => {
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

  it("marks a notification as read", async () => {
    const mockNotification: Notification = {
      id: 1, userId: 1, type: "ASSIGNMENT_CREATED",
      title: "Test", message: "Message",
      metadata: { assignmentId: 1 },
      isRead: false, readAt: null, createdAt: new Date(),
    }

    vi.mocked(mockNotificationRepo.findById).mockResolvedValue(mockNotification)
    vi.mocked(mockNotificationRepo.markAsRead).mockResolvedValue(undefined)

    await service.markAsRead(1, 1)

    expect(mockNotificationRepo.markAsRead).toHaveBeenCalledWith(1)
  })

  it("throws NotFoundError when notification does not exist", async () => {
    vi.mocked(mockNotificationRepo.findById).mockResolvedValue(undefined)

    const markAsReadPromise = service.markAsRead(1, 1)

    await expect(markAsReadPromise).rejects.toThrow(NotFoundError)
    await expect(markAsReadPromise).rejects.toThrow("Notification not found")
  })

  it("throws ForbiddenError when user does not own the notification", async () => {
    vi.mocked(mockNotificationRepo.findById).mockResolvedValue({ id: 1, userId: 2 } as any)

    const markAsReadPromise = service.markAsRead(1, 1)

    await expect(markAsReadPromise).rejects.toThrow(ForbiddenError)
    await expect(markAsReadPromise).rejects.toThrow("Not authorized")
  })
})
