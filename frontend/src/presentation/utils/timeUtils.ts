/**
 * Time utility functions for formatting and display
 */

/**
 * Format a 24-hour time string (HH:MM) to 12-hour format with AM/PM
 * @example formatTimeDisplay("14:30") => "2:30 PM"
 */
export function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(":")
  const hour = parseInt(h, 10)
  const suffix = hour >= 12 ? "PM" : "AM"
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${displayHour}:${m} ${suffix}`
}

/**
 * Format a millisecond duration into a human-readable time difference string.
 *
 * @param diffMs - The time difference in milliseconds.
 * @returns A compact string like "45s", "3m", "2h 15m", or "1d 6h".
 */
export function formatTimeDifference(diffMs: number): string {
  const diffMinutes = Math.floor(diffMs / 60_000)
  const diffHours = Math.floor(diffMs / 3_600_000)
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffMinutes < 1) return `${Math.floor(diffMs / 1000)}s`
  if (diffMinutes < 60) return `${diffMinutes}m`
  if (diffHours < 24) return diffMinutes % 60 === 0 ? `${diffHours}h` : `${diffHours}h ${diffMinutes % 60}m`

  return diffHours % 24 === 0 ? `${diffDays}d` : `${diffDays}d ${diffHours % 24}h`
}

/**
 * Determine temporal submission order between two timestamps.
 *
 * @param leftSubmittedAt - ISO timestamp of the left submission.
 * @param rightSubmittedAt - ISO timestamp of the right submission.
 * @returns "left" if left submitted first, "right" if right submitted first, or null if too close/unavailable.
 */
export function getTemporalOrder(
  leftSubmittedAt?: string | null,
  rightSubmittedAt?: string | null,
): "left" | "right" | null {
  if (!leftSubmittedAt || !rightSubmittedAt) return null

  const leftDate = new Date(leftSubmittedAt)
  const rightDate = new Date(rightSubmittedAt)
  const diffMs = Math.abs(leftDate.getTime() - rightDate.getTime())

  if (diffMs < 1000) return null

  return leftDate < rightDate ? "left" : "right"
}
