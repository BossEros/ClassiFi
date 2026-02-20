import { useEffect, useMemo, useCallback } from "react"
import { Calendar, type View, type ToolbarProps } from "react-big-calendar"
import { useClassCalendar } from "@/presentation/hooks/shared/useClassCalendar"
import { CustomEventComponent } from "./CustomEventComponent"
import { CustomToolbar } from "./CustomToolbar"
import { CustomDayView } from "./CustomDayView"
import { CustomWeekView } from "./CustomWeekView"
import { EventDetailsModal } from "./EventDetailsModal"
import { calendarLocalizer } from "@/presentation/constants/calendarConfig"
import { useToast } from "@/presentation/context/ToastContext"
import type { CalendarEvent } from "@/business/models/calendar/types"
import type { CalendarView } from "@/business/models/calendar/types"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "@/presentation/pages/shared/CalendarPage.css"

// ============================================================================
// Types
// ============================================================================

export interface ClassCalendarTabProps {
  /** The ID of the class to display events for */
  classId: number
  /** The display name of the class */
  className: string
}

// ============================================================================
// Component
// ============================================================================

/**
 * Calendar tab content for the ClassDetailPage.
 *
 * Displays a month/week/day calendar showing only assignments from the
 * specified class. Supports navigation, view switching, and event details modal.
 *
 * @param classId - The class whose assignments to display
 * @param className - Display name used for color and label generation
 * @returns Calendar UI scoped to a single class
 */
