import { injectable, inject } from "tsyringe"
import type { NotificationRepository } from "../../repositories/notification.repository.js"
import type { NotificationQueueService } from "./queue.service.js"
import type { NotificationPreferenceService } from "./preference.service.js"
import type { Notification, NewNotification } from "../../models/index.js"
import type { NotificationType } from "../../api/schemas/notification.schema.js"
import {
  NOTIFICATION_TYPES,
  type NotificationChannel,
  type NotificationMetadataByType,
  type PayloadFor,
  type NotificationTypeConfig,
} from "./types.js"
import { NotFoundError, ForbiddenError } from "../../shared/errors.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Service for managing notifications.
 * Handles notification creation, retrieval, and user interactions.
 */
@injectable()
export class NotificationService {
  constructor(
    @inject(DI_TOKENS.repositories.notification)
    private notificationRepo: NotificationRepository,
    @inject(DI_TOKENS.services.notificationQueue)
    private queueService: NotificationQueueService,
    @inject(DI_TOKENS.services.notificationPreference)
    private preferenceService: NotificationPreferenceService,
  ) {}

  /**
   * Creates and queues a notification for delivery.
   * Respects user preferences for notification channels.
   *
   * @param userId - The ID of the user to notify
   * @param type - The notification type
   * @param data - Type-specific data for template rendering
   * @returns The created notification
   */
  async createNotification<T extends NotificationType>(
    userId: number,
    type: T,
    data: PayloadFor<T>,
  ): Promise<Notification> {
    const config = this.getNotificationConfig(type)
    const metadata = this.extractMetadata(config, data, type)
    const preferredChannels = await this.preferenceService.getEnabledChannels(
      userId,
      type,
    )
    const enabledChannels = this.getEffectiveChannels(
      preferredChannels,
      config.channels,
    )

    if (enabledChannels.length === 0) {
      return this.createMockNotification(userId, type, config, data, metadata)
    }

    const notification = await this.createNotificationRecord(
      userId,
      type,
      config,
      data,
      metadata,
    )

    await this.queueDeliveries(notification.id, enabledChannels, data)

    return notification
  }

  /**
   * Gets and validates the notification type configuration.
   *
   * @param type - The notification type
   * @returns The notification configuration
   */
  private getNotificationConfig<T extends NotificationType>(
    type: T,
  ): NotificationTypeConfig<T> {
    const config = NOTIFICATION_TYPES[type]

    if (!config) {
      throw new Error(`Unknown notification type: ${type}`)
    }

    return config
  }

  /**
   * Extracts and validates metadata from notification data.
   *
   * @param config - The notification configuration
   * @param data - The notification data
   * @param type - The notification type
   * @returns The extracted metadata
   */
  private extractMetadata<T extends NotificationType>(
    config: NotificationTypeConfig<T>,
    data: PayloadFor<T>,
    type: T,
  ): NotificationMetadataByType[T] {
    const metadata = config.metadata(data)

    if (!metadata) {
      throw new Error(`Metadata is required for notification type: ${type}`)
    }

    return metadata
  }

  /**
   * Intersects user-enabled channels with type-specific allowed channels.
   *
   * @param preferredChannels - Channels enabled by user preference
   * @param allowedChannels - Channels allowed by notification type
   * @returns Filtered list of effective channels
   */
  private getEffectiveChannels(
    preferredChannels: NotificationChannel[],
    allowedChannels: NotificationChannel[],
  ): NotificationChannel[] {
    const allowedSet = new Set<NotificationChannel>(allowedChannels)

    return preferredChannels.filter((channel) => allowedSet.has(channel))
  }

  /**
   * Creates a mock notification object when no channels are enabled.
   * This notification is not persisted to the database.
   *
   * @param userId - The user ID
   * @param type - The notification type
   * @param config - The notification configuration
   * @param data - The notification data
   * @param metadata - The notification metadata
   * @returns A mock notification object
   */
  private createMockNotification<T extends NotificationType>(
    userId: number,
    type: T,
    config: NotificationTypeConfig<T>,
    data: PayloadFor<T>,
    metadata: NotificationMetadataByType[T],
  ): Notification {
    // Safe: metadata and type come from the same notification config.
    return {
      id: 0,
      userId,
      type,
      title: config.titleTemplate(data),
      message: config.messageTemplate(data),
      metadata,
      isRead: false,
      readAt: null,
      createdAt: new Date(),
    } as Notification
  }

