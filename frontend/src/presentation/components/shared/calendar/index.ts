/**
 * Calendar Components
 *
 * This module exports all calendar-related components for the ClassiFi application.
 * Components are designed for use with React Big Calendar and follow ClassiFi's
 * dark theme design system.
 */

// Control Components
export {
  CalendarViewToggle,
  type CalendarViewToggleProps,
} from "./CalendarViewToggle"
export { CalendarFilters, type CalendarFiltersProps } from "./CalendarFilters"

// Modal Components
export {
  EventDetailsModal,
  type EventDetailsModalProps,
} from "./EventDetailsModal"

// Composite Components
export {
  ClassCalendarTab,
  type ClassCalendarTabProps,
} from "./ClassCalendarTab"

// React Big Calendar Customizations
export { CustomEventComponent } from "./CustomEventComponent"
export { CustomToolbar } from "./CustomToolbar"
export { CustomDayView } from "./CustomDayView"
export { CustomWeekView } from "./CustomWeekView"
export {
  CustomViewToolbar,
  type CustomViewToolbarProps,
} from "./CustomViewToolbar"
