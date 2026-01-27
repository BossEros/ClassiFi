import * as React from "react"
import { Clock, X } from "lucide-react"
import { cn } from "@/shared/utils/cn"
import { Popover } from "@/presentation/components/ui/Popover"

interface TimePickerProps {
  value: string // "HH:MM" 24h format
  onChange: (value: string | null) => void
  label?: string
  error?: string
  disabled?: boolean
}

export const TimePicker = React.forwardRef<HTMLInputElement, TimePickerProps>(
  ({ value, onChange, label, error, disabled }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")

    const formatTimeFor12h = (timeStr: string) => {
      if (!timeStr) return ""
      const [h, m] = timeStr.split(":")
      const date = new Date()
      date.setHours(parseInt(h), parseInt(m))
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    }

    // Format value for display (24h -> 12h)
    React.useEffect(() => {
      if (!value) {
        setInputValue("")
        return
      }
      setInputValue(formatTimeFor12h(value))
    }, [value])

    const parseTimeInput = (input: string): string | null => {
      const cleanInput = input.trim().toLowerCase()
      if (!cleanInput) return null

      // Simple parser for common formats
      // Matches: 12, 12:30, 12:30pm, 12pm, 12:30 pm
      const timeRegex = /^(\d{1,2})(?::(\d{2}))?\s*(a|p|am|pm)?$/i
      const match = cleanInput.match(timeRegex)

      if (match) {
        let hours = parseInt(match[1])
        const minutes = match[2] ? parseInt(match[2]) : 0
        const meridiem = match[3] ? match[3].toLowerCase() : null

        if (hours > 12 && !meridiem) {
          // Assume 24h input if > 12
          if (hours > 23) return null
        } else if (meridiem) {
          // Handle 12h format
          if (hours === 12) {
            hours = meridiem.startsWith("a") ? 0 : 12
          } else if (meridiem.startsWith("p")) {
            hours += 12
          }
        } else if (hours === 12) {
          // Ambiguous 12 with no merit, assume 12:00 PM (hours stays as 12)
        }

        if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
          return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}`
        }
      }
      return null
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value)
    }

    const handleBlur = () => {
      const parsed = parseTimeInput(inputValue)
      if (parsed) {
        onChange(parsed)
        // Determine label again
        setInputValue(formatTimeFor12h(parsed))
      } else {
        // Revert if invalid or clear if empty
        if (!inputValue.trim()) {
          onChange(null)
        } else if (value) {
          // Revert to valid value
          setInputValue(formatTimeFor12h(value))
        }
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.currentTarget.blur()
        setIsOpen(false)
      }
    }

    // Generate time options (every 30 mins)
    const timeOptions = React.useMemo(() => {
      const options = []
      for (let i = 0; i < 24 * 2; i++) {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        d.setMinutes(i * 30)
        const val = `${d.getHours().toString().padStart(2, "0")}:${d
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
        const labelText = d.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        options.push({ value: val, label: labelText })
      }
      return options
    }, [])

    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
            {label}
          </label>
        )}

        <div className="relative">
          <Popover
            isOpen={isOpen && !disabled}
            onOpenChange={(open) => !disabled && setIsOpen(open)}
            className="w-[150px] p-2 max-h-[300px] overflow-y-auto"
            trigger={
              <div
                className={cn(
                  "flex items-center justify-between w-full h-11 px-4 rounded-xl border transition-all duration-200 group relative",
                  disabled
                    ? "bg-white/5 border-white/5 cursor-not-allowed opacity-50"
                    : "bg-black/20 border-white/10 hover:bg-black/30 hover:border-white/20",
                  isOpen &&
                    !disabled &&
                    "bg-white/10 border-blue-500/50 ring-2 ring-blue-500/20",
                  error && "border-red-500/50",
                )}
              >
                <div className="flex items-center gap-3 overflow-hidden w-full">
                  <Clock
                    className={cn(
                      "w-4 h-4 shrink-0 transition-colors pointer-events-none",
                      value
                        ? "text-blue-400"
                        : "text-gray-500 group-hover:text-gray-400",
                    )}
                  />

                  <input
                    ref={ref}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    placeholder="Pick a time..."
                    className={cn(
                      "bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-500",
                      "text-white",
                    )}
                    onClick={() => {
                      // Don't toggle open purely on input click to allow typing
                      // But if needed we can open it
                      if (!isOpen) setIsOpen(true)
                    }}
                  />
                </div>

                <div className="flex items-center gap-1">
                  {!disabled && value && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onChange(null)
                        setInputValue("")
                      }}
                      className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                      title="Clear time"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            }
            content={
              <div className="space-y-1">
                {timeOptions.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => {
                      onChange(option.value)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-sm text-left rounded-lg transition-colors",
                      value === option.value
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-white/10",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            }
          />
        </div>
        {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
      </div>
    )
  },
)

TimePicker.displayName = "TimePicker"
