import { ChevronLeft, ChevronRight } from "lucide-react"
import type { ToolbarProps, View } from "react-big-calendar"

/**
 * Props for the CustomToolbar component.
 * Extends react-big-calendar's ToolbarProps with view control.
 */
interface CustomToolbarProps extends ToolbarProps {
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
    <div className="flex items-center justify-between px-6 py-4 bg-slate-900/95 backdrop-blur-xl border-b border-white/10">
      {/* Left: Date Label + Navigation Controls */}
      <div className="flex items-center gap-5">
        {/* Date Label */}
        <h2 className="text-lg font-semibold text-white min-w-[160px]">
          {label}
        </h2>

        {/* Navigation Control Group */}
        <div className="flex items-center gap-3">
          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800/80 backdrop-blur-sm border border-white/10 text-slate-200 hover:bg-slate-700 hover:text-white hover:border-white/20 transition-all duration-200 shadow-sm"
              aria-label="Previous Period"
              title="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={handleNext}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-800/80 backdrop-blur-sm border border-white/10 text-slate-200 hover:bg-slate-700 hover:text-white hover:border-white/20 transition-all duration-200 shadow-sm"
              aria-label="Next Period"
              title="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Today Button */}
          <button
            onClick={handleToday}
            className="px-4 py-1.5 text-sm font-medium bg-slate-800/80 backdrop-blur-sm border border-white/10 text-slate-200 rounded-lg hover:bg-slate-700 hover:text-white hover:border-white/20 transition-all duration-200 shadow-sm"
          >
            Today
          </button>
        </div>
      </div>

      {/* Right: View Toggle */}
      <div className="flex items-center bg-slate-800/80 border border-white/10 rounded-lg p-1">
        {(["month", "week", "day"] as const).map((view) => (
          <button
            key={view}
            onClick={() => onViewChange(view as View)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150 ${
              currentView === view
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )
}
