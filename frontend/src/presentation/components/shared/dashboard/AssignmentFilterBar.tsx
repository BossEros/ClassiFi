import React from "react"
import type {
  AssignmentFilter,
  TeacherAssignmentFilter,
} from "@/shared/utils/assignmentFilters"

interface StudentAssignmentFilterBarProps {
  mode?: "student"
  activeFilter: AssignmentFilter
  onFilterChange: (filter: AssignmentFilter) => void
  counts: {
    all: number
    pending: number
    submitted: number
  }
  className?: string
  variant?: "dark" | "light"
}

interface TeacherAssignmentFilterBarProps {
  mode: "teacher"
  activeFilter: TeacherAssignmentFilter
  onFilterChange: (filter: TeacherAssignmentFilter) => void
  counts: {
    all: number
    current: number
    past: number
  }
  className?: string
  variant?: "dark" | "light"
}

type AssignmentFilterBarProps =
  | StudentAssignmentFilterBarProps
  | TeacherAssignmentFilterBarProps

export const AssignmentFilterBar: React.FC<AssignmentFilterBarProps> = (
  props,
) => {
  const className = props.className ?? ""
  const variant = props.variant ?? "dark"

  if (props.mode === "teacher") {
    const filters: Array<{
      id: TeacherAssignmentFilter
      label: string
      count: number
    }> = [
      { id: "all", label: "All Assignments", count: props.counts.all },
      {
        id: "current",
        label: "Current & Upcoming",
        count: props.counts.current,
      },
      { id: "past", label: "Past", count: props.counts.past },
    ]

    return (
      <div className={`flex flex-wrap gap-3 ${className}`}>
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => props.onFilterChange(filter.id)}
            aria-pressed={props.activeFilter === filter.id}
            aria-label={`Filter by ${filter.label}`}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              props.activeFilter === filter.id
                ? variant === "light"
                  ? "border border-teal-600 bg-teal-600 text-white shadow-sm"
                  : "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                : variant === "light"
                  ? "border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-800"
                  : "bg-transparent text-gray-400 border border-white/10 hover:bg-white/5 hover:text-gray-300"
            }`}
          >
            {filter.label} ({filter.count})
          </button>
        ))}
      </div>
    )
  }

  const studentFilters = [
    { id: "all", label: "All Assignments", count: props.counts.all },
    { id: "pending", label: "Pending", count: props.counts.pending },
    { id: "submitted", label: "Submitted", count: props.counts.submitted },
  ] as const

  const filters: Array<{ id: AssignmentFilter; label: string; count: number }> =
    [...studentFilters]

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => props.onFilterChange(filter.id)}
          aria-pressed={props.activeFilter === filter.id}
          aria-label={`Filter by ${filter.label}`}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            props.activeFilter === filter.id
              ? variant === "light"
                ? "border border-teal-600 bg-teal-600 text-white shadow-sm"
                : "bg-teal-500/20 text-teal-400 border border-teal-500/30"
              : variant === "light"
                ? "border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-800"
                : "bg-transparent text-gray-400 border border-white/10 hover:bg-white/5 hover:text-gray-300"
          }`}
        >
          {filter.label} ({filter.count})
        </button>
      ))}
    </div>
  )
}
