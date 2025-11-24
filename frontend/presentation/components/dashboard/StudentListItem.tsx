/**
 * Student List Item Component
 * Part of the Presentation Layer - Dashboard Components
 */

import { cn } from '@/shared/utils/cn'
import { Avatar } from '@/presentation/components/ui/Avatar'
import { Mail } from 'lucide-react'
import type { EnrolledStudent } from '@/business/models/dashboard/types'

interface StudentListItemProps {
  student: EnrolledStudent
  onClick?: () => void
  className?: string
}

export function StudentListItem({ student, onClick, className }: StudentListItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl',
        'border border-white/10 bg-white/5',
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:bg-white/10 hover:border-white/20',
        className
      )}
    >
      {/* Avatar */}
      <Avatar
        alt={student.fullName}
        size="md"
      />

      {/* Student info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-white truncate">
          {student.fullName}
        </h4>
        <p className="text-sm text-gray-400 truncate">
          @{student.username}
        </p>
      </div>

      {/* Email */}
      <div className="flex items-center gap-2 text-gray-400">
        <Mail className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm hidden sm:block truncate max-w-[200px]">
          {student.email}
        </span>
      </div>
    </div>
  )
}
