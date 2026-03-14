import { useState } from "react"
import { ChevronDown, Plus, Pencil, Trash2, Eye, EyeOff, MoreHorizontal } from "lucide-react"
import { AssignmentCard } from "@/presentation/components/shared/dashboard/AssignmentCard"
import { RenameModuleModal } from "@/presentation/components/shared/modules/RenameModuleModal"
import { DeleteModuleModal } from "@/presentation/components/shared/modules/DeleteModuleModal"
import { cn } from "@/shared/utils/cn"
import type { Module } from "@/shared/types/class"
import type { Assignment } from "@/business/models/dashboard/types"

interface ModuleCardProps {
  module: Module
  isExpanded: boolean
  onToggleExpand: () => void
  onAssignmentClick: (assignmentId: number) => void
  isTeacher: boolean
  onAddAssignment?: (moduleId: number) => void
  onRenameModule?: (moduleId: number, name: string) => Promise<void>
  onDeleteModule?: (moduleId: number) => Promise<void>
  onTogglePublish?: (moduleId: number, isPublished: boolean) => Promise<void>
  variant?: "dark" | "light"
}

/**
 * Collapsible accordion container for a module — displays header with actions and assignment list.
 *
 * @param module - The module data including its assignments.
 * @param isExpanded - Whether the module is currently expanded.
 * @param onToggleExpand - Callback to toggle expansion.
 * @param onAssignmentClick - Callback when an assignment is clicked.
 * @param isTeacher - Whether the current user is a teacher.
 * @param onAddAssignment - Callback to add an assignment to this module.
 * @param onRenameModule - Async callback to rename this module.
 * @param onDeleteModule - Async callback to delete this module.
 * @param onTogglePublish - Async callback to toggle publish state.
 * @param variant - Visual variant for light/dark backgrounds.
 */
export function ModuleCard({
  module,
  isExpanded,
  onToggleExpand,
  onAssignmentClick,
  isTeacher,
  onAddAssignment,
  onRenameModule,
  onDeleteModule,
  onTogglePublish,
  variant = "light",
}: ModuleCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const isLight = variant === "light"
  const isUnpublished = !module.isPublished
  const assignments = module.assignments as Assignment[]
  const assignmentCount = assignments.length

  const handleRename = async (name: string) => {
    if (onRenameModule) {
      await onRenameModule(module.id, name)
    }
  }

  const handleDelete = async () => {
    if (onDeleteModule) {
      await onDeleteModule(module.id)
    }
  }

  const handleTogglePublish = async () => {
    if (onTogglePublish) {
      await onTogglePublish(module.id, !module.isPublished)
    }

    setIsMenuOpen(false)
  }

  return (
    <>
      <div
        className={cn(
          "rounded-xl border transition-colors duration-200",
          isLight
            ? isUnpublished
              ? "border-dashed border-slate-300 bg-slate-50/50"
              : "border-slate-200 bg-white shadow-sm"
            : isUnpublished
              ? "border-dashed border-white/20 bg-white/3"
              : "border-white/10 bg-white/5",
        )}
      >
        {/* Module Header */}
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3",
            isLight ? "border-slate-200" : "border-white/10",
            isExpanded && assignmentCount > 0 && "border-b",
          )}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={onToggleExpand}
            className={cn(
              "flex items-center justify-center rounded-lg p-1 transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
              isLight ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100" : "text-slate-500 hover:text-white hover:bg-white/5",
            )}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? `Collapse ${module.name}` : `Expand ${module.name}`}
          >
            <ChevronDown
              className={cn(
                "h-5 w-5 transition-transform duration-200",
                isExpanded && "rotate-180",
              )}
            />
          </button>

          {/* Module Name + Badge */}
          <button
            onClick={onToggleExpand}
            className="flex flex-1 items-center gap-2 text-left min-w-0"
          >
            <h3
              className={cn(
                "text-sm font-semibold truncate",
                isLight ? "text-slate-900" : "text-white",
                isUnpublished && "opacity-70",
              )}
            >
              {module.name}
            </h3>

            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                isLight ? "bg-slate-100 text-slate-500" : "bg-white/10 text-slate-400",
              )}
            >
              {assignmentCount} {assignmentCount === 1 ? "assignment" : "assignments"}
            </span>

            {isUnpublished && (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                Draft
              </span>
            )}
          </button>

          {/* Teacher Actions */}
          {isTeacher && (
            <div className="relative flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={cn(
                  "rounded-lg p-1.5 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                  isLight ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100" : "text-slate-500 hover:text-white hover:bg-white/5",
                )}
                aria-label="Module actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                  <div
                    className={cn(
                      "absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border py-1 shadow-lg",
                      isLight ? "border-slate-200 bg-white" : "border-white/20 bg-slate-800",
                    )}
                  >
                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        setIsRenameModalOpen(true)
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors duration-200",
                        isLight ? "text-slate-700 hover:bg-slate-50" : "text-slate-300 hover:bg-white/5",
                      )}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Rename
                    </button>
                    <button
                      onClick={handleTogglePublish}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors duration-200",
                        isLight ? "text-slate-700 hover:bg-slate-50" : "text-slate-300 hover:bg-white/5",
                      )}
                    >
                      {module.isPublished ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          Publish
                        </>
                      )}
                    </button>
                    <div className={cn("my-1 h-px", isLight ? "bg-slate-100" : "bg-white/10")} />
                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        setIsDeleteModalOpen(true)
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors duration-200",
                        "text-rose-600 hover:bg-rose-50",
                      )}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Assignments List (Collapsible) */}
        {isExpanded && (
          <div className="px-4 py-3 space-y-3">
            {assignmentCount > 0 ? (
              assignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  onClick={() => onAssignmentClick(assignment.id)}
                  isTeacher={isTeacher}
                  variant={variant}
                />
              ))
            ) : (
              <p className={cn("py-4 text-center text-sm", isLight ? "text-slate-400" : "text-slate-500")}>
                No assignments in this module yet.
              </p>
            )}

            {/* Add Assignment Button (Teacher only) */}
            {isTeacher && onAddAssignment && (
              <button
                onClick={() => onAddAssignment(module.id)}
                className={cn(
                  "flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-sm font-medium transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                  isLight
                    ? "border-slate-300 text-slate-400 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50/50"
                    : "border-white/20 text-slate-500 hover:border-teal-400 hover:text-teal-400 hover:bg-white/5",
                )}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Assignment
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <RenameModuleModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        onRename={handleRename}
        currentName={module.name}
      />
      <DeleteModuleModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        moduleName={module.name}
        assignmentCount={assignmentCount}
      />
    </>
  )
}
