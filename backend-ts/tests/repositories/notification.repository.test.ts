import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("../../src/shared/database.js", () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((field, value) => ({ field, value, type: "eq" })),
  desc: vi.fn((field) => ({ field, type: "desc" })),
  and: vi.fn((...conditions) => ({ conditions, type: "and" })),
  sql: vi.fn(),
  relations: vi.fn(),
}))

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

import { db } from "../../src/shared/database.js"
import { NotificationRepository } from "../../src/modules/notifications/notification.repository.js"

interface MockDatabase {
  insert: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

describe("NotificationRepository", () => {
  let mockDb: MockDatabase

  beforeEach(() => {
    vi.clearAllMocks()
    mockDb = db as unknown as MockDatabase
  })

  describe("findByUserId", () => {
    it("returns notifications for a user with pagination", async () => {
      const mockNotifications = [
        { id: 1, userId: 1, title: "Test 1", isRead: false },
        { id: 2, userId: 1, title: "Test 2", isRead: true },
      ]

      const offsetMock = vi.fn().mockResolvedValue(mockNotifications)
      const limitMock = vi.fn().mockReturnValue({ offset: offsetMock })
      const orderByMock = vi.fn().mockReturnValue({ limit: limitMock })
      const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockDb.select = vi.fn().mockReturnValue({ from: fromMock })

      const notificationRepo = new NotificationRepository()

      const result = await notificationRepo.findByUserId(1, 10, 0)

      expect(result).toEqual(mockNotifications)
      expect(limitMock).toHaveBeenCalledWith(10)
      expect(offsetMock).toHaveBeenCalledWith(0)
    })
  })

  describe("countByUserId", () => {
    it("returns the total count of notifications for a user", async () => {
      const whereMock = vi.fn().mockResolvedValue([{ count: 5 }])
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockDb.select = vi.fn().mockReturnValue({ from: fromMock })

      const notificationRepo = new NotificationRepository()

      const result = await notificationRepo.countByUserId(1)

      expect(result).toBe(5)
    })

    it("returns 0 when the user has no notifications", async () => {
      const whereMock = vi.fn().mockResolvedValue([])
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockDb.select = vi.fn().mockReturnValue({ from: fromMock })

      const notificationRepo = new NotificationRepository()

      const result = await notificationRepo.countByUserId(1)

      expect(result).toBe(0)
    })
  })

  describe("countUnreadByUserId", () => {
    it("returns the count of unread notifications", async () => {
      const whereMock = vi.fn().mockResolvedValue([{ count: 3 }])
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockDb.select = vi.fn().mockReturnValue({ from: fromMock })

      const notificationRepo = new NotificationRepository()

      const result = await notificationRepo.countUnreadByUserId(1)

      expect(result).toBe(3)
    })
  })

  describe("markAsRead", () => {
    it("marks a notification as read", async () => {
      const whereMock = vi.fn().mockResolvedValue([])
      const setMock = vi.fn().mockReturnValue({ where: whereMock })
      const updateMock = vi.fn().mockReturnValue({ set: setMock })
      mockDb.update = updateMock

      const notificationRepo = new NotificationRepository()

      await notificationRepo.markAsRead(1)

      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          isRead: true,
          readAt: expect.any(Date),
        }),
      )
    })
  })

  describe("markAllAsReadByUserId", () => {
    it("marks all unread notifications as read for a user", async () => {
      const whereMock = vi.fn().mockResolvedValue([])
      const setMock = vi.fn().mockReturnValue({ where: whereMock })
      const updateMock = vi.fn().mockReturnValue({ set: setMock })
      mockDb.update = updateMock

      const notificationRepo = new NotificationRepository()

      await notificationRepo.markAllAsReadByUserId(1)

      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          isRead: true,
          readAt: expect.any(Date),
        }),
      )
    })
  })

  describe("findRecentUnread", () => {
    it("returns recent unread notifications", async () => {
      const mockNotifications = [
        { id: 1, userId: 1, title: "Unread 1", isRead: false },
        { id: 2, userId: 1, title: "Unread 2", isRead: false },
      ]

      const offsetMock = vi.fn().mockResolvedValue(mockNotifications)
      const limitMock = vi.fn().mockReturnValue({ offset: offsetMock })
      const orderByMock = vi.fn().mockReturnValue({ limit: limitMock })
      const whereMock = vi.fn().mockReturnValue({ orderBy: orderByMock })
      const fromMock = vi.fn().mockReturnValue({ where: whereMock })
      mockDb.select = vi.fn().mockReturnValue({ from: fromMock })

      const notificationRepo = new NotificationRepository()

      const result = await notificationRepo.findRecentUnread(1, 5, 0)

      expect(result).toEqual(mockNotifications)
      expect(limitMock).toHaveBeenCalledWith(5)
      expect(offsetMock).toHaveBeenCalledWith(0)
    })
  })
})
