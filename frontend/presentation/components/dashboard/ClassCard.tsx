import { Card, CardContent } from "@/presentation/components/ui/Card"
import { cn } from "@/shared/utils/cn"
import { Users } from "lucide-react"
import type { Class } from "@/business/models/dashboard/types"

interface ClassCardProps {
  classItem: Class
  onClick?: () => void
  className?: string
}

// Code snippet patterns for visual backgrounds
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

export function ClassCard({ classItem, onClick, className }: ClassCardProps) {
  const isArchived = !classItem.isActive
  // Use class ID to consistently pick a code pattern
  const codePattern = codePatterns[classItem.id % codePatterns.length]

  return (
    <Card
      variant="interactive"
      onClick={onClick}
      className={cn(
        "w-full overflow-hidden group relative border-white/10 bg-slate-800/50 backdrop-blur-md hover:border-white/20 transition-all duration-300",
        isArchived && "opacity-75 grayscale hover:grayscale-0",
        className,
      )}
    >
      {/* Code Background */}
      <div className="relative h-32 bg-gradient-to-br from-slate-700/50 to-slate-800/50 overflow-hidden">
        <pre className="absolute inset-0 p-4 text-xs text-slate-400/30 font-mono leading-relaxed select-none pointer-events-none">
          {codePattern}
        </pre>
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-800/90 to-transparent" />

        {/* Class Code Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30 font-mono backdrop-blur-sm">
            {classItem.classCode}
          </span>
        </div>

        {isArchived && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/30 text-slate-300 border border-slate-500/30 backdrop-blur-sm">
              Archived
            </span>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <h3 className="text-base font-bold text-white tracking-tight mb-2 group-hover:text-teal-200 transition-colors line-clamp-1">
          {classItem.className}
        </h3>

        {/* Term Info */}
        <div className="flex flex-wrap gap-1 text-xs text-slate-400 mb-3 items-center">
          {classItem.yearLevel && (
            <>
              <span>Year {classItem.yearLevel}</span>
              {(classItem.academicYear || classItem.semester) && (
                <span className="mx-1">•</span>
              )}
            </>
          )}
          {classItem.academicYear && <span>{classItem.academicYear}</span>}
          {classItem.academicYear && classItem.semester && (
            <span className="mx-1">|</span>
          )}
          {classItem.semester && <span>Sem {classItem.semester}</span>}
        </div>

        {/* Footer: Instructor & Student Count */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          {/* Instructor */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
              {classItem.teacherName
                ? classItem.teacherName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "T"}
            </div>
            <span className="text-xs text-slate-300 font-medium">
              {classItem.teacherName || "Instructor"}
            </span>
          </div>

          {/* Student Count */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Users className="w-3.5 h-3.5" />
            <span>{classItem.studentCount || 0}</span>
          </div>
        </div>
      </CardContent>

      {/* Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </Card>
  )
}
