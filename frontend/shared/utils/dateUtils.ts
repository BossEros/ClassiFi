/**
 * Date utility functions for formatting and deadline display
 */

/**
 * Format a date/string into a human-readable deadline format
 */
export function formatDeadline(date: Date | string | null | undefined): string {
  if (!date) {
    return "No deadline"
  }

  const dateObj = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(dateObj.getTime())) {
    return "No deadline"
  }

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
  return dateObj.toLocaleString("en-US", options)
}

/**
 * Get a color class for a deadline based on how close it is
 * - Past: red
 * - < 1 day: orange
 * - < 3 days: yellow
 * - Otherwise: gray
 */
export function getDeadlineColor(
  date: Date | string | null | undefined,
): string {
  if (!date) return "text-gray-400"

  const dateObj = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(dateObj.getTime())) return "text-gray-400"

  const now = new Date()
  const diffTime = dateObj.getTime() - now.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)

  if (diffDays < 0) return "text-red-400"
  if (diffDays < 1) return "text-orange-400"
  if (diffDays < 3) return "text-yellow-400"
  return "text-gray-400"
}

/**
 * Get the current academic year in YYYY-YYYY format
 * If past June, uses current-next year; otherwise uses previous-current year
 * @example In August 2024: "2024-2025", In February 2024: "2023-2024"
 */
export function getCurrentAcademicYear(): string {
  const now = new Date()
  const currentYear = now.getFullYear()
  // If we're past June, use current-next year, otherwise use previous-current year
  const startYear = now.getMonth() >= 5 ? currentYear : currentYear - 1
  return `${startYear}-${startYear + 1}`
}

/**
 * Format a date as relative time (e.g., "5 minutes ago", "2 days ago")
 */
export function formatTimeAgo(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffTime = now.getTime() - dateObj.getTime()
  const diffMinutes = Math.floor(diffTime / (1000 * 60))
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return "Just now"
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`

  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Check if a submission date is past the deadline
 */
export function isLateSubmission(
  submittedAt: Date | string,
  deadline: Date | string | null | undefined,
): boolean {
  if (!deadline) {
    return false
  }

  const submitted =
    typeof submittedAt === "string" ? new Date(submittedAt) : submittedAt
  const due = typeof deadline === "string" ? new Date(deadline) : deadline

  if (Number.isNaN(submitted.getTime()) || Number.isNaN(due.getTime())) {
    return false
  }

  return submitted.getTime() > due.getTime()
}

/**
 * Format time remaining until a deadline (e.g., "3d 5h", "2h 30m", "Past due")
 */
export function formatTimeRemaining(
  deadline: Date | string | null | undefined,
): string {
  if (!deadline) return "No deadline"

  const dateObj = typeof deadline === "string" ? new Date(deadline) : deadline
  if (Number.isNaN(dateObj.getTime())) return "No deadline"

  const diff = dateObj.getTime() - new Date().getTime()

  if (diff <= 0) return "Past due"

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days}d ${hours}h`
  return `${hours}h ${minutes}m`
}

/**
 * Get human-readable deadline status (e.g., "Due today", "Due in 3 days", "Overdue")
 */
export function getDeadlineStatus(
  deadline: Date | string | null | undefined,
): string {
  if (!deadline) {
    return "No deadline"
  }

  const dateObj = typeof deadline === "string" ? new Date(deadline) : deadline
  if (Number.isNaN(dateObj.getTime())) {
    return "No deadline"
  }

  const now = new Date()

  // Normalize both dates to midnight (start of day) for calendar date comparison
  const deadlineDate = new Date(
    dateObj.getFullYear(),
    dateObj.getMonth(),
    dateObj.getDate(),
  )
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Calculate day difference using normalized dates
  const diff = deadlineDate.getTime() - todayDate.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days < 0) return "Overdue"
  if (days === 0) return "Due today"
  if (days === 1) return "Due tomorrow"
  return `Due in ${days} days`
}

/**
 * Format a date/string into a consistent datetime format
 * Used for displaying submission times, etc.
 */
export function formatDateTime(
  date: Date | string | null | undefined,
): string {
  if (!date) {
    return "No deadline"
  }

  const dateObj = typeof date === "string" ? new Date(date) : date
  if (Number.isNaN(dateObj.getTime())) {
    return "No deadline"
  }

  return dateObj.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

/**
 * Month names for date pickers and calendars
 */
export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const

/**
 * Short day names for calendar headers
 */
export const DAY_NAMES_SHORT = [
  "Su",
  "Mo",
  "Tu",
  "We",
  "Th",
  "Fr",
  "Sa",
] as const

/**
 * Validates if a Date object is valid
 */
export function isValidDate(date: Date | null): date is Date {
  return date !== null && !isNaN(date.getTime())
}

/**
 * Converts a Date or ISO date string to a local datetime string
 * suitable for HTML datetime-local inputs (format: YYYY-MM-DDTHH:mm).
 * Adjusts for the local timezone offset.
 */
export function toLocalDateTimeString(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  // Clone the date to avoid mutating the original
  const cloned = new Date(d.getTime())
  cloned.setMinutes(cloned.getMinutes() - cloned.getTimezoneOffset())
  return cloned.toISOString().slice(0, 16)
}
