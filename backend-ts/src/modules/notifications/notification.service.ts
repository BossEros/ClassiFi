import { injectable, inject } from "tsyringe"
import type { NotificationRepository } from "@/modules/notifications/notification.repository.js"
import type { UserRepository } from "@/modules/users/user.repository.js"
import type { User } from "@/modules/users/user.model.js"
import type { Notification, NewNotification } from "@/modules/notifications/notification.model.js"
import type { IEmailService } from "@/services/interfaces/email.interface.js"
import type { NotificationType } from "@/modules/notifications/notification.schema.js"
import {
  NOTIFICATION_TYPES,
  type NotificationChannel,
  type NotificationMetadataByType,
  type PayloadFor,
  type NotificationTypeConfig,
} from "@/modules/notifications/notification.types.js"
import { NotFoundError, ForbiddenError } from "@/shared/errors.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"
import { createLogger } from "@/shared/logger.js"
import type { TransactionContext } from "@/shared/transaction.js"
import {
  escapeHtml,
  sanitizeEmailSubject,
} from "@/services/email/templates.js"

const logger = createLogger("NotificationService")

/**
 * Service for managing notifications.
 * Handles notification creation, retrieval, and user interactions.
 */
@injectable()
export class NotificationService {
  constructor(
    @inject(DI_TOKENS.repositories.notification)
    private notificationRepo: NotificationRepository,
    @inject(DI_TOKENS.repositories.user)
    private userRepo: UserRepository,
    @inject(DI_TOKENS.services.email)
    private emailService: IEmailService,
  ) {}

  /**
   * Creates an in-app notification when that channel is enabled.
   * Respects user preferences for notification channels.
   *
   * @param userId - The ID of the user to notify
   * @param type - The notification type
   * @param data - Type-specific data for template rendering
   * @returns The created in-app notification, or null when nothing is persisted
   */
  async createNotification<T extends NotificationType>(
    userId: number,
    type: T,
    data: PayloadFor<T>,
  ): Promise<Notification | null> {
    // STEP 1: Load the notification type configuration and extract template metadata
    const config = this.getNotificationConfig(type)
    const metadata = this.extractMetadata(config, data, type)

    // STEP 2: Fetch the target user — silently bail if they don’t exist
    const user = await this.userRepo.getUserById(userId)

    if (!user) {
      return null
    }

    // STEP 3: Resolve enabled channels by intersecting user preferences with type-allowed channels
    const preferredChannels = this.getPreferredChannels(user)
    const enabledChannels = this.getEffectiveChannels(
      preferredChannels,
      config.channels,
    )

    if (enabledChannels.length === 0) {
      return null
    }

    // STEP 4: Check the IN_APP channel is enabled — bail if the user has it disabled
    if (!enabledChannels.includes("IN_APP")) {
      return null
    }

    // STEP 5: Persist the in-app notification record to the database
    return this.createNotificationRecord(userId, type, config, data, metadata)
  }

  /**
   * Creates a transaction-aware clone that reuses the same service behavior with
   * repository instances bound to the provided database context.
   *
   * @param context - The transaction context to bind repository operations to.
   * @returns A cloned notification service bound to the transaction.
   */
  withContext(context: TransactionContext): NotificationService {
    const scopedService = Object.create(Object.getPrototypeOf(this)) as NotificationService

    Object.assign(scopedService, this, {
      notificationRepo: this.notificationRepo.withContext(context),
      userRepo: this.userRepo.withContext(context),
    })

    return scopedService
  }

  /**
   * Sends an email notification after the triggering write has committed.
   *
   * @param userId - The ID of the user to notify.
   * @param type - The notification type.
   * @param data - Type-specific data for template rendering.
   */
  async sendEmailNotificationIfEnabled<T extends NotificationType>(
    userId: number,
    type: T,
    data: PayloadFor<T>,
  ): Promise<void> {
    // STEP 1: Load the notification type configuration
    const config = this.getNotificationConfig(type)

    // STEP 2: Fetch the user — bail if they have no email address on record
    const user = await this.userRepo.getUserById(userId)

    if (!user?.email) {
      return
    }

    // STEP 3: Resolve effective channels and check if EMAIL is enabled
    const preferredChannels = this.getPreferredChannels(user)
    const enabledChannels = this.getEffectiveChannels(
      preferredChannels,
      config.channels,
    )

    if (!enabledChannels.includes("EMAIL")) {
      return
    }

    // STEP 4: Dispatch the email notification
    await this.sendEmailNotification(user, type, config, data)
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
   * Gets enabled notification channels from user preferences.
   *
   * @param user - The target user
   * @returns List of enabled notification channels
   */
  private getPreferredChannels(user: Pick<User, "emailNotificationsEnabled" | "inAppNotificationsEnabled">): NotificationChannel[] {
    const channels: NotificationChannel[] = []
    if (user.emailNotificationsEnabled) channels.push("EMAIL")
    if (user.inAppNotificationsEnabled) channels.push("IN_APP")
    return channels
  }

  /**
  /**
   * Sends a best-effort email notification.
   *
   * @param user - The target user
   * @param type - The notification type
   * @param config - The notification configuration
   * @param data - The notification data
   * @returns Promise that resolves when the email send attempt completes
   */
  private async sendEmailNotification<T extends NotificationType>(
    user: Pick<User, "id" | "email">,
    type: T,
    config: NotificationTypeConfig<T>,
    data: PayloadFor<T>,
  ): Promise<void> {
    const fallbackMessage = escapeHtml(config.messageTemplate(data))
    const safeSubject = sanitizeEmailSubject(config.titleTemplate(data))
    const emailHtml =
      config.emailTemplate?.(data) ??
      `<p>${fallbackMessage}</p>`

    await this.emailService.sendEmail({
      to: user.email,
      subject: safeSubject,
      html: emailHtml,
      text: config.messageTemplate(data),
    })

    logger.info("Notification email sent", {
      userId: user.id,
      notificationType: type,
    })
  }

  /**
   * Creates an in-app notification record in the database.
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
