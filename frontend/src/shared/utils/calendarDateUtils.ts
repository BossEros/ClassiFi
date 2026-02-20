import { endOfWeek, format, startOfWeek } from "date-fns"

export type CalendarDateView = "month" | "week" | "day" | "agenda"

/**
 * Formats a date for calendar UI display.
 *
 * @param date - Date value to format.
 * @param view - Optional calendar view mode.
 * @returns Formatted date string.
 */
export function formatCalendarDate(
  date: Date,
  view?: CalendarDateView,
): string {
  if (!view) {
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  switch (view) {
    case "month":
      return format(date, "MMMM yyyy")

    case "week": {
      const weekStart = startOfWeek(date, { weekStartsOn: 0 })
      const weekEnd = endOfWeek(date, { weekStartsOn: 0 })

      if (format(weekStart, "MMM") === format(weekEnd, "MMM")) {
        return `${format(weekStart, "MMM d")}-${format(weekEnd, "d")}, ${format(weekEnd, "yyyy")}`
      }

      return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}, ${format(weekEnd, "yyyy")}`
    }

    case "day":
      return format(date, "MMMM d, yyyy")

    case "agenda":
      return format(date, "MMMM yyyy")

    default:
      return format(date, "MMMM yyyy")
  }
}
