import React from "react"
import { AssignmentCard } from "./AssignmentCard"
import type { Assignment } from "@/business/models/dashboard/types"

interface AssignmentSectionProps {
  title: string
  assignments: Assignment[]
  onAssignmentClick: (assignmentId: number) => void
  isTeacher: boolean
  className?: string
}

export const AssignmentSection: React.FC<AssignmentSectionProps> = ({
  title,
  assignments,
  onAssignmentClick,
  isTeacher,
  className = "",
}) => {
  if (assignments.length === 0) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-3">
        {assignments.map((assignment) => (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            onClick={() => onAssignmentClick(assignment.id)}
            isTeacher={isTeacher}
          />
        ))}
      </div>
    </div>
  )
}
