import React from "react"
import type { AssignmentStatus } from "@/shared/utils/assignmentStatus"
import { getStatusLabel } from "@/shared/utils/assignmentStatus"

interface StatusBadgeProps {
  status: AssignmentStatus
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = "",
}) => {
  const getStatusStyles = (status: AssignmentStatus): string => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "not-started":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      case "submitted":
        return "bg-teal-500/20 text-teal-400 border-teal-500/30"
      case "late":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  return (
    <span
      role="status"
      aria-label={`Assignment status: ${getStatusLabel(status)}`}
      className={`inline-flex items-center px-2 py-1 rounded text-sm font-semibold border ${getStatusStyles(status)} ${className}`}
    >
      {getStatusLabel(status)}
    </span>
  )
}
