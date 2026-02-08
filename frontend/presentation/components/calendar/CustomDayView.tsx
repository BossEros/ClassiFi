import { useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { CalendarEvent } from "@/business/models/calendar/types"
import type { CalendarView } from "@/shared/utils/calendarConfig"
import { format } from "date-fns"
import "./CustomDayView.css"

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
 * Includes navigation toolbar for date navigation and view switching.
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
            const timeKey = `${startTime.getHours()}:${startTime.getMinutes()}`

            if (!slotMap.has(timeKey)) {
                slotMap.set(timeKey, [])
            }
            slotMap.get(timeKey)!.push(event)
        })

        // Convert to array and sort by time
        const slots: TimeSlot[] = []

        // Generate all time slots from 00:00 to 23:30 (30-minute intervals)
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
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
     * Reduced heights for more compact view
     */
    const getSlotHeight = (eventCount: number): number => {
        if (eventCount === 0) return 35 // Smaller minimum height for empty slots
        return Math.max(35, eventCount * 38 + 8) // 38px per event + 8px padding
    }

    /**
     * Format time for display
     */
    const formatTime = (hour: number, minute: number): string => {
        const date = new Date()
        date.setHours(hour, minute)
        return format(date, "h:mm a")
    }

    return (
        <div className="custom-day-view">
            {/* Toolbar */}
            <div className="custom-day-toolbar">
                {/* Left: Date Label + Navigation Controls */}
                <div className="flex items-center gap-5">
                    {/* Date Label - Show full date for day view */}
                    <h2 className="text-lg font-semibold text-white min-w-[200px]">
                        {format(date, "MMMM d, yyyy")}
                    </h2>

                    {/* Navigation Control Group */}
                    <div className="flex items-center gap-3">
                        {/* Navigation Arrows */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onNavigate("prev")}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800/80 backdrop-blur-sm border border-white/10 text-slate-200 hover:bg-slate-700 hover:text-white hover:border-white/20 transition-all duration-200 shadow-sm"
                                aria-label="Previous Day"
                                title="Previous"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <button
                                onClick={() => onNavigate("next")}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800/80 backdrop-blur-sm border border-white/10 text-slate-200 hover:bg-slate-700 hover:text-white hover:border-white/20 transition-all duration-200 shadow-sm"
                                aria-label="Next Day"
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
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${currentView === view
                                ? "bg-teal-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                                }`}
                        >
                            {view.charAt(0).toUpperCase() + view.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Time Grid - No duplicate header */}
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
                                            >
                                                <div className="event-content">
                                                    <div className="event-class">
                                                        {event.classInfo.name}
                                                    </div>
                                                    <div className="event-title">{event.title}</div>
                                                    {event.assignment.status && (
                                                        <div className="event-status">
                                                            {event.assignment.status === "submitted" && "✓ Submitted"}
                                                            {event.assignment.status === "pending" && "⏳ Pending"}
                                                            {event.assignment.status === "late" && "⚠ Late"}
                                                            {event.assignment.status === "not-started" && "○ Not Started"}
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
