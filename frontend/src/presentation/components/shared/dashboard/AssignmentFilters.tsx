import { Search, Filter } from "lucide-react"
import { Input } from "@/presentation/components/ui/Input"
import { Select } from "@/presentation/components/ui/Select"
import { classFiltersTheme } from "@/presentation/constants/dashboardTheme"

export interface AssignmentFiltersProps {
  onSearchChange: (query: string) => void
  onClassChange: (className: string) => void
  currentFilters: {
    searchQuery: string
    selectedClass: string
  }
  classOptions: Array<{ value: string; label: string }>
}

/**
 * Renders search bar and class filter dropdown for the Assignments page.
 *
 * @param onSearchChange - Called when search input value changes.
 * @param onClassChange - Called when a class is selected from the dropdown.
 * @param currentFilters - Current search query and selected class values.
 * @param classOptions - Available class options derived from fetched tasks.
 */
export function AssignmentFilters({
  onSearchChange,
  onClassChange,
  currentFilters,
  classOptions,
}: AssignmentFiltersProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 p-1 md:flex-row">
      <div className="relative flex-1">
        <Search
          className={`pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 ${classFiltersTheme.searchIcon}`}
          aria-hidden="true"
        />
        <Input
          placeholder="Search assignments by name..."
          value={currentFilters.searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className={`pl-12 ${classFiltersTheme.searchInput}`}
        />
      </div>

      <div className="group relative min-w-[200px]">
        <Filter
          className={`pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 ${classFiltersTheme.selectIcon}`}
        />
        <Select
          value={currentFilters.selectedClass}
          onChange={(value) => onClassChange(value)}
          options={classOptions}
          className={`appearance-none cursor-pointer pl-9 pr-10 transition-all ${classFiltersTheme.select} ${classFiltersTheme.selectOption}`}
        />
      </div>
    </div>
  )
}
