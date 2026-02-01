import React from "react"
import type { Assignment } from "@/business/models/dashboard/types"
import { AssignmentCard } from "./AssignmentCard"

interface AssignmentSectionProps {
    title: string
    assignments: Assignment[]
    onAssignmentClick: (assignmentId: number) => void
    onEditAssignment?: (assignment: Assignment) => void
    onDeleteAssignment?: (assignment: Assignment) => void
    isTeacher: boolean
}

export const AssignmentSection: React.FC<AssignmentSectionProps> = ({
    title,
    assignments,
    onAssignmentClick,
    onEditAssignment,
    onDeleteAssignment,
}) => {
    if (assignments.length === 0) {
        return null
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">
                {title}
            </h3>
            <div className="space-y-3">
                {assignments.map((assignment) => (
                    <AssignmentCard
                        key={assignment.id}
                        assignment={assignment}
                        onClick={() => onAssignmentClick(assignment.id)}
                        onEdit={
                            onEditAssignment ? () => onEditAssignment(assignment) : undefined
                        }
                        onDelete={
                            onDeleteAssignment
                                ? () => onDeleteAssignment(assignment)
                                : undefined
                        }
                    />
                ))}
            </div>
        </div>
    )
}
