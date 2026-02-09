import { useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
} from "date-fns"
import type { CalendarEvent } from "@/business/models/calendar/types"
import type { CalendarView } from "@/shared/utils/calendarConfig"
import "./CustomWeekView.css"

interface DayColumn {
  date: Date
  isToday: boolean
  timeSlots: TimeSlot[]
}

interface TimeSlot {
  time: Date
  hour: number
  minute: number
  events: CalendarEvent[]
}

interface CustomWeekViewProps {
  date: Date
  events: CalendarEvent[]
  onSelectEvent: (event: CalendarEvent) => void
  onNavigate: (direction: "prev" | "next" | "today") => void
  onViewChange: (view: CalendarView) => void
  currentView: CalendarView
}

/**
 * Custom Week View with Stacked Events
 *
 * Displays a 7-day week grid where events at the same time are stacked
 * vertically instead of displayed side-by-side. Each day column contains
 * time slots that expand to fit all events at that time.
 *
 * This is a custom implementation that replaces react-big-calendar's
 * default week view for better handling of multiple events at the same time.
 */
export function CustomWeekView({
  date,
  events,
  onSelectEvent,
  onNavigate,
  onViewChange,
  currentView,
}: CustomWeekViewProps) {
  /**
   * Calculate the week range (Sunday to Saturday)
   */
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(date, { weekStartsOn: 0 })
    const weekEnd = endOfWeek(date, { weekStartsOn: 0 })

    return eachDayOfInterval({ start: weekStart, end: weekEnd })
  }, [date])

  /**
   * Group events by day and time slot
   */
  const dayColumns = useMemo((): DayColumn[] => {
    return weekDays.map((day) => {
      // Filter events for this day
      const dayEvents = events.filter((event) =>
        isSameDay(event.timing.start, day),
      )

      // Create time slots map
      const slotMap = new Map<string, CalendarEvent[]>()

      dayEvents.forEach((event) => {
        const startTime = event.timing.start
        // Round to the nearest 30-minute slot (0 or 30)
        const slotMinute = startTime.getMinutes() < 30 ? 0 : 30
        const timeKey = `${startTime.getHours()}:${slotMinute}`

        if (!slotMap.has(timeKey)) {
          slotMap.set(timeKey, [])
        }

        slotMap.get(timeKey)!.push(event)
      })

      // Generate time slots from 00:00 to 23:30 (30-minute intervals)
      const timeSlots: TimeSlot[] = []

      for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeKey = `${hour}:${minute}`
          const slotEvents = slotMap.get(timeKey) || []

          const slotTime = new Date(day)
          slotTime.setHours(hour, minute, 0, 0)

          timeSlots.push({
            time: slotTime,
            hour,
            minute,
            events: slotEvents,
          })
        }
      }

      return {
        date: day,
        isToday: isToday(day),
        timeSlots,
      }
    })
  }, [weekDays, events])

  /**
   * Get the maximum event count for each time slot across all days
   * This ensures consistent row heights across columns
   */
  const getRowHeight = (slotIndex: number): number => {
    const maxEvents = Math.max(
      ...dayColumns.map((col) => col.timeSlots[slotIndex]?.events.length || 0),
    )

    if (maxEvents === 0) return 35

    return Math.max(35, maxEvents * 38 + 8)
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
   * Get week range text for header
   */
  const weekRangeText = useMemo(() => {
    const weekStart = weekDays[0]
    const weekEnd = weekDays[6]

    if (weekStart.getMonth() === weekEnd.getMonth()) {
      return `${format(weekStart, "MMMM d")} - ${format(weekEnd, "d, yyyy")}`
    }

    return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`
  }, [weekDays])

  return (
    <div className="custom-week-view">
      {/* Toolbar */}
      <div className="custom-week-toolbar">
        {/* Left: Date Label + Navigation Controls */}
        <div className="flex items-center gap-5">
          {/* Date Label */}
          <h2 className="text-lg font-semibold text-white min-w-[240px]">
            {weekRangeText}
          </h2>

          {/* Navigation Control Group */}
          <div className="flex items-center gap-3">
            {/* Navigation Arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate("prev")}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800/80 backdrop-blur-sm border border-white/10 text-slate-200 hover:bg-slate-700 hover:text-white hover:border-white/20 transition-all duration-200 shadow-sm"
                aria-label="Previous Week"
                title="Previous"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() => onNavigate("next")}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800/80 backdrop-blur-sm border border-white/10 text-slate-200 hover:bg-slate-700 hover:text-white hover:border-white/20 transition-all duration-200 shadow-sm"
                aria-label="Next Week"
                title="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Today Button */}
            <button
              onClick={() => onNavigate("today")}
              className="px-4 py-1.5 text-sm font-medium bg-slate-800/80 backdrop-blur-sm border border-white/10 text-slate-200 rounded-lg hover:bg-slate-700 hover:text-white hover:border-white/20 transition-all duration-200 shadow-sm"
            >
              Today
            </button>
          </div>
        </div>

        {/* Right: View Toggle */}
        <div className="flex items-center bg-slate-800/80 border border-white/10 rounded-lg p-1">
          {(["month", "week", "day"] as const).map((view) => (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${
                currentView === view
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Week Grid */}
      <div className="week-view-container">
        {/* Day Headers */}
        <div className="week-header">
          <div className="time-gutter-header" />
          {dayColumns.map((col) => (
            <div
              key={col.date.toISOString()}
              className={`day-header ${col.isToday ? "day-header-today" : ""}`}
            >
              <span className="day-name">{format(col.date, "EEE")}</span>
              <span
                className={`day-number ${col.isToday ? "today-number" : ""}`}
              >
                {format(col.date, "d")}
              </span>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="week-view-grid">
          {/* Generate rows for each time slot */}
          {Array.from({ length: 48 }).map((_, slotIndex) => {
            const hour = Math.floor(slotIndex / 2)
            const minute = (slotIndex % 2) * 30
            const isHourMark = minute === 0
            const rowHeight = getRowHeight(slotIndex)

            return (
              <div
                key={slotIndex}
                className="time-slot-row"
                style={{ minHeight: `${rowHeight}px` }}
              >
                {/* Time Label */}
                <div className="time-gutter">
                  {isHourMark && (
                    <span className="time-label-text">
                      {formatTime(hour, minute)}
                    </span>
                  )}
                </div>

                {/* Day Columns */}
                {dayColumns.map((col) => {
                  const slot = col.timeSlots[slotIndex]

                  return (
                    <div
                      key={col.date.toISOString()}
                      className={`day-cell ${col.isToday ? "day-cell-today" : ""}`}
                    >
                      {/* Stacked Events */}
                      {slot.events.length > 0 && (
                        <div className="week-events-stack">
                          {slot.events.map((event) => (
                            <button
                              key={event.id}
                              onClick={() => onSelectEvent(event)}
                              className="week-event-card"
                              style={{
                                backgroundColor: event.classInfo.color,
                                borderLeftColor: event.classInfo.color,
                              }}
                              title={`${event.classInfo.name}: ${event.title}`}
                            >
                              <div className="week-event-content">
                                <div className="week-event-title">
                                  {event.title}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
