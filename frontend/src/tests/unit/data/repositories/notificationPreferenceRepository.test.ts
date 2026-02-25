import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiClient } from "@/data/api/apiClient"
import { notificationPreferenceRepository } from "@/data/repositories/notificationPreferenceRepository"
import type { NotificationPreference } from "@/business/models/notification/preference.types"

vi.mock("@/data/api/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

describe("notificationPreferenceRepository", () => {
  const mockPreference: NotificationPreference = {
    id: 1,
    userId: 10,
    notificationType: "ASSIGNMENT_CREATED",
    emailEnabled: true,
    inAppEnabled: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getPreferences", () => {
    it("returns preferences from API response", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          success: true,
          preferences: [mockPreference],
        },
        status: 200,
      })

      const result = await notificationPreferenceRepository.getPreferences()

      expect(apiClient.get).toHaveBeenCalledWith("/notification-preferences")
      expect(result).toEqual([mockPreference])
    })

    it("throws when response data is missing", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: undefined,
        status: 200,
      })

      await expect(
        notificationPreferenceRepository.getPreferences(),
      ).rejects.toThrow("Failed to fetch notification preferences")
    })
  })

  describe("updatePreference", () => {
    it("returns updated preference from API response", async () => {
      const updatedPreference: NotificationPreference = {
        ...mockPreference,
        emailEnabled: false,
      }

      vi.mocked(apiClient.put).mockResolvedValue({
        data: {
          success: true,
          preference: updatedPreference,
        },
        status: 200,
      })

      const result = await notificationPreferenceRepository.updatePreference({
        notificationType: "ASSIGNMENT_CREATED",
        emailEnabled: false,
        inAppEnabled: true,
      })

      expect(apiClient.put).toHaveBeenCalledWith("/notification-preferences", {
        notificationType: "ASSIGNMENT_CREATED",
        emailEnabled: false,
        inAppEnabled: true,
      })
      expect(result).toEqual(updatedPreference)
    })

    it("throws when update response data is missing", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({
        data: undefined,
        status: 200,
      })

      await expect(
        notificationPreferenceRepository.updatePreference({
          notificationType: "DEADLINE_REMINDER",
          emailEnabled: true,
          inAppEnabled: false,
        }),
      ).rejects.toThrow("Failed to update notification preference")
    })
  })
})
