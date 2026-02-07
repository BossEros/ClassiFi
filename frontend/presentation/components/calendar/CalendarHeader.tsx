import { Calendar } from "lucide-react"

/**
 * CalendarHeader Component
 *
 * Displays the main heading and subtitle for the calendar page.
 * Styled to match ClassiFi's typography and design system.
 *
 * @returns JSX element representing the calendar header
 */
export function CalendarHeader() {
  return (
    <div className="flex items-start gap-4 mb-6">
      {/* Calendar Icon */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 backdrop-blur-sm">
        <Calendar className="w-8 h-8 text-blue-400" strokeWidth={1.5} />
      </div>

      {/* Text Content */}
      <div className="flex flex-col">
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
          Academic Calendar
        </h1>

        <p className="text-sm lg:text-base text-slate-400 mt-1">
          Manage your schedules, deadlines and exams across all courses
        </p>
      </div>
    </div>
  )
}
