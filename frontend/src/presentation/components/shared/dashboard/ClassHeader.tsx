import React, { useState } from "react"
import { LogOut, Trash2, Edit, Clock, Copy, Check } from "lucide-react"
import { DropdownMenu } from "@/presentation/components/ui/DropdownMenu"
import { Avatar } from "@/presentation/components/ui/Avatar"
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
  instructorAvatarUrl?: string | null
  classCode?: string
  description?: string
  yearLevel?: number
  semester?: number
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
  instructorAvatarUrl,
  classCode,
  description,
  yearLevel,
  semester,
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
  const academicTermText =
    yearLevel && semester ? `Year ${yearLevel} / Sem ${semester}` : null
  const instructorInitials = instructorName
    .split(" ")
    .map((namePart) => namePart[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  if (isLight) {
    return (
      <section className={className}>
        <div className="flex items-stretch gap-5">
          <div className="w-1 shrink-0 rounded-full bg-teal-500" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-4">
              {classCode ? (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-medium uppercase tracking-[0.16em] text-slate-400">
                    Class Code
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 font-mono font-semibold tracking-wide text-slate-500 transition-colors hover:text-teal-700"
                    title="Copy class code"
                  >
                    <span>{classCode}</span>
                    {hasCopied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                    )}
                  </button>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                    {classNameTitle}
                  </h1>
                </div>

                <div className="flex items-center gap-3 self-start">
                  {schedule.days.length > 0 &&
                  schedule.startTime &&
                  schedule.endTime ? (
                    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                      <Clock className="h-4 w-4 text-teal-600" />
                      <span>{scheduleText}</span>
                    </div>
                  ) : null}

                  {isTeacher ? (
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
                      variant="light"
                    />
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
                      variant="light"
                    />
                  )}
                </div>
              </div>

              {description ? (
                <p className="max-w-4xl whitespace-pre-wrap break-words text-base leading-7 text-slate-500">
                  {description}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 text-sm">
                {academicTermText ? (
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {academicTermText}
                  </span>
                ) : null}

                {!isTeacher ? (
                  <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                    <Avatar
                      size="sm"
                      src={instructorAvatarUrl ?? undefined}
                      fallback={instructorInitials}
                      alt={instructorName}
                      className="h-6 w-6 border border-slate-200 text-[10px]"
                    />
                    <span>{instructorName}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div
      className={`rounded-2xl border border-white/5 bg-slate-900 p-6 ${className}`}
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
            <span className="text-sm text-slate-300">{instructorName}</span>
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
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-400">
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


