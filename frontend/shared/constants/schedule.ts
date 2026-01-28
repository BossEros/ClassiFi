import type { DayOfWeek } from "@/business/models/dashboard/types"

/**
 * Days of the week with labels and short forms for UI display
 */
export const DAYS: { value: DayOfWeek; label: string; short: string }[] = [
  { value: "monday", label: "Monday", short: "Mon" },
  { value: "tuesday", label: "Tuesday", short: "Tue" },
  { value: "wednesday", label: "Wednesday", short: "Wed" },
  { value: "thursday", label: "Thursday", short: "Thu" },
  { value: "friday", label: "Friday", short: "Fri" },
  { value: "saturday", label: "Saturday", short: "Sat" },
  { value: "sunday", label: "Sunday", short: "Sun" },
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
