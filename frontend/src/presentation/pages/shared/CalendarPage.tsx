import { useEffect, useMemo, useCallback } from "react";
import { Calendar, type View, type ToolbarProps } from "react-big-calendar";
import { useCalendar } from "@/presentation/hooks/shared/useCalendar";
import { CustomEventComponent, CustomToolbar, CustomDayView, CustomWeekView, EventDetailsModal } from "@/presentation/components/shared/calendar";
import { getCalendarMonthEventStyle } from "@/presentation/components/shared/calendar/eventStyle";
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout";
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar";
import { calendarLocalizer } from "@/presentation/constants/calendarConfig";
import { useToastStore } from "@/shared/store/useToastStore";
import { useAuthStore } from "@/shared/store/useAuthStore";
import type { CalendarEvent } from "@/business/models/calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./CalendarPage.css";
import { Filter, Check, ChevronDown } from "lucide-react";
import type { ClassInfo } from "@/business/models/calendar";
import { useState, useRef } from "react";
import { calendarTheme } from "@/presentation/constants/calendarTheme";

// Inlined from src/presentation/components/shared/calendar/CalendarFilters.tsx
interface CalendarFiltersProps {
  /** Available classes to filter by */
  classes: ClassInfo[]
  /** Currently selected class IDs */
  selectedClasses: Set<number>
  /** Callback when filter changes */
  onFilterChange: (classId: number) => void
  /** Callback to select all classes */
  onSelectAll: () => void
  /** Callback to deselect all classes */
  onDeselectAll: () => void
}



/**
 * CalendarFilters Component
 *
 * Compact dropdown filter button for filtering calendar events by class.
 * Renders as a subtle black button that expands to show class checkboxes.
 * Click outside to close the dropdown.
 *
 * @param classes - Available classes to filter by
 * @param selectedClasses - Currently selected class IDs
 * @param onFilterChange - Callback when filter changes
 * @param onSelectAll - Callback to select all classes
 * @param onDeselectAll - Callback to deselect all classes
 * @returns JSX element representing the calendar filters dropdown
 */