export function ClassCalendarTab({
  classId,
  className,
}: ClassCalendarTabProps) {
  const {
    currentDate,
    currentView,
    filteredEvents,
    selectedEvent,
    isLoading,
    error,
    navigatePeriod,
    navigateToDate,
    changeView,
    openEventDetails,
    closeEventDetails,
    refetchEvents,
  } = useClassCalendar({ classId, className })

  const { showToast } = useToast()

  // ============================================================================
  // Side Effects
  // ============================================================================

  useEffect(() => {
    if (error) {
      showToast(error, "error")
    }
  }, [error, showToast])

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleNavigate = (
    _newDate: Date,
    _view: View,
    action: "PREV" | "NEXT" | "TODAY" | "DATE",
  ) => {
    if (action === "PREV") {
      navigatePeriod("prev")
    } else if (action === "NEXT") {
      navigatePeriod("next")
    } else if (action === "TODAY") {
      navigatePeriod("today")
    } else if (action === "DATE") {
      navigateToDate(_newDate)
    }
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    openEventDetails(event)
  }

  const handleShowMore = (_events: CalendarEvent[], date: Date) => {
    navigateToDate(date)
    changeView("day")
  }

  // ============================================================================
  // Style Getters
  // ============================================================================

  const eventStyleGetter = (event: CalendarEvent) => ({
    style: {
      backgroundColor: event.classInfo.color,
      borderLeft: `3px solid ${event.classInfo.color}`,
      color: "white",
    },
  })

  const dayStyleGetter = (date: Date) => {
    const today = new Date()

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()

    if (isToday) {
      return { className: "rbc-today-highlight" }
    }

    return {}
  }

  // ============================================================================
  // View Conversion
  // ============================================================================

  const convertToCalendarView = useCallback((view: View): CalendarView => {
    if (
      view === "month" ||
      view === "week" ||
      view === "day" ||
      view === "agenda"
    ) {
      return view as CalendarView
    }

    return "month"
  }, [])

  // ============================================================================
  // Toolbar Wrapper
  // ============================================================================

  const ToolbarWrapper = useMemo(
    () =>
      function MemoizedToolbarWrapper(
        props: ToolbarProps<CalendarEvent, object>,
      ) {
        return (
          <CustomToolbar
            {...props}
            currentView={currentView as View}
            onViewChange={(view: View) =>
              changeView(convertToCalendarView(view))
            }
          />
        )
      },
    [currentView, changeView, convertToCalendarView],
  )

  // ============================================================================
  // Empty State Copy
  // ============================================================================

  const emptyStateCopy = useMemo(() => {
    switch (currentView) {
      case "day":
        return {
          title: "No assignment deadlines found for this day.",
          subtitle: "Try navigating to a different day.",
        }
      case "week":
        return {
          title: "No assignment deadlines found for this week.",
          subtitle: "Try navigating to a different week.",
        }
      default:
        return {
          title: "No assignment deadlines found for this month.",
          subtitle: "Try navigating to a different month.",
        }
    }
  }, [currentView])

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="flex flex-col" style={{ minHeight: "600px" }}>
      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start justify-between">
          <div className="flex-1">
            <p className="text-red-400 text-sm font-medium mb-1">
              Failed to load calendar events
            </p>
            <p className="text-red-400/70 text-xs">{error}</p>
          </div>

          <button
            onClick={refetchEvents}
            className="ml-4 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="relative flex-1 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden min-h-[500px]">
          {/* Skeleton Toolbar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 animate-pulse" />
              <div className="w-32 h-5 rounded bg-slate-800 animate-pulse" />
              <div className="w-8 h-8 rounded-lg bg-slate-800 animate-pulse" />
            </div>

            <div className="flex gap-2">
              <div className="w-16 h-8 rounded-lg bg-slate-800 animate-pulse" />
              <div className="w-16 h-8 rounded-lg bg-slate-800 animate-pulse" />
              <div className="w-16 h-8 rounded-lg bg-slate-800 animate-pulse" />
            </div>
          </div>

          {/* Skeleton Grid */}
          <div className="p-4">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="w-8 h-3 mx-auto rounded bg-slate-800 animate-pulse mb-2" />
                  <div className="w-6 h-6 mx-auto rounded-full bg-slate-800 animate-pulse" />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {[...Array(5)].map((_, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-7 gap-2">
                  {[...Array(7)].map((_, colIndex) => (
                    <div
                      key={colIndex}
                      className="h-20 rounded-lg bg-slate-800/50 border border-white/5 p-2"
                    >
                      {(rowIndex + colIndex) % 3 === 0 && (
                        <div className="w-full h-4 rounded bg-slate-700/50 animate-pulse" />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Centered Loading Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-slate-800/90 border border-white/10 shadow-xl">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-teal-500/20 border-t-teal-500 animate-spin" />
                <div
                  className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-b-teal-400/50 animate-spin"
                  style={{
                    animationDirection: "reverse",
                    animationDuration: "1.5s",
                  }}
                />
              </div>

              <div className="text-center">
                <p className="text-white font-medium text-sm">Loading Events</p>
                <p className="text-slate-400 text-xs mt-1">
                  Fetching class calendar...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      {!isLoading && (
        <div className="flex-1 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden calendar-container relative">
          {currentView === "day" ? (
            <CustomDayView
              date={currentDate}
              events={filteredEvents}
              onSelectEvent={handleSelectEvent}
              onNavigate={navigatePeriod}
              onViewChange={changeView}
              currentView={currentView}
            />
          ) : currentView === "week" ? (
            <CustomWeekView
              date={currentDate}
              events={filteredEvents}
              onSelectEvent={handleSelectEvent}
              onNavigate={navigatePeriod}
              onViewChange={changeView}
              currentView={currentView}
            />
          ) : (
            <Calendar<CalendarEvent>
              localizer={calendarLocalizer}
              events={filteredEvents}
              startAccessor={(event) => event.timing.start}
              endAccessor={(event) => event.timing.end}
              allDayAccessor={(event) => event.timing.allDay ?? false}
              date={currentDate}
              view={currentView as View}
              views={["month", "week", "day"]}
              onNavigate={handleNavigate}
              onView={(view) => {
                const validatedView = convertToCalendarView(view)
                changeView(validatedView)
              }}
              onSelectEvent={handleSelectEvent}
              onShowMore={handleShowMore}
              components={{
                event: CustomEventComponent,
                toolbar: ToolbarWrapper,
              }}
              eventPropGetter={eventStyleGetter}
              dayPropGetter={dayStyleGetter}
              style={{ height: "100%" }}
              popup={true}
              selectable={false}
              min={new Date(1970, 0, 1, 0, 0, 0)}
              max={new Date(1970, 0, 1, 23, 59, 59)}
              scrollToTime={new Date(1970, 0, 1, 0, 0, 0)}
            />
          )}
        </div>
      )}

      {/* Empty State (when loaded but no events) */}
      {!isLoading && !error && filteredEvents.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-slate-400 text-sm">{emptyStateCopy.title}</p>
          <p className="text-slate-500 text-xs mt-1">
            {emptyStateCopy.subtitle}
          </p>
        </div>
      )}

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={selectedEvent !== null}
        onClose={closeEventDetails}
        event={selectedEvent}
      />
    </div>
  )
}

