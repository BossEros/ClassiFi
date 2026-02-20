import { ChevronLeft, ChevronRight } from "lucide-react"
import type { CalendarView } from "@/business/models/calendar/types"

/**
 * Props for the CustomViewToolbar component
 */
export interface CustomViewToolbarProps {
  /** The label to display (typically a date or date range) */
  label: string

  /** Handler for navigation actions (prev, next, today) */
  onNavigate: (direction: "prev" | "next" | "today") => void

  /** Handler for view changes */
  onViewChange: (view: CalendarView) => void

  /** The currently active view */
  currentView: CalendarView

  /** Aria label for navigation buttons (e.g., "Previous Week", "Next Day") */
  navigationLabel: string

  /** Minimum width for the label container */
  labelMinWidth?: string
}

/**
 * Available calendar views for the toolbar
 */
const CALENDAR_VIEWS: readonly CalendarView[] = [
  "month",
  "week",
  "day",
] as const

/**
 * Capitalizes the first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * CustomViewToolbar Component
 *
 * A shared toolbar component used by CustomDayView and CustomWeekView.
 * Provides consistent navigation controls and view switching functionality.
 *
 * Features:
 * - Date label display
 * - Previous/Next navigation buttons
 * - Today button
 * - View toggle (Month, Week, Day)
 *
 * @param props - Toolbar configuration props
 * @returns JSX element for the toolbar
 */
export function CustomViewToolbar({
  label,
  onNavigate,
  onViewChange,
  currentView,
  navigationLabel,
  labelMinWidth = "200px",
}: CustomViewToolbarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-slate-900/95 backdrop-blur-xl border-b border-white/10">
      {/* Left: Date Label + Navigation Controls */}
      <div className="flex items-center gap-5">
        {/* Date Label */}
        <h2
          className="text-lg font-semibold text-white"
          style={{ minWidth: labelMinWidth }}
        >
          {label}
        </h2>

        {/* Navigation Control Group */}
        <div className="flex items-center gap-3">
          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate("prev")}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800/80 backdrop-blur-sm border border-white/10 text-slate-200 hover:bg-slate-700 hover:text-white hover:border-white/20 transition-all duration-200 shadow-sm"
              aria-label={`Previous ${navigationLabel}`}
              title="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => onNavigate("next")}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800/80 backdrop-blur-sm border border-white/10 text-slate-200 hover:bg-slate-700 hover:text-white hover:border-white/20 transition-all duration-200 shadow-sm"
              aria-label={`Next ${navigationLabel}`}
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
        {CALENDAR_VIEWS.map((view) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${
              currentView === view
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            {capitalize(view)}
          </button>
        ))}
      </div>
    </div>
  )
}
