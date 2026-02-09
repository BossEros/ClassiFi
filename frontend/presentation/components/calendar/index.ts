/**
 * Calendar Components
 *
 * This module exports all calendar-related components for the ClassiFi application.
 * Components are designed for use with React Big Calendar and follow ClassiFi's
 * dark theme design system.
 */

// Layout Components
export { CalendarHeader } from "./CalendarHeader"
export {
  CalendarNavigation,
  type CalendarNavigationProps,
} from "./CalendarNavigation"

// Control Components
export {
  CalendarViewToggle,
  type CalendarViewToggleProps,
} from "./CalendarViewToggle"
export { CalendarFilters, type CalendarFiltersProps } from "./CalendarFilters"

// React Big Calendar Customizations
export { CustomEventComponent } from "./CustomEventComponent"
export { CustomToolbar } from "./CustomToolbar"
export { CustomDayView } from "./CustomDayView"
export { CustomWeekView } from "./CustomWeekView"
