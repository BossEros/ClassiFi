import { Filter, Check, ChevronDown } from "lucide-react"
import type { ClassInfo } from "@/business/models/calendar/types"
import { useState, useRef, useEffect } from "react"

export interface CalendarFiltersProps {
  /** Available classes to filter by */
  classes: ClassInfo[]
  /** Currently selected class IDs */
  selectedClasses: Set<number>
  /** Callback when filter changes */
  onFilterChange: (classId: number) => void
  /** Callback to select all classes */
  onSelectAll: () => void
  /** Callback to deselect all classes */
  onDeselectAll: () => void
}

/**
 * CalendarFilters Component
 *
 * Compact dropdown filter button for filtering calendar events by class.
 * Renders as a subtle black button that expands to show class checkboxes.
 * Click outside to close the dropdown.
 *
 * @param classes - Available classes to filter by
 * @param selectedClasses - Currently selected class IDs
 * @param onFilterChange - Callback when filter changes
 * @param onSelectAll - Callback to select all classes
 * @param onDeselectAll - Callback to deselect all classes
 * @returns JSX element representing the calendar filters dropdown
 */
export function CalendarFilters({
  classes,
  selectedClasses,
  onFilterChange,
  onSelectAll,
  onDeselectAll,
}: CalendarFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  /** Close dropdown when clicking outside */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const selectedCount = selectedClasses.size
  const totalCount = classes.length
  const allSelected = selectedCount === totalCount

  /** Get filter label text */
  const getFilterLabel = () => {
    if (selectedCount === 0) {
      return "No Classes"
    }

    if (selectedCount === totalCount) {
      return "All Classes"
    }

    if (selectedCount === 1) {
      const selectedClass = classes.find((c) => selectedClasses.has(c.id))

      return selectedClass?.name || "1 Class"
    }

    return `${selectedCount} Classes`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Filter by class"
      >
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-white font-medium">
          {getFilterLabel()}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-72 p-4 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-50"
          role="listbox"
          aria-label="Class filter options"
        >
          {/* Header with Actions */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
            <span className="text-xs text-slate-400 uppercase tracking-wide font-medium">
              Filter by Class
            </span>
            <div className="flex gap-2">
              <button
                onClick={onSelectAll}
                className={`text-xs font-medium transition-colors ${
                  allSelected
                    ? "text-slate-500 cursor-default"
                    : "text-blue-400 hover:text-blue-300"
                }`}
                disabled={allSelected}
              >
                All
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={onDeselectAll}
                className={`text-xs font-medium transition-colors ${
                  selectedCount === 0
                    ? "text-slate-500 cursor-default"
                    : "text-blue-400 hover:text-blue-300"
                }`}
                disabled={selectedCount === 0}
              >
                None
              </button>
            </div>
          </div>

          {/* Class List */}
          <div className="space-y-1 max-h-[280px] overflow-y-auto">
            {classes.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No classes available
              </p>
            ) : (
              classes.map((classInfo) => {
                const isChecked = selectedClasses.has(classInfo.id)

                return (
                  <label
                    key={classInfo.id}
                    className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group"
                    role="option"
                    aria-selected={isChecked}
                  >
                    {/* Custom Checkbox */}
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onFilterChange(classInfo.id)}
                        className="sr-only"
                        aria-label={`Filter by ${classInfo.name}`}
                      />
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          isChecked
                            ? "bg-blue-600 border-blue-600"
                            : "bg-transparent border-slate-500 group-hover:border-slate-400"
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>

                    {/* Color Indicator */}
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: classInfo.color }}
                      aria-hidden="true"
                    />

                    {/* Class Name */}
                    <span className="text-sm text-white flex-1 truncate">
                      {classInfo.name}
                    </span>
                  </label>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
