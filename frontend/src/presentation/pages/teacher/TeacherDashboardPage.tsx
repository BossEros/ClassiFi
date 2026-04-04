import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, ChevronUp, ChevronDown, Clock } from "lucide-react"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import { ClassCard } from "@/presentation/components/shared/dashboard/ClassCard"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { getDashboardData } from "@/business/services/teacherDashboardService"
import { getDeadlineStatus, formatDateTime, getMinutesUntilNextSession } from "@/presentation/utils/dateUtils"
import type { User } from "@/business/models/auth/types"
import type { Class, Task } from "@/business/models/dashboard/types"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import { dashboardTheme } from "@/presentation/constants/dashboardTheme"

function getPendingBadgeClass(pendingCount: number): string {
  if (pendingCount >= 20) {
    return "border-rose-300 bg-rose-100 text-rose-700"
  }

  if (pendingCount >= 10) {
    return "border-amber-300 bg-amber-100 text-amber-700"
  }

  if (pendingCount > 0) {
    return "border-blue-300 bg-blue-100 text-blue-700"
  }

  return "border-slate-300 bg-slate-100 text-slate-600"
}

function getDeadlineBadgeClass(deadlineStatus: string): string {
  if (deadlineStatus === "Overdue") {
    return "border-rose-300 bg-rose-100 text-rose-700"
  }

  if (deadlineStatus === "Due today" || deadlineStatus === "Due tomorrow") {
    return "border-amber-300 bg-amber-100 text-amber-700"
  }

  if (deadlineStatus.startsWith("Due in")) {
    return "border-blue-300 bg-blue-100 text-blue-700"
  }

  return "border-slate-300 bg-slate-100 text-slate-600"
}

type SortDirection = "asc" | "desc"

export function TeacherDashboardPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const [user, setUser] = useState<User | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deadlineSort, setDeadlineSort] = useState<SortDirection>("asc")

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0
      if (!a.deadline) return 1
      if (!b.deadline) return -1

      const dateA = new Date(a.deadline).getTime()
      const dateB = new Date(b.deadline).getTime()
      const safeA = Number.isFinite(dateA) ? dateA : (deadlineSort === "asc" ? Infinity : -Infinity)
      const safeB = Number.isFinite(dateB) ? dateB : (deadlineSort === "asc" ? Infinity : -Infinity)

      return deadlineSort === "asc" ? safeA - safeB : safeB - safeA
    })
  }, [tasks, deadlineSort])

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }

    setUser(currentUser)

    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const dashboardData = await getDashboardData(parseInt(currentUser.id))

        setClasses(dashboardData.recentClasses)
        setTasks(dashboardData.pendingTasks)
      } catch {
        setError("Failed to load dashboard data. Please try refreshing the page.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currentUser, navigate])

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user, userInitials })

  const displayedClasses = useMemo(() => {
    return [...classes]
      .sort((a, b) => {
        const minutesA = a.schedule ? getMinutesUntilNextSession(a.schedule) : Infinity
        const minutesB = b.schedule ? getMinutesUntilNextSession(b.schedule) : Infinity

        return minutesA - minutesB
      })
      .slice(0, 3)
  }, [classes])

  return (
    <DashboardLayout topBar={topBar}>
      <div className="mb-10">
        <h1 className={dashboardTheme.pageTitle}>
          Welcome back, {user?.firstName || "Teacher"}
        </h1>
        <p className={dashboardTheme.pageSubtitle}>
          Here is your quick overview and pending tasks for today.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-medium text-rose-600">{error}</p>
        </div>
      )}

      <section className="mb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-slate-800 md:text-lg">
            My Classes
          </h2>
          <button
            onClick={() => navigate("/dashboard/classes")}
            className="group inline-flex items-center gap-2 text-sm font-semibold text-teal-600 transition-colors hover:text-teal-700"
          >
            View all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`class-skeleton-${index}`}
                className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : displayedClasses.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayedClasses.map((classItem, classIndex) => (
              <ClassCard
                key={classItem.id}
                classItem={classItem}
                variant="dashboard"
                accentIndex={classIndex}
                onClick={() => navigate(`/dashboard/classes/${classItem.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-base font-semibold text-slate-700">
              No recent classes found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Classes you recently accessed will appear here.
            </p>
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-slate-800 md:text-lg">
            To-Check
          </h2>
          <button
            onClick={() => navigate("/dashboard/assignments")}
            className="group inline-flex items-center gap-2 text-sm font-semibold text-teal-600 transition-colors hover:text-teal-700"
          >
            View all
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading pending tasks...
            </div>
          ) : tasks.length > 0 ? (
            <>
              {/* Mobile card layout */}
              <div className="space-y-3 lg:hidden">
                {sortedTasks.slice(0, 5).map((task) => {
                  const pendingCount = task.submissionCount ?? 0
                  const pendingBadgeClass = getPendingBadgeClass(pendingCount)
                  const deadlineStatus = getDeadlineStatus(task.deadline)

                  return (
                    <div
                      key={`mobile-${task.id}`}
                      className="border-b border-slate-200 p-4 last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {task.assignmentName}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {task.className || "Unknown class"}
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${pendingBadgeClass}`}
                        >
                          {pendingCount} Pending
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${getDeadlineBadgeClass(deadlineStatus)
                            .replace("border-", "text-")
                            .split(" ")
                            .filter(c => c.startsWith("text-"))
                            .join(" ")
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {task.deadline ? formatDateTime(task.deadline) : "No deadline"}
                        </span>
                        <button
                          onClick={() =>
                            navigate(`/dashboard/assignments/${task.id}/submissions`)
                          }
                          className="inline-flex items-center gap-1.5 rounded-md bg-teal-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-600"
                        >
                          Review
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop table layout */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 text-left">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Assignment Name
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Class
                      </th>
                      <th
                        className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600"
                        aria-sort={deadlineSort === "asc" ? "ascending" : "descending"}
                      >
                        <button
                          type="button"
                          className="inline-flex cursor-pointer select-none items-center gap-1 hover:text-slate-800"
                          onClick={() => setDeadlineSort(prev => prev === "asc" ? "desc" : "asc")}
                          aria-label="Sort by deadline"
                        >
                          Deadline
                          {deadlineSort === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Pending Submissions
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTasks.slice(0, 5).map((task) => {
                      const pendingCount = task.submissionCount ?? 0
                      const pendingBadgeClass = getPendingBadgeClass(pendingCount)
                      const deadlineStatus = getDeadlineStatus(task.deadline)

                      return (
                        <tr
                          key={task.id}
                          className="border-t border-slate-200 transition-colors hover:bg-slate-50/70"
                        >
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {task.assignmentName}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {task.className || "Unknown class"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getDeadlineBadgeClass(deadlineStatus)}`}
                            >
                              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
                              {task.deadline ? formatDateTime(task.deadline) : "No deadline"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${pendingBadgeClass}`}
                            >
                              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
                              {pendingCount} Pending
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() =>
                                navigate(`/dashboard/assignments/${task.id}/submissions`)
                              }
                              className="inline-flex items-center gap-2 rounded-md bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
                            >
                              Review
                              <ArrowRight className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-base font-semibold text-slate-700">All caught up</p>
              <p className="mt-1 text-sm text-slate-500">
                New pending checks will appear here.
              </p>
            </div>
          )}
        </div>
      </section>
    </DashboardLayout>
  )
}

