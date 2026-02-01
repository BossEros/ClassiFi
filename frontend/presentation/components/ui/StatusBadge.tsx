import React from "react"

type AssignmentStatus = "pending" | "not-started" | "submitted" | "late"

interface StatusBadgeProps {
    status: AssignmentStatus
    className?: string
}

const statusConfig = {
    pending: {
        label: "Pending",
        classes: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    },
    "not-started": {
        label: "Not Started",
        classes: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    },
    submitted: {
        label: "Submitted",
        classes: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    },
    late: {
        label: "Late",
        classes: "bg-red-500/20 text-red-400 border-red-500/30",
    },
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    className = "",
}) => {
    const config = statusConfig[status]

    return (
        <span
            role="status"
            aria-label={`Assignment status: ${config.label}`}
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.classes} ${className}`}
        >
            {config.label}
        </span>
    )
}
