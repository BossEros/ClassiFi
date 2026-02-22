import { injectable } from "tsyringe"
import { supabase } from "@/shared/supabase.js"
import { type IStorageService } from "@/services/interfaces/storage.interface.js"
import { createLogger } from "@/shared/logger.js"

const logger = createLogger("StorageService")

// Re-export for backwards compatibility
export type { IStorageService } from "@/services/interfaces/storage.interface.js"

/**
 * Supabase Storage Service implementation.
 * Handles all file operations through Supabase Storage.
 */
@injectable()
export class StorageService implements IStorageService {
  /**
   * Upload a file to Supabase Storage.
   */
  async upload(
    bucket: string,
    path: string,
    data: Buffer,
    contentType: string,
    upsert: boolean = false,
  ): Promise<string> {
    const { error } = await supabase.storage.from(bucket).upload(path, data, {
      contentType,
      upsert,
    })

    if (error) {
      logger.error(`Storage upload error for ${path}:`, error)
      throw new Error(`File upload failed: ${error.message}`)
    }

    return path
  }

  /**
   * Download a file from Supabase Storage.
   */
  async download(bucket: string, path: string): Promise<string> {
    const { data, error } = await supabase.storage.from(bucket).download(path)

    if (error) {
      logger.error(`Storage download error for ${path}:`, error)
      throw new Error(`File download failed: ${error.message}`)
    }

    return await data.text()
  }

  /**
   * Delete files from Supabase Storage.
   * Silently logs failures but continues processing.
   */
  async deleteFiles(bucket: string, paths: string[]): Promise<number> {
    if (paths.length === 0) {
      return 0
    }

    const { error, data } = await supabase.storage.from(bucket).remove(paths)

    if (error) {
      logger.error(`Storage delete error:`, error)
      return 0
    }

    const deletedCount = data?.length ?? 0
    logger.info(`Deleted ${deletedCount} files from ${bucket}`)
    return deletedCount
  }

  /**
   * Get a signed URL for file download.
   */
  async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600,
    options?: { download?: string | boolean },
  ): Promise<string> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn, options)

    if (error) {
      logger.error(`Storage signed URL error for ${path}:`, error)
      throw new Error(`Failed to create signed URL: ${error.message}`)
    }

    return data?.signedUrl ?? ""
  }

  // ============ Convenience Methods ============

  /**
   * Delete submission files for a list of submissions.
   * @param filePaths - Array of file paths in the submissions bucket
   * @returns Number of files deleted
   */
  async deleteSubmissionFiles(filePaths: string[]): Promise<number> {
    return await this.deleteFiles("submissions", filePaths)
  }

  /**
   * Delete an avatar file.
   * @param avatarUrl - The full avatar URL or path
   * @returns True if deleted successfully
   */
  async deleteAvatar(avatarUrl: string): Promise<boolean> {
    try {
      // Extract path from URL if necessary
      let path = avatarUrl
      if (avatarUrl.includes("/avatars/")) {
        const urlParts = avatarUrl.split("/avatars/")
        path = urlParts[urlParts.length - 1]
      }

      const result = await this.deleteFiles("avatars", [path])
      return result > 0
    } catch (error) {
      logger.error("Failed to delete avatar:", error)
      return false
    }
  }

  /**
   * Delete an assignment instructions image file.
   * Accepts either a full public URL or a storage-relative path.
   */
  async deleteAssignmentInstructionsImage(imageUrl: string): Promise<boolean> {
    try {
      const storageLocation = this.parseStorageLocationFromPublicUrl(imageUrl)

      if (!storageLocation) {
        return false
      }

      const result = await this.deleteFiles(storageLocation.bucket, [
        storageLocation.path,
      ])
      return result > 0
    } catch (error) {
      logger.error("Failed to delete assignment instructions image:", error)
      return false
    }
  }

  /**
   * Parse bucket/path from a Supabase public URL or storage-relative path.
   */
  private parseStorageLocationFromPublicUrl(
    storagePublicUrl: string,
  ): { bucket: string; path: string } | null {
    if (!storagePublicUrl?.trim()) {
      return null
    }

    const parsedAbsoluteLocation =
      this.parseStorageLocationFromAbsoluteUrl(storagePublicUrl)
    if (parsedAbsoluteLocation) {
      return parsedAbsoluteLocation
    }

    const [bucketName, ...pathSegments] = storagePublicUrl.split("/")
    if (!bucketName || pathSegments.length === 0) {
      return null
    }

    const normalizedPath = pathSegments.join("/").split("?")[0]
    if (!normalizedPath) {
      return null
    }

    return { bucket: bucketName, path: normalizedPath }
  }

  /**
   * Parse bucket/path from canonical Supabase public object URLs.
   */
  private parseStorageLocationFromAbsoluteUrl(
    storagePublicUrl: string,
  ): { bucket: string; path: string } | null {
    try {
      const parsedUrl = new URL(storagePublicUrl)
      const storagePublicMarker = "/storage/v1/object/public/"
      const markerIndex = parsedUrl.pathname.indexOf(storagePublicMarker)

      if (markerIndex === -1) {
        return null
      }

      const bucketAndPath = parsedUrl.pathname.slice(
        markerIndex + storagePublicMarker.length,
      )
      const [bucketName, ...pathSegments] = bucketAndPath.split("/")

      if (!bucketName || pathSegments.length === 0) {
        return null
      }

      const decodedPath = decodeURIComponent(pathSegments.join("/"))
      if (!decodedPath) {
        return null
      }

      return {
        bucket: decodeURIComponent(bucketName),
        path: decodedPath,
      }
    } catch {
      return null
    }
  }

  /**
   * Upload a submission file.
   */
  async uploadSubmission(
    assignmentId: number,
    studentId: number,
    submissionNumber: number,
    filename: string,
    data: Buffer,
    contentType: string,
  ): Promise<string> {
    const path = `submissions/${assignmentId}/${studentId}/${submissionNumber}_${filename}`
    return await this.upload("submissions", path, data, contentType)
  }
}
