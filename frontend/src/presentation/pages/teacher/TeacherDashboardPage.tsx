import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import { ClassCard } from "@/presentation/components/shared/dashboard/ClassCard"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { getDashboardData } from "@/business/services/teacherDashboardService"
import { getDeadlineStatus } from "@/presentation/utils/dateUtils"
import type { User } from "@/business/models/auth/types"
import type { Class, Task } from "@/business/models/dashboard/types"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"

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

export function TeacherDashboardPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const [user, setUser] = useState<User | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      } catch (fetchError) {
        console.error("Failed to fetch dashboard data:", fetchError)
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
  const displayedClasses = classes.slice(0, 3)

  return (
    <DashboardLayout topBar={topBar}>
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          Welcome back, {user?.firstName || "Teacher"}
        </h1>
        <p className="mt-2 text-base text-slate-500">
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
            Recent Classes
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
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading pending tasks...
            </div>
          ) : tasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-slate-100 text-left">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Assignment Name
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Class
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
                  {tasks.map((task) => {
                    const pendingCount = task.submissionCount ?? 0
                    const pendingBadgeClass = getPendingBadgeClass(pendingCount)
                    const deadlineStatus = getDeadlineStatus(task.deadline)

                    return (
                      <tr
                        key={task.id}
                        className="border-t border-slate-200 transition-colors hover:bg-slate-50/70"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {task.assignmentName}
                            </p>
                            <p className="text-xs text-slate-500">
                              Due: {deadlineStatus}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                          {task.className || "Unknown class"}
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

