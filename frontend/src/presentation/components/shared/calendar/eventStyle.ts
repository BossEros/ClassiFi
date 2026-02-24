import type { CSSProperties } from "react"

const SOLID_MONTH_EVENT_BG = "#334155"
const SOLID_STACKED_EVENT_BG = "#2f3d52"
const SOLID_EVENT_BORDER = "rgba(148, 163, 184, 0.45)"

/**
 * Returns a neutral, solid style for month view calendar events.
 * Uses a dark tone to preserve strong contrast with white text.
 */
export function getCalendarMonthEventStyle(_classColor: string): CSSProperties {
  return {
    backgroundColor: SOLID_MONTH_EVENT_BG,
    borderLeft: `3px solid ${SOLID_EVENT_BORDER}`,
    color: "#ffffff",
  }
}

/**
 * Returns a neutral, solid style for custom day/week stacked event cards.
 */
export function getCalendarStackedEventStyle(
  _classColor: string,
): CSSProperties {
  return {
    backgroundColor: SOLID_STACKED_EVENT_BG,
    borderLeftColor: SOLID_EVENT_BORDER,
    color: "#ffffff",
  }
}
