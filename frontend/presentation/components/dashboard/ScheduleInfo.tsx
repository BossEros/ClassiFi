import React from "react"
import { Clock } from "lucide-react"
import {
  convertToSingleLetterAbbr,
  formatTimeRange,
} from "@/shared/constants/schedule"
import type { DayOfWeek } from "@/shared/types/class"

interface ScheduleInfoProps {
  days: DayOfWeek[]
  startTime: string
  endTime: string
  className?: string
}

export const ScheduleInfo: React.FC<ScheduleInfoProps> = ({
  days,
  startTime,
  endTime,
  className = "",
}) => {
  if (!days || days.length === 0 || !startTime || !endTime) {
    return null
  }

  const dayAbbreviations = convertToSingleLetterAbbr(days)
  const daysText = dayAbbreviations.join("")
  const timeText = formatTimeRange(startTime, endTime)
  const scheduleText = `${daysText} ${timeText}`

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className="w-4 h-4 text-slate-400" />
      <span className="text-sm text-slate-300">{scheduleText}</span>
    </div>
  )
}
