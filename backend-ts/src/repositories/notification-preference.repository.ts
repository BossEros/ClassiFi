import { eq, and } from "drizzle-orm"
import {
  notificationPreferences,
  type NotificationPreference,
  type NewNotificationPreference,
} from "../models/index.js"
import { BaseRepository } from "./base.repository.js"
import { injectable } from "tsyringe"
import type { NotificationType } from "../api/schemas/notification.schema.js"

/**
 * Repository for notification preference database operations.
 * Manages user preferences for notification delivery channels.
 */
@injectable()
export class NotificationPreferenceRepository extends BaseRepository<
  typeof notificationPreferences,
  NotificationPreference,
  NewNotificationPreference
> {
  constructor() {
    super(notificationPreferences)
  }

  /**
   * Finds a notification preference by user ID and notification type.
   *
   * @param userId - The ID of the user
   * @param notificationType - The notification type
   * @returns The notification preference or undefined if not found
   */
  async findByUserAndType(
    userId: number,
    notificationType: NotificationType,
  ): Promise<NotificationPreference | undefined> {
    const results = await this.db
      .select()
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.userId, userId),
          eq(notificationPreferences.notificationType, notificationType),
        ),
      )
      .limit(1)

    return results[0] as NotificationPreference | undefined
  }

  /**
   * Finds all notification preferences for a user.
   *
   * @param userId - The ID of the user
   * @returns Array of notification preferences
   */
  async findByUserId(userId: number): Promise<NotificationPreference[]> {
    const results = await this.db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))

    return results as NotificationPreference[]
  }

  /**
   * Creates or updates a notification preference atomically.
   * Uses PostgreSQL's ON CONFLICT DO UPDATE for thread-safe upsert.
   *
   * @param userId - The ID of the user
   * @param notificationType - The notification type
   * @param emailEnabled - Whether email notifications are enabled
   * @param inAppEnabled - Whether in-app notifications are enabled
   * @returns The created or updated preference
   */
  async upsert(
    userId: number,
    notificationType: NotificationType,
    emailEnabled: boolean,
    inAppEnabled: boolean,
  ): Promise<NotificationPreference> {
    const now = new Date()

    const result = await this.db
      .insert(notificationPreferences)
      .values({
        userId,
        notificationType,
        emailEnabled,
        inAppEnabled,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          notificationPreferences.userId,
          notificationPreferences.notificationType,
        ],
        set: {
          emailEnabled,
          inAppEnabled,
          updatedAt: now,
        },
      })
      .returning()

    return result[0] as NotificationPreference
  }
}
