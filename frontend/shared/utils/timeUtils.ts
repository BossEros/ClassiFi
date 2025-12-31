/**
 * Time utility functions for formatting and display
 */

/**
 * Format a 24-hour time string (HH:MM) to 12-hour format with AM/PM
 * @example formatTimeDisplay("14:30") => "2:30 PM"
 */
export function formatTimeDisplay(time: string): string {
    const [h, m] = time.split(':')
    const hour = parseInt(h, 10)
    const suffix = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${m} ${suffix}`
}
