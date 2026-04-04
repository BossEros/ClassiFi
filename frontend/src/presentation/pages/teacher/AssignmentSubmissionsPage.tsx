import { useState, useEffect, useId } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import { Card, CardContent } from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import { Input } from "@/presentation/components/ui/Input"
import { SummaryStatCard } from "@/presentation/components/ui/SummaryStatCard"
import {
  Search,
  Shield,
  Calendar,
  Inbox,
  Loader2,
  Edit,
  Trash2,
  Users,
  CheckCircle2,
  Clock3,
  UserX,
  AlertCircle,
  ScrollText,
  ChevronDown,
} from "lucide-react"
import { useAuthStore } from "@/shared/store/useAuthStore"
import {
  getAssignmentById,
  getAssignmentSubmissions,
} from "@/business/services/assignmentService"
import {
  deleteAssignment,
  getClassStudents,
} from "@/business/services/classService"
import {
  analyzeAssignmentSubmissions,
  getAssignmentSimilarityStatus,
} from "@/business/services/plagiarismService"
import {
  formatDeadline,
  isLateSubmission,
} from "@/presentation/utils/dateUtils"
import { dashboardTheme } from "@/presentation/constants/dashboardTheme"
import { useToastStore } from "@/shared/store/useToastStore"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import { DropdownMenu } from "@/presentation/components/ui/DropdownMenu"
import type {
  AssignmentDetail,
  Submission,
} from "@/business/models/assignment"
import * as React from "react"
import { cn } from "@/shared/utils/cn"
import { AlertTriangle, X } from "lucide-react"
import {
  formatGrade,
  getGradePercentage,
} from "@/presentation/utils/gradeUtils"
import { Avatar } from "@/presentation/components/ui/Avatar"
import { TablePaginationFooter } from "@/presentation/components/ui/TablePaginationFooter"

// Inlined from src/presentation/components/teacher/forms/class/DeleteAssignmentModal.tsx
interface DeleteAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  className?: string
  isDeleting?: boolean
  assignmentTitle?: string
}

