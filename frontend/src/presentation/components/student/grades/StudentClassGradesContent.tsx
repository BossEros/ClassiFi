import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Clock3,
  Download,
  FileText,
  MessageSquareText,
  RefreshCw,
} from "lucide-react"
import { useState, type ElementType } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import { dashboardTheme } from "@/presentation/constants/dashboardTheme"
import { useStudentGrades } from "@/presentation/hooks/teacher/useGradebook"
import { downloadPdfDocument } from "@/presentation/utils/pdfDownload"
import { useToastStore } from "@/shared/store/useToastStore"
import { formatDateTime } from "@/presentation/utils/dateUtils"
import type { StudentGradeEntry } from "@/data/api/gradebook.types"
import { cn } from "@/shared/utils/cn"
import { calculateStudentGradeSummaryMetrics } from "@/presentation/utils/studentGradeMetrics"
import { GradeBreakdownPanel } from "@/presentation/components/shared/GradeBreakdownPanel"
import {
  buildStudentGradeReportData,
  StudentGradeReportDocument,
} from "./pdf/studentGradeReportPdf"

interface StudentClassGradesContentProps {
  classId: number
  studentId: number
  studentName?: string
  variant?: "dark" | "light"
}

interface LatePenaltyBadgeProps {
  penaltyPercent: number
  small?: boolean
  className?: string
  variant?: "dark" | "light"
}

interface SummaryCardProps {
  icon: ElementType
  label: string
  value: string
  helperText?: string
  variant?: "dark" | "light"
}

