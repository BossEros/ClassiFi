import { Search, Filter, Calendar, GraduationCap } from "lucide-react"
import { Input } from "@/presentation/components/ui/Input"
import { Select } from "@/presentation/components/ui/Select"
import { classFiltersTheme } from "@/presentation/constants/dashboardTheme"

export type FilterStatus = "active" | "archived" | "all"

export interface ClassFiltersProps {
  onSearchChange: (query: string) => void
  onStatusChange: (status: FilterStatus) => void
  onTermChange: (term: string) => void
  onYearLevelChange: (yearLevel: string) => void
  currentFilters: {
    searchQuery: string
    status: FilterStatus
    selectedTerm: string
    selectedYearLevel: string
  }
  terms: string[]
  yearLevels: string[]
}

export function ClassFilters({
  onSearchChange,
  onStatusChange,
  onTermChange,
  onYearLevelChange,
  currentFilters,
  terms,
  yearLevels,
}: ClassFiltersProps) {
  const statusOptions = [
    { value: "all", label: "All Classes" },
    { value: "active", label: "Active Classes" },
    { value: "archived", label: "Archived" },
  ]

  const termOptions = [
    { value: "all", label: "All Terms" },
    ...terms.map((term) => ({ value: term, label: term })),
  ]

  const getOrdinalYear = (level: string) => {
    const num = parseInt(level)
    if (isNaN(num)) return level
    const suffix = ["th", "st", "nd", "rd"]
    const v = num % 100
    return num + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]) + " Year"
  }

  const yearLevelOptions = [
    { value: "all", label: "All Year Levels" },
    ...yearLevels.map((yl) => ({ value: yl, label: getOrdinalYear(yl) })),
  ]

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 p-1">
      {/* Search Bar */}
      <div className="flex-1 relative">
        <Search
          className={`absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 pointer-events-none ${classFiltersTheme.searchIcon}`}
          aria-hidden="true"
        />
        <Input
          placeholder="Search classes by name or code..."
          value={currentFilters.searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`pl-12 ${classFiltersTheme.searchInput}`}
        />
      </div>

      {/* Filters Group */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Year Level Filter */}
        <div className="min-w-[160px] relative group">
          <GraduationCap
            className={`pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 ${classFiltersTheme.selectIcon}`}
          />
          <Select
            value={currentFilters.selectedYearLevel}
            onChange={onYearLevelChange}
            options={yearLevelOptions}
            className={`appearance-none cursor-pointer pl-9 pr-10 transition-all disabled:cursor-not-allowed disabled:opacity-50 ${classFiltersTheme.select} ${classFiltersTheme.selectOption}`}
            disabled={yearLevels.length === 0}
            placeholder={yearLevels.length === 0 ? "No levels" : "Year Level"}
          />
        </div>

        {/* Term Filter */}
        <div className="min-w-[180px] relative group">
          <Calendar
            className={`pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 ${classFiltersTheme.selectIcon}`}
          />
          <Select
            value={currentFilters.selectedTerm}
            onChange={onTermChange}
            options={termOptions}
            className={`appearance-none cursor-pointer pl-9 pr-10 transition-all disabled:cursor-not-allowed disabled:opacity-50 ${classFiltersTheme.select} ${classFiltersTheme.selectOption}`}
            disabled={terms.length === 0}
            placeholder={terms.length === 0 ? "No terms" : "Select Term"}
          />
        </div>

        {/* Status Filter */}
        <div className="min-w-[160px] relative group">
          <Filter
            className={`pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 ${classFiltersTheme.selectIcon}`}
          />
          <Select
            value={currentFilters.status}
            onChange={(value) => onStatusChange(value as FilterStatus)}
            options={statusOptions}
            className={`appearance-none cursor-pointer pl-9 pr-10 transition-all ${classFiltersTheme.select} ${classFiltersTheme.selectOption}`}
          />
        </div>
      </div>
    </div>
  )
}
