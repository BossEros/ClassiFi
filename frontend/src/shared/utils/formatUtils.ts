/**
 * Formatting utility functions for display
 */

/**
 * Format file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

/**
 * Format a full name from first and last name
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Formatted full name
 */
export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim()
}

/**
 * Add fullName property to an object with firstName and lastName
 * @param obj - Object with firstName and lastName properties
 * @returns Original object with fullName added
 */
export function withFullName<T extends { firstName: string; lastName: string }>(
  obj: T,
): T & { fullName: string } {
  return {
    ...obj,
    fullName: formatFullName(obj.firstName, obj.lastName),
  }
}

/**
 * Normalize user name from various sources
 * Handles cases where name might be empty or undefined
 * @param firstName - First name (may be undefined)
 * @param lastName - Last name (may be undefined)
 * @param fallback - Fallback value if both names are empty
 * @returns Normalized full name or fallback
 */
export function normalizeUserName(
  firstName?: string | null,
  lastName?: string | null,
  fallback: string = "Unknown User",
): string {
  const first = firstName?.trim() || ""
  const last = lastName?.trim() || ""

  if (!first && !last) return fallback
  if (!first) return last
  if (!last) return first
  return `${first} ${last}`
}
