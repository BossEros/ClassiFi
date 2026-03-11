import { Card, CardContent } from "@/presentation/components/ui/Card"
import { cn } from "@/shared/utils/cn"
import { Clock3, Users } from "lucide-react"
import type { Class } from "@/business/models/dashboard/types"
import {
  convertToSingleLetterAbbr,
  formatTimeRange,
} from "@/presentation/constants/schedule.constants"

interface ClassCardProps {
  classItem: Class
  onClick?: () => void
  className?: string
  variant?: "default" | "dashboard"
  accentIndex?: number
}

const codePatterns = [
  `function solve(arr) {
  return arr.sort((a, b) =>
    a - b);
}`,
  `class Node {
  constructor(val) {
    this.value = val;
    this.next = null;
  }
}`,
  `const search = (arr, target) => {
  let left = 0;
  let right = arr.length - 1;
  return binarySearch(left, right);
}`,
  `def fibonacci(n):
    if n <= 1:
        return n
    return fib(n-1) + fib(n-2)`,
  `public class Stack {
    private int[] items;
    private int top = -1;

    public void push(int x) {
        items[++top] = x;
    }
}`,
]

const dashboardAccentBorderClasses = [
  "border-l-teal-500",
  "border-l-orange-500",
  "border-l-indigo-600",
]

const dashboardAccentHeaderClasses = [
  "bg-teal-100",
  "bg-amber-100",
  "bg-indigo-100",
]

const dashboardAccentScheduleClasses = [
  "text-teal-700",
  "text-amber-700",
  "text-indigo-700",
]

const dashboardAccentScheduleIconClasses = [
  "text-teal-600",
  "text-orange-600",
  "text-indigo-600",
]

export function ClassCard({
  classItem,
  onClick,
  className,
  variant = "default",
  accentIndex,
}: ClassCardProps) {
  const isArchived = !classItem.isActive
  const codePattern = codePatterns[classItem.id % codePatterns.length]

  const accentClassIndex =
    typeof accentIndex === "number"
      ? accentIndex % dashboardAccentBorderClasses.length
      : classItem.id % dashboardAccentBorderClasses.length
  const scheduleDayAbbreviations = classItem.schedule?.days?.length
    ? convertToSingleLetterAbbr(classItem.schedule.days).join("")
    : "TBA"
  const scheduleTimeLabel =
    classItem.schedule?.startTime && classItem.schedule?.endTime
      ? formatTimeRange(classItem.schedule.startTime, classItem.schedule.endTime)
      : "Schedule TBD"

  if (variant === "dashboard") {
    return (
      <Card
        variant="interactive"
        onClick={onClick}
        className={cn(
          "w-full min-h-[165px] overflow-hidden rounded-2xl border border-slate-200 border-l-4 bg-white shadow-sm",
          "transition-all duration-200 hover:border-slate-300 hover:shadow-md",
          dashboardAccentBorderClasses[accentClassIndex],
          isArchived && "opacity-75 grayscale hover:grayscale-0",
          className,
        )}
      >
        <CardContent className="p-0">
          <div className={cn("flex items-start justify-between gap-4 px-7 py-5", dashboardAccentHeaderClasses[accentClassIndex])}>
            <div className="min-w-0">
              <h3 className="line-clamp-1 text-lg font-bold tracking-tight text-slate-900">
                {classItem.className}
              </h3>
              <p className="mt-0.5 text-sm font-medium text-slate-500">
                Code: {classItem.classCode}
              </p>
            </div>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="mt-3.5 px-5 pb-3.5">
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold",
                  dashboardAccentScheduleClasses[accentClassIndex],
                )}
              >
                <Clock3
                  className={cn(
                    "h-3 w-3",
                    dashboardAccentScheduleIconClasses[accentClassIndex],
                  )}
                />
                {scheduleDayAbbreviations} {scheduleTimeLabel}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      variant="interactive"
      onClick={onClick}
      className={cn(
        "group relative w-full overflow-hidden border-white/10 bg-slate-800/50 backdrop-blur-md transition-all duration-300 hover:border-white/20",
        isArchived && "opacity-75 grayscale hover:grayscale-0",
        className,
      )}
    >
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-slate-700/50 to-slate-800/50">
        <pre className="pointer-events-none absolute inset-0 select-none p-4 text-xs font-mono leading-relaxed text-slate-400/30">
          {codePattern}
        </pre>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-800/90 to-transparent" />

        {isArchived && (
          <div className="absolute right-3 top-3">
            <span className="inline-flex items-center rounded-full border border-slate-500/30 bg-slate-500/30 px-2.5 py-1 text-xs font-medium text-slate-300 backdrop-blur-sm">
              Archived
            </span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="mb-2 line-clamp-1 text-base font-bold tracking-tight text-white transition-colors group-hover:text-teal-200">
          {classItem.className}
        </h3>

        <div className="mb-3 flex flex-wrap items-center gap-1 text-xs text-slate-400">
          {classItem.academicYear && <span>{classItem.academicYear}</span>}
          {classItem.academicYear && classItem.semester && (
            <span className="mx-1">|</span>
          )}
          {classItem.semester && <span>Sem {classItem.semester}</span>}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-blue-500 text-xs font-semibold text-white">
              {classItem.teacherName
                ? classItem.teacherName
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((namePart) => namePart[0])
                    .filter(Boolean)
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "T"
                : "T"}
            </div>
            <span className="text-xs font-medium text-slate-300">
              {classItem.teacherName || "Instructor"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Users className="h-3.5 w-3.5" />
            <span>{classItem.studentCount || 0}</span>
          </div>
        </div>
      </CardContent>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-teal-500/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </Card>
  )
}
