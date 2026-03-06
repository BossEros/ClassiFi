import { Card, CardContent } from "@/presentation/components/ui/Card"
import { cn } from "@/shared/utils/cn"
import { CheckCircle, Clock } from "lucide-react"
import type { Assignment } from "@/business/models/dashboard/types"
import { parseISODate } from "@/shared/types/class"
import {
  getAssignmentStatus,
  getStatusLabel,
} from "@/shared/utils/assignmentStatus"
import { formatDateTime } from "@/presentation/utils/dateUtils"
import {
  formatGrade,
  getGradePercentage,
  getGradeColor,
} from "@/presentation/utils/gradeUtils"

interface AssignmentCardProps {
  assignment: Assignment
  onClick?: () => void
  className?: string
  isTeacher?: boolean // Added to conditionally show teacher actions/grades
  variant?: "dark" | "light"
}

export function AssignmentCard({
  assignment,
  onClick,
  className,
  isTeacher = false,
  variant = "dark",
}: AssignmentCardProps) {
  const deadlineDate = parseISODate(assignment.deadline)
  const month = deadlineDate
    ? deadlineDate.toLocaleString("default", { month: "short" }).toUpperCase()
    : null
  const day = deadlineDate
    ? deadlineDate.getDate().toString().padStart(2, "0")
    : null

  // Only show grade if it actually exists (student submitted and was graded)
  const shouldShowGrade =
    assignment.grade !== null && assignment.grade !== undefined
  const displayGrade = assignment.grade
  const shouldShowStatusBadge = !isTeacher && !shouldShowGrade
  const hasRightSideContent = shouldShowGrade || shouldShowStatusBadge
  const status = shouldShowStatusBadge ? getAssignmentStatus(assignment) : null
  const gradePercentage = getGradePercentage(
    displayGrade,
    assignment.maxGrade || assignment.totalScore || 100,
  )
  const gradeColorClass = getGradeColor(gradePercentage)
  const formattedGrade = formatGrade(
    displayGrade,
    assignment.maxGrade || assignment.totalScore || 100,
  )

  const getStatusStyles = (statusValue: NonNullable<typeof status>): string => {
    if (variant === "light") {
      switch (statusValue) {
        case "pending":
          return "border-amber-200 bg-amber-50 text-amber-700"
        case "not-started":
          return "border-slate-200 bg-slate-100 text-slate-600"
        case "submitted":
          return "border-teal-200 bg-teal-50 text-teal-700"
        case "late":
          return "border-rose-200 bg-rose-50 text-rose-700"
        default:
          return "border-slate-200 bg-slate-100 text-slate-600"
      }
    }

    switch (statusValue) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "not-started":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      case "submitted":
        return "bg-teal-500/20 text-teal-400 border-teal-500/30"
      case "late":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  return (
    <Card
      variant="interactive"
      onClick={onClick}
      className={cn(
        variant === "light"
          ? "w-full border-slate-300 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:bg-white hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
          : "w-full group transition-all duration-200 hover:border-teal-500/30 bg-slate-800/50 border-white/5",
        className,
      )}
    >
      <CardContent className="p-4 flex items-center gap-4">
        {/* Date Block */}
        {deadlineDate && month && day && (
          <div
            className={`flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-lg border ${
              variant === "light"
                ? "border-slate-300 bg-slate-100"
                : "border-slate-700 bg-slate-900"
            }`}
          >
            <span className={`text-xs font-semibold uppercase tracking-wider ${variant === "light" ? "text-slate-500" : "text-slate-400"}`}>
              {month}
            </span>
            <span className={`text-2xl font-bold ${variant === "light" ? "text-teal-700" : "text-teal-400"}`}>{day}</span>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div
            className={cn(
              "flex items-start gap-4",
              hasRightSideContent ? "justify-between" : "justify-start",
            )}
          >
            <div className="space-y-1 flex-1 min-w-0">
              <h3 className={`truncate text-base font-semibold transition-colors ${variant === "light" ? "text-slate-900 group-hover:text-teal-700" : "text-white group-hover:text-teal-400"}`}>
                {assignment.assignmentName}
              </h3>

              {isTeacher ? (
                <div className="flex items-center gap-1.5">
                  <Clock className={`h-3.5 w-3.5 flex-shrink-0 ${variant === "light" ? "text-amber-500" : "text-orange-400"}`} />
                  <p className={`text-xs ${variant === "light" ? "text-slate-500" : "text-gray-400"}`}>
                    {assignment.deadline
                      ? `Due ${formatDateTime(assignment.deadline)}`
                      : "No deadline"}
                  </p>
                </div>
              ) : assignment.hasSubmitted && assignment.submittedAt ? (
                <div className="flex items-center gap-1.5">
                  <CheckCircle className={`h-3.5 w-3.5 flex-shrink-0 ${variant === "light" ? "text-teal-600" : "text-teal-400"}`} />
                  <p className={`text-xs ${variant === "light" ? "text-slate-500" : "text-gray-400"}`}>
                    Submitted {formatDateTime(assignment.submittedAt)}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Clock className={`h-3.5 w-3.5 flex-shrink-0 ${variant === "light" ? "text-amber-500" : "text-orange-400"}`} />
                  <p className={`text-xs ${variant === "light" ? "text-slate-500" : "text-gray-400"}`}>
                    {assignment.deadline
                      ? `Due ${formatDateTime(assignment.deadline)}`
                      : "No deadline"}
                  </p>
                </div>
              )}
            </div>

            {/* Right Side: Grade or Status */}
            {hasRightSideContent && (
              <div className="flex items-center gap-3">
                {shouldShowGrade ? (
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className={`text-xl font-bold ${gradeColorClass}`}>
                        {formattedGrade}
                      </span>
                      <span className={`text-xs uppercase tracking-wider ${variant === "light" ? "text-slate-400" : "text-gray-500"}`}>
                        Grade
                      </span>
                    </div>
                  </div>
                ) : status ? (
                  <span
                    role="status"
                    aria-label={`Assignment status: ${getStatusLabel(status)}`}
                    className={`inline-flex items-center px-2 py-1 rounded text-sm font-semibold border ${getStatusStyles(status)}`}
                  >
                    {getStatusLabel(status)}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
