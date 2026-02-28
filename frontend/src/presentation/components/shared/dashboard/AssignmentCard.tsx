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
}

export function AssignmentCard({
  assignment,
  onClick,
  className,
  isTeacher = false,
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
        "w-full group transition-all duration-200 hover:border-teal-500/30 bg-slate-800/50 border-white/5",
        className,
      )}
    >
      <CardContent className="p-4 flex items-center gap-4">
        {/* Date Block */}
        {deadlineDate && month && day && (
          <div className="flex flex-col items-center justify-center w-16 h-16 bg-slate-900 border border-slate-700 rounded-lg flex-shrink-0">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {month}
            </span>
            <span className="text-2xl font-bold text-teal-400">{day}</span>
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
              <h3 className="text-base font-semibold text-white truncate group-hover:text-teal-400 transition-colors">
                {assignment.assignmentName}
              </h3>

              {isTeacher ? (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                  <p className="text-xs text-gray-400">
                    {assignment.deadline
                      ? `Due ${formatDateTime(assignment.deadline)}`
                      : "No deadline"}
                  </p>
                </div>
              ) : assignment.hasSubmitted && assignment.submittedAt ? (
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                  <p className="text-xs text-gray-400">
                    Submitted {formatDateTime(assignment.submittedAt)}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                  <p className="text-xs text-gray-400">
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
                      <span className="text-xs text-gray-500 uppercase tracking-wider">
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
