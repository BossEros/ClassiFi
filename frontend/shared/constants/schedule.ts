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
