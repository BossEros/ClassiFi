import React from "react"
import { LogOut, Trash2, Edit, User, Clock } from "lucide-react"
import { DropdownMenu } from "@/presentation/components/ui/DropdownMenu"
import { convertToSingleLetterAbbr, formatTimeRange } from "@/presentation/constants/schedule.constants"

import type { DayOfWeek } from "@/shared/types/class"

interface ClassHeaderProps {
  className?: string
  classNameTitle: string
  instructorName: string
  description?: string
  schedule: {
    days: DayOfWeek[]
    startTime: string
    endTime: string
  }
  studentCount: number
  isTeacher: boolean
  onEditClass?: () => void
  onDeleteClass?: () => void
  onLeaveClass?: () => void
}

export const ClassHeader: React.FC<ClassHeaderProps> = ({
  className = "",
  classNameTitle,
  instructorName,
  description,
  schedule,
  // studentCount, // Unused for now, but part of interface
  isTeacher,
  onEditClass,
  onDeleteClass,
  onLeaveClass,
}) => {
  const dayAbbreviations = convertToSingleLetterAbbr(schedule.days)
  const daysText = dayAbbreviations.join("")
  const timeText = formatTimeRange(schedule.startTime, schedule.endTime)
  const scheduleText = `${daysText} ${timeText}`

  return (
    <div
      className={`p-6 bg-slate-900 border border-white/5 rounded-xl ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        {/* Left Side: Class Info */}
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {classNameTitle}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">{instructorName}</span>
            </div>
            {schedule.days.length > 0 &&
              schedule.startTime &&
              schedule.endTime && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">{scheduleText}</span>
                </div>
              )}
          </div>

          {description && (
            <p className="text-gray-400 text-sm whitespace-pre-wrap break-words leading-relaxed mt-2">
              {description}
            </p>
          )}
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-3">
          {isTeacher ? (
            <>
              <DropdownMenu
                items={[
                  {
                    id: "edit",
                    label: "Edit Class",
                    icon: Edit,
                    onClick: onEditClass || (() => {}),
                  },
                  {
                    id: "delete",
                    label: "Delete Class",
                    icon: Trash2,
                    variant: "danger",
                    onClick: onDeleteClass || (() => {}),
                  },
                ]}
                triggerLabel="Class actions"
                className="text-slate-400 hover:text-white"
              />
            </>
          ) : (
            <DropdownMenu
              items={[
                {
                  id: "leave",
                  label: "Leave Class",
                  icon: LogOut,
                  variant: "danger",
                  onClick: onLeaveClass || (() => {}),
                },
              ]}
              triggerLabel="Class actions"
              className="text-slate-400 hover:text-white"
            />
          )}
        </div>
      </div>
    </div>
  )
}
