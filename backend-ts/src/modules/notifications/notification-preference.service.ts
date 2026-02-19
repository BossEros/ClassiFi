import { injectable, inject } from "tsyringe"
import type { NotificationPreferenceRepository } from "@/modules/notifications/notification-preference.repository.js"
import type { NotificationPreference } from "@/models/index.js"
import type { NotificationType } from "@/modules/notifications/notification.schema.js"
import { NOTIFICATION_TYPES } from "@/services/notification/types.js"
import { DI_TOKENS } from "@/shared/di/tokens.js"

/**
 * Service for managing notification preferences.
 * Handles user preferences for notification delivery channels.
 */
@injectable()
export class NotificationPreferenceService {
  constructor(
    @inject(DI_TOKENS.repositories.notificationPreference)
    private preferenceRepo: NotificationPreferenceRepository,
  ) {}

  /**
   * Gets user preferences for a specific notification type.
   * Returns default preferences (both enabled) if not found.
   *
   * @param userId - The ID of the user
   * @param notificationType - The notification type
   * @returns The notification preference
   */
  async getPreference(
    userId: number,
    notificationType: NotificationType,
  ): Promise<NotificationPreference> {
    const preference = await this.preferenceRepo.findByUserAndType(
      userId,
      notificationType,
    )

    if (preference) {
      return preference
    }

    // Return default preferences (both enabled)
    return {
      id: 0,
      userId,
      notificationType,
      emailEnabled: true,
      inAppEnabled: true,
      createdAt: new Date(),
      updatedAt: null,
    }
  }

  /**
   * Gets all notification preferences for a user.
   * Returns default preferences for types not yet configured.
   *
   * @param userId - The ID of the user
   * @returns Array of notification preferences
   */
  async getAllPreferences(userId: number): Promise<NotificationPreference[]> {
    const preferences = await this.preferenceRepo.findByUserId(userId)
    const preferenceMap = new Map(
      preferences.map((p) => [p.notificationType, p]),
    )

    // Ensure all notification types have a preference entry
    const allTypes = Object.keys(NOTIFICATION_TYPES) as NotificationType[]

    return allTypes.map((type) => {
      const existing = preferenceMap.get(type)

      if (existing) {
        return existing
      }

      // Return default preference
      return {
        id: 0,
        userId,
        notificationType: type,
        emailEnabled: true,
        inAppEnabled: true,
        createdAt: new Date(),
        updatedAt: null,
      }
    })
  }

  /**
   * Updates notification preferences for a user.
   *
   * @param userId - The ID of the user
   * @param notificationType - The notification type
   * @param emailEnabled - Whether email notifications are enabled
   * @param inAppEnabled - Whether in-app notifications are enabled
   * @returns The updated preference
   */
  async updatePreference(
    userId: number,
    notificationType: NotificationType,
    emailEnabled: boolean,
    inAppEnabled: boolean,
  ): Promise<NotificationPreference> {
    return this.preferenceRepo.upsert(
      userId,
      notificationType,
      emailEnabled,
      inAppEnabled,
    )
  }

  /**
   * Determines which channels should be used for a notification based on user preferences.
   *
   * @param userId - The ID of the user
   * @param notificationType - The notification type
   * @returns Array of enabled channels
   */
  async getEnabledChannels(
    userId: number,
    notificationType: NotificationType,
  ): Promise<("EMAIL" | "IN_APP")[]> {
    const preference = await this.getPreference(userId, notificationType)
    const channels: ("EMAIL" | "IN_APP")[] = []

    if (preference.emailEnabled) {
      channels.push("EMAIL")
    }

    if (preference.inAppEnabled) {
      channels.push("IN_APP")
    }

    return channels
  }
}