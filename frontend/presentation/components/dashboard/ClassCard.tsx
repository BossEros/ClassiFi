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
  const isArchived = !classItem.isActive

  return (
    <Card
      variant="interactive"
      onClick={onClick}
      className={cn(
        'w-full overflow-hidden group relative border-white/5 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300',
        isArchived && 'opacity-75 grayscale hover:grayscale-0',
        className
      )}
    >
      <CardContent className="p-5 h-full flex flex-col relative z-10">
        {/* Header: Code & Status */}
        <div className="flex items-start justify-between mb-3">
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
            {classItem.classCode}
          </span>
          {isArchived && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/20">
              Archived
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white tracking-tight mb-1 group-hover:text-purple-200 transition-colors line-clamp-2">
          {classItem.className}
        </h3>

        {/* Term Info */}
        {/* Term Info & Year Level */}
        <div className="flex flex-wrap gap-y-1 text-sm text-gray-500 mb-4 items-center">
          {classItem.yearLevel && (
            <>
              <span className="font-medium">Year {classItem.yearLevel}</span>
              {(classItem.academicYear || classItem.semester) && <span className="mx-2 text-gray-700">•</span>}
            </>
          )}
          {classItem.academicYear && <span>{classItem.academicYear}</span>}
          {classItem.academicYear && classItem.semester && <span className="mx-1 text-gray-700">|</span>}
          {classItem.semester && <span>Sem {classItem.semester}</span>}
        </div>

        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400 group-hover:text-white transition-colors">
            <Users className="w-4 h-4" />
            <span className="font-medium">{classItem.studentCount}</span>
            <span>{classItem.studentCount === 1 ? 'Student' : 'Students'}</span>
          </div>
          <GraduationCap className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-all transform group-hover:scale-110" />
        </div>
      </CardContent>

      {/* Decorative Background */}
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
        <GraduationCap className="w-32 h-32 transform rotate-12 -translate-y-8 translate-x-8" />
      </div>

      {/* Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </Card>
  )
}

