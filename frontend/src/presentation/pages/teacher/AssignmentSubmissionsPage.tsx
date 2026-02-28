import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import { Card, CardContent } from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import { Input } from "@/presentation/components/ui/Input"
import { BackButton } from "@/presentation/components/ui/BackButton"
import { SummaryStatCard } from "@/presentation/components/ui/SummaryStatCard"
import { CollapsibleInstructions } from "@/presentation/components/shared/assignmentDetail/CollapsibleInstructions"
import { AssignmentSubmissionsTable } from "@/presentation/components/teacher/submissions/AssignmentSubmissionsTable"
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
import { formatDeadline } from "@/presentation/utils/dateUtils"
import { useToastStore } from "@/shared/store/useToastStore"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import { DropdownMenu } from "@/presentation/components/ui/DropdownMenu"
import { DeleteAssignmentModal } from "@/presentation/components/teacher/forms/class/DeleteAssignmentModal"
import type {
  AssignmentDetail,
  Submission,
} from "@/business/models/assignment/types"

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
