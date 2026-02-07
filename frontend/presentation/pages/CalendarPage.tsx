/**
 * Calendar Page
 *
 * Main page component for the calendar feature.
 * Displays a calendar with assignment deadlines and class information.
 * Integrates React Big Calendar with custom components and styling.
 * Supports Month, Week, and Day view modes.
 */

import { useEffect } from "react"
import { Calendar, type View } from "react-big-calendar"
import { useCalendar } from "@/presentation/hooks/useCalendar"
import {
  CustomEventComponent,
  CustomToolbar,
  CalendarFilters,
  CalendarHeader,
  CalendarViewToggle,
  CalendarNavigation,
} from "@/presentation/components/calendar"
import { EventDetailsModal } from "@/presentation/components/calendar/EventDetailsModal"
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
    events,
    filteredEvents,
    selectedClasses,
    availableClasses,
    selectedEvent,
    isLoading,
    error,
    navigatePeriod,
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
   * Provides custom styling for events based on class color.
   *
   * @param event - The calendar event to style
   * @returns Style object for the event
   */
  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.classColor,
        borderLeft: `3px solid ${event.classColor}`,
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

  return (
    <DashboardLayout className="p-0" topBar={topBar}>
      <div className="h-full flex flex-col -m-6 lg:-m-8">
        {/* Page Header */}
        <div className="px-6 lg:px-8 pt-6 pb-4 border-b border-white/10">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            {/* Title and Subtitle */}
            <CalendarHeader />

            {/* View Toggle (Desktop) */}
            <div className="hidden lg:block">
              <CalendarViewToggle
                currentView={currentView}
                onViewChange={changeView}
              />
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CalendarNavigation
              currentDate={currentDate}
              currentView={currentView}
              onNavigate={navigatePeriod}
            />

            {/* View Toggle (Mobile) */}
            <div className="lg:hidden">
              <CalendarViewToggle
                currentView={currentView}
                onViewChange={changeView}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex gap-6 p-6 lg:p-8">
            {/* Sidebar - Class Filters */}
            <aside className="w-80 flex-shrink-0 hidden lg:block">
              <CalendarFilters
                classes={availableClasses}
                selectedClasses={selectedClasses}
                onFilterChange={handleFilterChange}
                onSelectAll={selectAllClasses}
                onDeselectAll={deselectAllClasses}
              />
            </aside>

            {/* Calendar Container */}
            <main className="flex-1 flex flex-col min-w-0">
              {/* Mobile Filters */}
              <div className="lg:hidden mb-4">
                <CalendarFilters
                  classes={availableClasses}
                  selectedClasses={selectedClasses}
                  onFilterChange={handleFilterChange}
                  onSelectAll={selectAllClasses}
                  onDeselectAll={deselectAllClasses}
                />
              </div>

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
                <div className="flex-1 flex items-center justify-center bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl">
                  <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                    <p className="text-slate-400 text-sm">
                      Loading calendar events...
                    </p>
                  </div>
                </div>
              )}

              {/* Calendar */}
              {!isLoading && (
                <div className="flex-1 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden calendar-container relative">
                  <Calendar<CalendarEvent>
                    localizer={calendarLocalizer}
                    events={filteredEvents}
                    startAccessor="deadline"
                    endAccessor="deadline"
                    date={currentDate}
                    view={currentView as View}
                    views={["month", "week", "day"]}
                    onNavigate={handleNavigate}
                    onView={(view) => changeView(view as typeof currentView)}
                    onSelectEvent={handleSelectEvent}
                    components={{
                      event: CustomEventComponent,
                      toolbar: CustomToolbar as any,
                    }}
                    eventPropGetter={eventStyleGetter}
                    dayPropGetter={dayStyleGetter}
                    style={{ height: "100%" }}
                    popup={false}
                    selectable={false}
                  />

                  {/* Empty State Overlay */}
                  {filteredEvents.length === 0 && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm pointer-events-none">
                      <div className="text-center max-w-md px-6">
                        {availableClasses.length === 0 ? (
                          <>
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                              <svg
                                className="w-8 h-8 text-slate-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                              No Classes Yet
                            </h3>
                            <p className="text-slate-400 text-sm mb-4">
                              You're not enrolled in or teaching any classes
                              yet. Join or create a class to see assignment
                              deadlines here.
                            </p>
                          </>
                        ) : events.length === 0 ? (
                          <>
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                              <svg
                                className="w-8 h-8 text-slate-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                              No Assignments This Month
                            </h3>
                            <p className="text-slate-400 text-sm">
                              There are no assignment deadlines in{" "}
                              {currentDate.toLocaleString("en-US", {
                                month: "long",
                                year: "numeric",
                              })}
                              . Check other months or wait for new assignments
                              to be created.
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
                              <svg
                                className="w-8 h-8 text-slate-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                                />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">
                              No Assignments for Selected Classes
                            </h3>
                            <p className="text-slate-400 text-sm">
                              The selected classes have no assignment deadlines
                              in{" "}
                              {currentDate.toLocaleString("en-US", {
                                month: "long",
                                year: "numeric",
                              })}
                              . Try selecting different classes or check other
                              months.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </main>
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
