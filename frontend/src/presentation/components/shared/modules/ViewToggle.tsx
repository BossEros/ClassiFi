import { LayoutGrid, List } from "lucide-react"
import { cn } from "@/shared/utils/cn"

export type AssignmentViewMode = "module" | "list"

interface ViewToggleProps {
  activeView: AssignmentViewMode
  onViewChange: (view: AssignmentViewMode) => void
  variant?: "dark" | "light"
}

/**
 * Toggle button switching between Module View and List View for assignments.
 *
 * @param activeView - The currently active view mode.
 * @param onViewChange - Callback when the view mode is changed.
 * @param variant - Visual variant for light/dark backgrounds.
 */
export function ViewToggle({ activeView, onViewChange, variant = "light" }: ViewToggleProps) {
  const isLight = variant === "light"

  const baseButtonClass = cn(
    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
  )

  const activeClass = isLight
    ? "bg-white text-slate-900 shadow-sm border border-slate-200"
    : "bg-white/10 text-white shadow-sm border border-white/20"

  const inactiveClass = isLight
    ? "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
    : "text-slate-400 hover:text-white hover:bg-white/5"

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl p-1",
        isLight ? "bg-slate-100" : "bg-white/5",
      )}
      role="tablist"
      aria-label="Assignment view mode"
    >
      <button
        role="tab"
        aria-selected={activeView === "module"}
        onClick={() => onViewChange("module")}
        className={cn(baseButtonClass, activeView === "module" ? activeClass : inactiveClass)}
      >
        <LayoutGrid className="h-4 w-4" />
        Modules
      </button>
      <button
        role="tab"
        aria-selected={activeView === "list"}
        onClick={() => onViewChange("list")}
        className={cn(baseButtonClass, activeView === "list" ? activeClass : inactiveClass)}
      >
        <List className="h-4 w-4" />
        List
      </button>
    </div>
  )
}
