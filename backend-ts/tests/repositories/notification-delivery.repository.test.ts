import { describe, it, expect, vi, beforeEach } from "vitest"

// Mock database module before importing repository
vi.mock("../../src/shared/database.js", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock drizzle-orm
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field, value) => ({ field, value, type: "eq" })),
}))

// Mock models
vi.mock("../../src/models/index.js", () => ({
  notificationDeliveries: {
    id: "id",
    notificationId: "notificationId",
    channel: "channel",
    status: "status",
    sentAt: "sentAt",
    failedAt: "failedAt",
    errorMessage: "errorMessage",
    retryCount: "retryCount",
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  },
  notifications: {
    id: "id",
    userId: "userId",
    type: "type",
    title: "title",
    message: "message",
  },
}))

// Mock errors
vi.mock("../../src/shared/errors.js", () => ({
  NotFoundError: class NotFoundError extends Error {
    constructor(message: string) {
      super(message)
      this.name = "NotFoundError"
    }
  },
}))

describe("NotificationDeliveryRepository", () => {
  let mockDb: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get the mocked db
    const { db } = await import("../../src/shared/database.js")
    mockDb = db
  })

  describe("findPending", () => {
    it("should return pending deliveries", async () => {
      const mockDeliveries = [
        { id: 1, notificationId: 1, status: "PENDING", channel: "EMAIL" },
        { id: 2, notificationId: 2, status: "PENDING", channel: "IN_APP" },
      ]

      const limitMock = vi.fn().mockResolvedValue(mockDeliveries)
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { NotificationDeliveryRepository } =
        await import("../../src/repositories/notification-delivery.repository.js")
      const deliveryRepo = new NotificationDeliveryRepository()

      const result = await deliveryRepo.findPending(100)

      expect(result).toEqual(mockDeliveries)
      expect(limitMock).toHaveBeenCalledWith(100)
    })

    it("should use default limit of 100", async () => {
      const mockDeliveries = []
      const limitMock = vi.fn().mockResolvedValue(mockDeliveries)
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { NotificationDeliveryRepository } =
        await import("../../src/repositories/notification-delivery.repository.js")
      const deliveryRepo = new NotificationDeliveryRepository()

      await deliveryRepo.findPending()

      expect(limitMock).toHaveBeenCalledWith(100)
    })
  })

  describe("getNotification", () => {
    it("should return notification when found", async () => {
      const mockNotification = {
        id: 1,
        userId: 1,
        type: "ASSIGNMENT_CREATED",
        title: "Test Notification",
        message: "Test message",
      }

      const limitMock = vi.fn().mockResolvedValue([mockNotification])
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { NotificationDeliveryRepository } =
        await import("../../src/repositories/notification-delivery.repository.js")
      const deliveryRepo = new NotificationDeliveryRepository()

      const result = await deliveryRepo.getNotification(1)

      expect(result).toEqual(mockNotification)
    })

    it("should throw NotFoundError when notification not found", async () => {
      const limitMock = vi.fn().mockResolvedValue([])
      const whereMock = vi.fn().mockReturnValue({ limit: limitMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { NotificationDeliveryRepository } =
        await import("../../src/repositories/notification-delivery.repository.js")
      const deliveryRepo = new NotificationDeliveryRepository()

      await expect(deliveryRepo.getNotification(999)).rejects.toThrow(
        "Notification not found",
      )
    })
  })
})
