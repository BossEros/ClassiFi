import { cn } from "@/shared/utils/cn"
import { Avatar } from "@/presentation/components/ui/Avatar"
import { Trash2 } from "lucide-react"
import type { EnrolledStudent } from "@/business/models/dashboard/types"

interface StudentListItemProps {
  student: EnrolledStudent
  onClick?: () => void
  onRemove?: () => void
  isLast?: boolean
  className?: string
  gridTemplate?: string
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
        "hover:bg-white/5",
        !isLast && "border-b border-white/5",
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
        <h4 className="text-sm font-semibold text-white whitespace-nowrap">
          {student.fullName}
        </h4>
      </div>

      {/* Email Address */}
      <div className="min-w-0">
        <p className="text-sm text-gray-400 truncate">{student.email}</p>
      </div>

      {/* Role Badge */}
      <div>
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-400 border border-teal-500/30">
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
            className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
            title="Remove student"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
