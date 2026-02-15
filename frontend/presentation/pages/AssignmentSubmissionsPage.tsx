import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { DashboardLayout } from "@/presentation/components/dashboard/DashboardLayout"
import { Card, CardContent } from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import { Input } from "@/presentation/components/ui/Input"
import { BackButton } from "@/presentation/components/ui/BackButton"
import { SubmissionCard } from "@/presentation/components/dashboard/SubmissionCard"
import {
  Search,
  Shield,
  Calendar,
  Code,
  FileText,
  Inbox,
  Loader2,
} from "lucide-react"
import { getCurrentUser } from "@/business/services/authService"
import {
  getAssignmentById,
  getAssignmentSubmissions,
} from "@/business/services/assignmentService"
import { analyzeAssignmentSubmissions } from "@/business/services/plagiarismService"
import { formatDeadline } from "@/shared/utils/dateUtils"
import { useToast } from "@/shared/context/ToastContext"
import { useTopBar } from "@/presentation/components/dashboard/TopBar"
import type {
  AssignmentDetail,
  Submission,
} from "@/business/models/assignment/types"

export function AssignmentSubmissionsPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const navigate = useNavigate()
  const [currentUser] = useState(() => getCurrentUser())

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>(
    [],
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const { showToast } = useToast()

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

        // Get current user
        const user = getCurrentUser()
        if (!user) {
          navigate("/login")
          return
        }

        // Fetch assignment details and submissions in parallel
        const [assignmentData, submissionsData] = await Promise.all([
          getAssignmentById(parseInt(assignmentId), parseInt(user.id)),
          getAssignmentSubmissions(parseInt(assignmentId)),
        ])

        setAssignment(assignmentData)
        setSubmissions(submissionsData)
        setFilteredSubmissions(submissionsData)
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
  }, [assignmentId, navigate])

  // Filter submissions by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSubmissions(submissions)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = submissions.filter((submission) =>
      submission.studentName?.toLowerCase().includes(query),
    )
    setFilteredSubmissions(filtered)
  }, [searchQuery, submissions])

  // Calculate statistics
  const totalSubmissions = submissions.length
  const onTimeCount = submissions.filter(
    (sub) =>
      assignment &&
      new Date(sub.submittedAt).getTime() <=
        new Date(assignment.deadline).getTime(),
  ).length
  const lateCount = totalSubmissions - onTimeCount

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
      showToast(
        `Analysis complete! Found ${results.summary.suspiciousPairs} suspicious pairs.`,
        results.summary.suspiciousPairs > 0 ? "info" : "success",
      )
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
  const handleViewSubmission = () => {
    // Navigate to submission detail page
    // For now, navigate to assignment detail page with student context
    navigate(`/dashboard/assignments/${assignmentId}`)
  }

  // Loading state
  if (loading) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-slate-300">Loading coursework submissions...</p>
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
              <p className="font-medium">{error || "Coursework not found"}</p>
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
          <h1 className="text-3xl font-bold text-white">
            {assignment.assignmentName}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Due: {formatDeadline(assignment.deadline)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              <span className="capitalize">
                {assignment.programmingLanguage}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>{assignment.className}</span>
            </div>
          </div>

          {assignment.description && (
            <p className="text-gray-300 text-sm leading-relaxed max-w-3xl">
              {assignment.description}
            </p>
          )}
        </div>

        {/* Statistics Card */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-400">Total Submissions</p>
                <p className="text-2xl font-bold text-white">
                  {totalSubmissions}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-400">On Time</p>
                <p className="text-2xl font-bold text-green-400">
                  {onTimeCount}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-400">Late</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {lateCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <Button
            onClick={handleCheckSimilarities}
            disabled={totalSubmissions < 2 || isAnalyzing}
            className="flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                <span>Check Similarities</span>
              </>
            )}
          </Button>

          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search by student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11"
            />
          </div>
        </div>

        {/* Submissions Grid */}
        <div className="mt-8">
          {filteredSubmissions.length === 0 ? (
            // Empty State
            <Card className="bg-white/5 backdrop-blur-sm border-white/10">
              <CardContent className="p-12">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                    <Inbox className="w-8 h-8 text-gray-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white">
                      {searchQuery
                        ? "No matching submissions"
                        : "No submissions yet"}
                    </h3>
                    <p className="text-sm text-gray-400 max-w-md mx-auto">
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
            // Submissions Grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubmissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  deadline={new Date(assignment.deadline)}
                  onClick={handleViewSubmission}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
