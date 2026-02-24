import { Card, CardContent } from "@/presentation/components/ui/Card"
import { cn } from "@/shared/utils/cn"
import { CheckCircle, Clock } from "lucide-react"
import type { Assignment } from "@/business/models/dashboard/types"
import { DateBlock } from "@/presentation/components/ui/DateBlock"
import { StatusBadge } from "@/presentation/components/ui/StatusBadge"
import { GradeDisplay } from "@/presentation/components/ui/GradeDisplay"
import { parseISODate } from "@/shared/types/class"
import { getAssignmentStatus } from "@/shared/utils/assignmentStatus"
import { formatDateTime } from "@/presentation/utils/dateUtils"

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

  // Only show grade if it actually exists (student submitted and was graded)
  const shouldShowGrade =
    assignment.grade !== null && assignment.grade !== undefined
  const displayGrade = assignment.grade
  const shouldShowStatusBadge = !isTeacher && !shouldShowGrade
  const hasRightSideContent = shouldShowGrade || shouldShowStatusBadge
  const status = shouldShowStatusBadge ? getAssignmentStatus(assignment) : null

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
        {deadlineDate && (
          <DateBlock date={deadlineDate} className="flex-shrink-0" />
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
                    <GradeDisplay
                      grade={displayGrade}
                      maxGrade={
                        assignment.maxGrade || assignment.totalScore || 100
                      }
                    />
                  </div>
                ) : status ? (
                  <StatusBadge status={status} />
                ) : null}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
