import type { CalendarView } from "@/business/models/calendar/types"

export interface CalendarViewToggleProps {
  /** Currently active view */
  currentView: CalendarView
  /** Callback when view changes */
  onViewChange: (view: CalendarView) => void
}

interface ViewOption {
  value: CalendarView
  label: string
}

const VIEW_OPTIONS: ViewOption[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "day", label: "Day" },
]

/**
 * CalendarViewToggle Component
 *
 * Renders toggle buttons to switch between Month, Week, and Day views.
 * Highlights the currently active view button.
 * Positioned in the top right area of the calendar header.
 *
 * @param currentView - Currently active calendar view
 * @param onViewChange - Callback when view changes
 * @returns JSX element representing the view toggle buttons
 */
export function CalendarViewToggle({
  currentView,
  onViewChange,
}: CalendarViewToggleProps) {
  const handleViewChange = (view: CalendarView) => {
    onViewChange(view)
  }

  return (
    <div
      className="inline-flex rounded-lg bg-white/5 border border-white/10 p-1"
      role="tablist"
      aria-label="Calendar view options"
    >
      {VIEW_OPTIONS.map((option) => {
        const isActive = currentView === option.value

        return (
          <button
            key={option.value}
            onClick={() => handleViewChange(option.value)}
            role="tab"
            aria-selected={isActive}
            aria-label={`Switch to ${option.label} view`}
            className={`
                            px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-blue-500/50
                            ${
                              isActive
                                ? "bg-blue-600 text-white border border-blue-500/40"
                                : "text-slate-400 hover:text-white hover:bg-white/10"
                            }
                        `}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
