/**
 * Class Card Component
 * Part of the Presentation Layer - Dashboard Components
 */

import { Card, CardContent } from '@/presentation/components/ui/Card'
import { cn } from '@/shared/utils/cn'
import { GraduationCap, Users } from 'lucide-react'
import type { Class } from '@/business/models/dashboard/types'

interface ClassCardProps {
  classItem: Class
  onClick?: () => void
  className?: string
}

export function ClassCard({ classItem, onClick, className }: ClassCardProps) {
  return (
    <Card
      variant="interactive"
      onClick={onClick}
      className={cn('w-full overflow-hidden', className)}
    >
      <CardContent className="p-4 relative">
        {/* Decorative background icon */}
        <GraduationCap className="absolute -right-2 -top-2 w-20 h-20 text-white/5 pointer-events-none" />

        <div className="space-y-3 relative">
          {/* Class name */}
          <h3 className="text-base font-semibold text-white tracking-tight pr-12">
            {classItem.name}
          </h3>

          {/* Class code */}
          <p className="text-sm text-gray-400">
            Code: <span className="text-purple-400 font-mono">{classItem.code}</span>
          </p>

          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Student count */}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users className="w-4 h-4" />
            <span className="text-white font-medium">{classItem.studentCount}</span>
            <span>{classItem.studentCount === 1 ? 'Student' : 'Students'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

