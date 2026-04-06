import { useAuthStore } from "@/shared/store/useAuthStore"
import * as userRepository from "@/data/repositories/userRepository"
import type { UploadAvatarRequest, UploadAvatarResponse } from "@/data/api/user.types"

/**
 * Uploads a new avatar for the current user.
 * Handles file upload, old avatar cleanup, and profile update.
 *
 * @param request - The avatar upload request containing the file and optional current avatar URL.
 * @returns The response containing success status and new avatar URL.
 */
export async function uploadAvatar(
  request: UploadAvatarRequest,
): Promise<UploadAvatarResponse> {
  const user = useAuthStore.getState().user

  if (!user) {
    return {
      success: false,
      message: "You must be logged in to upload an avatar",
    }
  }

  try {
    const avatarUrl = await userRepository.uploadUserAvatar(
      user.id,
      request.file,
      request.currentAvatarUrl,
    )

    // Update local user data
    const updatedUser = { ...user, avatarUrl }
    useAuthStore.getState().login(updatedUser)

    return {
      success: true,
      avatarUrl,
    }
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to upload avatar",
    }
  }
}

/**
 * Updates the current user's notification preferences.
 * Calls the backend API and syncs the auth store.
 *
 * @param emailNotificationsEnabled - Whether email notifications are enabled.
 * @param inAppNotificationsEnabled - Whether in-app notifications are enabled.
 * @returns The updated notification preferences.
 * @throws Error if the user is not logged in.
 */
export async function updateNotificationPreferences(
  emailNotificationsEnabled: boolean,
  inAppNotificationsEnabled: boolean,
): Promise<{
  emailNotificationsEnabled: boolean
  inAppNotificationsEnabled: boolean
}> {
  const user = useAuthStore.getState().user

  if (!user) {
    throw new Error(
      "You must be logged in to update notification preferences",
    )
  }

  const result = await userRepository.updateNotificationPreferences(
    emailNotificationsEnabled,
    inAppNotificationsEnabled,
  )

  // Sync auth store so all components see updated preferences
  useAuthStore.getState().login({
    ...user,
    emailNotificationsEnabled: result.emailNotificationsEnabled,
    inAppNotificationsEnabled: result.inAppNotificationsEnabled,
  })

  return result
}
