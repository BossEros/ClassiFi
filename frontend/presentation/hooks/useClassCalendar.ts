import { useMemo } from "react"

import { useCalendar, type UseCalendarReturn } from "./useCalendar"
import { getClassColor } from "@/business/services/calendarService"
import type { ClassInfo } from "@/business/models/calendar/types"

// ============================================================================
// Types
// ============================================================================

interface UseClassCalendarProps {
  /** The ID of the class to filter events for */
  classId: number
  /** The display name of the class */
  className: string
}

/**
 * Custom hook for class-specific calendar state management.
 *
 * Wraps the existing `useCalendar` hook and filters all events to a single class.
 * Provides the same return interface as `useCalendar` for full component compatibility,
 * but scoped to a specific class context.
 *
 * Features:
 * - Reuses all state/methods from `useCalendar` (navigation, view switching, modals)
 * - Overrides `filteredEvents` to show only events for the target class
 * - Overrides `availableClasses` to show only the current class
 * - Pre-selects the class filter so events display immediately
 *
 * @param props - The class ID and name to scope the calendar to
 * @returns Calendar state and methods scoped to a single class
 */
export function useClassCalendar({
  classId,
  className,
}: UseClassCalendarProps): UseCalendarReturn {
  const calendar = useCalendar()

  /**
   * Filter events to only include those belonging to the target class.
   * Applies on top of the base hook's fetched events (not `filteredEvents`,
   * which depends on selectedClasses state we don't control).
   */
  const classFilteredEvents = useMemo(
    () => calendar.events.filter((event) => event.classInfo.id === classId),
    [calendar.events, classId],
  )

  /**
   * Build a single-item class info array for the current class.
   * This replaces the full list of classes so the UI only shows
   * the relevant class context (no multi-class filter needed).
   */
  const singleClassInfo: ClassInfo[] = useMemo(
    () => [
      {
        id: classId,
        name: className,
        color: getClassColor(classId),
        isEnrolled: true,
        isTeaching: false,
      },
    ],
    [classId, className],
  )

  /**
   * Pre-selected filter containing only the target class.
   */
  const preSelectedClasses = useMemo(() => new Set([classId]), [classId])

  return {
    ...calendar,
    filteredEvents: classFilteredEvents,
    availableClasses: singleClassInfo,
    selectedClasses: preSelectedClasses,
  }
}
