import { Card, CardContent } from '@/presentation/components/ui/Card'
import { cn } from '@/shared/utils/cn'
import { Clock } from 'lucide-react'
import type { Task } from '@/business/models/dashboard/types'
import { formatDeadline, getDeadlineColor } from '@/shared/utils/dateUtils'

interface TaskCardProps {
  task: Task
  onClick?: () => void
  className?: string
}

export function TaskCard({ task, onClick, className }: TaskCardProps) {
  const deadlineColor = getDeadlineColor(task.deadline)

  return (
    <Card
      variant="interactive"
      onClick={onClick}
      className={cn('w-full', className)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-white tracking-tight">
            {task.assignmentName}
          </h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Course: <span className="text-white font-medium">{task.className}</span>
            </p>
            <div className="flex items-center gap-2">
              <Clock className={cn('w-4 h-4 flex-shrink-0', deadlineColor)} />
              <p className={cn('text-sm font-medium', deadlineColor)}>
                Deadline: {formatDeadline(task.deadline)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

