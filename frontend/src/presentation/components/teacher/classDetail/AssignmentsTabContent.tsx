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
}: AssignmentsTabContentProps) {
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
          />
        ) : (
          <AssignmentFilterBar
            activeFilter={assignmentFilter}
            onFilterChange={onFilterChange}
            counts={filterCounts}
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-300 font-medium mb-1">
            No assignments match this filter
          </p>
          <p className="text-sm text-gray-500">
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
          />
          <AssignmentSection
            title="PAST ASSIGNMENTS"
            assignments={groupedAssignments.past}
            onAssignmentClick={onAssignmentClick}
            isTeacher={isTeacher}
          />
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-300 font-medium mb-1">No assignments yet</p>
          {isTeacher ? (
            <>
              <p className="text-sm text-gray-500 mb-4">
                Create your first assignment to get started.
              </p>
              <Button onClick={onCreateAssignment} className="w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Assignment
              </Button>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              Your teacher hasn't created any assignments yet.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
