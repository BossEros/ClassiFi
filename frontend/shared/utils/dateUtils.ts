/**
 * Date utility functions for formatting and deadline display
 */

/**
 * Format a date/string into a human-readable deadline format
 */
export function formatDeadline(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }
    return dateObj.toLocaleString('en-US', options)
}

/**
 * Get a color class for a deadline based on how close it is
 * - Past: red
 * - < 1 day: orange
 * - < 3 days: yellow
 * - Otherwise: gray
 */
export function getDeadlineColor(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffTime = dateObj.getTime() - now.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)

    if (diffDays < 0) return 'text-red-400'
    if (diffDays < 1) return 'text-orange-400'
    if (diffDays < 3) return 'text-yellow-400'
    return 'text-gray-400'
}
