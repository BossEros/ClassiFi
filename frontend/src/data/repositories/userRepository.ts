import { supabase } from "@/data/api/supabaseClient"
import { apiClient } from "@/data/api/apiClient"

/**
 * Uploads a user avatar to Supabase Storage and updates the user profile.
 * Handles cleanup of old avatar files.
 *
 * @param userId - The ID of the user uploading the avatar.
 * @param file - The image file to upload.
 * @param currentAvatarUrl - Optional URL of the current avatar to delete.
 * @returns The public URL of the uploaded avatar.
 * @throws Error if upload fails or storage is not configured.
 */
export async function uploadUserAvatar(
  userId: string,
  file: File,
  currentAvatarUrl?: string,
): Promise<string> {
  // Delete old avatar if exists
  if (currentAvatarUrl && currentAvatarUrl.includes("/avatars/")) {
    await deleteOldAvatar(currentAvatarUrl)
  }

  // Generate consistent filename based on user ID
  // Safely extract extension from filename, MIME type, or use default
  let fileExt = file.name.split(".").pop()

  // If no extension from filename (no dot in name), derive from MIME type
  if (!fileExt || fileExt === file.name) {
    const mimeToExt: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/svg+xml": "svg",
    }
    fileExt = mimeToExt[file.type] || "jpg" // Default to jpg if MIME unknown
  }

  const fileName = `${userId}.${fileExt}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
    })

  if (uploadError) {
    if (
      uploadError.message.includes("not found") ||
      uploadError.message.includes("bucket")
    ) {
      throw new Error(
        "Avatar storage is not configured. Please contact support.",
      )
    }
    throw new Error(uploadError.message || "Failed to upload image")
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(fileName)

  // Persist to backend database
  await persistAvatarUrlToBackend(publicUrl)

  return publicUrl
}

/**
 * Deletes an old avatar file from Supabase Storage.
 * Fails silently if deletion is unsuccessful.
 *
 * @param avatarUrl - The URL of the avatar to delete.
 */
async function deleteOldAvatar(avatarUrl: string): Promise<void> {
  try {
    const [, rawFilePath] = avatarUrl.split("/avatars/")
    const filePath = rawFilePath?.split("?")[0]

    if (!filePath) {
      return
    }

    await supabase.storage.from("avatars").remove([filePath])
  } catch (error) {
    console.error("Failed to delete old avatar:", error)
    // Continue anyway - not critical
  }
}

/**
 * Persists the avatar URL to the backend database.
 * Fails silently if backend update is unsuccessful.
 *
 * @param avatarUrl - The public URL of the uploaded avatar.
 */
async function persistAvatarUrlToBackend(avatarUrl: string): Promise<void> {
  try {
    await apiClient.patch("/user/me/avatar", { avatarUrl })
  } catch (error) {
    console.error("Failed to persist avatar URL to backend:", error)
    // Continue anyway - localStorage will still work
  }
}
