import type { Assignment } from "@/shared/types/class"

export type AssignmentStatus = "pending" | "not-started" | "submitted" | "late"

/**
 * Determines the status of an assignment based on submission and grading state.
 *
 * @param assignment - The assignment to evaluate
 * @returns The assignment status
 */
export function getAssignmentStatus(assignment: Assignment): AssignmentStatus {
  const now = new Date()
  const deadline = assignment.deadline ? new Date(assignment.deadline) : null
  const hasSubmitted = assignment.hasSubmitted
  const hasGrade = assignment.grade !== null && assignment.grade !== undefined
  const submittedAt = assignment.submittedAt
    ? new Date(assignment.submittedAt)
    : null

  // Not submitted and past deadline
  if (deadline && !hasSubmitted && deadline < now) {
    return "late"
  }

  // Submitted after deadline
  if (deadline && hasSubmitted && submittedAt && submittedAt > deadline) {
    return "late"
  }

  // Submitted and graded
  if (hasSubmitted && hasGrade) {
    return "submitted"
  }

  // Submitted but not graded
  if (hasSubmitted && !hasGrade) {
    return "pending"
  }

  // Not submitted yet (future deadline)
  return "not-started"
}

/**
 * Returns Tailwind color classes for a given assignment status.
 *
 * @param status - The assignment status
 * @returns Tailwind color class string
 */
export function getStatusColor(status: AssignmentStatus): string {
  switch (status) {
    case "pending":
      return "text-yellow-400"
    case "not-started":
      return "text-gray-400"
    case "submitted":
      return "text-teal-400"
    case "late":
      return "text-red-400"
    default:
      return "text-gray-400"
  }
}

/**
 * Returns display label for a given assignment status.
 *
 * @param status - The assignment status
 * @returns Human-readable status label
 */
export function getStatusLabel(status: AssignmentStatus): string {
  switch (status) {
    case "pending":
      return "Pending"
    case "not-started":
      return "Not Started"
    case "submitted":
      return "Submitted"
    case "late":
      return "Late"
    default:
      return "Unknown"
  }
}
