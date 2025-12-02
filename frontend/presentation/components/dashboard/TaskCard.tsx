import { Card, CardContent } from '@/presentation/components/ui/Card'
import { cn } from '@/shared/utils/cn'
import { Clock } from 'lucide-react'
import type { Task } from '@/business/models/dashboard/types'

interface TaskCardProps {
  task: Task
  onClick?: () => void
  className?: string
}

function formatDeadline(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  return date.toLocaleString('en-US', options)
}

function getDeadlineColor(date: Date): string {
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)

  if (diffDays < 0) return 'text-red-400'
  if (diffDays < 1) return 'text-orange-400'
  if (diffDays < 3) return 'text-yellow-400'
  return 'text-gray-400'
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
            {task.title}
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