function DeleteAssignmentModal({
  isOpen,
  onClose,
  onConfirm,
  className,
  isDeleting = false,
  assignmentTitle = "this assignment",
}: DeleteAssignmentModalProps) {
  // Close on escape key
  React.useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose, isDeleting])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] grid place-items-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-[448px] mx-auto p-6 flex-shrink-0",
          "rounded-2xl border border-slate-200 bg-white",
          "shadow-xl shadow-black/20",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-assignment-modal-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className={cn(
            "absolute top-4 right-4 rounded-lg p-1",
            "text-slate-400 hover:bg-slate-100 hover:text-slate-900",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning icon */}
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
        </div>

        {/* Title */}
        <h2
          id="delete-assignment-modal-title"
          className="mb-2 text-center text-xl font-semibold text-slate-900"
        >
          Delete Assignment
        </h2>

        {/* Description */}
        <p className="mb-6 text-center text-slate-500">
          Are you sure you want to delete{" "}
          <span className="font-medium text-slate-900">{assignmentTitle}</span>?
          This action cannot be undone. All student submissions for this
          assignment will be permanently removed.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className={cn(
              "flex flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700",
              "hover:bg-slate-50 transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={cn(
              "flex flex-1 items-center justify-center rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white",
              "hover:bg-red-600 transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {isDeleting ? "Deleting..." : "Delete Assignment"}
          </button>
        </div>
      </div>
    </div>
  )
}

interface CollapsibleInstructionsProps {
  instructions: string
  instructionsImageUrl?: string | null
  assignmentName: string
  defaultExpanded?: boolean
}

function CollapsibleInstructions({
  instructions,
  instructionsImageUrl,
  assignmentName,
  defaultExpanded = false,
}: CollapsibleInstructionsProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const instructionsPanelId = useId()

  const normalizedInstructions = instructions.trim()
  const canExpand =
    normalizedInstructions.length > 0 || Boolean(instructionsImageUrl)

  const handleToggleExpanded = () => {
    if (!canExpand) {
      return
    }

    setIsExpanded((previousValue) => !previousValue)
  }

  return (
    <Card className="border-slate-300 bg-white shadow-md shadow-slate-200/70">
      <div className="px-6 py-5">
        <button
          type="button"
          onClick={handleToggleExpanded}
          disabled={!canExpand}
          aria-expanded={isExpanded}
          aria-controls={instructionsPanelId}
          className={cn(
            "w-full flex items-center justify-between gap-4 text-left",
            canExpand ? "cursor-pointer" : "cursor-default",
          )}
        >
          <div className="flex items-center gap-2.5">
            <ScrollText className="h-4 w-4 text-blue-700" />
            <h2 className="text-lg font-semibold text-slate-900">
              Instructions
            </h2>
          </div>
          {canExpand && (
            <ChevronDown
              className={cn(
                "h-4 w-4 text-slate-400 transition-transform duration-200",
                isExpanded && "rotate-180",
              )}
            />
          )}
        </button>
      </div>
      {isExpanded && (
        <CardContent id={instructionsPanelId}>
          <div className="space-y-4">
            {normalizedInstructions ? (
              <p className="whitespace-pre-wrap break-words text-base leading-7 text-slate-600">
                {normalizedInstructions}
              </p>
            ) : (
              <p className="text-sm text-slate-400">
                No instructions provided.
              </p>
            )}

            {instructionsImageUrl && (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <img
                  src={instructionsImageUrl}
                  alt={`${assignmentName} instructions`}
                  className="max-h-[28rem] w-full object-contain bg-slate-50"
                />
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

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

function getSubmissionGradeTextClass(percentage: number): string {
  if (percentage >= 90) return "text-emerald-700"
  if (percentage >= 80) return "text-teal-700"
  if (percentage >= 70) return "text-amber-700"
  if (percentage >= 60) return "text-orange-700"
  return "text-rose-700"
}

function AssignmentSubmissionsTable({
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
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-slate-300 bg-white shadow-md shadow-slate-200/80">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-200/85">
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                Student Name
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                Status
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                Grade
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {submissions.map((submission) => {
              const isLate = isLateSubmission(submission.submittedAt, deadline)
              const submissionGradePercentage = getGradePercentage(
                submission.grade,
                maxGrade,
              )
              const submissionGradeClass =
                submission.grade === null || submission.grade === undefined
                  ? "text-slate-400"
                  : getSubmissionGradeTextClass(submissionGradePercentage)

              return (
                <tr
                  key={submission.id}
                  className="cursor-pointer border-b border-slate-100 transition-colors duration-200 hover:bg-slate-50/80"
                  onClick={() => onViewDetails(submission)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={
                          studentAvatarUrlById[submission.studentId] ??
                          undefined
                        }
                        alt={submission.studentName || "Unknown Student"}
                        fallback={(submission.studentName || "Unknown Student")
                          .split(" ")
                          .map((namePart) => namePart[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                        size="sm"
                        className="border border-slate-200"
                      />
                      <span className="text-sm font-medium text-slate-900">
                        {submission.studentName || "Unknown Student"}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                        isLate
                          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
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

                  <td
                    className={cn(
                      "px-6 py-4 text-center text-sm font-semibold",
                      submissionGradeClass,
                    )}
                  >
                    {formatGrade(submission.grade, maxGrade)}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={(event) => {
                        event.stopPropagation()
                        onViewDetails(submission)
                      }}
                      className="inline-flex items-center justify-center rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-sm transition-colors duration-200 hover:border-teal-300 hover:bg-teal-100 hover:text-teal-800"
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
        variant="light"
      />
    </div>
  )
}

const SUBMISSIONS_PER_PAGE = 10

export function AssignmentSubmissionsPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const canManageAssignment =
    currentUser?.role === "teacher" || currentUser?.role === "admin"

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>(
    [],
  )
  const [classStudentCount, setClassStudentCount] = useState<number | null>(
    null,
  )
  const [studentAvatarUrlById, setStudentAvatarUrlById] = useState<
    Record<number, string | null>
  >({})
  const [searchQuery, setSearchQuery] = useState("")
  const [currentSubmissionPage, setCurrentSubmissionPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [hasReusableSimilarityReport, setHasReusableSimilarityReport] =
    useState(false)
  const [isDeleteAssignmentModalOpen, setIsDeleteAssignmentModalOpen] =
    useState(false)
  const [isDeletingAssignment, setIsDeletingAssignment] = useState(false)
  const showToast = useToastStore((state) => state.showToast)

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!assignmentId) {
        setError("Assignment ID is missing")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        if (!currentUser) {
          navigate("/login")
          return
        }

        // Fetch assignment details and submissions in parallel
        const [assignmentData, submissionsData] = await Promise.all([
          getAssignmentById(parseInt(assignmentId), parseInt(currentUser.id)),
          getAssignmentSubmissions(parseInt(assignmentId)),
        ])

        let enrolledStudentsCount: number | null = null
        let avatarUrlMapByStudentId: Record<number, string | null> = {}
        try {
          const classStudents = await getClassStudents(assignmentData.classId)
          enrolledStudentsCount = classStudents.length
          avatarUrlMapByStudentId = classStudents.reduce<
            Record<number, string | null>
          >((accumulator, classStudent) => {
            accumulator[classStudent.id] = classStudent.avatarUrl ?? null
            return accumulator
          }, {})
        } catch {
          // Submission details can still render without the class roster enrichment.
        }

        setAssignment(assignmentData)
        setSubmissions(submissionsData)
        setFilteredSubmissions(submissionsData)
        setClassStudentCount(enrolledStudentsCount)
        setStudentAvatarUrlById(avatarUrlMapByStudentId)

        try {
          const similarityStatus = await getAssignmentSimilarityStatus(
            parseInt(assignmentId, 10),
          )
          setHasReusableSimilarityReport(similarityStatus.hasReusableReport)
        } catch {
          setHasReusableSimilarityReport(false)
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred"
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [assignmentId, currentUser, navigate])

  // Filter submissions by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSubmissions(submissions)
      setCurrentSubmissionPage(1)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = submissions.filter((submission) =>
      submission.studentName?.toLowerCase().includes(query),
    )
    setFilteredSubmissions(filtered)
    setCurrentSubmissionPage(1)
  }, [searchQuery, submissions])

  // Calculate statistics
  const totalSubmissions = submissions.length
  const assignmentDeadline = assignment?.deadline
    ? new Date(assignment.deadline)
    : null
  const onTimeCount = submissions.filter(
    (sub) =>
      !assignmentDeadline ||
      new Date(sub.submittedAt).getTime() <= assignmentDeadline.getTime(),
  ).length
  const lateCount = totalSubmissions - onTimeCount
  const missingCount =
    classStudentCount === null
      ? null
      : Math.max(classStudentCount - totalSubmissions, 0)
  const totalSubmissionPages = Math.max(
    1,
    Math.ceil(filteredSubmissions.length / SUBMISSIONS_PER_PAGE),
  )
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentSubmissionPage - 1) * SUBMISSIONS_PER_PAGE,
    currentSubmissionPage * SUBMISSIONS_PER_PAGE,
  )

  const userInitials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : "?"

  const breadcrumbItems = [
    { label: "Classes", to: "/dashboard/classes" },
    ...(assignment
      ? [
          {
            label: assignment.className || "Class Overview",
            to: `/dashboard/classes/${assignment.classId}`,
          },
          { label: assignment.assignmentName || "Submission Overview" },
        ]
      : [{ label: "Submission Overview" }]),
  ]

  const topBar = useTopBar({
    user: currentUser,
    userInitials,
    breadcrumbItems,
  })

  // Handle Check Similarities button
  const handleCheckSimilarities = async () => {
    if (!assignmentId) return

    try {
      setIsAnalyzing(true)
      const results = await analyzeAssignmentSubmissions(parseInt(assignmentId))

      if (!results.isReusedReport) {
        showToast(
          `Analysis complete! Found ${results.summary.suspiciousPairs} suspicious pairs.`,
          results.summary.suspiciousPairs > 0 ? "info" : "success",
        )
      }

      setHasReusableSimilarityReport(true)
      // Navigate to results page with the analysis data
      navigate(`/dashboard/assignments/${assignmentId}/similarity`, {
        state: { results },
      })
    } catch {
      showToast("Analysis failed", "error")
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Handle view submission details
  const handleViewSubmission = (submission: Submission) => {
    if (!assignmentId) {
      return
    }

    navigate(
      `/dashboard/assignments/${assignmentId}?submissionId=${submission.id}`,
    )
  }

  const handleSubmissionPageChange = (page: number) => {
    setCurrentSubmissionPage(Math.min(Math.max(page, 1), totalSubmissionPages))
  }

  const handleEditAssignment = () => {
    if (!assignment || !canManageAssignment) {
      return
    }

    navigate(
      `/dashboard/classes/${assignment.classId}/assignments/${assignment.id}/edit`,
    )
  }

  const handleDeleteAssignmentClick = () => {
    if (!canManageAssignment) {
      return
    }

    setIsDeleteAssignmentModalOpen(true)
  }

  const handleConfirmDeleteAssignment = async () => {
    if (!currentUser || !assignment || !canManageAssignment) {
      return
    }

    try {
      setIsDeletingAssignment(true)
      await deleteAssignment(assignment.id, parseInt(currentUser.id, 10))
      showToast("Assignment deleted successfully")
      navigate(`/dashboard/classes/${assignment.classId}`)
    } catch {
      showToast("Failed to delete assignment", "error")
    } finally {
      setIsDeletingAssignment(false)
      setIsDeleteAssignmentModalOpen(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-slate-200 border-t-teal-500"></div>
            <p className="text-slate-500">Loading assignment submissions...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Error state
  if (error || !assignment) {
    return (
      <DashboardLayout topBar={topBar}>
        <Card className="border-rose-200 bg-rose-50/80 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-rose-700">
              <Inbox className="h-5 w-5" />
              <p className="font-medium">{error || "Assignment not found"}</p>
            </div>
            <Button
              type="button"
              onClick={() => navigate("/dashboard/classes")}
              className="mt-4 w-auto border border-slate-300 bg-white px-4 text-slate-700 hover:bg-slate-50"
            >
              Go to Classes
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout topBar={topBar}>
      <div className="space-y-6 max-w-[1600px]">
        <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <h1 className={dashboardTheme.pageTitle}>
              {assignment.assignmentName}
            </h1>

            <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-800 shadow-sm">
              <Calendar className="h-4 w-4 text-blue-700" />
              <span>
                {assignment.deadline
                  ? `Due ${formatDeadline(assignment.deadline)}`
                  : "No deadline"}
              </span>
            </div>
          </div>

          {canManageAssignment && (
            <DropdownMenu
              items={[
                {
                  id: "edit-assignment",
                  label: "Edit Assignment",
                  icon: Edit,
                  onClick: handleEditAssignment,
                },
                {
                  id: "delete-assignment",
                  label: "Delete Assignment",
                  icon: Trash2,
                  variant: "danger",
                  onClick: handleDeleteAssignmentClick,
                },
              ]}
              triggerLabel="Assignment actions"
              variant="light"
              className="flex-shrink-0 self-start"
            />
          )}
        </div>

        <CollapsibleInstructions
          instructions={assignment.instructions}
          instructionsImageUrl={assignment.instructionsImageUrl}
          assignmentName={assignment.assignmentName}
          defaultExpanded={true}
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryStatCard
            label="Total Submissions"
            value={totalSubmissions}
            icon={Users}
            variant="light"
            className="border-slate-300 shadow-md shadow-slate-200/70"
            iconContainerClassName="h-auto w-auto rounded-none bg-transparent p-0"
            iconClassName="text-sky-600"
          />

          <SummaryStatCard
            label="On Time"
            value={onTimeCount}
            icon={CheckCircle2}
            variant="light"
            className="border-slate-300 shadow-md shadow-slate-200/70"
            iconContainerClassName="h-auto w-auto rounded-none bg-transparent p-0"
            iconClassName="text-emerald-600"
            valueClassName="text-emerald-700"
          />

          <SummaryStatCard
            label="Late"
            value={lateCount}
            icon={Clock3}
            variant="light"
            className="border-slate-300 shadow-md shadow-slate-200/70"
            iconContainerClassName="h-auto w-auto rounded-none bg-transparent p-0"
            iconClassName="text-amber-600"
            valueClassName="text-amber-700"
          />

          <SummaryStatCard
            label="Missing"
            value={missingCount ?? "N/A"}
            icon={UserX}
            variant="light"
            className="border-slate-300 shadow-md shadow-slate-200/70"
            iconContainerClassName="h-auto w-auto rounded-none bg-transparent p-0"
            iconClassName="text-rose-600"
            valueClassName="text-rose-700"
          />
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-[28rem] relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <Input
              type="text"
              placeholder="Search by student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="relative z-0 border-slate-400 bg-white pl-11 text-slate-900 placeholder:text-slate-400 shadow-md shadow-slate-200/70 hover:border-slate-500 hover:bg-white focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15 disabled:hover:bg-white"
            />
          </div>

          <Button
            onClick={handleCheckSimilarities}
            disabled={totalSubmissions < 2 || isAnalyzing}
            className="flex items-center justify-center gap-2 bg-teal-600 text-white shadow-sm hover:bg-teal-700 sm:ml-auto"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>
                  {hasReusableSimilarityReport
                    ? "Review Similarities"
                    : "Check Similarities"}
                </span>
              </>
            )}
          </Button>
        </div>

        {/* Submissions Grid */}
        <div className="mt-8">
          {filteredSubmissions.length === 0 ? (
            // Empty State
            <Card className="border-slate-300 bg-white shadow-md shadow-slate-200/70">
              <CardContent className="p-12">
                <div className="w-full text-center space-y-4 flex flex-col items-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                    <Inbox className="h-8 w-8 text-slate-400" />
                  </div>
                  <div className="space-y-2 w-full max-w-[36rem]">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {searchQuery
                        ? "No matching submissions"
                        : "No submissions yet"}
                    </h3>
                    <p className="block w-full whitespace-normal break-normal text-center text-sm leading-relaxed text-slate-500">
                      {searchQuery
                        ? `No submissions found matching "${searchQuery}"`
                        : "Students haven't submitted their work yet. Check back later."}
                    </p>
                  </div>
                  {searchQuery && (
                    <Button
                      onClick={() => setSearchQuery("")}
                      className="mt-4 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <AssignmentSubmissionsTable
              submissions={paginatedSubmissions}
              deadline={
                assignment.deadline ? new Date(assignment.deadline) : null
              }
              maxGrade={assignment.totalScore ?? 100}
              studentAvatarUrlById={studentAvatarUrlById}
              currentPage={currentSubmissionPage}
              totalPages={totalSubmissionPages}
              totalItems={filteredSubmissions.length}
              itemsPerPage={SUBMISSIONS_PER_PAGE}
              onPageChange={handleSubmissionPageChange}
              onViewDetails={handleViewSubmission}
            />
          )}
        </div>
      </div>

      {canManageAssignment && (
        <DeleteAssignmentModal
          isOpen={isDeleteAssignmentModalOpen}
          onClose={() => setIsDeleteAssignmentModalOpen(false)}
          onConfirm={handleConfirmDeleteAssignment}
          isDeleting={isDeletingAssignment}
          assignmentTitle={assignment.assignmentName}
        />
      )}
    </DashboardLayout>
  )
}

