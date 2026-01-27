import {
  Search,
  Filter,
  Calendar,
  GraduationCap,
  ChevronDown,
} from "lucide-react"
import { Input } from "@/presentation/components/ui/Input"
import { Select } from "@/presentation/components/ui/Select"

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
      <div className="flex-1 relative group">
        <div className="absolute inset-0 bg-purple-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors z-10 pointer-events-none" />
          <Input
            placeholder="Search classes by name or code..."
            value={currentFilters.searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20 hover:bg-white/10 transition-all rounded-xl"
          />
        </div>
      </div>

      {/* Filters Group */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status Filter */}
        <div className="min-w-[160px] relative group">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors z-10 pointer-events-none" />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors z-10 pointer-events-none" />
          <Select
            value={currentFilters.status}
            onChange={(value) => onStatusChange(value as FilterStatus)}
            options={statusOptions}
            className="appearance-none pl-9 pr-10 h-11 bg-white/5 border-white/10 text-white hover:bg-white/10 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all rounded-xl cursor-pointer"
          />
        </div>

        {/* Term Filter */}
        <div className="min-w-[180px] relative group">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors z-10 pointer-events-none" />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors z-10 pointer-events-none" />
          <Select
            value={currentFilters.selectedTerm}
            onChange={onTermChange}
            options={termOptions}
            className="appearance-none pl-9 pr-10 h-11 bg-white/5 border-white/10 text-white hover:bg-white/10 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={terms.length === 0}
            placeholder={terms.length === 0 ? "No terms" : "Select Term"}
          />
        </div>

        {/* Year Level Filter */}
        <div className="min-w-[160px] relative group">
          <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors z-10 pointer-events-none" />
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors z-10 pointer-events-none" />
          <Select
            value={currentFilters.selectedYearLevel}
            onChange={onYearLevelChange}
            options={yearLevelOptions}
            className="appearance-none pl-9 pr-10 h-11 bg-white/5 border-white/10 text-white hover:bg-white/10 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={yearLevels.length === 0}
            placeholder={yearLevels.length === 0 ? "No levels" : "Year Level"}
          />
        </div>
      </div>
    </div>
  )
}
