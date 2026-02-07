import { useState, useEffect, useMemo, useCallback } from "react"
import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from "date-fns"

import * as calendarService from "@/business/services/calendarService"
import * as authService from "@/business/services/authService"
import type { CalendarEvent, ClassInfo } from "@/business/models/calendar/types"
import type { CalendarView } from "@/shared/utils/calendarConfig"

/**
 * Return type for the useCalendar hook.
 */
export interface UseCalendarReturn {
  // State
  currentDate: Date
  currentView: CalendarView
  events: CalendarEvent[]
  filteredEvents: CalendarEvent[]
  selectedClasses: Set<number>
  availableClasses: ClassInfo[]
  selectedEvent: CalendarEvent | null
  isLoading: boolean
  error: string | null

  // Methods
  navigatePeriod: (direction: "prev" | "next" | "today") => void
  changeView: (view: CalendarView) => void
  toggleClassFilter: (classId: number) => void
  selectAllClasses: () => void
  deselectAllClasses: () => void
  openEventDetails: (event: CalendarEvent) => void
  closeEventDetails: () => void
  refetchEvents: () => Promise<void>
}

/**
 * Custom hook for calendar state management.
 * Manages calendar events, filtering, navigation, view switching, and modal state.
 *
 * Features:
 * - Multiple view modes: month, week, day, agenda
 * - View-aware period navigation (prev/next/today)
 * - Class-based event filtering
 * - Automatic data fetching on date/view changes
 * - Event details modal management
 *
 * @returns Calendar state and methods
 */
export function useCalendar(): UseCalendarReturn {
  // ============================================================================
  // State Management
  // ============================================================================

  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [currentView, setCurrentView] = useState<CalendarView>("month")
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedClasses, setSelectedClasses] = useState<Set<number>>(new Set())
  const [availableClasses, setAvailableClasses] = useState<ClassInfo[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // ============================================================================
  // Data Fetching
  // ============================================================================

  /**
   * Fetches calendar events for the current date and view.
   * Uses getDateRangeForView to calculate the appropriate date range.
   * Retrieves user info and fetches events based on role.
   */
  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const user = authService.getCurrentUser()

      if (!user) {
        setError("User not authenticated")
        setEvents([])

        return
      }

      // Calculate date range based on current view
      const dateRange = calendarService.getDateRangeForView(
        currentDate,
        currentView,
      )

      // Fetch events and classes in parallel
      const [fetchedEvents, fetchedClasses] = await Promise.all([
        calendarService.getCalendarEvents(
          dateRange.start,
          dateRange.end,
          parseInt(user.id),
          user.role as "student" | "teacher",
        ),
        calendarService.getClassesForFilter(
          parseInt(user.id),
          user.role as "student" | "teacher",
        ),
      ])

      setEvents(fetchedEvents)
      setAvailableClasses(fetchedClasses)

      // Initialize selected classes with all classes if not already set
      if (selectedClasses.size === 0 && fetchedClasses.length > 0) {
        setSelectedClasses(new Set(fetchedClasses.map((cls) => cls.id)))
      }
    } catch (err) {
      console.error("Error fetching calendar events:", err)
      setError(
        err instanceof Error ? err.message : "Failed to load calendar events",
      )
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }, [currentDate, currentView, selectedClasses.size])

  // ============================================================================
  // Computed Values
  // ============================================================================

  /**
   * Filters events based on selected classes.
   * Memoized to avoid unnecessary recalculations.
   */
  const filteredEvents = useMemo(() => {
    // If no classes are selected, show all events
    if (selectedClasses.size === 0) {
      return events
    }

    // Filter events by selected classes
    return events.filter((event) => selectedClasses.has(event.classId))
  }, [events, selectedClasses])

  // ============================================================================
  // Navigation Methods
  // ============================================================================

  /**
   * Navigates to a different period based on the current view.
   * View-aware: navigates by month, week, or day depending on currentView.
   *
   * @param direction - Navigation direction ('prev', 'next', or 'today')
   *
   * Requirements: 3.1, 3.2
   */
  const navigatePeriod = useCallback(
    (direction: "prev" | "next" | "today") => {
      setCurrentDate((prevDate) => {
        if (direction === "today") {
          return new Date()
        }

        switch (currentView) {
          case "month":
          case "agenda":
            return direction === "prev"
              ? subMonths(prevDate, 1)
              : addMonths(prevDate, 1)

          case "week":
            return direction === "prev"
              ? subWeeks(prevDate, 1)
              : addWeeks(prevDate, 1)

          case "day":
            return direction === "prev"
              ? subDays(prevDate, 1)
              : addDays(prevDate, 1)

          default:
            return direction === "prev"
              ? subMonths(prevDate, 1)
              : addMonths(prevDate, 1)
        }
      })
    },
    [currentView],
  )

  /**
   * Changes the current calendar view.
   * Preserves the current date context when switching views.
   *
   * @param view - The new view mode ('month' | 'week' | 'day' | 'agenda')
   *
   * Requirements: 2.3, 2.4, 2.5, 2.6
   */
  const changeView = useCallback((view: CalendarView) => {
    setCurrentView(view)
  }, [])

  // ============================================================================
  // Filter Methods
  // ============================================================================

  /**
   * Toggles a class in the filter selection.
   *
   * @param classId - ID of the class to toggle
   *
   * Requirements: 6.2, 6.3
   */
  const toggleClassFilter = useCallback((classId: number) => {
    setSelectedClasses((prevSelected) => {
      const newSelected = new Set(prevSelected)

      if (newSelected.has(classId)) {
        newSelected.delete(classId)
      } else {
        newSelected.add(classId)
      }

      return newSelected
    })
  }, [])

  /**
   * Selects all available classes in the filter.
   *
   * Requirements: 6.4
   */
  const selectAllClasses = useCallback(() => {
    setSelectedClasses(new Set(availableClasses.map((cls) => cls.id)))
  }, [availableClasses])

  /**
   * Deselects all classes in the filter.
   *
   * Requirements: 6.4
   */
  const deselectAllClasses = useCallback(() => {
    setSelectedClasses(new Set())
  }, [])

  // ============================================================================
  // Modal Methods
  // ============================================================================

  /**
   * Opens the event details modal for a specific event.
   *
   * @param event - The calendar event to display details for
   */
  const openEventDetails = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event)
  }, [])

  /**
   * Closes the event details modal.
   */
  const closeEventDetails = useCallback(() => {
    setSelectedEvent(null)
  }, [])

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Manually refetches calendar events.
   * Useful for refreshing data after changes.
   */
  const refetchEvents = useCallback(async () => {
    await fetchEvents()
  }, [fetchEvents])

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Fetch events when currentDate or currentView changes.
   * This ensures the calendar always displays current data for the visible period.
   */
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // ============================================================================
  // Return Hook Value
  // ============================================================================

  return {
    // State
    currentDate,
    currentView,
    events,
    filteredEvents,
    selectedClasses,
    availableClasses,
    selectedEvent,
    isLoading,
    error,

    // Methods
    navigatePeriod,
    changeView,
    toggleClassFilter,
    selectAllClasses,
    deselectAllClasses,
    openEventDetails,
    closeEventDetails,
    refetchEvents,
  }
}
