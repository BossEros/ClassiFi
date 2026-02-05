import { eq, desc, and, sql, inArray } from "drizzle-orm"
import {
  notifications,
  type Notification,
  type NewNotification,
  notificationDeliveries,
} from "../models/index.js"
import { BaseRepository } from "./base.repository.js"
import { injectable } from "tsyringe"

/**
 * Repository for notification-related database operations.
 * Provides methods for notification CRUD and queries.
 */
@injectable()
export class NotificationRepository extends BaseRepository<
  typeof notifications,
  Notification,
  NewNotification
> {
  constructor() {
    super(notifications)
  }

  /**
   * Gets notification IDs that have an IN_APP delivery channel.
   * Used to filter notifications to only show those visible in-app.
   *
   * @returns Array of notification IDs with IN_APP delivery
   */
  private async getInAppNotificationIds(): Promise<number[]> {
    const inAppDeliveries = await this.db
      .select({ notificationId: notificationDeliveries.notificationId })
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.channel, "IN_APP"))

    return inAppDeliveries.map((d) => d.notificationId)
  }

  /**
   * Finds notifications by user ID with pagination.
   * Only returns notifications that have an IN_APP delivery channel.
   *
   * @param userId - The ID of the user
   * @param limit - Maximum number of notifications to return
   * @param offset - Number of notifications to skip
   * @returns Array of notifications
   */
  async findByUserId(
    userId: number,
    limit: number,
    offset: number,
  ): Promise<Notification[]> {
    const inAppNotificationIds = await this.getInAppNotificationIds()

    if (inAppNotificationIds.length === 0) {
      return []
    }

    const results = await this.db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          inArray(notifications.id, inAppNotificationIds),
        ),
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset)

    return results as Notification[]
  }

  /**
   * Counts total notifications for a user.
   * Only counts notifications that have an IN_APP delivery channel.
   *
   * @param userId - The ID of the user
   * @returns Total count
   */
  async countByUserId(userId: number): Promise<number> {
    const inAppNotificationIds = await this.getInAppNotificationIds()

    if (inAppNotificationIds.length === 0) {
      return 0
    }

    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          inArray(notifications.id, inAppNotificationIds),
        ),
      )

    return Number(result[0]?.count ?? 0)
  }

  /**
   * Counts unread notifications for a user.
   * Only counts notifications that have an IN_APP delivery channel.
   *
   * @param userId - The ID of the user
   * @returns Unread count
   */
  async countUnreadByUserId(userId: number): Promise<number> {
    const inAppNotificationIds = await this.getInAppNotificationIds()

    if (inAppNotificationIds.length === 0) {
      return 0
    }

    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
          inArray(notifications.id, inAppNotificationIds),
        ),
      )

    return Number(result[0]?.count ?? 0)
  }

  /**
   * Marks a notification as read.
   *
   * @param notificationId - The ID of the notification
   */
  async markAsRead(notificationId: number): Promise<void> {
    await this.db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.id, notificationId))
  }

  /**
   * Marks all notifications as read for a user.
   *
   * @param userId - The ID of the user
   */
  async markAllAsReadByUserId(userId: number): Promise<void> {
    await this.db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      )
  }

  /**
   * Finds recent unread notifications for a user with pagination.
   * Only returns notifications that have an IN_APP delivery channel.
   *
   * @param userId - The ID of the user
   * @param limit - Maximum number of notifications to return
   * @param offset - Number of notifications to skip
   * @returns Array of recent unread notifications
   */
  async findRecentUnread(
    userId: number,
    limit: number = 5,
    offset: number = 0,
  ): Promise<Notification[]> {
    const inAppNotificationIds = await this.getInAppNotificationIds()

    if (inAppNotificationIds.length === 0) {
      return []
    }

    const results = await this.db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
          inArray(notifications.id, inAppNotificationIds),
        ),
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset)

    return results as Notification[]
  }
}
