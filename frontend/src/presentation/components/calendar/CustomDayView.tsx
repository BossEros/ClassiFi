import { useMemo } from "react"
import type { CalendarEvent } from "@/business/models/calendar/types"
import type { CalendarView } from "@/shared/utils/calendarConfig"
import { format } from "date-fns"
import { CustomViewToolbar } from "./CustomViewToolbar"
import "./CustomDayView.css"

/**
 * Layout constants for consistent sizing
 */
const LAYOUT = {
  /** Minimum height for empty time slots (pixels) */
  EMPTY_SLOT_HEIGHT: 35,
  /** Height per event in a slot (pixels) */
  EVENT_HEIGHT: 38,
  /** Padding between events in a slot (pixels) */
  SLOT_PADDING: 8,
  /** Hours in a day */
  HOURS_PER_DAY: 24,
  /** Minutes per time slot */
  MINUTES_PER_SLOT: 30,
  /** Number of time slots per day (48 = 24 hours * 2 slots per hour) */
  SLOTS_PER_DAY: 48,
} as const

interface TimeSlot {
  time: Date
  hour: number
  minute: number
  events: CalendarEvent[]
}

interface CustomDayViewProps {
  date: Date
  events: CalendarEvent[]
  onSelectEvent: (event: CalendarEvent) => void
  onNavigate: (direction: "prev" | "next" | "today") => void
  onViewChange: (view: CalendarView) => void
  currentView: CalendarView
}

/**
 * Custom Day View with Stacked Events
 *
 * Groups events by their start time and stacks them vertically.
 * Each time slot expands to fit all events at that time.
 * Uses the shared CustomViewToolbar for navigation and view switching.
 *
 * This is a custom implementation that replaces react-big-calendar's
 * default time grid for better handling of multiple events at the same time.
 */
export function CustomDayView({
  date,
  events,
  onSelectEvent,
  onNavigate,
  onViewChange,
  currentView,
}: CustomDayViewProps) {
  /**
   * Group events by their start time (hour:minute)
   */
  const timeSlots = useMemo(() => {
    // Create a map of time -> events
    const slotMap = new Map<string, CalendarEvent[]>()

    events.forEach((event) => {
      const startTime = event.timing.start
      // Round to the nearest 30-minute slot (0 or 30)
      const slotMinute =
        startTime.getMinutes() < LAYOUT.MINUTES_PER_SLOT
          ? 0
          : LAYOUT.MINUTES_PER_SLOT

      const timeKey = `${startTime.getHours()}:${slotMinute}`

      if (!slotMap.has(timeKey)) {
        slotMap.set(timeKey, [])
      }

      slotMap.get(timeKey)!.push(event)
    })

    // Convert to array and sort by time
    const slots: TimeSlot[] = []

    // Generate all time slots from 00:00 to 23:30 (30-minute intervals)
    for (let hour = 0; hour < LAYOUT.HOURS_PER_DAY; hour++) {
      for (let minute = 0; minute < 60; minute += LAYOUT.MINUTES_PER_SLOT) {
        const timeKey = `${hour}:${minute}`
        const slotEvents = slotMap.get(timeKey) || []

        const slotTime = new Date(date)
        slotTime.setHours(hour, minute, 0, 0)

        slots.push({
          time: slotTime,
          hour,
          minute,
          events: slotEvents,
        })
      }
    }

    return slots
  }, [events, date])

  /**
   * Calculate the height for a time slot based on number of events
   */
  const getSlotHeight = (eventCount: number): number => {
    if (eventCount === 0) return LAYOUT.EMPTY_SLOT_HEIGHT

    return Math.max(
      LAYOUT.EMPTY_SLOT_HEIGHT,
      eventCount * LAYOUT.EVENT_HEIGHT + LAYOUT.SLOT_PADDING,
    )
  }

  /**
   * Format time for display
   */
  const formatTime = (hour: number, minute: number): string => {
    const d = new Date()
    d.setHours(hour, minute)

    return format(d, "h:mm a")
  }

  /**
   * Format the date label for the toolbar
   */
  const dateLabel = format(date, "MMMM d, yyyy")

  return (
    <div className="custom-day-view">
      {/* Shared Toolbar */}
      <CustomViewToolbar
        label={dateLabel}
        onNavigate={onNavigate}
        onViewChange={onViewChange}
        currentView={currentView}
        navigationLabel="Day"
        labelMinWidth="200px"
      />

      {/* Time Grid */}
      <div className="day-view-grid">
        {timeSlots.map((slot, index) => {
          const slotHeight = getSlotHeight(slot.events.length)
          const isHourMark = slot.minute === 0

          return (
            <div
              key={index}
              className="time-slot-row"
              style={{ minHeight: `${slotHeight}px` }}
            >
              {/* Time Label */}
              <div className="time-label">
                {isHourMark && (
                  <span className="text-sm text-slate-400 font-medium">
                    {formatTime(slot.hour, slot.minute)}
                  </span>
                )}
              </div>

              {/* Events Column */}
              <div className="events-column">
                {/* Horizontal line */}
                <div className="time-line" />

                {/* Stacked Events */}
                {slot.events.length > 0 && (
                  <div className="events-stack">
                    {slot.events.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => onSelectEvent(event)}
                        className="event-card"
                        style={{
                          backgroundColor: event.classInfo.color,
                          borderLeftColor: event.classInfo.color,
                        }}
                        aria-label={`${event.classInfo.name}: ${event.title}`}
                      >
                        <div className="event-content">
                          <div className="event-class">
                            {event.classInfo.name}
                          </div>
                          <div className="event-title">{event.title}</div>
                          {event.assignment.status && (
                            <div className="event-status">
                              {event.assignment.status === "submitted" &&
                                "✓ Submitted"}
                              {event.assignment.status === "pending" &&
                                "⏳ Pending"}
                              {event.assignment.status === "late" && "⚠ Late"}
                              {event.assignment.status === "not-started" &&
                                "○ Not Started"}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
