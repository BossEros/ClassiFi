import { describe, expect, it } from "vitest"
import {
  NotificationPreferenceSchema,
  UpdateNotificationPreferenceSchema,
} from "../../src/modules/notifications/notification-preference.schema.js"

describe("Notification Preference Schemas", () => {
  it("accepts a valid notification preference response", () => {
    const parseResult = NotificationPreferenceSchema.safeParse({
      id: 1,
      userId: 2,
      notificationType: "ASSIGNMENT_CREATED",
      emailEnabled: true,
      inAppEnabled: false,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: null,
    })

    expect(parseResult.success).toBe(true)
  })

  it("rejects invalid notification type", () => {
    const parseResult = NotificationPreferenceSchema.safeParse({
      id: 1,
      userId: 2,
      notificationType: "UNKNOWN_TYPE",
      emailEnabled: true,
      inAppEnabled: false,
      createdAt: "2025-01-01T00:00:00.000Z",
    })

    expect(parseResult.success).toBe(false)
  })

  it("accepts valid update notification preference request", () => {
    const parseResult = UpdateNotificationPreferenceSchema.safeParse({
      notificationType: "DEADLINE_REMINDER",
      emailEnabled: false,
      inAppEnabled: true,
    })

    expect(parseResult.success).toBe(true)
  })
})
