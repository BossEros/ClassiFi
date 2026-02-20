import { Card, CardContent } from "@/presentation/components/ui/Card"
import { cn } from "@/shared/utils/cn"
import { Clock, CheckCircle } from "lucide-react"
import type { Task } from "@/business/models/dashboard/types"
import {
  formatDeadline,
  getDeadlineColor,
  formatDateTime,
} from "@/presentation/utils/dateUtils"
import { StatusBadge } from "@/presentation/components/ui/StatusBadge"
import { getAssignmentStatus } from "@/shared/utils/assignmentStatus"

interface TaskCardProps {
  task: Task
  onClick?: () => void
  className?: string
}

export function TaskCard({ task, onClick, className }: TaskCardProps) {
  const deadlineColor = getDeadlineColor(task.deadline)
  const status = getAssignmentStatus(task)
  const hasGrade =
    task.grade !== null &&
    task.grade !== undefined &&
    task.maxGrade !== null &&
    task.maxGrade !== undefined

  return (
    <Card
      variant="interactive"
      onClick={onClick}
      className={cn("w-full", className)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              {task.assignmentName}
            </h3>
            {task.hasSubmitted && task.submittedAt && (
              <div className="flex items-center gap-1.5 mt-1">
                <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                <p className="text-xs text-gray-400">
                  Submitted {formatDateTime(task.submittedAt)}
                </p>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Course:{" "}
              <span className="text-white font-medium">{task.className}</span>
            </p>
            <div className="flex items-center gap-2">
              <Clock className={cn("w-4 h-4 flex-shrink-0", deadlineColor)} />
              <p className={cn("text-sm font-medium", deadlineColor)}>
                Deadline: {formatDeadline(task.deadline)}
              </p>
            </div>
            {hasGrade && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Grade:</span>
                  <span className="text-lg font-bold text-teal-400">
                    {task.grade}/{task.maxGrade}
                  </span>
                </div>
                <StatusBadge status={status} />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
