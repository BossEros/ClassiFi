import type { DayOfWeek } from "@/shared/types/class"

/**
 * Days of the week with labels and short forms for UI display
 */
export const DAYS: {
  value: DayOfWeek
  label: string
  short: string
  abbr: string
}[] = [
  { value: "monday", label: "Monday", short: "Mon", abbr: "M" },
  { value: "tuesday", label: "Tuesday", short: "Tue", abbr: "T" },
  { value: "wednesday", label: "Wednesday", short: "Wed", abbr: "W" },
  { value: "thursday", label: "Thursday", short: "Thu", abbr: "TH" },
  { value: "friday", label: "Friday", short: "Fri", abbr: "F" },
  { value: "saturday", label: "Saturday", short: "Sat", abbr: "S" },
  { value: "sunday", label: "Sunday", short: "Sun", abbr: "SU" },
]

/**
 * Generate time options in 30-minute intervals from 6:00 AM to 9:30 PM
 */
function generateTimeOptions(): string[] {
  const times: string[] = []
  for (let hour = 6; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour.toString().padStart(2, "0")
      const m = minute.toString().padStart(2, "0")
      times.push(`${h}:${m}`)
    }
  }
  return times
}

/**
 * Pre-generated time options for schedule dropdowns
 */
export const TIME_OPTIONS = generateTimeOptions()

/**
 * Array of day abbreviations for UI display (buttons, etc.)
 */
export const DAY_ABBREVIATIONS = DAYS.map((day) => day.short)

/**
 * Convert abbreviated day strings (e.g., "Mon", "Tue") to DayOfWeek values
 * @param abbreviatedDays - Array of day abbreviations
 * @returns Array of DayOfWeek values
 * @example convertToDayOfWeek(["Mon", "Wed", "Fri"]) → ["monday", "wednesday", "friday"]
 */
export function convertToDayOfWeek(abbreviatedDays: string[]): DayOfWeek[] {
  return abbreviatedDays
    .map((abbr) => {
      const day = DAYS.find((d) => d.short === abbr)
      return day?.value
    })
    .filter((day): day is DayOfWeek => day !== undefined)
}

/**
 * Convert DayOfWeek values to abbreviated day strings (e.g., "Mon", "Tue")
 * @param daysOfWeek - Array of DayOfWeek values
 * @returns Array of day abbreviations
 * @example convertToAbbreviations(["monday", "wednesday", "friday"]) → ["Mon", "Wed", "Fri"]
 */
export function convertToAbbreviations(daysOfWeek: DayOfWeek[]): string[] {
  return daysOfWeek
    .map((dayOfWeek) => {
      const day = DAYS.find((d) => d.value === dayOfWeek)
      return day?.short
    })
    .filter((abbr): abbr is string => abbr !== undefined)
}

/**
 * Convert DayOfWeek values to single-letter abbreviations (e.g., "M", "W", "F")
 * Uses academic convention: M, T, W, TH (Thursday), F, S, SU (Sunday)
 * @param daysOfWeek - Array of DayOfWeek values
 * @returns Array of single-letter day abbreviations
 * @example convertToSingleLetterAbbr(["monday", "wednesday", "friday"]) → ["M", "W", "F"]
 * @example convertToSingleLetterAbbr(["tuesday", "thursday"]) → ["T", "TH"]
 */
export function convertToSingleLetterAbbr(daysOfWeek: DayOfWeek[]): string[] {
  return daysOfWeek
    .map((dayOfWeek) => {
      const day = DAYS.find((d) => d.value === dayOfWeek)
      return day?.abbr
    })
    .filter((abbr): abbr is string => abbr !== undefined)
}

/**
 * Formats a time string from 24-hour format to 12-hour format with AM/PM.
 * @param time - Time string in 24-hour format (e.g., "08:00", "14:30")
 * @returns Time string in 12-hour format (e.g., "8:00 AM", "2:30 PM")
 * @example formatTime12Hour("08:00") → "8:00 AM"
 * @example formatTime12Hour("14:30") → "2:30 PM"
 */
export function formatTime12Hour(time: string): string {
  const [hourStr, minute] = time.split(":")
  const hour = parseInt(hourStr, 10)

  if (isNaN(hour)) {
    return time
  }

  const period = hour >= 12 ? "PM" : "AM"
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour

  return `${hour12}:${minute} ${period}`
}

/**
 * Formats a time range from 24-hour format to 12-hour format with AM/PM.
 * Optimizes display by showing AM/PM once if both times are in the same period.
 * @param startTime - Start time in 24-hour format (e.g., "08:00")
 * @param endTime - End time in 24-hour format (e.g., "09:30")
 * @returns Formatted time range (e.g., "8:00 - 9:30 AM" or "11:30 AM - 1:00 PM")
 * @example formatTimeRange("08:00", "09:30") → "8:00 - 9:30 AM"
 * @example formatTimeRange("11:30", "13:00") → "11:30 AM - 1:00 PM"
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  const [startHourStr] = startTime.split(":")
  const [endHourStr] = endTime.split(":")
  const startHour = parseInt(startHourStr, 10)
  const endHour = parseInt(endHourStr, 10)

  const startPeriod = startHour >= 12 ? "PM" : "AM"
  const endPeriod = endHour >= 12 ? "PM" : "AM"

  const formattedStart = formatTime12Hour(startTime).replace(
    ` ${startPeriod}`,
    "",
  )
  const formattedEnd = formatTime12Hour(endTime)

  if (startPeriod === endPeriod) {
    return `${formattedStart} - ${formattedEnd}`
  }

  return `${formattedStart} ${startPeriod} - ${formattedEnd}`
}
