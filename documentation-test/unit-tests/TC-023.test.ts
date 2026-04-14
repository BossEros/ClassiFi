/**
 * TC-023: Create In-App Notification
 *
 * Module: Notifications
 * Unit: View and Manage Notifications
 * Date Tested: 3/28/26
 * Description: Verify that an in-app notification is created.
 * Expected Result: Notification record is saved to the database.
 * Actual Result: As Expected.
 * Remarks: Passed
 * Suggested Figure Title (Test Pass): TC-023 Unit Test Pass - In-App Notification Created Successfully
 * Suggested Figure Title (System UI): Notifications UI - Notification List with New In-App Notification
 */
import { describe, it, expect, beforeEach, vi } from "vitest"
import { NotificationService } from "../../backend-ts/src/modules/notifications/notification.service.js"
import type { NotificationRepository } from "../../backend-ts/src/modules/notifications/notification.repository.js"
import type { UserRepository } from "../../backend-ts/src/modules/users/user.repository.js"
import type { IEmailService } from "../../backend-ts/src/services/interfaces/email.interface.js"
import type { Notification } from "../../backend-ts/src/models/index.js"

describe("TC-023: Create In-App Notification", () => {
  let service: NotificationService
  let mockNotificationRepo: NotificationRepository
  let mockUserRepo: UserRepository
  let mockEmailService: IEmailService

  beforeEach(() => {
    mockNotificationRepo = {
      create: vi.fn(), findById: vi.fn(), findByUserId: vi.fn(),
      findRecentUnread: vi.fn(), countByUserId: vi.fn(),
      countUnreadByUserId: vi.fn(), markAsRead: vi.fn(),
      markAllAsReadByUserId: vi.fn(), delete: vi.fn(),
      withContext: vi.fn().mockReturnThis(),
    } as any

    mockUserRepo = {
      getUserById: vi.fn().mockResolvedValue({
        id: 1, email: "student@example.com",
        emailNotificationsEnabled: true, inAppNotificationsEnabled: true,
      }),
      withContext: vi.fn().mockReturnThis(),
    } as any

    mockEmailService = { sendEmail: vi.fn().mockResolvedValue(undefined) }

    service = new NotificationService(mockNotificationRepo, mockUserRepo, mockEmailService)
  })

  it("creates an in-app notification when the channel is enabled", async () => {
    const mockNotification: Notification = {
      id: 1, userId: 1, type: "ASSIGNMENT_CREATED",
      title: "CS101: New Assignment Posted",
      message: 'Your teacher has posted a new assignment "Test Assignment" in CS101, due on 2024-12-31.',
      metadata: { assignmentId: 1, assignmentTitle: "Test Assignment", className: "CS101", classId: 1, dueDate: "2024-12-31", assignmentUrl: "http://example.com" },
      isRead: false, readAt: null, createdAt: new Date(),
    }

    vi.mocked(mockNotificationRepo.create).mockResolvedValue(mockNotification)

    const result = await service.createNotification(1, "ASSIGNMENT_CREATED", {
      assignmentTitle: "Test Assignment", className: "CS101",
      dueDate: "2024-12-31", assignmentUrl: "http://example.com",
      assignmentId: 1, classId: 1,
    })

    expect(result).toEqual(mockNotification)
    expect(mockNotificationRepo.create).toHaveBeenCalledWith({
      userId: 1, type: "ASSIGNMENT_CREATED",
      title: "CS101: New Assignment Posted",
      message: expect.stringContaining("Test Assignment"),
      metadata: expect.objectContaining({ assignmentId: 1 }),
    })
  })

  it("returns null when both channels are disabled", async () => {
    vi.mocked(mockUserRepo.getUserById).mockResolvedValue({
      id: 1, email: "student@example.com",
      emailNotificationsEnabled: false, inAppNotificationsEnabled: false,
    } as any)

    const result = await service.createNotification(1, "ASSIGNMENT_CREATED", {
      assignmentTitle: "Test", className: "CS101",
      dueDate: "2024-12-31", assignmentUrl: "http://example.com",
      assignmentId: 1, classId: 1,
    })

    expect(result).toBeNull()
    expect(mockNotificationRepo.create).not.toHaveBeenCalled()
  })
})