  /**
   * Creates a notification record in the database.
   * The notification record is created when at least one delivery channel is enabled.
   *
   * @param userId - The user ID
   * @param type - The notification type
   * @param config - The notification configuration
   * @param data - The notification data
   * @param metadata - The notification metadata
   * @returns The created notification
   */
  private async createNotificationRecord<T extends NotificationType>(
    userId: number,
    type: T,
    config: NotificationTypeConfig<T>,
    data: PayloadFor<T>,
    metadata: NotificationMetadataByType[T],
  ): Promise<Notification> {
    // Safe: metadata and type come from the same notification config.
    const newNotification = {
      userId,
      type,
      title: config.titleTemplate(data),
      message: config.messageTemplate(data),
      metadata,
    } as NewNotification

    return this.notificationRepo.create(newNotification)
  }

  /**
   * Queues deliveries for enabled channels.
   * Only queues IN_APP delivery if that channel is enabled.
   * Only queues EMAIL delivery if that channel is enabled.
   *
   * @param notificationId - The notification ID
   * @param enabledChannels - The enabled delivery channels
   * @param data - The notification data
   */
  private async queueDeliveries<T extends NotificationType>(
    notificationId: number,
    enabledChannels: NotificationChannel[],
    data: PayloadFor<T>,
  ): Promise<void> {
    for (const channel of enabledChannels) {
      await this.queueService.enqueueDelivery(notificationId, channel, data)
    }
  }

  /**
   * Retrieves notifications for a user with pagination.
   *
   * @param userId - The ID of the user
   * @param page - Page number (1-indexed)
   * @param limit - Number of notifications per page
   * @param unreadOnly - If true, only return unread notifications
   * @returns Paginated notifications with total count and hasMore flag
   */
  async getUserNotifications(
    userId: number,
    page: number = 1,
    limit: number = 20,
    unreadOnly?: boolean,
  ): Promise<{
    notifications: Notification[]
    total: number
    hasMore: boolean
  }> {
    const offset = (page - 1) * limit
    let notifications: Notification[]
    let total: number

    if (unreadOnly) {
      notifications = await this.notificationRepo.findRecentUnread(
        userId,
        limit,
        offset,
      )
      total = await this.notificationRepo.countUnreadByUserId(userId)
    } else {
      notifications = await this.notificationRepo.findByUserId(
        userId,
        limit,
        offset,
      )
      total = await this.notificationRepo.countByUserId(userId)
    }

    return {
      notifications,
      total,
      hasMore: offset + notifications.length < total,
    }
  }

  /**
   * Gets the count of unread notifications for a user.
   *
   * @param userId - The ID of the user
   * @returns Count of unread notifications
   */
  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepo.countUnreadByUserId(userId)
  }

  /**
   * Marks a notification as read.
   *
   * @param notificationId - The ID of the notification
   * @param userId - The ID of the user (for authorization)
   */
  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const notification = await this.notificationRepo.findById(notificationId)

    if (!notification) {
      throw new NotFoundError("Notification not found")
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError("Not authorized to access this notification")
    }

    await this.notificationRepo.markAsRead(notificationId)
  }

  /**
   * Marks all notifications as read for a user.
   *
   * @param userId - The ID of the user
   */
  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepo.markAllAsReadByUserId(userId)
  }

  /**
   * Deletes a notification.
   *
   * @param notificationId - The ID of the notification
   * @param userId - The ID of the user (for authorization)
   */
  async deleteNotification(
    notificationId: number,
    userId: number,
  ): Promise<void> {
    const notification = await this.notificationRepo.findById(notificationId)

    if (!notification) {
      throw new NotFoundError("Notification not found")
    }

    if (notification.userId !== userId) {
      throw new ForbiddenError("Not authorized to delete this notification")
    }

    await this.notificationRepo.delete(notificationId)
  }
}