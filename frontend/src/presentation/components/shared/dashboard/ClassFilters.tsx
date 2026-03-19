import { Search, Filter } from "lucide-react"
import { Input } from "@/presentation/components/ui/Input"
import { Select } from "@/presentation/components/ui/Select"
import { classFiltersTheme } from "@/presentation/constants/dashboardTheme"

export type FilterStatus = "active" | "archived"

export interface ClassFiltersProps {
  onSearchChange: (query: string) => void
  onStatusChange: (status: FilterStatus) => void
  currentFilters: {
    searchQuery: string
    status: FilterStatus
  }
  statusLabels?: {
    active: string
    archived: string
  }
}

export function ClassFilters({
  onSearchChange,
  onStatusChange,
  currentFilters,
  statusLabels,
}: ClassFiltersProps) {
  const statusOptions = [
    {
      value: "active",
      label: statusLabels?.active ?? "Active classes",
    },
    {
      value: "archived",
      label: statusLabels?.archived ?? "Archived",
    },
  ]

  return (
    <div className="mb-6 flex flex-col gap-4 p-1 md:flex-row">
      <div className="relative flex-1">
        <Search
          className={`pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 ${classFiltersTheme.searchIcon}`}
          aria-hidden="true"
        />
        <Input
          placeholder="Search classes by name or code..."
          value={currentFilters.searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className={`pl-12 ${classFiltersTheme.searchInput}`}
        />
      </div>

      <div className="group relative min-w-[160px]">
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
  )
}
