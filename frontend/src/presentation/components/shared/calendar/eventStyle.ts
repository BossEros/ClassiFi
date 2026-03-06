import type { CSSProperties } from "react"

const FALLBACK_CLASS_COLOR = "#0f766e"

/**
 * Converts a hex color to rgba with opacity.
 */
function toRgba(hexColor: string, alpha: number): string {
  const normalized = hexColor.replace("#", "")
  const fullHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized

  const red = Number.parseInt(fullHex.slice(0, 2), 16)
  const green = Number.parseInt(fullHex.slice(2, 4), 16)
  const blue = Number.parseInt(fullHex.slice(4, 6), 16)

  if ([red, green, blue].some((value) => Number.isNaN(value))) {
    return `rgba(15, 118, 110, ${alpha})`
  }

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

/**
 * Normalizes class color with fallback.
 */
function getClassColor(classColor: string): string {
  return classColor?.trim() || FALLBACK_CLASS_COLOR
}

/**
 * Returns a light style for month view calendar events.
 */
export function getCalendarMonthEventStyle(classColor: string): CSSProperties {
  const accentColor = getClassColor(classColor)

  return {
    backgroundColor: toRgba(accentColor, 0.16),
    borderLeft: `3px solid ${accentColor}`,
    border: `1px solid ${toRgba(accentColor, 0.28)}`,
    color: "#0f172a",
  }
}

/**
 * Returns a light style for custom day/week stacked event cards.
 */
export function getCalendarStackedEventStyle(
  classColor: string,
): CSSProperties {
  const accentColor = getClassColor(classColor)

  return {
    backgroundColor: toRgba(accentColor, 0.14),
    borderColor: toRgba(accentColor, 0.3),
    borderLeftColor: accentColor,
    color: "#0f172a",
  }
}
