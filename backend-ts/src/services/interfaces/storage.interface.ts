export interface IStorageService {
  /**
   * Upload a file to storage.
   * @param bucket - The storage bucket name
   * @param path - The file path within the bucket
   * @param data - The file data as a Buffer
   * @param contentType - The MIME type of the file
   * @param upsert - Whether to overwrite existing file
   * @returns The file path if successful
   */
  upload(
    bucket: string,
    path: string,
    data: Buffer,
    contentType: string,
    upsert?: boolean,
  ): Promise<string>

  /**
   * Download a file from storage.
   * @param bucket - The storage bucket name
   * @param path - The file path within the bucket
   * @returns The file content as a string
   */
  download(bucket: string, path: string): Promise<string>

  /**
   * Delete files from storage.
   * @param bucket - The storage bucket name
   * @param paths - Array of file paths to delete
   * @returns Number of files successfully deleted
   */
  deleteFiles(bucket: string, paths: string[]): Promise<number>

  /**
   * Get a signed URL for file download.
   * @param bucket - The storage bucket name
   * @param path - The file path within the bucket
   * @param expiresIn - URL expiration time in seconds
   * @param options - Additional options for the signed URL
   * @returns The signed URL
   */
  getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number,
    options?: { download?: string | boolean },
  ): Promise<string>

  /**
   * Delete an assignment description image.
   * @param imageUrl - Public URL or storage path of the description image
   * @returns True if deleted successfully
   */
  deleteAssignmentDescriptionImage?(imageUrl: string): Promise<boolean>
}

/** Dependency injection token for IStorageService */
export const STORAGE_SERVICE_TOKEN = "IStorageService"
