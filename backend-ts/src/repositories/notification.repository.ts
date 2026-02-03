import { eq, desc, and, sql } from "drizzle-orm";
import { notifications, type Notification, type NewNotification } from "../models/index.js";
import { BaseRepository } from "./base.repository.js";
import { injectable } from "tsyringe";

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
        super(notifications);
    }

    /**
     * Finds notifications by user ID with pagination.
     *
     * @param userId - The ID of the user
     * @param limit - Maximum number of notifications to return
     * @param offset - Number of notifications to skip
     * @returns Array of notifications
     */
    async findByUserId(userId: number, limit: number, offset: number): Promise<Notification[]> {
        return await this.db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt))
            .limit(limit)
            .offset(offset);
    }

    /**
     * Counts total notifications for a user.
     *
     * @param userId - The ID of the user
     * @returns Total count
     */
    async countByUserId(userId: number): Promise<number> {
        const result = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(notifications)
            .where(eq(notifications.userId, userId));

        return Number(result[0]?.count ?? 0);
    }

    /**
     * Counts unread notifications for a user.
     *
     * @param userId - The ID of the user
     * @returns Unread count
     */
    async countUnreadByUserId(userId: number): Promise<number> {
        const result = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(notifications)
            .where(
                and(
                    eq(notifications.userId, userId),
                    eq(notifications.isRead, false)
                )
            );

        return Number(result[0]?.count ?? 0);
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
            .where(eq(notifications.id, notificationId));
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
                and(
                    eq(notifications.userId, userId),
                    eq(notifications.isRead, false)
                )
            );
    }

    /**
     * Finds recent unread notifications for a user.
     *
     * @param userId - The ID of the user
     * @param limit - Maximum number of notifications to return
     * @returns Array of recent unread notifications
     */
    async findRecentUnread(userId: number, limit: number = 5): Promise<Notification[]> {
        return await this.db
            .select()
            .from(notifications)
            .where(
                and(
                    eq(notifications.userId, userId),
                    eq(notifications.isRead, false)
                )
            )
            .orderBy(desc(notifications.createdAt))
            .limit(limit);
    }
}
