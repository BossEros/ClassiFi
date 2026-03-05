import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ToolbarProps, View, Event } from "react-big-calendar"

/**
 * Props for the CustomToolbar component.
 * Picks only the needed properties from react-big-calendar's ToolbarProps
 * and adds custom view control properties.
 */
interface CustomToolbarProps extends Pick<
  ToolbarProps<Event, object>,
  "onNavigate" | "label"
> {
  currentView: View
  onViewChange: (view: View) => void
}

/**
 * Custom toolbar component for React Big Calendar.
 * Provides month navigation controls and view toggle styled to match ClassiFi's design system.
 *
 * @param onNavigate - Navigation callback from React Big Calendar
 * @param label - Formatted month/year label
 * @param currentView - Currently active view (month, week, day)
 * @param onViewChange - Callback when view changes
 * @returns JSX element representing the calendar toolbar
 */
export function CustomToolbar({
  onNavigate,
  label,
  currentView,
  onViewChange,
}: CustomToolbarProps) {
  const handlePrevious = () => {
    onNavigate("PREV")
  }

  const handleNext = () => {
    onNavigate("NEXT")
  }

  const handleToday = () => {
    onNavigate("TODAY")
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
      {/* Left: Date Label + Navigation Controls */}
      <div className="flex items-center gap-5">
        {/* Date Label */}
        <h2 className="text-lg font-semibold text-slate-900 min-w-[160px]">
          {label}
        </h2>

        {/* Navigation Control Group */}
        <div className="flex items-center gap-3">
          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 transition-all duration-200 shadow-sm"
              aria-label="Previous Period"
              title="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={handleNext}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 transition-all duration-200 shadow-sm"
              aria-label="Next Period"
              title="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Today Button */}
          <button
            onClick={handleToday}
            className="px-4 py-1.5 text-sm font-medium bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 transition-all duration-200 shadow-sm"
          >
            Today
          </button>
        </div>
      </div>

      {/* Right: View Toggle */}
      <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-1">
        {(["month", "week", "day"] as const).map((view) => (
          <button
            key={view}
            onClick={() => onViewChange(view as View)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${
              currentView === view
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white"
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )
}
