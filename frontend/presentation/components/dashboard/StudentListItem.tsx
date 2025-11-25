/**
 * Student List Item Component
 * Part of the Presentation Layer - Dashboard Components
 */

import { cn } from '@/shared/utils/cn'
import { Avatar } from '@/presentation/components/ui/Avatar'
import { Trash2 } from 'lucide-react'
import type { EnrolledStudent } from '@/business/models/dashboard/types'

interface StudentListItemProps {
  student: EnrolledStudent
  onClick?: () => void
  onRemove?: () => void
  className?: string
}

export function StudentListItem({ student, onClick, onRemove, className }: StudentListItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between p-4 rounded-xl',
        'border border-white/10 bg-white/5',
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:bg-white/10 hover:border-white/20',
        className
      )}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <Avatar
          alt={student.fullName}
          size="md"
        />

        {/* Student info */}
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">
            {student.fullName}
          </h4>
        </div>
      </div>

      {/* Remove Button */}
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
  )
}
