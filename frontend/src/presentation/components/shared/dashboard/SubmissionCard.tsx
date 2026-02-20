import { Card, CardContent } from "@/presentation/components/ui/Card"
import { Avatar } from "@/presentation/components/ui/Avatar"
import { cn } from "@/shared/utils/cn"
import {
  CheckCircle,
  Clock,
  AlertCircle,
  FileCode,
  ArrowRight,
} from "lucide-react"
import type { Submission } from "@/business/models/assignment/types"
import { formatFileSize } from "@/presentation/utils/formatUtils"
import { formatTimeAgo, isLateSubmission } from "@/presentation/utils/dateUtils"

interface SubmissionCardProps {
  submission: Submission
  deadline: Date | null
  onClick?: () => void
  className?: string
}

export function SubmissionCard({
  submission,
  deadline,
  onClick,
  className,
}: SubmissionCardProps) {
  const isLate = isLateSubmission(submission.submittedAt, deadline)
  const timeAgo = formatTimeAgo(submission.submittedAt)
  const fileSizeFormatted = formatFileSize(submission.fileSize)

  return (
    <Card
      variant="interactive"
      onClick={onClick}
      className={cn(
        "w-full group transition-all duration-200",
        isLate ? "hover:border-yellow-500/30" : "hover:border-green-500/30",
        className,
      )}
    >
      <CardContent className="p-6 space-y-4">
        {/* Student Info */}
        <div className="flex items-center gap-3">
          <Avatar
            alt={submission.studentName || "Student"}
            size="md"
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white truncate group-hover:text-teal-100 transition-colors">
              {submission.studentName || "Unknown Student"}
            </h3>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {isLate ? (
            <>
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <span className="text-sm font-medium text-yellow-400">
                Submitted (Late)
              </span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span className="text-sm font-medium text-green-400">
                Submitted
              </span>
            </>
          )}
        </div>

        {/* Submission Time */}
        <div className="flex items-center gap-2 text-gray-400">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{timeAgo}</span>
        </div>

        {/* File Info */}
        <div className="flex items-center gap-2 text-gray-300">
          <FileCode className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm truncate" title={submission.fileName}>
            {submission.fileName}
          </span>
          <span className="text-xs text-gray-500">({fileSizeFormatted})</span>
        </div>

        {/* View Details Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
          className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-white hover:bg-white/10 hover:border-teal-500/50 transition-all duration-200 group/button"
        >
          <span>View Details</span>
          <ArrowRight className="w-4 h-4 group-hover/button:translate-x-0.5 transition-transform" />
        </button>
      </CardContent>
    </Card>
  )
}
