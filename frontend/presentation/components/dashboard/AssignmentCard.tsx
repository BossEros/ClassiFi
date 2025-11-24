/**
 * Assignment Card Component
 * Part of the Presentation Layer - Dashboard Components
 */

import { Card, CardContent } from '@/presentation/components/ui/Card'
import { cn } from '@/shared/utils/cn'
import { Clock, Check, Circle, Code } from 'lucide-react'
import type { Assignment } from '@/business/models/dashboard/types'

interface AssignmentCardProps {
  assignment: Assignment
  onClick?: () => void
  className?: string
}

function formatDeadline(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
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

function getLanguageLabel(language: string): string {
  const labels: Record<string, string> = {
    python: 'Python',
    java: 'Java'
  }
  return labels[language.toLowerCase()] || language
}

function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    python: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    java: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  }
  return colors[language.toLowerCase()] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

export function AssignmentCard({ assignment, onClick, className }: AssignmentCardProps) {
  const deadlineColor = getDeadlineColor(assignment.deadline)
  const languageColor = getLanguageColor(assignment.programmingLanguage)

  return (
    <Card
      variant="interactive"
      onClick={onClick}
      className={cn('w-full', className)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Check status indicator */}
          <div className="flex-shrink-0 mt-0.5">
            {assignment.isChecked ? (
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-400" />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-gray-500 flex items-center justify-center">
                <Circle className="w-3 h-3 text-gray-500" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-white tracking-tight truncate">
                {assignment.title}
              </h3>

              {/* Language badge */}
              <span className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border flex-shrink-0',
                languageColor
              )}>
                <Code className="w-3 h-3" />
                {getLanguageLabel(assignment.programmingLanguage)}
              </span>
            </div>

            {/* Description preview */}
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">
              {assignment.description}
            </p>

            {/* Deadline */}
            <div className="flex items-center gap-2 mt-3">
              <Clock className={cn('w-4 h-4 flex-shrink-0', deadlineColor)} />
              <span className={cn('text-sm font-medium', deadlineColor)}>
                Due: {formatDeadline(assignment.deadline)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
