import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FileText, Calendar, Bell, BookOpen } from "lucide-react"
import { DashboardLayout } from "@/presentation/components/dashboard/DashboardLayout"
import { Card, CardContent } from "@/presentation/components/ui/Card"
import { Avatar } from "@/presentation/components/ui/Avatar"
import { getCurrentUser } from "@/business/services/authService"
import { getStudentSubmissions } from "@/business/services/assignmentService"
import type { User } from "@/business/models/auth/types"
import type { Submission } from "@/business/models/assignment/types"

export function AssignmentsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate("/login")
      return
    }

    setUser(currentUser)

    // Fetch all student submissions
    const fetchSubmissions = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getStudentSubmissions(
          parseInt(currentUser.id),
          false,
        ) // Get all submissions, not just latest
        setSubmissions(data)
      } catch (err) {
        console.error("Failed to fetch submissions:", err)
        setError("Failed to load coursework. Please try refreshing the page.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubmissions()
  }, [navigate])

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = {
    sidebar: (
      <div className="h-16 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 flex items-center px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            ClassiFi
          </h1>
        </div>
      </div>
    ),
    main: (
      <div className="h-16 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 flex items-center px-6 lg:px-8 shrink-0">
        <div className="flex items-center justify-end w-full gap-4">
          {/* Notifications */}
          <button
            className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-300" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Separator */}
          <div className="h-8 w-px bg-white/20"></div>

          {/* User Profile */}
          <button
            onClick={() => navigate("/dashboard/settings")}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">
                {user ? `${user.firstName} ${user.lastName}` : "User"}
              </p>
              <p className="text-xs text-slate-400">
                {user
                  ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                  : "Student"}
              </p>
            </div>
            <Avatar
              size="sm"
              src={user?.avatarUrl}
              fallback={userInitials}
              alt={user ? `${user.firstName} ${user.lastName}` : "User"}
            />
          </button>
        </div>
      </div>
    ),
  }

  return (
    <DashboardLayout topBar={topBar}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Coursework</h1>
        <p className="text-slate-400 text-base">
          View all your coursework and submissions
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Assignments List */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading coursework...</p>
            </div>
          ) : submissions.length > 0 ? (
            <div className="space-y-3">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  onClick={() =>
                    navigate(
                      `/dashboard/assignments/${submission.assignmentId}`,
                    )
                  }
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-base font-medium text-white mb-1">
                        {submission.assignmentName ||
                          `Coursework ${submission.assignmentId}`}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          Submitted{" "}
                          {new Date(
                            submission.submittedAt,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 font-medium">
                        Submitted
                      </span>
                      {submission.isLatest && (
                        <span className="text-xs text-teal-400">Latest</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Submission #{submission.submissionNumber}</span>
                    <span>•</span>
                    <span className="font-mono">{submission.fileName}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-300 font-medium mb-1">
                No submissions yet
              </p>
              <p className="text-sm text-gray-500">
                Your submitted coursework will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
