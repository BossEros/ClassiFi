import type { Schedule } from "@/shared/types/class"
import {
  convertToSingleLetterAbbr,
  formatTimeRange,
} from "@/shared/constants/schedule"

/**
 * Formats a schedule object into a human-readable string using academic conventions.
 * Uses single-letter day abbreviations (M, T, W, TH, F, S, SU) and 12-hour time format.
 *
 * @param schedule - The schedule object containing days, startTime, and endTime.
 * @returns A formatted string like "MWF 8:00 - 9:30 AM" or null if schedule is missing.
 *
 * @example
 * formatSchedule({
 *   days: ["monday", "wednesday", "friday"],
 *   startTime: "14:00",
 *   endTime: "15:30"
 * })
 * // Returns: "MWF 2:00 - 3:30 PM"
 *
 * @example
 * formatSchedule({
 *   days: ["tuesday", "thursday"],
 *   startTime: "11:30",
 *   endTime: "13:00"
 * })
 * // Returns: "TTH 11:30 AM - 1:00 PM"
 *
 * @example
 * formatSchedule(null)
 * // Returns: null
 */
export function formatSchedule(
  schedule: Schedule | null | undefined,
): string | null {
  if (!schedule) {
    return null
  }

  const { days, startTime, endTime } = schedule

  if (!days || days.length === 0) {
    return null
  }

  if (!startTime || !endTime) {
    return null
  }

  const dayAbbreviations = convertToSingleLetterAbbr(days)
  const daysString = dayAbbreviations.join("")
  const timeString = formatTimeRange(startTime, endTime)

  return `${daysString} ${timeString}`
}
