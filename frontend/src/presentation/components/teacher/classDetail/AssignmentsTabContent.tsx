import { useState } from "react"
import { ClipboardList, Plus } from "lucide-react"
import { Button } from "@/presentation/components/ui/Button"
import { AssignmentFilterBar } from "@/presentation/components/shared/dashboard/AssignmentFilterBar"
import { AssignmentSection } from "@/presentation/components/shared/dashboard/AssignmentSection"
import { ModuleCard, CreateModuleInput, ViewToggle } from "@/presentation/components/shared/modules"
import type { AssignmentViewMode } from "@/presentation/components/shared/modules"
import { dashboardTheme } from "@/presentation/constants/dashboardTheme"
import type { Assignment } from "@/business/models/class"
import type { Module } from "@/business/models/class"
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
  onCreateAssignment: (moduleId?: number) => void
  onAssignmentClick: (assignmentId: number) => void
  modules?: Module[]
  onCreateModule?: (name: string) => Promise<void>
  onRenameModule?: (moduleId: number, name: string) => Promise<void>
  onDeleteModule?: (moduleId: number) => Promise<void>
  onToggleModulePublish?: (moduleId: number, isPublished: boolean) => Promise<void>
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
  modules = [],
  onCreateModule,
  onRenameModule,
  onDeleteModule,
  onToggleModulePublish,
  variant = "dark",
}: AssignmentsTabContentProps) {
  const isLight = variant === "light"
  const [viewMode, setViewMode] = useState<AssignmentViewMode>("module")
  const [expandedModuleIds, setExpandedModuleIds] = useState<Set<number>>(new Set())
  const [hasToggledModules, setHasToggledModules] = useState(false)

  // Derive effective expanded IDs: if user hasn't interacted yet and modules exist, default first open
  const effectiveExpandedIds =
    !hasToggledModules && expandedModuleIds.size === 0 && modules.length > 0
      ? new Set([modules[0].id])
      : expandedModuleIds

  const hasVisibleAssignments = groupedAssignments.current.length > 0 || groupedAssignments.past.length > 0
  const shouldShowNoFilterResultsState = assignments.length > 0 && !hasVisibleAssignments
  const hasModules = modules.length > 0

  const toggleModuleExpanded = (moduleId: number) => {
    setHasToggledModules(true)
    setExpandedModuleIds(() => {
      const next = new Set(effectiveExpandedIds)

      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }

      return next
    })
  }

  const handleAddAssignment = (moduleId: number) => {
    onCreateAssignment(moduleId)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className={isLight ? dashboardTheme.sectionTitle : "text-lg font-semibold tracking-tight text-white"}>
            Assignments
          </h2>
          <div className="flex items-center gap-3 w-full sm:w-auto sm:ml-auto">
            <ViewToggle activeView={viewMode} onViewChange={setViewMode} variant={variant} />
          </div>
        </div>

        {viewMode === "list" && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            {isTeacher && (
              <Button
                onClick={() => onCreateAssignment()}
                variant="secondary"
                className="w-full sm:w-auto shrink-0 border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Assignment
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Module View */}
      {viewMode === "module" && (
        hasModules ? (
          <div className="space-y-4">
            {modules.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                isExpanded={effectiveExpandedIds.has(module.id)}
                onToggleExpand={() => toggleModuleExpanded(module.id)}
                onAssignmentClick={onAssignmentClick}
                isTeacher={isTeacher}
                onAddAssignment={handleAddAssignment}
                onRenameModule={onRenameModule}
                onDeleteModule={onDeleteModule}
                onTogglePublish={onToggleModulePublish}
                variant={variant}
              />
            ))}

            {isTeacher && onCreateModule && (
              <CreateModuleInput onCreateModule={onCreateModule} variant={variant} />
            )}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isLight ? "border border-slate-200 bg-slate-100" : "bg-white/5"}`}>
              <ClipboardList className={`w-8 h-8 ${isLight ? "text-slate-400" : "text-gray-500"}`} />
            </div>
            <p className={`mb-1 font-medium ${isLight ? "text-slate-800" : "text-gray-300"}`}>No modules yet</p>
            {isTeacher ? (
              <>
                <p className={`mb-4 text-sm ${isLight ? "text-slate-500" : "text-gray-500"}`}>
                  Create your first module to start organizing assignments.
                </p>
                {onCreateModule && <CreateModuleInput onCreateModule={onCreateModule} variant={variant} />}
              </>
            ) : (
              <p className={`text-sm ${isLight ? "text-slate-500" : "text-gray-500"}`}>
                Your teacher hasn't created any modules yet.
              </p>
            )}
          </div>
        )
      )}

      {/* List View */}
      {viewMode === "list" && (
        shouldShowNoFilterResultsState ? (
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
              <p className={`mb-4 text-sm ${isLight ? "text-slate-500" : "text-gray-500"}`}>
                Create your first assignment to get started.
              </p>
            ) : (
              <p className={`text-sm ${isLight ? "text-slate-500" : "text-gray-500"}`}>
                Your teacher hasn't created any assignments yet.
              </p>
            )}
          </div>
        )
      )}
    </div>
  )
}

