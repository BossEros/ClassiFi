import { AlertCircle, CheckCircle, Clock } from "lucide-react"
import type { CalendarEvent } from "@/business/models/calendar/types"

interface CustomEventComponentProps {
  event: CalendarEvent
  title: string
}

/**
 * Custom event component for React Big Calendar.
 * Renders content only so month view uses a single card container from `.rbc-event`.
 *
 * @param event - The calendar event to display.
 * @param title - The event title provided by React Big Calendar.
 * @returns Calendar event content.
 */
export function CustomEventComponent({
  event,
  title,
}: CustomEventComponentProps) {
  /**
   * Returns the appropriate status icon based on the event status.
   */
  const getStatusIcon = () => {
    if (!event.assignment.status) {
      return null
    }

    switch (event.assignment.status) {
      case "submitted":
        return (
          <CheckCircle
            className="w-3 h-3 text-green-300 flex-shrink-0"
            aria-label="Submitted"
          />
        )
      case "pending":
        return (
          <Clock
            className="w-3 h-3 text-yellow-300 flex-shrink-0"
            aria-label="Pending"
          />
        )
      case "late":
        return (
          <AlertCircle
            className="w-3 h-3 text-red-300 flex-shrink-0"
            aria-label="Late"
          />
        )
      case "not-started":
        return (
          <Clock
            className="w-3 h-3 text-white/60 flex-shrink-0"
            aria-label="Not started"
          />
        )
      default:
        return null
    }
  }

  return (
    <div
      className="h-full min-w-0 text-xs overflow-hidden"
      role="button"
      tabIndex={0}
      aria-label={title}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {getStatusIcon()}
        <span className="truncate font-semibold text-white text-[11px] leading-tight">
          {title}
        </span>
      </div>
    </div>
  )
}
