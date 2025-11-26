/**
 * Assignment Card Component
 * Part of the Presentation Layer - Dashboard Components
 */

import { Card, CardContent } from '@/presentation/components/ui/Card'
import { cn } from '@/shared/utils/cn'
import { Clock, Check, Circle, Pencil, Trash2 } from 'lucide-react'
import type { Assignment } from '@/business/models/dashboard/types'

interface AssignmentCardProps {
  assignment: Assignment
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
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

export function AssignmentCard({ assignment, onClick, onEdit, onDelete, className }: AssignmentCardProps) {
  const deadlineColor = getDeadlineColor(assignment.deadline)

  return (
    <Card
      variant="interactive"
      onClick={onClick}
      className={cn('w-full group transition-all duration-200 hover:border-purple-500/30', className)}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Check status indicator */}
          <div className="flex-shrink-0">
            {assignment.isChecked ? (
              <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center transition-colors group-hover:bg-green-500/20">
                <Check className="w-5 h-5 text-green-400" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-colors group-hover:border-purple-500/50">
                <Circle className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <h3 className="text-base font-medium text-white truncate group-hover:text-purple-100 transition-colors">
                  {assignment.title}
                </h3>
                <div className="flex items-center gap-2">
                  <Clock className={cn('w-3.5 h-3.5', deadlineColor)} />
                  <span className={cn('text-xs font-medium', deadlineColor)}>
                    Due {formatDeadline(assignment.deadline)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {(onEdit || onDelete) && (
                <div className="flex items-center gap-1 pl-3 border-l border-white/10">
                  {onEdit && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit()
                      }}
                      className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="Edit Coursework"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete()
                      }}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete Coursework"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
