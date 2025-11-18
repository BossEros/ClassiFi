/**
 * Class Card Component
 * Part of the Presentation Layer - Dashboard Components
 */

import { Card, CardContent } from '@/presentation/components/ui/Card'
import { cn } from '@/shared/utils/cn'
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
      className={cn('w-full', className)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-white tracking-tight">
            {classItem.name}
          </h3>
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <p className="text-sm text-gray-400">
            Students: <span className="text-white font-medium">{classItem.studentCount} Students</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

