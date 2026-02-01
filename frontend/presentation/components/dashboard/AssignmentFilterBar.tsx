import React from "react"

type AssignmentFilter = "all" | "pending" | "submitted"

interface AssignmentFilterBarProps {
    activeFilter: AssignmentFilter
    onFilterChange: (filter: AssignmentFilter) => void
    counts: {
        all: number
        pending: number
        submitted: number
    }
}

export const AssignmentFilterBar: React.FC<AssignmentFilterBarProps> = ({
    activeFilter,
    onFilterChange,
    counts,
}) => {
    const filters: { id: AssignmentFilter; label: string }[] = [
        { id: "all", label: "All Assignments" },
        { id: "pending", label: "Pending" },
        { id: "submitted", label: "Submitted" },
    ]

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {filters.map((filter) => (
                <button
                    key={filter.id}
                    onClick={() => onFilterChange(filter.id)}
                    aria-pressed={activeFilter === filter.id}
                    className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
            ${activeFilter === filter.id
                            ? "bg-teal-500 text-white"
                            : "bg-transparent text-slate-400 border border-white/10 hover:border-teal-500/50 hover:text-teal-400"
                        }
          `}
                >
                    <span>{filter.label}</span>
                    <span
                        className={`
              px-1.5 py-0.5 rounded-full text-xs
              ${activeFilter === filter.id
                                ? "bg-white/20 text-white"
                                : "bg-white/5 text-slate-500"
                            }
            `}
                    >
                        {counts[filter.id]}
                    </span>
                </button>
            ))}
        </div>
    )
}
