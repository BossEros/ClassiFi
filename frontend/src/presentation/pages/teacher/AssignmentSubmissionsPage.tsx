import { useState, useEffect, useId } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout";
import { Card, CardContent } from "@/presentation/components/ui/Card";
import { Button } from "@/presentation/components/ui/Button";
import { Input } from "@/presentation/components/ui/Input";
import { BackButton } from "@/presentation/components/ui/BackButton";
import { SummaryStatCard } from "@/presentation/components/ui/SummaryStatCard";
import { Search, Shield, Calendar, Inbox, Loader2, Edit, Trash2, Users, CheckCircle2, Clock3, UserX, AlertCircle, FileText, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { getAssignmentById, getAssignmentSubmissions } from "@/business/services/assignmentService";
import { deleteAssignment, getClassStudents } from "@/business/services/classService";
import { analyzeAssignmentSubmissions, getAssignmentSimilarityStatus } from "@/business/services/plagiarismService";
import { formatDeadline, isLateSubmission } from "@/presentation/utils/dateUtils";
import { useToastStore } from "@/shared/store/useToastStore";
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar";
import { DropdownMenu } from "@/presentation/components/ui/DropdownMenu";
import type { AssignmentDetail, Submission } from "@/business/models/assignment/types";
import * as React from "react";
import { cn } from "@/shared/utils/cn";
import { AlertTriangle, X } from "lucide-react";
import { formatGrade, getGradeColor, getGradePercentage } from "@/presentation/utils/gradeUtils";
import { Avatar } from "@/presentation/components/ui/Avatar";
import { TablePaginationFooter } from "@/presentation/components/ui/TablePaginationFooter";

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
          "relative w-full max-w-[448px] min-w-[320px] mx-auto p-6 flex-shrink-0",
          "rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-sm",
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
            "absolute top-4 right-4 p-1 rounded-lg",
            "text-gray-400 hover:text-white hover:bg-white/10",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        {/* Title */}
        <h2
          id="delete-assignment-modal-title"
          className="text-xl font-semibold text-white text-center mb-2"
        >
          Delete Assignment
        </h2>

        {/* Description */}
        <p className="text-gray-400 text-center mb-6">
          Are you sure you want to delete{" "}
          <span className="text-white font-medium">{assignmentTitle}</span>?
          This action cannot be undone. All student submissions for this
          assignment will be permanently removed.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className={cn(
              "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
              "border border-white/20 text-white",
              "hover:bg-white/10 transition-colors duration-200",
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
              "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
              "bg-red-500 text-white",
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
    <Card className="bg-white/5 backdrop-blur-sm border-white/10">
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
            <FileText className="h-4 w-4 text-slate-300" />
            <h2 className="text-lg font-semibold text-white">Instructions</h2>
          </div>
          {canExpand && (
            <ChevronDown
              className={cn(
                "h-4 w-4 text-slate-300 transition-transform duration-200",
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
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words">
                {normalizedInstructions}
              </p>
            ) : (
              <p className="text-gray-400 text-sm">No instructions provided.</p>
            )}

            {instructionsImageUrl && (
              <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20">
                <img
                  src={instructionsImageUrl}
                  alt={`${assignmentName} instructions`}
                  className="w-full max-h-[28rem] object-contain bg-black/30"
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
              const submissionGradePercentage = getGradePercentage(
                submission.grade,
                maxGrade,
              )
              const submissionGradeClass =
                submission.grade === null || submission.grade === undefined
                  ? "text-slate-400"
                  : getGradeColor(submissionGradePercentage)

              return (
                <tr
                  key={submission.id}
                  className="border-b border-white/5 transition-all duration-200 hover:bg-white/5 cursor-pointer"
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
        } catch (classStudentsError) {
          console.error(
            "Failed to fetch class students for missing count:",
            classStudentsError,
          )
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
        } catch (similarityStatusError) {
          console.error(
            "Failed to fetch assignment similarity status:",
            similarityStatusError,
          )
          setHasReusableSimilarityReport(false)
        }
      } catch (err) {
        console.error("Error fetching assignment data:", err)
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

  const topBar = useTopBar({ user: currentUser, userInitials })

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
    } catch (err) {
      console.error("Plagiarism analysis failed:", err)
      const errorMessage =
        err instanceof Error ? err.message : "Analysis failed"
      showToast(errorMessage, "error")
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
    } catch (deleteError) {
      console.error("Failed to delete assignment:", deleteError)
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
            <div className="w-16 h-16 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-300">Loading assignment submissions...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Error state
  if (error || !assignment) {
    return (
      <DashboardLayout topBar={topBar}>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-400">
              <Inbox className="w-5 h-5" />
              <p className="font-medium">{error || "Assignment not found"}</p>
            </div>
            <BackButton to={-1} label="Go Back" className="mt-4" />
          </CardContent>
        </Card>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout topBar={topBar}>
      <div className="space-y-6 max-w-[1600px]">
        {/* Header Section */}
        {/* Back Button */}
        <BackButton
          to={assignment ? `/dashboard/classes/${assignment.classId}` : -1}
          label="Back to Class"
        />

        {/* Assignment Info */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold text-white">
              {assignment.assignmentName}
            </h1>

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
                className="text-slate-400 hover:text-white flex-shrink-0"
              />
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 w-fit">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-medium text-blue-100">
              {assignment.deadline
                ? `Due ${formatDeadline(assignment.deadline)}`
                : "No deadline"}
            </span>
          </div>
        </div>

        <CollapsibleInstructions
          instructions={assignment.instructions}
          instructionsImageUrl={assignment.instructionsImageUrl}
          assignmentName={assignment.assignmentName}
          defaultExpanded={true}
        />

        <div className="h-px w-full bg-white/10" />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryStatCard
            label="Total Submissions"
            value={totalSubmissions}
            icon={Users}
            iconContainerClassName="bg-blue-500/20"
            iconClassName="text-blue-400"
          />

          <SummaryStatCard
            label="On Time"
            value={onTimeCount}
            icon={CheckCircle2}
            iconContainerClassName="bg-green-500/20"
            iconClassName="text-green-400"
            valueClassName="text-green-400"
          />

          <SummaryStatCard
            label="Late"
            value={lateCount}
            icon={Clock3}
            iconContainerClassName="bg-yellow-500/20"
            iconClassName="text-yellow-400"
            valueClassName="text-yellow-400"
          />

          <SummaryStatCard
            label="Missing"
            value={missingCount ?? "N/A"}
            icon={UserX}
            iconContainerClassName="bg-red-500/20"
            iconClassName="text-red-400"
            valueClassName="text-red-400"
          />
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-[28rem] relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none z-10"
              aria-hidden="true"
            />
            <Input
              type="text"
              placeholder="Search by student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 relative z-0"
            />
          </div>

          <Button
            onClick={handleCheckSimilarities}
            disabled={totalSubmissions < 2 || isAnalyzing}
            className="flex items-center justify-center gap-2 sm:ml-auto"
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
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-12">
                <div className="w-full text-center space-y-4 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                    <Inbox className="w-8 h-8 text-gray-500" />
                  </div>
                  <div className="space-y-2 w-full max-w-[36rem]">
                    <h3 className="text-lg font-semibold text-white">
                      {searchQuery
                        ? "No matching submissions"
                        : "No submissions yet"}
                    </h3>
                    <p className="block w-full text-sm text-gray-400 leading-relaxed text-center whitespace-normal break-normal">
                      {searchQuery
                        ? `No submissions found matching "${searchQuery}"`
                        : "Students haven't submitted their work yet. Check back later."}
                    </p>
                  </div>
                  {searchQuery && (
                    <Button onClick={() => setSearchQuery("")} className="mt-4">
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
