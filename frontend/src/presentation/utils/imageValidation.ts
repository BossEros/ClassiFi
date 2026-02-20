/**
 * Image validation rules used by presentation upload flows.
 */
export const FILE_VALIDATION = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ACCEPTED_IMAGE_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ] as const,
} as const

/**
 * Validates an image file for upload.
 *
 * @param file - The file to validate.
 * @returns Error message if invalid, otherwise null.
 */
export function validateImageFile(file: File): string | null {
  const acceptedTypes: readonly string[] = FILE_VALIDATION.ACCEPTED_IMAGE_TYPES

  if (!acceptedTypes.includes(file.type)) {
    return "Please select a valid image file (JPEG, PNG, GIF, or WebP)"
  }

  if (file.size > FILE_VALIDATION.MAX_IMAGE_SIZE) {
    return "File size must be less than 5MB"
  }

  return null
}
