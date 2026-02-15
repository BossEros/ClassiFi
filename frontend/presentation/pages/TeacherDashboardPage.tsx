import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Grid3x3, ClipboardList, FileText, ArrowRight } from "lucide-react"
import { DashboardLayout } from "@/presentation/components/dashboard/DashboardLayout"
import { ClassCard } from "@/presentation/components/dashboard/ClassCard"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/Card"
import { getCurrentUser } from "@/business/services/authService"
import { getDashboardData } from "@/business/services/teacherDashboardService"
import { getDeadlineStatus } from "@/shared/utils/dateUtils"
import type { User } from "@/business/models/auth/types"
import type { Class, Task } from "@/business/models/dashboard/types"
import { useTopBar } from "@/presentation/components/dashboard/TopBar"

export function TeacherDashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate("/login")
      return
    }

    setUser(currentUser)

    // Fetch dashboard data from API
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch dashboard data using the teacher's user ID
        const dashboardData = await getDashboardData(parseInt(currentUser.id))

        setClasses(dashboardData.recentClasses)
        setTasks(dashboardData.pendingTasks)
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err)
        setError(
          "Failed to load dashboard data. Please try refreshing the page.",
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [navigate])

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user, userInitials })

  return (
    <DashboardLayout topBar={topBar}>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-slate-400 text-base">
          Here's what's happening with your courses today.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Classes Panel */}
        <Card className="lg:col-span-2 h-fit">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Grid3x3 className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <CardTitle className="text-xl">Recent Classes</CardTitle>
              </div>
              <button
                onClick={() => navigate("/dashboard/classes")}
                className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors group"
              >
                View All
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">Loading dashboard...</p>
              </div>
            ) : classes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((classItem) => (
                  <ClassCard
                    key={classItem.id}
                    classItem={classItem}
                    onClick={() =>
                      navigate(`/dashboard/classes/${classItem.id}`)
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <Grid3x3 className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-300 font-semibold text-sm mb-1.5">
                  No recent classes found
                </p>
                <p className="text-xs text-slate-500">
                  Classes you've recently been active in will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* To-Check Panel */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <FileText className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <CardTitle className="text-xl">To-Check</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400">Loading...</p>
              </div>
            ) : tasks.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() =>
                      navigate(`/dashboard/assignments/${task.id}/submissions`)
                    }
                    className="min-h-24 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer flex flex-col"
                  >
                    <h4 className="text-sm font-medium text-white mb-3 truncate">
                      {task.assignmentName}
                    </h4>
                    <div className="mt-auto flex items-center justify-between gap-3">
                      <span className="flex-1 text-xs text-slate-400 truncate">
                        {task.className || "Unknown class"}
                      </span>
                      <span
                        className={`shrink-0 text-xs font-medium ${
                          new Date(task.deadline) < new Date()
                            ? "text-red-400"
                            : "text-teal-400"
                        }`}
                      >
                        {getDeadlineStatus(new Date(task.deadline))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <ClipboardList className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-300 font-semibold text-sm mb-1.5">
                  All caught up!
                </p>
                <p className="text-xs text-slate-500">
                  New tasks will appear here when they're assigned.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
