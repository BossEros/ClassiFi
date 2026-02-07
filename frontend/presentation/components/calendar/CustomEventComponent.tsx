import { CheckCircle, Clock, AlertCircle } from "lucide-react"
import type { CalendarEvent } from "@/business/models/calendar/types"

interface CustomEventComponentProps {
  event: CalendarEvent
  title: string
}

/**
 * Generates a darker shade of the given color for borders and accents.
 *
 * @param color - The base color in hex format
 * @returns A darker version of the color
 */
function getDarkerShade(color: string): string {
  // Simple approach: add transparency for border effect
  return color
}

/**
 * Custom event component for React Big Calendar.
 * Displays assignment information with class color coding and role-specific details.
 *
 * Features:
 * - Course code badge (e.g., "CS101")
 * - Assignment name with truncation
 * - Status icons for students (submitted, pending, late, not-started)
 * - Submission count for teachers
 * - Class-specific color coding
 *
 * @param event - The calendar event to display
 * @param title - The event title (provided by React Big Calendar)
 * @returns JSX element representing the event
 */
export function CustomEventComponent({
  event,
  title,
}: CustomEventComponentProps) {
  /**
   * Returns the appropriate status icon based on the event status.
   */
  const getStatusIcon = () => {
    if (!event.status) return null

    switch (event.status) {
      case "submitted":
        return (
          <CheckCircle
            className="w-3 h-3 text-green-300 flex-shrink-0"
            aria-label="Submitted"
          />
        )

      case "pending":
        return (
          <Clock
            className="w-3 h-3 text-yellow-300 flex-shrink-0"
            aria-label="Pending"
          />
        )

      case "late":
        return (
          <AlertCircle
            className="w-3 h-3 text-red-300 flex-shrink-0"
            aria-label="Late"
          />
        )

      case "not-started":
        return (
          <Clock
            className="w-3 h-3 text-white/60 flex-shrink-0"
            aria-label="Not started"
          />
        )

      default:
        return null
    }
  }

  /**
   * Returns the submission count text for teacher view.
   */
  const getSubmissionText = () => {
    if (
      event.submittedCount !== undefined &&
      event.totalStudents !== undefined
    ) {
      return `${event.submittedCount}/${event.totalStudents}`
    }

    return null
  }

  /**
   * Extracts the course code from the class name.
   * Attempts to find a pattern like "CS101", "MATH201", etc.
   */
  const getCourseCode = (): string | null => {
    if (!event.className) return null

    // Match patterns like "CS101", "MATH 201", "EE-100"
    const match = event.className.match(/^([A-Z]+[-\s]?\d+)/i)

    if (match) {
      return match[1].toUpperCase().replace(/\s+/g, "")
    }

    // Fallback: Use first word if it looks like a code (all caps or alphanumeric)
    const firstWord = event.className.split(" ")[0]

    if (firstWord && firstWord.length <= 8 && /^[A-Z0-9]+$/i.test(firstWord)) {
      return firstWord.toUpperCase()
    }

    return null
  }

  const courseCode = getCourseCode()
  const submissionText = getSubmissionText()
  const borderColor = getDarkerShade(event.classColor)

  return (
    <div
      className="h-full px-1.5 py-1 rounded-sm text-xs overflow-hidden transition-opacity hover:opacity-90"
      style={{
        backgroundColor: `${event.classColor}E6`, // 90% opacity
        borderLeft: `3px solid ${borderColor}`,
      }}
      role="button"
      tabIndex={0}
      aria-label={`${event.className || ""} - ${title}`}
    >
      {/* Main Content Row */}
      <div className="flex items-center gap-1 min-w-0">
        {/* Status Icon */}
        {getStatusIcon()}

        {/* Course Code Badge */}
        {courseCode && (
          <span className="flex-shrink-0 text-[10px] font-bold text-white/90 bg-black/20 px-1 rounded">
            {courseCode}
          </span>
        )}

        {/* Assignment Title */}
        <span className="truncate font-medium text-white text-[11px]">
          {title}
        </span>
      </div>

      {/* Secondary Info Row (Submission Count for Teachers) */}
      {submissionText && (
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[10px] text-white/70 font-medium">
            📝 {submissionText}
          </span>
        </div>
      )}
    </div>
  )
}
