import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/shared/utils/cn"
import { Popover } from "./Popover"
import {
  MONTH_NAMES,
  DAY_NAMES_SHORT,
  isValidDate,
} from "@/shared/utils/dateUtils"

interface DatePickerProps {
  value: string // ISO string date component
  onChange: (value: string | null) => void
  label?: string
  error?: string
  minDate?: Date
  disabled?: boolean
}

export const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  ({ value, onChange, label, error, minDate, disabled }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)

    // Parse initial state with validation
    const dateObj = value ? new Date(value) : null
    const validatedDateObj = dateObj && isValidDate(dateObj) ? dateObj : null

    // Calendar view state - use validated date or fallback to today
    const [viewDate, setViewDate] = React.useState(
      validatedDateObj || new Date(),
    )

    React.useEffect(() => {
      if (value) {
        const d = new Date(value)
        if (isValidDate(d)) {
          setViewDate(d)
        }
      } else {
        // Reset to current date when value is cleared
        setViewDate(new Date())
      }
    }, [value])

    const viewMonth = viewDate.getMonth()
    const viewYear = viewDate.getFullYear()

    const getDaysInMonth = (year: number, month: number) =>
      new Date(year, month + 1, 0).getDate()
    const getFirstDayOfMonth = (year: number, month: number) =>
      new Date(year, month, 1).getDay()

    const handlePrevMonth = (e: React.MouseEvent) => {
      e.stopPropagation()
      setViewDate(new Date(viewYear, viewMonth - 1, 1))
    }

    const handleNextMonth = (e: React.MouseEvent) => {
      e.stopPropagation()
      setViewDate(new Date(viewYear, viewMonth + 1, 1))
    }

    const handleDateSelect = (day: number) => {
      // Construct local date at noon to avoid DST/midnight shifts
      const newDate = new Date(viewYear, viewMonth, day, 12, 0, 0)

      // Manually format to YYYY-MM-DD to avoid UTC conversion shifts
      const year = newDate.getFullYear()
      const month = String(newDate.getMonth() + 1).padStart(2, "0")
      const date = String(newDate.getDate()).padStart(2, "0")

      // Create a "UTC" date that matches the local Y-M-D
      const utcDate = new Date(Date.UTC(year, Number(month) - 1, Number(date)))
      onChange(utcDate.toISOString())
      setIsOpen(false)
    }

    const clearDate = (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange(null)
      setIsOpen(false)
    }

    const isSelected = (day: number) => {
      if (!validatedDateObj) return false
      return (
        validatedDateObj.getDate() === day &&
        validatedDateObj.getMonth() === viewMonth &&
        validatedDateObj.getFullYear() === viewYear
      )
    }

    const isToday = (day: number) => {
      const today = new Date()
      return (
        today.getDate() === day &&
        today.getMonth() === viewMonth &&
        today.getFullYear() === viewYear
      )
    }

    const isDisabled = (day: number) => {
      if (!minDate) return false
      const date = new Date(viewYear, viewMonth, day)
      date.setHours(23, 59, 59, 999)
      return date < minDate
    }

    // Generate grid
    const daysInMonth = getDaysInMonth(viewYear, viewMonth)
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
    const days: (number | null)[] = Array(firstDay).fill(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)

    const handleOpenChange = (open: boolean) => {
      if (!disabled) {
        setIsOpen(open)
      }
    }

    return (
      <div ref={ref} className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            {label}
          </label>
        )}

        <Popover
          isOpen={isOpen && !disabled}
          onOpenChange={handleOpenChange}
          className="w-[320px] p-4"
          trigger={
            <div className="relative flex items-center w-full">
              <button
                type="button"
                disabled={disabled}
                aria-expanded={isOpen}
                className={cn(
                  "flex items-center justify-between w-full h-11 px-4 rounded-xl border transition-all duration-200 group text-left",
                  disabled
                    ? "bg-white/5 border-white/5 cursor-not-allowed opacity-50"
                    : "cursor-pointer",
                  !disabled &&
                    (isOpen
                      ? "bg-white/10 border-blue-500/50 ring-2 ring-blue-500/20"
                      : "bg-black/20 border-white/10 hover:bg-black/30 hover:border-white/20"),
                  error && "border-red-500/50",
                )}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <CalendarIcon
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors",
                      value
                        ? "text-blue-400"
                        : "text-gray-500 group-hover:text-gray-400",
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm truncate",
                      value ? "text-white" : "text-gray-500",
                    )}
                  >
                    {value && validatedDateObj
                      ? validatedDateObj.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Pick a date..."}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              {!disabled && value && (
                <button
                  type="button"
                  onClick={clearDate}
                  aria-label="Clear date"
                  className="absolute right-10 p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors z-10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          }
          content={
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-semibold text-white">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {DAY_NAMES_SHORT.map((day) => (
                  <div
                    key={day}
                    className="text-xs font-medium text-gray-500 py-1"
                  >
                    {day}
                  </div>
                ))}
                {days.map((day, index) => {
                  if (day === null) return <div key={`empty-${index}`} />

                  const isSelectedDay = isSelected(day)
                  const isTodayDay = isToday(day)
                  const disabledDay = isDisabled(day)

                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => !disabledDay && handleDateSelect(day)}
                      disabled={disabledDay}
                      className={cn(
                        "h-8 w-8 text-sm rounded-lg flex items-center justify-center transition-all",
                        isSelectedDay
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 font-semibold"
                          : isTodayDay
                            ? "bg-white/10 text-blue-400 font-medium"
                            : "text-gray-300 hover:bg-white/5",
                        disabledDay &&
                          "opacity-30 cursor-not-allowed hover:bg-transparent text-gray-500",
                      )}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>
          }
        />
        {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
      </div>
    )
  },
)

DatePicker.displayName = "DatePicker"
