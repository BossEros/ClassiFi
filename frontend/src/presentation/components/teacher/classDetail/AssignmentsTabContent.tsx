import { ClipboardList, Plus } from "lucide-react"
import { Button } from "@/presentation/components/ui/Button"
import { AssignmentFilterBar } from "@/presentation/components/shared/dashboard/AssignmentFilterBar"
import { AssignmentSection } from "@/presentation/components/shared/dashboard/AssignmentSection"
import type { Assignment } from "@/business/models/dashboard/types"
import type {
  AssignmentFilter,
  TeacherAssignmentFilter,
} from "@/shared/utils/assignmentFilters"

interface AssignmentsTabContentProps {
  assignments: Assignment[]
  groupedAssignments: {
    current: Assignment[]
    past: Assignment[]
  }
  assignmentFilter: AssignmentFilter
  filterCounts: {
    all: number
    pending: number
    submitted: number
  }
  teacherAssignmentFilter: TeacherAssignmentFilter
  teacherFilterCounts: {
    all: number
    current: number
    past: number
  }
  isTeacher: boolean
  onFilterChange: (filter: AssignmentFilter) => void
  onTeacherFilterChange: (filter: TeacherAssignmentFilter) => void
  onCreateAssignment: () => void
  onAssignmentClick: (assignmentId: number) => void
  variant?: "dark" | "light"
}

export function AssignmentsTabContent({
  assignments,
  groupedAssignments,
  assignmentFilter,
  filterCounts,
  teacherAssignmentFilter,
  teacherFilterCounts,
  isTeacher,
  onFilterChange,
  onTeacherFilterChange,
  onCreateAssignment,
  onAssignmentClick,
  variant = "dark",
}: AssignmentsTabContentProps) {
  const isLight = variant === "light"
  const hasVisibleAssignments =
    groupedAssignments.current.length > 0 || groupedAssignments.past.length > 0
  const shouldShowNoFilterResultsState =
    assignments.length > 0 && !hasVisibleAssignments

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {isTeacher ? (
          <AssignmentFilterBar
            mode="teacher"
            activeFilter={teacherAssignmentFilter}
            onFilterChange={onTeacherFilterChange}
            counts={teacherFilterCounts}
            variant={variant}
          />
        ) : (
          <AssignmentFilterBar
            activeFilter={assignmentFilter}
            onFilterChange={onFilterChange}
            counts={filterCounts}
            variant={variant}
          />
        )}
        {isTeacher ? (
          <Button
            onClick={onCreateAssignment}
            className="w-full sm:w-auto sm:ml-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Assignment
          </Button>
        ) : null}
      </div>

      {shouldShowNoFilterResultsState ? (
        <div className="py-12 text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isLight ? "border border-slate-200 bg-slate-100" : "bg-white/5"}`}>
            <ClipboardList className={`w-8 h-8 ${isLight ? "text-slate-400" : "text-gray-500"}`} />
          </div>
          <p className={`mb-1 font-medium ${isLight ? "text-slate-800" : "text-gray-300"}`}>
            No assignments match this filter
          </p>
          <p className={`text-sm ${isLight ? "text-slate-500" : "text-gray-500"}`}>
            Try selecting a different filter to see more assignments.
          </p>
        </div>
      ) : assignments.length > 0 ? (
        <div className="space-y-6">
          <AssignmentSection
            title="CURRENT & UPCOMING"
            assignments={groupedAssignments.current}
            onAssignmentClick={onAssignmentClick}
            isTeacher={isTeacher}
            variant={variant}
          />
          <AssignmentSection
            title="PAST ASSIGNMENTS"
            assignments={groupedAssignments.past}
            onAssignmentClick={onAssignmentClick}
            isTeacher={isTeacher}
            variant={variant}
          />
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isLight ? "border border-slate-200 bg-slate-100" : "bg-white/5"}`}>
            <ClipboardList className={`w-8 h-8 ${isLight ? "text-slate-400" : "text-gray-500"}`} />
          </div>
          <p className={`mb-1 font-medium ${isLight ? "text-slate-800" : "text-gray-300"}`}>No assignments yet</p>
          {isTeacher ? (
            <>
              <p className={`mb-4 text-sm ${isLight ? "text-slate-500" : "text-gray-500"}`}>
                Create your first assignment to get started.
              </p>
            </>
          ) : (
            <p className={`text-sm ${isLight ? "text-slate-500" : "text-gray-500"}`}>
              Your teacher hasn't created any assignments yet.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
