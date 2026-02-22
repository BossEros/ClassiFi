import type { Assignment } from "@/shared/types/class"
import { getAssignmentStatus } from "./assignmentStatus"

export type AssignmentFilter = "all" | "pending" | "submitted"

/**
 * Filters assignments based on the selected filter type.
 *
 * @param assignments - Array of assignments to filter
 * @param filter - Filter type to apply
 * @returns Filtered array of assignments
 */
export function filterAssignments(
  assignments: Assignment[],
  filter: AssignmentFilter,
): Assignment[] {
  if (filter === "all") {
    return assignments
  }

  return assignments.filter((assignment) => {
    const status = getAssignmentStatus(assignment)

    if (filter === "pending") {
      return status === "pending" || status === "not-started"
    }

    if (filter === "submitted") {
      return status === "submitted" || status === "late"
    }

    return false
  })
}

/**
 * Groups assignments into current and past based on deadline.
 *
 * @param assignments - Array of assignments to group
 * @returns Object with current and past assignment arrays
 */
export function groupAssignments(assignments: Assignment[]): {
  current: Assignment[]
  past: Assignment[]
} {
  const now = new Date()
  const getDeadlineTimestamp = (deadline: Assignment["deadline"]): number => {
    if (!deadline) {
      return Number.POSITIVE_INFINITY
    }

    const parsed = new Date(deadline).getTime()
    return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed
  }

  const current = assignments.filter(
    (a) => !a.deadline || getDeadlineTimestamp(a.deadline) >= now.getTime(),
  )
  const past = assignments.filter(
    (a) => !!a.deadline && getDeadlineTimestamp(a.deadline) < now.getTime(),
  )

  // Sort by deadline (earliest first)
  current.sort(
    (a, b) =>
      getDeadlineTimestamp(a.deadline) - getDeadlineTimestamp(b.deadline),
  )
  past.sort(
    (a, b) =>
      getDeadlineTimestamp(a.deadline) - getDeadlineTimestamp(b.deadline),
  )

  return { current, past }
}

/**
 * Calculates counts for each filter category.
 *
 * @param assignments - Array of assignments to count
 * @returns Object with counts for all, pending, and submitted
 */
export function calculateFilterCounts(assignments: Assignment[]): {
  all: number
  pending: number
  submitted: number
} {
  const all = assignments.length
  const pending = assignments.filter((a) => {
    const status = getAssignmentStatus(a)
    return status === "pending" || status === "not-started"
  }).length
  const submitted = assignments.filter((a) => {
    const status = getAssignmentStatus(a)
    return status === "submitted" || status === "late"
  }).length

  return { all, pending, submitted }
}
