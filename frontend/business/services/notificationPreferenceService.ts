import { notificationPreferenceRepository } from "@/data/repositories/notificationPreferenceRepository"
import type {
    NotificationPreference,
    NotificationType,
} from "@/business/models/notification/preference.types"

/**
 * Service for managing notification preferences.
 * Handles business logic for notification preference operations.
 */
export const notificationPreferenceService = {
    /**
     * Gets all notification preferences for the current user.
     *
     * @returns Array of notification preferences
     */
    async getPreferences(): Promise<NotificationPreference[]> {
        return notificationPreferenceRepository.getPreferences()
    },

    /**
     * Updates a notification preference.
     *
     * @param notificationType - The notification type
     * @param emailEnabled - Whether email notifications are enabled
     * @param inAppEnabled - Whether in-app notifications are enabled
     * @returns The updated preference
     */
    async updatePreference(
        notificationType: NotificationType,
        emailEnabled: boolean,
        inAppEnabled: boolean,
    ): Promise<NotificationPreference> {
        return notificationPreferenceRepository.updatePreference({
            notificationType,
            emailEnabled,
            inAppEnabled,
        })
    },

    /**
     * Gets a human-readable label for a notification type.
     *
     * @param type - The notification type
     * @returns Human-readable label
     */
    getNotificationTypeLabel(type: NotificationType): string {
        const labels: Record<NotificationType, string> = {
            ASSIGNMENT_CREATED: "New Assignments",
            SUBMISSION_GRADED: "Graded Submissions",
            CLASS_ANNOUNCEMENT: "Class Announcements",
            DEADLINE_REMINDER: "Deadline Reminders",
            ENROLLMENT_CONFIRMED: "Enrollment Confirmations",
        }

        return labels[type]
    },

    /**
     * Gets a description for a notification type.
     *
     * @param type - The notification type
     * @returns Description text
     */
    getNotificationTypeDescription(type: NotificationType): string {
        const descriptions: Record<NotificationType, string> = {
            ASSIGNMENT_CREATED: "Get notified when teachers post new assignments",
            SUBMISSION_GRADED: "Get notified when your submissions are graded",
            CLASS_ANNOUNCEMENT: "Get notified about class announcements",
            DEADLINE_REMINDER: "Get reminded about upcoming assignment deadlines",
            ENROLLMENT_CONFIRMED: "Get notified when you're enrolled in a class",
        }

        return descriptions[type]
    },
}