function CalendarFilters({
  classes,
  selectedClasses,
  onFilterChange,
  onSelectAll,
  onDeselectAll,
}: CalendarFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  /** Close dropdown when clicking outside */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const selectedCount = selectedClasses.size
  const totalCount = classes.length
  const allSelected = selectedCount === totalCount

  /** Get filter label text */
  const getFilterLabel = () => {
    if (selectedCount === 0) {
      return "No Classes"
    }

    if (selectedCount === totalCount) {
      return "All Classes"
    }

    if (selectedCount === 1) {
      const selectedClass = classes.find((c) => selectedClasses.has(c.id))

      return selectedClass?.name || "1 Class"
    }

    return `${selectedCount} Classes`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-sm"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Filter by class"
      >
        <Filter className="w-4 h-4 text-slate-500" />
        <span className="text-sm text-slate-700 font-medium">
          {getFilterLabel()}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-[calc(100vw-3rem)] sm:w-72 max-w-72 p-4 bg-white border border-slate-200 rounded-xl shadow-xl z-50"
          role="listbox"
          aria-label="Class filter options"
        >
          {/* Header with Actions */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200">
            <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">
              Filter by Class
            </span>
            <div className="flex gap-2">
              <button
                onClick={onSelectAll}
                className={`text-xs font-medium transition-colors ${
                  allSelected
                    ? "text-slate-400 cursor-default"
                    : "text-teal-700 hover:text-teal-800"
                }`}
                disabled={allSelected}
              >
                All
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={onDeselectAll}
                className={`text-xs font-medium transition-colors ${
                  selectedCount === 0
                    ? "text-slate-400 cursor-default"
                    : "text-teal-700 hover:text-teal-800"
                }`}
                disabled={selectedCount === 0}
              >
                None
              </button>
            </div>
          </div>

          {/* Class List */}
          <div className="space-y-1 max-h-[280px] overflow-y-auto">
            {classes.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No classes available
              </p>
            ) : (
              classes.map((classInfo) => {
                const isChecked = selectedClasses.has(classInfo.id)

                return (
                  <label
                    key={classInfo.id}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors group"
                    role="option"
                    aria-selected={isChecked}
                  >
                    {/* Custom Checkbox */}
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onFilterChange(classInfo.id)}
                        className="sr-only"
                        aria-label={`Filter by ${classInfo.name}`}
                      />
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          isChecked
                            ? "bg-teal-600 border-teal-600"
                            : "bg-transparent border-slate-400 group-hover:border-slate-500"
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>

                    {/* Color Indicator */}
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: classInfo.color }}
                      aria-hidden="true"
                    />

                    {/* Class Name */}
                    <span className="text-sm text-slate-700 flex-1 truncate">
                      {classInfo.name}
                    </span>
                  </label>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

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
  const user = useAuthStore((state) => state.user)
  const userInitials = user
    ? `${user.firstName && user.firstName.length > 0 ? user.firstName[0] : "?"}${user.lastName && user.lastName.length > 0 ? user.lastName[0] : "?"}`.toUpperCase()
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

  const showToast = useToastStore((state) => state.showToast)

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
      style: getCalendarMonthEventStyle(event.classInfo.color),
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
   * Converts react-big-calendar's View type to CalendarView.
   * Ensures type safety when translating between library and app types.
   *
   * @param view - The react-big-calendar View
   * @returns The corresponding CalendarView
   */
  const convertToCalendarView = useCallback(
    (view: View): typeof currentView => {
      // View from react-big-calendar is compatible with CalendarView
      // but we need to ensure it's one of our supported views
      if (
        view === "month" ||
        view === "week" ||
        view === "day" ||
        view === "agenda"
      ) {
        return view as typeof currentView
      }

      // Default to month if unsupported view
      return "month"
    },
    [],
  )

  /**
   * Toolbar wrapper component.
   * Wraps CustomToolbar to pass view state since react-big-calendar
   * doesn't support custom props on toolbar components directly.
   * Memoized to prevent unnecessary remounts.
   */
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

  return (
    <DashboardLayout className="p-0" topBar={topBar}>
      <div className="h-full flex flex-col -m-4 sm:-m-6 lg:-mx-8 lg:-mb-8 bg-slate-50">
        {/* Page Header */}
        <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-4">
          {/* Row 1: Title and Subtitle */}
          <div className="mb-4">
            <h1 className={calendarTheme.pageTitle}>
              Academic Calendar
            </h1>
            <p className={calendarTheme.pageSubtitle}>
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
        <div className="flex-1 overflow-hidden px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6">
          <div className="h-full min-h-0">
            {/* Error State */}
            {error && (
              <div className={`mb-4 p-4 ${calendarTheme.errorSurface} flex items-start justify-between`}>
                <div className="flex-1">
                  <p className="text-rose-700 text-sm font-medium mb-1">
                    Failed to load calendar events
                  </p>
                  <p className="text-rose-600 text-xs">{error}</p>
                </div>
                <button
                  onClick={refetchEvents}
                  className="ml-4 px-3 py-1.5 text-xs font-medium text-rose-700 hover:text-rose-800 border border-rose-300 hover:border-rose-400 rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading State - Skeleton Loader */}
            {isLoading && (
              <div className={`relative flex-1 ${calendarTheme.surface} overflow-hidden`}>
                {/* Skeleton Toolbar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-200 animate-pulse" />
                    <div className="w-32 h-5 rounded bg-slate-200 animate-pulse" />
                    <div className="w-8 h-8 rounded-lg bg-slate-200 animate-pulse" />
                  </div>
                  <div className="flex gap-2">
                    <div className="w-16 h-8 rounded-lg bg-slate-200 animate-pulse" />
                    <div className="w-16 h-8 rounded-lg bg-slate-200 animate-pulse" />
                    <div className="w-16 h-8 rounded-lg bg-slate-200 animate-pulse" />
                  </div>
                </div>

                {/* Skeleton Grid */}
                <div className="p-4">
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className="text-center">
                          <div className="w-8 h-3 mx-auto rounded bg-slate-200 animate-pulse mb-2" />
                          <div className="w-6 h-6 mx-auto rounded-full bg-slate-200 animate-pulse" />
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
                            className="h-24 rounded-lg bg-slate-100 border border-slate-200 p-2"
                          >
                            {/* Random event skeleton */}
                            {(rowIndex + colIndex) % 3 === 0 && (
                              <div className="w-full h-5 rounded bg-slate-200 animate-pulse" />
                            )}
                            {(rowIndex + colIndex) % 4 === 1 && (
                              <div className="space-y-1">
                                <div className="w-full h-5 rounded bg-slate-200 animate-pulse" />
                                <div className="w-3/4 h-5 rounded bg-slate-200 animate-pulse" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Centered Loading Indicator Overlay */}
                <div className={`absolute inset-0 flex items-center justify-center ${calendarTheme.loadingOverlay}`}>
                  <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xl">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin" />
                      <div
                        className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-b-teal-400/50 animate-spin"
                        style={{
                          animationDirection: "reverse",
                          animationDuration: "1.5s",
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-slate-900 font-medium text-sm">
                        Loading Events
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        Fetching your calendar...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar */}
            {!isLoading && (
              <div className={`flex-1 ${calendarTheme.surface} overflow-hidden calendar-container relative`}>
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

