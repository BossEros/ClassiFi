import { cn } from "@/shared/utils/cn"
import { Avatar } from "@/presentation/components/ui/Avatar"
import type { EnrolledStudent } from "@/data/api/class.types"

interface StudentListItemProps {
  student: EnrolledStudent
  onClick?: () => void
  onRemove?: () => void
  isLast?: boolean
  className?: string
  gridTemplate?: string
  layoutMode?: "table" | "card"
  variant?: "dark" | "light"
}

/**
 * Renders a single student list item with avatar, name, email, role badge, and optional remove button.
 *
 * @param student - The enrolled student object containing profile information (firstName, lastName, email, avatarUrl).
 * @param onClick - Optional callback function triggered when the list item is clicked.
 * @param onRemove - Optional callback function triggered when the remove button is clicked.
 * @param isLast - Optional boolean indicating if this is the last item in the list (removes bottom border). Defaults to false.
 * @param className - Optional additional CSS classes to apply to the root element.
 * @param gridTemplate - Optional grid template columns string to control layout alignment.
 * @returns A React element representing the student list item.
 */
export function StudentListItem({
  student,
  onClick,
  onRemove,
  isLast = false,
  className,
  gridTemplate = "400px 1fr 150px 60px",
  layoutMode = "table",
  variant = "dark",
}: StudentListItemProps) {
  // Generate initials from first and last name
  const initials =
    `${student.firstName?.[0] ?? ""}${student.lastName?.[0] ?? ""}`.toUpperCase() ||
    "?"

  // Preserve the remove callback contract so the trash action can be restored quickly later.
  void onRemove

  const statusLabel = student.isActive ? "Active" : "Inactive"
  const statusBadgeClassName =
    variant === "light"
      ? student.isActive
        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border border-amber-200 bg-amber-50 text-amber-700"
      : student.isActive
        ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
        : "border border-amber-500/30 bg-amber-500/15 text-amber-300"

  if (layoutMode === "card") {
    return (
      <div
        onClick={onClick}
        className={cn(
          "rounded-xl border p-4 transition-all duration-200",
          variant === "light"
            ? "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            : "border-white/10 bg-slate-900/50 hover:bg-white/5",
          onClick && "cursor-pointer",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <Avatar
            src={student.avatarUrl ?? undefined}
            fallback={initials}
            alt={student.fullName}
            size="md"
          />

          <div className="min-w-0 flex-1">
            <h4
              className={`truncate text-sm font-semibold ${
                variant === "light" ? "text-slate-900" : "text-white"
              }`}
            >
              {student.fullName}
            </h4>
            <p
              className={`mt-1 break-all text-sm ${
                variant === "light" ? "text-slate-500" : "text-gray-400"
              }`}
            >
              {student.email}
            </p>
            <span
              className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClassName}`}
            >
              {statusLabel}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "grid gap-4 items-center px-6 py-4",
        "transition-all duration-200",
        variant === "light" ? "hover:bg-slate-50" : "hover:bg-white/5",
        !isLast &&
          (variant === "light"
            ? "border-b border-slate-100"
            : "border-b border-white/5"),
        onClick && "cursor-pointer",
        className,
      )}
      style={{ gridTemplateColumns: gridTemplate }}
    >
      {/* Avatar and Name */}
      <div className="flex items-center gap-3">
        <Avatar
          src={student.avatarUrl ?? undefined}
          fallback={initials}
          alt={student.fullName}
          size="md"
        />
        <h4
          className={`whitespace-nowrap text-sm font-semibold ${variant === "light" ? "text-slate-900" : "text-white"}`}
        >
          {student.fullName}
        </h4>
      </div>

      {/* Email Address */}
      <div className="min-w-0">
        <p
          className={`truncate text-sm ${variant === "light" ? "text-slate-500" : "text-gray-400"}`}
        >
          {student.email}
        </p>
      </div>

      {/* Role Badge */}
      <div>
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClassName}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Remove Button - intentionally commented out for now so it can be restored quickly later. */}
      {/*
      <div className="flex justify-end">
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className={`rounded-lg p-2 transition-colors ${variant === "light" ? "text-rose-500 hover:bg-rose-50 hover:text-rose-600" : "text-gray-400 hover:bg-red-500/20 hover:text-red-400"}`}
            title="Remove student"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      */}
    </div>
  )
}
