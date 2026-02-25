import { AlertCircle, CheckCircle2 } from "lucide-react"
import type { Submission } from "@/business/models/assignment/types"
import { isLateSubmission } from "@/presentation/utils/dateUtils"
import {
  formatGrade,
  getGradeColor,
  getGradePercentage,
} from "@/presentation/utils/gradeUtils"
import { cn } from "@/shared/utils/cn"
import { Avatar } from "@/presentation/components/ui/Avatar"
import { TablePaginationFooter } from "@/presentation/components/ui/TablePaginationFooter"

interface AssignmentSubmissionsTableProps {
  submissions: Submission[]
  deadline: Date | null
  maxGrade?: number
  studentAvatarUrlById: Record<number, string | null>
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onViewDetails: (submission: Submission) => void
}

/**
 * Displays teacher assignment submissions in a paginated table layout.
 *
 * @param submissions - Submission rows for the current page.
 * @param deadline - Assignment deadline used to compute late/on-time status.
 * @param maxGrade - Maximum possible assignment score.
 * @param studentAvatarUrlById - Student avatar URL lookup keyed by student ID.
 * @param currentPage - Currently active page (1-indexed).
 * @param totalPages - Total number of pages available.
 * @param totalItems - Total submissions after filtering.
 * @param itemsPerPage - Number of rows shown per page.
 * @param onPageChange - Callback when pagination controls request another page.
 * @param onViewDetails - Callback when a row action requests submission details.
 * @returns A submissions table with action buttons and pagination controls.
 */
export function AssignmentSubmissionsTable({
  submissions,
  deadline,
  maxGrade = 100,
  studentAvatarUrlById,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onViewDetails,
}: AssignmentSubmissionsTableProps) {
  const tableBackgroundColor = "#1E2433"

  return (
    <div className="space-y-4">
      <div
        className="overflow-x-auto rounded-xl border border-white/10 backdrop-blur-md"
        style={{ backgroundColor: tableBackgroundColor }}
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                Student Name
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">
                Status
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">
                Grade
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {submissions.map((submission) => {
              const isLate = isLateSubmission(submission.submittedAt, deadline)
              const submissionGradePercentage = getGradePercentage(submission.grade, maxGrade)
              const submissionGradeClass =
                submission.grade === null || submission.grade === undefined
                  ? "text-slate-400"
                  : getGradeColor(submissionGradePercentage)

              return (
                <tr
                  key={submission.id}
                  className="border-b border-white/5 transition-all duration-200 hover:bg-white/5"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={studentAvatarUrlById[submission.studentId] ?? undefined}
                        alt={submission.studentName || "Unknown Student"}
                        fallback={(submission.studentName || "Unknown Student")
                          .split(" ")
                          .map((namePart) => namePart[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                        size="sm"
                      />
                      <span className="text-sm text-white font-medium">
                        {submission.studentName || "Unknown Student"}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                        isLate
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-green-500/20 text-green-400",
                      )}
                    >
                      {isLate ? (
                        <AlertCircle className="h-3.5 w-3.5" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      <span>{isLate ? "Late" : "On Time"}</span>
                    </span>
                  </td>

                  <td className={cn("px-6 py-4 text-center text-sm font-semibold", submissionGradeClass)}>
                    {formatGrade(submission.grade, maxGrade)}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => onViewDetails(submission)}
                      className="px-3 py-1.5 text-xs font-medium text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-lg transition-all duration-200"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <TablePaginationFooter
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
      />
    </div>
  )
}