function LatePenaltyBadge({
  penaltyPercent,
  small = false,
  className,
  variant = "light",
}: LatePenaltyBadgeProps) {
  if (penaltyPercent <= 0) return null

  const isRejected = penaltyPercent >= 100

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium text-xs",
        small ? "px-1.5 py-0.5" : "px-2 py-1",
        variant === "light"
          ? isRejected
            ? "bg-rose-50 text-rose-700 border border-rose-200"
            : "bg-orange-50 text-orange-700 border border-orange-200"
          : isRejected
            ? "bg-red-500/20 text-red-400"
            : "bg-orange-500/20 text-orange-400",
        className,
      )}
      title={
        isRejected
          ? "Late submission rejected"
          : `${penaltyPercent}% late penalty applied`
      }
    >
      <Clock3 className={cn(small ? "h-2.5 w-2.5" : "h-3 w-3")} />
      {isRejected ? "Rejected" : `-${penaltyPercent}%`}
    </span>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  helperText,
  variant = "light",
}: SummaryCardProps) {
  return (
    <Card
      className={
        variant === "light"
          ? "border-slate-200 bg-white shadow-sm backdrop-blur-0"
          : undefined
      }
    >
      <CardContent className="flex items-start gap-4 py-5">
        <Icon
          className={cn(
            "mt-0.5 h-5 w-5 shrink-0",
            variant === "light" ? "text-teal-700" : "text-teal-400",
          )}
        />
        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-semibold tracking-tight",
              variant === "light" ? "text-slate-700" : "text-slate-200",
            )}
          >
            {label}
          </p>
          <p
            className={cn(
              "mt-1 text-2xl font-semibold tracking-tight",
              variant === "light" ? "text-slate-900" : "text-white",
            )}
          >
            {value}
          </p>
          {helperText ? (
            <p
              className={cn(
                "mt-1 text-xs",
                variant === "light" ? "text-slate-400" : "text-slate-400",
              )}
            >
              {helperText}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function getGradeColor(percentage: number, variant: "dark" | "light"): string {
  if (variant === "light") {
    if (percentage >= 90) return "text-emerald-700"
    if (percentage >= 75) return "text-sky-700"
    if (percentage >= 60) return "text-amber-700"
    if (percentage >= 40) return "text-orange-700"
    return "text-rose-700"
  }

  if (percentage >= 90) return "text-green-400"
  if (percentage >= 75) return "text-blue-400"
  if (percentage >= 60) return "text-yellow-400"
  if (percentage >= 40) return "text-orange-400"
  return "text-red-400"
}

function AssignmentGradeRow({
  assignment,
  variant = "light",
}: {
  assignment: StudentGradeEntry
  variant?: "dark" | "light"
}) {
  const [isGradeBreakdownExpanded, setIsGradeBreakdownExpanded] = useState(false)
  const hasGrade = assignment.grade !== null && assignment.grade !== undefined
  const hasSubmission = Boolean(assignment.submittedAt)
  const hasGradeBreakdown =
    assignment.gradeBreakdown?.originalGrade !== null &&
    assignment.gradeBreakdown?.originalGrade !== undefined
  const percentage =
    hasGrade && assignment.totalScore > 0
      ? ((assignment.grade ?? 0) / assignment.totalScore) * 100
      : 0

  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        variant === "light"
          ? "border-slate-200 bg-slate-50/70"
          : "border-white/10 bg-white/5",
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                "text-sm font-semibold",
                variant === "light" ? "text-slate-900" : "text-white",
              )}
            >
              {assignment.assignmentName}
            </p>
            {assignment.isOverridden ? (
              <span
                className={cn(
                  "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                  variant === "light"
                    ? "border border-amber-200 bg-amber-50 text-amber-700"
                    : "bg-yellow-500/20 text-yellow-400",
                )}
              >
                Adjusted
              </span>
            ) : null}
            {assignment.feedback ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  variant === "light"
                    ? "border border-sky-200 bg-sky-50 text-sky-700"
                    : "bg-blue-500/20 text-blue-400",
                )}
              >
                <MessageSquareText className="h-3 w-3" />
                Feedback
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-1",
                variant === "light" ? "text-slate-500" : "text-slate-300",
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              Max {assignment.totalScore} points
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1",
                variant === "light" ? "text-slate-500" : "text-slate-300",
              )}
            >
              <Clock3 className="h-3.5 w-3.5" />
              Due {formatDateTime(assignment.deadline)}
            </span>
            {hasSubmission ? (
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  variant === "light" ? "text-slate-500" : "text-slate-300",
                )}
              >
                <ClipboardCheck className="h-3.5 w-3.5" />
                Submitted {formatDateTime(assignment.submittedAt)}
              </span>
            ) : null}
            {assignment.isLate ? (
              <LatePenaltyBadge
                penaltyPercent={assignment.penaltyApplied ?? 0}
                small
                variant={variant}
              />
            ) : null}
          </div>
        </div>

        <div className="shrink-0 text-left md:text-right">
          {hasGrade ? (
            <div className="space-y-1">
              <p
                className={cn(
                  "text-xl font-bold",
                  getGradeColor(percentage, variant),
                )}
              >
                {assignment.grade}/{assignment.totalScore}
              </p>
              <p
                className={cn(
                  "text-xs font-medium",
                  getGradeColor(percentage, variant),
                )}
              >
                {Math.round(percentage)}%
              </p>
              {assignment.isOverridden ? (
                <div
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-xs md:text-right",
                    variant === "light"
                      ? "border-slate-200 bg-white text-blue-700"
                      : "border-white/10 bg-slate-900/60 text-blue-300",
                  )}
                >
                  Displayed score includes a manual override.
                </div>
              ) : null}
            </div>
          ) : hasSubmission ? (
            <div
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                variant === "light"
                  ? "border border-amber-200 bg-amber-50 text-amber-700"
                  : "bg-yellow-500/20 text-yellow-400",
              )}
            >
              Pending review
            </div>
          ) : (
            <div
              className={cn(
                "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                variant === "light"
                  ? "border border-slate-200 bg-white text-slate-500"
                  : "bg-white/10 text-slate-300",
              )}
            >
              Not submitted
            </div>
          )}
        </div>
      </div>

      {assignment.feedback && !assignment.isOverridden ? (
        <div
          className={cn(
            "mt-4 rounded-xl border px-3 py-3",
            variant === "light"
              ? "border-slate-200 bg-white"
              : "border-white/10 bg-slate-900/60",
          )}
        >
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.12em]",
              variant === "light" ? "text-slate-500" : "text-slate-400",
            )}
          >
            Teacher Feedback
          </p>
          <p
            className={cn(
              "mt-2 text-sm leading-6",
              variant === "light" ? "text-slate-700" : "text-slate-200",
            )}
          >
            {assignment.feedback}
          </p>
        </div>
      ) : null}

      {hasGradeBreakdown ? (
        <>
          <button
            type="button"
            onClick={() => setIsGradeBreakdownExpanded((previousValue) => !previousValue)}
            className={cn(
              "mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
              isGradeBreakdownExpanded
                ? "border border-teal-200 bg-teal-50 text-teal-800"
                : variant === "light"
                  ? "border border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                  : "border border-white/10 bg-white/5 text-slate-200 hover:border-teal-400/40 hover:bg-teal-500/10 hover:text-teal-200",
            )}
            aria-expanded={isGradeBreakdownExpanded}
          >
            {isGradeBreakdownExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            {isGradeBreakdownExpanded ? "Hide" : "View"} Grade Breakdown
          </button>

          {isGradeBreakdownExpanded ? (
            <GradeBreakdownPanel
              breakdown={assignment.gradeBreakdown}
              totalScore={assignment.totalScore}
              submittedAt={assignment.submittedAt}
              deadline={assignment.deadline}
              overrideReason={assignment.feedback}
              variant={variant}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}

/**
 * Displays a student-only class grades view focused on personal performance, not class-wide rankings.
 *
 * @param classId - The current class identifier.
 * @param studentId - The current student identifier.
 * @param variant - Optional visual variant for light or dark surfaces.
 * @returns The class-scoped student grades content for the class overview grades tab.
 */
export function StudentClassGradesContent({
  classId,
  studentId,
  studentName,
  variant = "light",
}: StudentClassGradesContentProps) {
  const showToast = useToastStore((state) => state.showToast)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)

  const { grades, isLoading, error, refetch } = useStudentGrades(
    studentId,
    classId,
  )
  const classGrades = grades[0] ?? null
  const {
    currentGrade,
    gradedCount,
    overdueMissingCount,
    pendingReviewCount,
    notSubmittedCount,
    totalAssignments,
  } = calculateStudentGradeSummaryMetrics(classGrades?.assignments ?? [])

  const handleDownloadPdf = async () => {
    if (!classGrades) return

    try {
      setIsDownloadingPdf(true)
      const reportData = buildStudentGradeReportData({
        classGrades,
        studentName,
      })

      await downloadPdfDocument({
        document: <StudentGradeReportDocument data={reportData} />,
        fileName: `grade-report-${classGrades.className.replace(/\s+/g, "-").toLowerCase()}.pdf`,
      })

      showToast("Grade report downloaded successfully")
    } catch {
      showToast("Failed to download grade report", "error")
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div
            className={cn(
              "mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4",
              variant === "light"
                ? `${dashboardTheme.spinnerTrack} ${dashboardTheme.spinnerHead}`
                : "border-white/30 border-t-white",
            )}
          ></div>
          <p
            className={
              variant === "light" ? dashboardTheme.loadingText : "text-gray-400"
            }
          >
            Loading your grades...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex w-full items-center justify-center px-4 py-20">
        <div className="w-full max-w-xl text-center">
          <div
            className={cn(
              "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full",
              variant === "light" ? "bg-rose-50" : "bg-red-500/20",
            )}
          >
            <AlertTriangle
              className={cn(
                "h-8 w-8",
                variant === "light" ? "text-rose-500" : "text-red-400",
              )}
            />
          </div>
          <p
            className={cn(
              "mb-2 font-medium",
              variant === "light" ? "text-slate-800" : "text-gray-300",
            )}
          >
            Error Loading Grades
          </p>
          <p
            className={cn(
              "mb-4 text-sm leading-6 break-words whitespace-normal",
              variant === "light" ? "text-slate-500" : "text-gray-500",
            )}
          >
            {error}
          </p>
          <Button onClick={refetch} className="w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2
            className={
              variant === "light"
                ? dashboardTheme.sectionTitle
                : "text-lg font-semibold tracking-tight text-white"
            }
          >
            My Grades
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleDownloadPdf}
            className="w-auto px-4 h-10"
            disabled={isDownloadingPdf || !classGrades}
          >
            <Download
              className={cn(
                "mr-2 h-4 w-4",
                isDownloadingPdf && "animate-bounce",
              )}
            />
            {isDownloadingPdf ? "Preparing PDF..." : "Download PDF"}
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={BarChart3}
          label="Current Grade"
          value={currentGrade !== null ? `${currentGrade}%` : "No grade yet"}
          helperText={
            currentGrade !== null
              ? `Counts ${gradedCount} graded and ${overdueMissingCount} overdue missing assignments`
              : "Appears after a score is posted or an assignment becomes overdue and missing"
          }
          variant={variant}
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Graded"
          value={`${gradedCount}/${totalAssignments}`}
          helperText="Assignments with a published score"
          variant={variant}
        />
        <SummaryCard
          icon={ClipboardCheck}
          label="Pending Review"
          value={String(pendingReviewCount)}
          helperText="Submitted work still waiting for grading"
          variant={variant}
        />
        <SummaryCard
          icon={Clock3}
          label="Not Submitted"
          value={String(notSubmittedCount)}
          helperText="Assignments without a submission yet"
          variant={variant}
        />
      </div>

      <Card
        className={
          variant === "light"
            ? "border-slate-200 bg-white shadow-sm backdrop-blur-0"
            : undefined
        }
      >
        <CardHeader
          className={
            variant === "light" ? "border-b border-slate-200" : undefined
          }
        >
          <CardTitle
            className={variant === "light" ? "text-slate-900" : "text-white"}
          >
            Assignment Grades
          </CardTitle>
          <CardDescription
            className={variant === "light" ? "text-slate-500" : undefined}
          >
            Assignment-by-assignment breakdown for this class.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {classGrades && classGrades.assignments.length > 0 ? (
            classGrades.assignments.map((assignment) => (
              <AssignmentGradeRow
                key={assignment.assignmentId}
                assignment={assignment}
                variant={variant}
              />
            ))
          ) : (
            <div className="py-10 text-center">
              <div
                className={cn(
                  "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full",
                  variant === "light"
                    ? "border border-slate-200 bg-slate-100"
                    : "bg-white/5",
                )}
              >
                <BarChart3
                  className={cn(
                    "h-8 w-8",
                    variant === "light" ? "text-slate-400" : "text-slate-500",
                  )}
                />
              </div>
              <p
                className={cn(
                  "mb-1 font-medium",
                  variant === "light" ? "text-slate-900" : "text-gray-300",
                )}
              >
                No assignments created yet
              </p>
              <p
                className={cn(
                  "text-sm",
                  variant === "light" ? "text-slate-500" : "text-gray-500",
                )}
              >
                Your grades will appear here after your teacher adds assignments.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

