import React from "react"
import { AssignmentCard } from "./AssignmentCard"
import type { Assignment } from "@/data/api/class.types"

interface AssignmentSectionProps {
  title: string
  assignments: Assignment[]
  onAssignmentClick: (assignmentId: number) => void
  isTeacher: boolean
  className?: string
  variant?: "dark" | "light"
}

export const AssignmentSection: React.FC<AssignmentSectionProps> = ({
  title,
  assignments,
  onAssignmentClick,
  isTeacher,
  className = "",
  variant = "dark",
}) => {
  if (assignments.length === 0) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3
        className={`text-sm font-semibold uppercase tracking-wider ${variant === "light" ? "text-slate-500" : "text-slate-300"}`}
      >
        {title}
      </h3>
      <div className="space-y-3">
        {assignments.map((assignment) => (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            onClick={() => onAssignmentClick(assignment.id)}
            isTeacher={isTeacher}
            variant={variant}
          />
        ))}
      </div>
    </div>
  )
}
