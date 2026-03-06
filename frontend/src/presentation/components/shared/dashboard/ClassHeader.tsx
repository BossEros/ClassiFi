import React, { useState } from "react"
import { LogOut, Trash2, Edit, User, Clock, Copy, Check } from "lucide-react"
import { DropdownMenu } from "@/presentation/components/ui/DropdownMenu"
import { useToastStore } from "@/shared/store/useToastStore"
import {
  convertToSingleLetterAbbr,
  formatTimeRange,
} from "@/presentation/constants/schedule.constants"

import type { DayOfWeek } from "@/shared/types/class"

interface ClassHeaderProps {
  className?: string
  variant?: "dark" | "light"
  classNameTitle: string
  instructorName: string
  classCode?: string
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
  variant = "dark",
  classNameTitle,
  instructorName,
  classCode,
  description,
  schedule,
  // studentCount, // Unused for now, but part of interface
  isTeacher,
  onEditClass,
  onDeleteClass,
  onLeaveClass,
}) => {
  const [hasCopied, setHasCopied] = useState(false)
  const showToast = useToastStore((state) => state.showToast)

  const handleCopyCode = async () => {
    if (!classCode) return

    try {
      await navigator.clipboard.writeText(classCode)
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy class code:", error)
      showToast("Failed to copy class code", "error")
    }
  }

  const dayAbbreviations = convertToSingleLetterAbbr(schedule.days)
  const daysText = dayAbbreviations.join("")
  const timeText = formatTimeRange(schedule.startTime, schedule.endTime)
  const scheduleText = `${daysText} ${timeText}`
  const isLight = variant === "light"

  return (
    <div
      className={`rounded-2xl border p-6 ${isLight ? "border-slate-200 bg-white shadow-sm" : "border-white/5 bg-slate-900"} ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        {/* Left Side: Class Info */}
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex items-center flex-wrap gap-3">
            <h1 className={`text-3xl font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
              {classNameTitle}
            </h1>
            {isTeacher && classCode && (
              <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 md:ml-2 ${isLight ? "border-teal-100 bg-teal-50" : "border-white/10 bg-white/5"}`}>
                <span className={`text-xs font-medium uppercase tracking-wider ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                  Class Code:
                </span>
                <span className={`text-sm font-mono font-bold tracking-wider ${isLight ? "text-teal-700" : "text-teal-400"}`}>
                  {classCode}
                </span>
                <button
                  type="button"
                  aria-label="Copy class code"
                  onClick={handleCopyCode}
                  className={`ml-1 rounded-md p-1 transition-colors ${isLight ? "text-slate-500 hover:bg-white hover:text-teal-700" : "text-slate-400 hover:bg-white/10 hover:text-teal-400"}`}
                  title="Copy Class Code"
                >
                  {hasCopied ? (
                    <Check className={`w-4 h-4 ${isLight ? "text-emerald-600" : "text-emerald-400"}`} />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <User className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
              <span className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>{instructorName}</span>
            </div>
            {schedule.days.length > 0 &&
              schedule.startTime &&
              schedule.endTime && (
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${isLight ? "text-slate-500" : "text-slate-400"}`} />
                  <span className={`text-sm ${isLight ? "text-slate-600" : "text-slate-300"}`}>{scheduleText}</span>
                </div>
              )}
          </div>

          {description && (
            <p className={`mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed ${isLight ? "text-slate-500" : "text-gray-400"}`}>
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
                className={isLight ? "text-slate-500 hover:text-slate-900" : "text-slate-400 hover:text-white"}
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
              className={isLight ? "text-slate-500 hover:text-slate-900" : "text-slate-400 hover:text-white"}
            />
          )}
        </div>
      </div>
    </div>
  )
}
