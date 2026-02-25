import { beforeEach, describe, expect, it, vi } from "vitest"
import { notificationPreferenceService } from "@/business/services/notificationPreferenceService"
import { notificationPreferenceRepository } from "@/data/repositories/notificationPreferenceRepository"
import type {
  NotificationPreference,
  NotificationType,
} from "@/business/models/notification/preference.types"

vi.mock("@/data/repositories/notificationPreferenceRepository", () => ({
  notificationPreferenceRepository: {
    getPreferences: vi.fn(),
    updatePreference: vi.fn(),
  },
}))

describe("notificationPreferenceService", () => {
  const mockPreference: NotificationPreference = {
    id: 1,
    userId: 10,
    notificationType: "ASSIGNMENT_CREATED",
    emailEnabled: true,
    inAppEnabled: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: null,
  }

  const notificationTypes: NotificationType[] = [
    "ASSIGNMENT_CREATED",
    "SUBMISSION_GRADED",
    "CLASS_ANNOUNCEMENT",
    "DEADLINE_REMINDER",
    "ENROLLMENT_CONFIRMED",
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("gets notification preferences from repository", async () => {
    vi.mocked(notificationPreferenceRepository.getPreferences).mockResolvedValue([
      mockPreference,
    ])

    const result = await notificationPreferenceService.getPreferences()

    expect(notificationPreferenceRepository.getPreferences).toHaveBeenCalledTimes(1)
    expect(result).toEqual([mockPreference])
  })

  it("updates a notification preference through repository", async () => {
    const updatedPreference: NotificationPreference = {
      ...mockPreference,
      emailEnabled: false,
      inAppEnabled: true,
    }

    vi.mocked(notificationPreferenceRepository.updatePreference).mockResolvedValue(
      updatedPreference,
    )

    const result = await notificationPreferenceService.updatePreference(
      "ASSIGNMENT_CREATED",
      false,
      true,
    )

    expect(notificationPreferenceRepository.updatePreference).toHaveBeenCalledWith({
      notificationType: "ASSIGNMENT_CREATED",
      emailEnabled: false,
      inAppEnabled: true,
    })
    expect(result).toEqual(updatedPreference)
  })

  it.each(notificationTypes)(
    "returns a label for notification type %s",
    (notificationType) => {
      const label =
        notificationPreferenceService.getNotificationTypeLabel(notificationType)

      expect(label.length).toBeGreaterThan(0)
    },
  )

  it.each(notificationTypes)(
    "returns a description for notification type %s",
    (notificationType) => {
      const description =
        notificationPreferenceService.getNotificationTypeDescription(
          notificationType,
        )

      expect(description.length).toBeGreaterThan(0)
    },
  )
})
