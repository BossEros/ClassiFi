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
  desc: vi.fn((field) => ({ field, type: "desc" })),
  and: vi.fn((...conditions) => ({ conditions, type: "and" })),
  sql: vi.fn(),
}))

// Mock models
vi.mock("../../src/models/index.js", () => ({
  notifications: {
    id: "id",
    userId: "userId",
    type: "type",
    title: "title",
    message: "message",
    metadata: "metadata",
    isRead: "isRead",
    readAt: "readAt",
    createdAt: "createdAt",
  },
}))

describe("NotificationRepository", () => {
  let mockDb: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get the mocked db
    const { db } = await import("../../src/shared/database.js")
    mockDb = db
  })

  describe("findByUserId", () => {
    it("should return notifications for a user with pagination", async () => {
      const mockNotifications = [
        { id: 1, userId: 1, title: "Test 1", isRead: false },
        { id: 2, userId: 1, title: "Test 2", isRead: true },
      ]

      const offsetMock = vi.fn().mockResolvedValue(mockNotifications)
      const limitMock = vi.fn().mockReturnValue({ offset: offsetMock })
      const orderByMock = vi.fn().mockReturnValue({ limit: limitMock })
      const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { NotificationRepository } =
        await import("../../src/repositories/notification.repository.js")
      const notificationRepo = new NotificationRepository()

      const result = await notificationRepo.findByUserId(1, 10, 0)

      expect(result).toEqual(mockNotifications)
      expect(limitMock).toHaveBeenCalledWith(10)
      expect(offsetMock).toHaveBeenCalledWith(0)
    })
  })

  describe("countByUserId", () => {
    it("should return total count of notifications for a user", async () => {
      const whereMock = vi.fn().mockResolvedValue([{ count: 5 }])
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { NotificationRepository } =
        await import("../../src/repositories/notification.repository.js")
      const notificationRepo = new NotificationRepository()

      const result = await notificationRepo.countByUserId(1)

      expect(result).toBe(5)
    })

    it("should return 0 when user has no notifications", async () => {
      const whereMock = vi.fn().mockResolvedValue([])
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { NotificationRepository } =
        await import("../../src/repositories/notification.repository.js")
      const notificationRepo = new NotificationRepository()

      const result = await notificationRepo.countByUserId(1)

      expect(result).toBe(0)
    })
  })

  describe("countUnreadByUserId", () => {
    it("should return count of unread notifications", async () => {
      const whereMock = vi.fn().mockResolvedValue([{ count: 3 }])
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { NotificationRepository } =
        await import("../../src/repositories/notification.repository.js")
      const notificationRepo = new NotificationRepository()

      const result = await notificationRepo.countUnreadByUserId(1)

      expect(result).toBe(3)
    })
  })

  describe("markAsRead", () => {
    it("should mark a notification as read", async () => {
      const whereMock = vi.fn().mockResolvedValue([])
      const setMock = vi.fn().mockReturnValue({ where: whereMock })
      const updateMock = vi.fn().mockReturnValue({ set: setMock })
      mockDb.update = updateMock

      const { NotificationRepository } =
        await import("../../src/repositories/notification.repository.js")
      const notificationRepo = new NotificationRepository()

      await notificationRepo.markAsRead(1)

      expect(updateMock).toHaveBeenCalled()
      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          isRead: true,
          readAt: expect.any(Date),
        }),
      )
    })
  })

  describe("markAllAsReadByUserId", () => {
    it("should mark all unread notifications as read for a user", async () => {
      const whereMock = vi.fn().mockResolvedValue([])
      const setMock = vi.fn().mockReturnValue({ where: whereMock })
      const updateMock = vi.fn().mockReturnValue({ set: setMock })
      mockDb.update = updateMock

      const { NotificationRepository } =
        await import("../../src/repositories/notification.repository.js")
      const notificationRepo = new NotificationRepository()

      await notificationRepo.markAllAsReadByUserId(1)

      expect(updateMock).toHaveBeenCalled()
      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          isRead: true,
          readAt: expect.any(Date),
        }),
      )
    })
  })

  describe("findRecentUnread", () => {
    it("should return recent unread notifications", async () => {
      const mockNotifications = [
        { id: 1, userId: 1, title: "Unread 1", isRead: false },
        { id: 2, userId: 1, title: "Unread 2", isRead: false },
      ]

      const offsetMock = vi.fn().mockResolvedValue(mockNotifications)
      const limitMock = vi.fn().mockReturnValue({ offset: offsetMock })
      const orderByMock = vi.fn().mockReturnValue({ limit: limitMock })
      const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      const selectMock = vi.fn().mockReturnValue({ from: fromMock })
      mockDb.select = selectMock

      const { NotificationRepository } =
        await import("../../src/repositories/notification.repository.js")
      const notificationRepo = new NotificationRepository()

      const result = await notificationRepo.findRecentUnread(1, 5, 0)

      expect(result).toEqual(mockNotifications)
      expect(limitMock).toHaveBeenCalledWith(5)
      expect(offsetMock).toHaveBeenCalledWith(0)
    })
  })
})
