import type { GradeEntry } from "@/shared/types/gradebook"
import { X, Edit2 } from "lucide-react"

interface GradeCellProps {
  grade: GradeEntry | null
  totalScore: number
}

export function GradeCell({ grade, totalScore }: GradeCellProps) {
  if (!grade || !grade.submissionId) {
    return (
      <span className="inline-flex items-center justify-center w-12 h-8 rounded text-xs text-gray-500">
        -
      </span>
    )
  }

  if (grade.grade === null) {
    return (
      <span
        className="inline-flex items-center justify-center w-12 h-8 rounded bg-gray-700/50 text-gray-400 text-xs"
        title="Not graded yet"
      >
        <X className="w-3 h-3" />
      </span>
    )
  }

  const percentage = totalScore > 0 ? (grade.grade / totalScore) * 100 : 0
  const colorClass = getGradeColorClass(percentage)

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[48px] h-8 px-2 rounded text-sm font-medium ${colorClass}`}
      title={`${grade.grade}/${totalScore} (${Math.round(percentage)}%)`}
    >
      <span>{grade.grade}</span>
      {grade.isOverridden && (
        <span className="ml-1" title="Manually overridden">
          <Edit2 className="w-3 h-3 text-yellow-400" />
        </span>
      )}
    </span>
  )
}

function getGradeColorClass(percentage: number): string {
  if (percentage >= 90) return "bg-green-500/20 text-green-400"
  if (percentage >= 75) return "bg-blue-500/20 text-blue-400"
  if (percentage >= 60) return "bg-yellow-500/20 text-yellow-400"
  if (percentage >= 40) return "bg-orange-500/20 text-orange-400"
  return "bg-red-500/20 text-red-400"
}
