/**
 * Shared validation utilities
 */

/**
 * Validates that an ID is a positive number
 * @param id - The ID to validate
 * @param fieldName - Name of the field for error message (e.g., 'class', 'teacher', 'student')
 * @throws Error if ID is invalid
 */
export function validateId(
  id: number | undefined | null,
  fieldName: string,
): void {
  if (!id || id <= 0) {
    throw new Error(`Invalid ${fieldName} ID`)
  }
}

/**
 * Validates multiple IDs at once
 * @param ids - Object with fieldName as key and id as value
 * @throws Error if any ID is invalid
 */
export function validateIds(
  ids: Record<string, number | undefined | null>,
): void {
  for (const [fieldName, id] of Object.entries(ids)) {
    validateId(id, fieldName)
  }
}

/**
 * File validation constants
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
 * Validates an image file for upload
 * @param file - The file to validate
 * @returns Error message if invalid, null if valid
 */
export function validateImageFile(file: File): string | null {
  const acceptedTypes: readonly string[] =
    FILE_VALIDATION.ACCEPTED_IMAGE_TYPES

  if (!acceptedTypes.includes(file.type)) {
    return "Please select a valid image file (JPEG, PNG, GIF, or WebP)"
  }

  if (file.size > FILE_VALIDATION.MAX_IMAGE_SIZE) {
    return "File size must be less than 5MB"
  }

  return null
}
