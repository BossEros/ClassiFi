import { useMemo } from "react"

import { useCalendar, type UseCalendarReturn } from "./useCalendar"
import { getClassColor } from "@/business/services/calendarService"
import { getCurrentUser } from "@/business/services/authService"
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

  // Get current user to determine role-based flags
  const currentUser = getCurrentUser()
  const userRole = currentUser?.role

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
   *
   * Derives isTeaching and isEnrolled from the current user's role:
   * - Teachers are considered to be teaching the class
   * - Students are considered to be enrolled in the class
   * (Access control should be enforced at routing/permission level)
   */
  const singleClassInfo: ClassInfo[] = useMemo(
    () => [
      {
        id: classId,
        name: className,
        color: getClassColor(classId),
        isEnrolled: userRole === "student",
        isTeaching: userRole === "teacher",
      },
    ],
    [classId, className, userRole],
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
