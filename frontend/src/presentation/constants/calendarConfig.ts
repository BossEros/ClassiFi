/**
 * Calendar Configuration
 *
 * This module configures the date-fns localizer for React Big Calendar.
 * The localizer handles date formatting, parsing, and manipulation for the calendar component.
 */

import { dateFnsLocalizer } from "react-big-calendar"
import { format, parse, startOfWeek, getDay } from "date-fns"
import { enUS } from "date-fns/locale"
import type { CalendarView } from "@/business/models/calendar/types"

/**
 * Date-fns localizer configuration for React Big Calendar.
 *
 * This localizer provides date manipulation functions that React Big Calendar
 * uses internally for rendering and navigation.
 */
export const calendarLocalizer = dateFnsLocalizer({
  /**
   * Formats a date according to the specified format string.
   * Uses date-fns format function.
   */
  format,

  /**
   * Parses a date string according to the specified format.
   * Uses date-fns parse function.
   */
  parse,

  /**
   * Returns the start of the week for a given date.
   * Uses date-fns startOfWeek function.
   */
  startOfWeek,

  /**
   * Returns the day of the week (0-6, Sunday-Saturday).
   * Uses date-fns getDay function.
   */
  getDay,

  /**
   * Locale configuration for date formatting.
   * Uses US English locale by default.
   */
  locales: {
    "en-US": enUS,
  },
})

/**
 * Default calendar configuration options.
 */
export const defaultCalendarConfig = {
  /** Default view to display */
  defaultView: "month" as CalendarView,

  /** Available views */
  views: ["month", "week", "day"] as CalendarView[],

  /** Start of week (0 = Sunday) */
  startOfWeek: 0,

  /** Enable popup on event click */
  popup: false,

  /** Enable selection of date ranges */
  selectable: false,

  /** Show all-day row */
  showAllDay: false,
}
