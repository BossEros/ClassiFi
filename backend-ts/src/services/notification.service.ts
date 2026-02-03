import { injectable, inject } from "tsyringe";
import type { NotificationRepository } from "../repositories/notification.repository.js";
import type { NotificationQueueService } from "./notification-queue.service.js";
import type { Notification } from "../models/index.js";
import { NOTIFICATION_TYPES } from "./notification-types.js";
import { NotFoundError, ForbiddenError } from "../shared/errors.js";

/**
 * Service for managing notifications.
 * Handles notification creation, retrieval, and user interactions.
 */
@injectable()
export class NotificationService {
    constructor(
        @inject("NotificationRepository")
        private notificationRepo: NotificationRepository,
        @inject("NotificationQueueService")
        private queueService: NotificationQueueService
    ) { }

    /**
     * Creates and queues a notification for delivery.
     *
     * @param userId - The ID of the user to notify
     * @param type - The notification type
     * @param data - Type-specific data for template rendering
     * @returns The created notification
     */
    async createNotification(
        userId: number,
        type: string,
        data: Record<string, any>
    ): Promise<Notification> {
        const config = NOTIFICATION_TYPES[type];
        if (!config) {
            throw new Error(`Unknown notification type: ${type}`);
        }

        const notification = await this.notificationRepo.create({
            userId,
            type: type as any, // Type assertion needed since type is validated at runtime
            title: config.titleTemplate(data),
            message: config.messageTemplate(data),
            metadata: config.metadata ? config.metadata(data) : null,
        });

        // Queue delivery for each channel
        for (const channel of config.channels) {
            await this.queueService.enqueueDelivery(notification.id, channel, data);
        }

        return notification;
    }

    /**
     * Retrieves notifications for a user with pagination.
     *
     * @param userId - The ID of the user
     * @param page - Page number (1-indexed)
     * @param limit - Number of notifications per page
     * @returns Paginated notifications
     */
    async getUserNotifications(
        userId: number,
        page: number = 1,
        limit: number = 20
    ): Promise<{ notifications: Notification[]; total: number; hasMore: boolean }> {
        const offset = (page - 1) * limit;
        const notifications = await this.notificationRepo.findByUserId(userId, limit, offset);
        const total = await this.notificationRepo.countByUserId(userId);

        return {
            notifications,
            total,
            hasMore: offset + notifications.length < total,
        };
    }

    /**
     * Gets the count of unread notifications for a user.
     *
     * @param userId - The ID of the user
     * @returns Count of unread notifications
     */
    async getUnreadCount(userId: number): Promise<number> {
        return this.notificationRepo.countUnreadByUserId(userId);
    }

    /**
     * Marks a notification as read.
     *
     * @param notificationId - The ID of the notification
     * @param userId - The ID of the user (for authorization)
     */
    async markAsRead(notificationId: number, userId: number): Promise<void> {
        const notification = await this.notificationRepo.findById(notificationId);

        if (!notification) {
            throw new NotFoundError("Notification not found");
        }

        if (notification.userId !== userId) {
            throw new ForbiddenError("Not authorized to access this notification");
        }

        await this.notificationRepo.markAsRead(notificationId);
    }

    /**
     * Marks all notifications as read for a user.
     *
     * @param userId - The ID of the user
     */
    async markAllAsRead(userId: number): Promise<void> {
        await this.notificationRepo.markAllAsReadByUserId(userId);
    }

    /**
     * Deletes a notification.
     *
     * @param notificationId - The ID of the notification
     * @param userId - The ID of the user (for authorization)
     */
    async deleteNotification(notificationId: number, userId: number): Promise<void> {
        const notification = await this.notificationRepo.findById(notificationId);

        if (!notification) {
            throw new NotFoundError("Notification not found");
        }

        if (notification.userId !== userId) {
            throw new ForbiddenError("Not authorized to delete this notification");
        }

        await this.notificationRepo.delete(notificationId);
    }
}
