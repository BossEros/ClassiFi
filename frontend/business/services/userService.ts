import * as userRepository from "@/data/repositories/userRepository"
import { getCurrentUser } from "./authService"

export interface UploadAvatarRequest {
  file: File
  currentAvatarUrl?: string
}

export interface UploadAvatarResponse {
  success: boolean
  avatarUrl?: string
  message?: string
}

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
  const user = getCurrentUser()

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
    localStorage.setItem("user", JSON.stringify(updatedUser))
    window.dispatchEvent(new Event("userUpdated"))

    return {
      success: true,
      avatarUrl,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to upload avatar",
    }
  }
}
