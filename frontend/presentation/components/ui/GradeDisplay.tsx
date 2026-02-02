import React from "react"
import {
  formatGrade,
  getGradePercentage,
  getGradeColor,
} from "@/shared/utils/gradeUtils"

interface GradeDisplayProps {
  grade: number | null | undefined
  maxGrade?: number
  className?: string
}

export const GradeDisplay: React.FC<GradeDisplayProps> = ({
  grade,
  maxGrade = 100,
  className = "",
}) => {
  const percentage = getGradePercentage(grade, maxGrade)
  const colorClass = getGradeColor(percentage)
  const formattedGrade = formatGrade(grade, maxGrade)

  return (
    <div className={`flex flex-col items-end ${className}`}>
      <span className={`text-xl font-bold ${colorClass}`}>
        {formattedGrade}
      </span>
      <span className="text-xs text-gray-500 uppercase tracking-wider">
        Grade
      </span>
    </div>
  )
}
