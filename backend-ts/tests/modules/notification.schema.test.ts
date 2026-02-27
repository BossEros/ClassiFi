import { describe, expect, it } from "vitest"
import {
  ListNotificationsDto,
  NotificationParamsSchema,
  NotificationQueryParamsSchema,
  NotificationSchema,
  NotificationTypeSchema,
} from "../../src/modules/notifications/notification.schema.js"

describe("Notification Schemas", () => {
  describe("NotificationTypeSchema", () => {
    it("accepts valid notification type", () => {
      const result = NotificationTypeSchema.safeParse("ASSIGNMENT_CREATED")
      expect(result.success).toBe(true)
    })

    it("rejects invalid notification type", () => {
      const result = NotificationTypeSchema.safeParse("UNKNOWN")
      expect(result.success).toBe(false)
    })
  })

  describe("NotificationSchema", () => {
    it("accepts full notification response payload", () => {
      const result = NotificationSchema.safeParse({
        id: 1,
        userId: 2,
        type: "DEADLINE_REMINDER",
        title: "Reminder",
        message: "Assignment due soon",
        metadata: {
          assignmentId: 20,
          extra: "value",
        },
        isRead: false,
        readAt: null,
        createdAt: "2025-01-01T00:00:00.000Z",
      })

      expect(result.success).toBe(true)
    })

    it("accepts notification response without optional metadata/readAt", () => {
      const result = NotificationSchema.safeParse({
        id: 1,
        userId: 2,
        type: "ASSIGNMENT_CREATED",
        title: "New Assignment",
        message: "Check the new assignment",
        isRead: true,
        createdAt: "2025-01-01T00:00:00.000Z",
      })

      expect(result.success).toBe(true)
    })
  })

  describe("NotificationParamsSchema", () => {
    it("coerces id params and rejects invalid ids", () => {
      expect(NotificationParamsSchema.parse({ id: "10" }).id).toBe(10)
      expect(NotificationParamsSchema.safeParse({ id: "invalid" }).success).toBe(
        false,
      )
    })
  })

  describe("NotificationQueryParamsSchema", () => {
    it("applies defaults when query params are omitted", () => {
      const parsed = NotificationQueryParamsSchema.parse({})

      expect(parsed).toEqual({ page: 1, limit: 20 })
    })

    it("coerces query params from string values", () => {
      const parsed = NotificationQueryParamsSchema.parse({
        page: "2",
        limit: "50",
        unreadOnly: "true",
      })

      expect(parsed).toEqual({
        page: 2,
        limit: 50,
        unreadOnly: true,
      })
    })

    it("accepts boolean unreadOnly values directly", () => {
      const parsed = NotificationQueryParamsSchema.parse({
        unreadOnly: true,
      })

      expect(parsed.unreadOnly).toBe(true)
    })

    it("rejects invalid limit values", () => {
      const result = NotificationQueryParamsSchema.safeParse({
        page: 1,
        limit: 101,
      })

      expect(result.success).toBe(false)
    })

    it("rejects invalid unreadOnly string values", () => {
      const result = NotificationQueryParamsSchema.safeParse({
        unreadOnly: "not-a-boolean",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("ListNotificationsDto", () => {
    it("maps validated query fields", () => {
      const dto = new ListNotificationsDto({
        page: "3",
        limit: "25",
        unreadOnly: "false",
      })

      expect(dto.page).toBe(3)
      expect(dto.limit).toBe(25)
      expect(dto.unreadOnly).toBe(false)
    })

    it("throws for invalid query payload", () => {
      expect(
        () =>
          new ListNotificationsDto({
            page: 0,
            limit: 20,
          }),
      ).toThrow()
    })
  })
})
