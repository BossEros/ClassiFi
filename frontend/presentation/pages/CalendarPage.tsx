/**
 * Calendar Page
 *
 * Main page component for the calendar feature.
 * Displays a calendar with assignment deadlines and class information.
 * Integrates React Big Calendar with custom components and styling.
 * Supports Month, Week, and Day view modes.
 * Day view uses CustomDayView component with stacked events by default.
 */

import { useEffect } from "react"
import { Calendar, type View } from "react-big-calendar"
import { useCalendar } from "@/presentation/hooks/useCalendar"
import {
  CustomEventComponent,
  CustomToolbar,
  CalendarFilters,
  CustomDayView,
  CustomWeekView,
  EventDetailsModal,
} from "@/presentation/components/calendar"
import { DashboardLayout } from "@/presentation/components/dashboard/DashboardLayout"
import { useTopBar } from "@/presentation/components/dashboard/TopBar"
import { calendarLocalizer } from "@/shared/utils/calendarConfig"
import { useToast } from "@/shared/context/ToastContext"
import { getCurrentUser } from "@/business/services/authService"
import type { CalendarEvent } from "@/business/models/calendar/types"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "./CalendarPage.css"

/**
 * Calendar page component.
 *
 * Displays a month-view calendar with:
 * - Assignment deadlines from enrolled/teaching classes
 * - Class-based filtering
 * - Color-coded events by class
 * - Event details modal
 * - Month navigation
 *
 * @returns The calendar page UI
 */
export default function CalendarPage() {
  const user = getCurrentUser()
  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user, userInitials })

  const {
    currentDate,
    currentView,
    filteredEvents,
    selectedClasses,
    availableClasses,
    selectedEvent,
    isLoading,
    error,
    navigatePeriod,
    navigateToDate,
    changeView,
    toggleClassFilter,
    selectAllClasses,
    deselectAllClasses,
    openEventDetails,
    closeEventDetails,
    refetchEvents,
  } = useCalendar()

  const { showToast } = useToast()

  /**
   * Show error toast when error state changes.
   */
  useEffect(() => {
    if (error) {
      showToast(error, "error")
    }
  }, [error, showToast])

  /**
   * Handles navigation events from React Big Calendar.
   *
   * @param _newDate - The new date to navigate to (unused, we use action instead)
   * @param _view - The calendar view (always 'month' for MVP)
   * @param action - The navigation action performed
   */
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
    }
  }

  /**
   * Handles event selection (click) from React Big Calendar.
   *
   * @param event - The selected calendar event
   */
  const handleSelectEvent = (event: CalendarEvent) => {
    openEventDetails(event)
  }

  /**
   * Handles "show more" link clicks by navigating to day view.
   * Instead of showing a popup, this navigates to the day view for that date.
   *
   * @param _events - Array of events for that day (unused)
   * @param date - The date that was clicked
   */
  const handleShowMore = (_events: CalendarEvent[], date: Date) => {
    navigateToDate(date)
    changeView("day")
  }

  /**
   * Provides custom styling for events based on class color.
   *
   * @param event - The calendar event to style
   * @returns Style object for the event
   */
  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.classInfo.color,
        borderLeft: `3px solid ${event.classInfo.color}`,
        color: "white",
      },
    }
  }

  /**
   * Provides custom styling for day cells.
   * Highlights the current day.
   *
   * @param date - The date of the day cell
   * @returns Style object for the day cell
   */
  const dayStyleGetter = (date: Date) => {
    const today = new Date()
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()

    if (isToday) {
      return {
        className: "rbc-today-highlight",
      }
    }

    return {}
  }

  /**
   * Handles class filter changes.
   *
   * @param classId - The class ID to toggle
   */
  const handleFilterChange = (classId: number) => {
    toggleClassFilter(classId)
  }

  /**
   * Toolbar wrapper component.
   * Wraps CustomToolbar to pass view state since react-big-calendar
   * doesn't support custom props on toolbar components directly.
   */
  const ToolbarWrapper = (props: Record<string, unknown>) => {
    return (
      <CustomToolbar
        {...props}
        currentView={currentView}
        onViewChange={changeView}
      />
    )
  }

  return (
    <DashboardLayout className="p-0" topBar={topBar}>
      <div className="h-full flex flex-col -m-6 lg:-m-8">
        {/* Page Header */}
        <div className="px-6 lg:px-8 pt-6 pb-4">
          {/* Row 1: Title and Subtitle */}
          <div className="mb-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Academic Calendar
            </h1>
            <p className="text-sm lg:text-base text-slate-400 mt-1">
              Manage your schedules, deadlines and exams across all courses
            </p>
          </div>

          {/* Row 2: Filter (right-aligned, own line) */}
          <div className="flex justify-end">
            <CalendarFilters
              classes={availableClasses}
              selectedClasses={selectedClasses}
              onFilterChange={handleFilterChange}
              onSelectAll={selectAllClasses}
              onDeselectAll={deselectAllClasses}
            />
          </div>
        </div>

        {/* Main Content - Calendar Container */}
        <div className="flex-1 overflow-hidden px-6 lg:px-8 pb-6">
          <div className="h-full min-h-0">
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

            {/* Loading State - Skeleton Loader */}
            {isLoading && (
              <div className="flex-1 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
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
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="text-center">
                        <div className="w-8 h-3 mx-auto rounded bg-slate-800 animate-pulse mb-2" />
                        <div className="w-6 h-6 mx-auto rounded-full bg-slate-800 animate-pulse" />
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid Rows */}
                  <div className="space-y-2">
                    {[...Array(5)].map((_, rowIndex) => (
                      <div key={rowIndex} className="grid grid-cols-7 gap-2">
                        {[...Array(7)].map((_, colIndex) => (
                          <div
                            key={colIndex}
                            className="h-24 rounded-lg bg-slate-800/50 border border-white/5 p-2"
                          >
                            {/* Random event skeleton */}
                            {(rowIndex + colIndex) % 3 === 0 && (
                              <div className="w-full h-5 rounded bg-slate-700/50 animate-pulse" />
                            )}
                            {(rowIndex + colIndex) % 4 === 1 && (
                              <div className="space-y-1">
                                <div className="w-full h-5 rounded bg-slate-700/50 animate-pulse" />
                                <div className="w-3/4 h-5 rounded bg-slate-700/50 animate-pulse" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Centered Loading Indicator Overlay */}
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
                      <p className="text-white font-medium text-sm">
                        Loading Events
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        Fetching your calendar...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar */}
            {!isLoading && (
              <div className="flex-1 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden calendar-container relative">
                {/* Use CustomDayView for day view, CustomWeekView for week view, standard Calendar for month */}
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
                    onView={(view) => changeView(view as typeof currentView)}
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
                    // Time range for week and day views: 12:00 AM to 11:59 PM
                    min={new Date(1970, 0, 1, 0, 0, 0)}
                    max={new Date(1970, 0, 1, 23, 59, 59)}
                    scrollToTime={new Date(1970, 0, 1, 0, 0, 0)}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={selectedEvent !== null}
        onClose={closeEventDetails}
        event={selectedEvent}
      />
    </DashboardLayout>
  )
}
