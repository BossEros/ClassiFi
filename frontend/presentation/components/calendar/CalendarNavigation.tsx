import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfWeek, endOfWeek } from "date-fns"
import type { CalendarView } from "@/shared/utils/calendarConfig"

export interface CalendarNavigationProps {
  /** Current date being displayed */
  currentDate: Date
  /** Current view mode */
  currentView: CalendarView
  /** Callback for navigation */
  onNavigate: (direction: "prev" | "next" | "today") => void
}

/**
 * Formats the date label based on the current view mode.
 *
 * @param date - The current date to format
 * @param view - The current calendar view
 * @returns Formatted date label string
 */
function formatDateLabel(date: Date, view: CalendarView): string {
  switch (view) {
    case "month":
      return format(date, "MMMM yyyy")

    case "week": {
      const weekStart = startOfWeek(date, { weekStartsOn: 0 })
      const weekEnd = endOfWeek(date, { weekStartsOn: 0 })

      // Same month: "Oct 16-22, 2023"
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${format(weekStart, "MMM d")}-${format(weekEnd, "d, yyyy")}`
      }

      // Different months: "Oct 30 - Nov 5, 2023"
      return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`
    }

    case "day":
      return format(date, "EEEE, MMMM d, yyyy")

    case "agenda":
      return format(date, "MMMM yyyy")

    default:
      return format(date, "MMMM yyyy")
  }
}

/**
 * CalendarNavigation Component
 *
 * Provides navigation controls for the calendar.
 * Renders previous/next period buttons with icons.
 * Displays a view-aware date label.
 * Includes a "Today" button to jump to the current date.
 *
 * @param currentDate - Current date being displayed
 * @param currentView - Current view mode (month, week, day)
 * @param onNavigate - Callback for navigation actions
 * @returns JSX element representing the calendar navigation
 */
export function CalendarNavigation({
  currentDate,
  currentView,
  onNavigate,
}: CalendarNavigationProps) {
  const handlePrevious = () => {
    onNavigate("prev")
  }

  const handleNext = () => {
    onNavigate("next")
  }

  const handleToday = () => {
    onNavigate("today")
  }

  const dateLabel = formatDateLabel(currentDate, currentView)

  // Generate aria-label based on view
  const getPeriodLabel = (): string => {
    switch (currentView) {
      case "month":
        return "month"
      case "week":
        return "week"
      case "day":
        return "day"
      case "agenda":
        return "period"
      default:
        return "period"
    }
  }

  return (
    <div
      className="flex items-center gap-4"
      role="navigation"
      aria-label="Calendar navigation"
    >
      {/* Navigation Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={handlePrevious}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          aria-label={`Previous ${getPeriodLabel()}`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={handleNext}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          aria-label={`Next ${getPeriodLabel()}`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Date Label */}
      <h2
        className="text-lg lg:text-xl font-semibold text-white min-w-[200px]"
        aria-live="polite"
        aria-atomic="true"
      >
        {dateLabel}
      </h2>

      {/* Today Button */}
      <button
        onClick={handleToday}
        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg shadow-blue-600/20"
        aria-label="Go to today"
      >
        Today
      </button>
    </div>
  )
}
