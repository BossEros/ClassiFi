import type { Assignment, Module } from "@/shared/types/class"

/**
 * Merges the latest assignment state from the flat class-detail assignment list
 * into each module's nested assignments.
 *
 * This keeps module view cards in sync with student-specific fields such as
 * submission state, submitted timestamp, and grade.
 *
 * @param modules - The modules returned for a class.
 * @param assignments - The canonical flat assignment list for the same class.
 * @returns Modules with nested assignments enriched from the canonical list.
 */
export function mergeModuleAssignmentsWithLatestAssignmentState(
  modules: Module[],
  assignments: Assignment[],
): Module[] {
  const assignmentsById = new Map(
    assignments.map((assignment) => [assignment.id, assignment]),
  )

  return modules.map((module) => ({
    ...module,
    assignments: module.assignments.map((moduleAssignment) => {
      const latestAssignmentState = assignmentsById.get(moduleAssignment.id)

      if (!latestAssignmentState) {
        return moduleAssignment
      }

      return {
        ...moduleAssignment,
        ...latestAssignmentState,
      }
    }),
  }))
}
