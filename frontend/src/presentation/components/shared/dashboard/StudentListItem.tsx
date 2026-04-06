import { cn } from "@/shared/utils/cn"
import { Avatar } from "@/presentation/components/ui/Avatar"
import { Trash2 } from "lucide-react"
import type { EnrolledStudent } from "@/data/api/class.types"

interface StudentListItemProps {
  student: EnrolledStudent
  onClick?: () => void
  onRemove?: () => void
  isLast?: boolean
  className?: string
  gridTemplate?: string
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
  variant = "dark",
}: StudentListItemProps) {
  // Generate initials from first and last name
  const initials =
    `${student.firstName?.[0] ?? ""}${student.lastName?.[0] ?? ""}`.toUpperCase() ||
    "?"

  return (
    <div
      onClick={onClick}
      className={cn(
        "grid gap-4 items-center px-6 py-4",
        "transition-all duration-200",
        variant === "light" ? "hover:bg-slate-50" : "hover:bg-white/5",
        !isLast &&
          (variant === "light" ? "border-b border-slate-100" : "border-b border-white/5"),
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
        <h4 className={`whitespace-nowrap text-sm font-semibold ${variant === "light" ? "text-slate-900" : "text-white"}`}>
          {student.fullName}
        </h4>
      </div>

      {/* Email Address */}
      <div className="min-w-0">
        <p className={`truncate text-sm ${variant === "light" ? "text-slate-500" : "text-gray-400"}`}>{student.email}</p>
      </div>

      {/* Role Badge */}
      <div>
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${variant === "light" ? "border border-sky-200 bg-sky-50 text-sky-700" : "border border-teal-500/30 bg-teal-500/20 text-teal-400"}`}>
          Student
        </span>
      </div>

      {/* Remove Button */}
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
    </div>
  )
}

