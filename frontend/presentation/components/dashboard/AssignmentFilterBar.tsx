import React from "react"
import type { AssignmentFilter } from "@/shared/utils/assignmentFilters"

interface AssignmentFilterBarProps {
  activeFilter: AssignmentFilter
  onFilterChange: (filter: AssignmentFilter) => void
  counts: {
    all: number
    pending: number
    submitted: number
  }
  className?: string
}

export const AssignmentFilterBar: React.FC<AssignmentFilterBarProps> = ({
  activeFilter,
  onFilterChange,
  counts,
  className = "",
}) => {
  const filters: Array<{ id: AssignmentFilter; label: string; count: number }> =
    [
      { id: "all", label: "All Assignments", count: counts.all },
      { id: "pending", label: "Pending", count: counts.pending },
      { id: "submitted", label: "Submitted", count: counts.submitted },
    ]

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          aria-pressed={activeFilter === filter.id}
          aria-label={`Filter by ${filter.label}`}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeFilter === filter.id
              ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
              : "bg-transparent text-gray-400 border border-white/10 hover:bg-white/5 hover:text-gray-300"
          }`}
        >
          {filter.label} ({filter.count})
        </button>
      ))}
    </div>
  )
}
