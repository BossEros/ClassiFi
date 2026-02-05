import { apiClient } from "@/data/api/apiClient"
import type {
    NotificationPreference,
    UpdateNotificationPreferenceRequest,
} from "@/business/models/notification/preference.types"

/**
 * Repository for notification preference operations.
 * Handles API communication for managing user notification preferences.
 */
export const notificationPreferenceRepository = {
    /**
     * Gets all notification preferences for the current user.
     *
     * @returns Array of notification preferences
     */
    async getPreferences(): Promise<NotificationPreference[]> {
        const response = await apiClient.get<{
            success: boolean
            preferences: NotificationPreference[]
        }>("/notification-preferences")

        if (!response.data) {
            throw new Error("Failed to fetch notification preferences")
        }

        return response.data.preferences
    },

    /**
     * Updates a notification preference.
     *
     * @param request - The preference update request
     * @returns The updated preference
     */
    async updatePreference(
        request: UpdateNotificationPreferenceRequest,
    ): Promise<NotificationPreference> {
        const response = await apiClient.put<{
            success: boolean
            preference: NotificationPreference
        }>("/notification-preferences", request)

        if (!response.data) {
            throw new Error("Failed to update notification preference")
        }

        return response.data.preference
    },
}
