import { beforeEach, describe, expect, it, vi } from "vitest"
import type { MockedObject } from "vitest"
import { NotificationPreferenceService } from "../../src/modules/notifications/notification-preference.service.js"
import type { NotificationPreferenceRepository } from "../../src/modules/notifications/notification-preference.repository.js"
import { NOTIFICATION_TYPES } from "../../src/modules/notifications/notification.types.js"
import type { NotificationType } from "../../src/modules/notifications/notification.schema.js"

describe("NotificationPreferenceService", () => {
  let service: NotificationPreferenceService
  let preferenceRepositoryMock: Partial<
    MockedObject<NotificationPreferenceRepository>
  >

  beforeEach(() => {
    preferenceRepositoryMock = {
      findByUserAndType: vi.fn(),
      findByUserId: vi.fn(),
      upsert: vi.fn(),
    } as any

    service = new NotificationPreferenceService(
      preferenceRepositoryMock as NotificationPreferenceRepository,
    )
  })

  describe("getPreference", () => {
    it("returns existing preference when found", async () => {
      const existingPreference = {
        id: 10,
        userId: 1,
        notificationType: "ASSIGNMENT_CREATED" as NotificationType,
        emailEnabled: false,
        inAppEnabled: true,
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
        updatedAt: null,
      }

      preferenceRepositoryMock.findByUserAndType!.mockResolvedValue(
        existingPreference,
      )

      const result = await service.getPreference(1, "ASSIGNMENT_CREATED")

      expect(result).toEqual(existingPreference)
    })

    it("returns default preference when repository has no record", async () => {
      preferenceRepositoryMock.findByUserAndType!.mockResolvedValue(undefined)

      const result = await service.getPreference(2, "SUBMISSION_GRADED")

      expect(result).toMatchObject({
        id: 0,
        userId: 2,
        notificationType: "SUBMISSION_GRADED",
        emailEnabled: true,
        inAppEnabled: true,
        updatedAt: null,
      })
    })
  })

  describe("getAllPreferences", () => {
    it("returns all configured notification types with defaults for missing entries", async () => {
      preferenceRepositoryMock.findByUserId!.mockResolvedValue([
        {
          id: 11,
          userId: 3,
          notificationType: "ASSIGNMENT_CREATED",
          emailEnabled: false,
          inAppEnabled: true,
          createdAt: new Date("2025-01-01T00:00:00.000Z"),
          updatedAt: null,
        },
      ] as any)

      const result = await service.getAllPreferences(3)
      const configuredTypes = Object.keys(NOTIFICATION_TYPES)

      expect(result).toHaveLength(configuredTypes.length)
      expect(result.find((pref) => pref.notificationType === "ASSIGNMENT_CREATED"))
        .toMatchObject({ emailEnabled: false, inAppEnabled: true })
      expect(result.find((pref) => pref.notificationType === "DEADLINE_REMINDER"))
        .toMatchObject({ emailEnabled: true, inAppEnabled: true })
    })
  })

  describe("updatePreference", () => {
    it("delegates update to repository upsert", async () => {
      const updatedPreference = {
        id: 20,
        userId: 4,
        notificationType: "DEADLINE_REMINDER",
        emailEnabled: true,
        inAppEnabled: false,
        createdAt: new Date("2025-01-01T00:00:00.000Z"),
        updatedAt: new Date("2025-01-02T00:00:00.000Z"),
      }

      preferenceRepositoryMock.upsert!.mockResolvedValue(updatedPreference as any)

      const result = await service.updatePreference(
        4,
        "DEADLINE_REMINDER",
        true,
        false,
      )

      expect(preferenceRepositoryMock.upsert).toHaveBeenCalledWith(
        4,
        "DEADLINE_REMINDER",
        true,
        false,
      )
      expect(result).toEqual(updatedPreference)
    })
  })

  describe("getEnabledChannels", () => {
    it("returns both channels when both are enabled", async () => {
      vi.spyOn(service, "getPreference").mockResolvedValue({
        id: 1,
        userId: 5,
        notificationType: "ASSIGNMENT_CREATED",
        emailEnabled: true,
        inAppEnabled: true,
        createdAt: new Date(),
        updatedAt: null,
      } as any)

      const result = await service.getEnabledChannels(5, "ASSIGNMENT_CREATED")
      expect(result).toEqual(["EMAIL", "IN_APP"])
    })

    it("returns only email channel when in-app is disabled", async () => {
      vi.spyOn(service, "getPreference").mockResolvedValue({
        id: 1,
        userId: 5,
        notificationType: "ASSIGNMENT_CREATED",
        emailEnabled: true,
        inAppEnabled: false,
        createdAt: new Date(),
        updatedAt: null,
      } as any)

      const result = await service.getEnabledChannels(5, "ASSIGNMENT_CREATED")
      expect(result).toEqual(["EMAIL"])
    })

    it("returns only in-app channel when email is disabled", async () => {
      vi.spyOn(service, "getPreference").mockResolvedValue({
        id: 1,
        userId: 5,
        notificationType: "ASSIGNMENT_CREATED",
        emailEnabled: false,
        inAppEnabled: true,
        createdAt: new Date(),
        updatedAt: null,
      } as any)

      const result = await service.getEnabledChannels(5, "ASSIGNMENT_CREATED")
      expect(result).toEqual(["IN_APP"])
    })

    it("returns empty channel list when both channels are disabled", async () => {
      vi.spyOn(service, "getPreference").mockResolvedValue({
        id: 1,
        userId: 5,
        notificationType: "ASSIGNMENT_CREATED",
        emailEnabled: false,
        inAppEnabled: false,
        createdAt: new Date(),
        updatedAt: null,
      } as any)

      const result = await service.getEnabledChannels(5, "ASSIGNMENT_CREATED")
      expect(result).toEqual([])
    })
  })
})
