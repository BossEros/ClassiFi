import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, ChevronUp, ChevronDown, ClipboardList } from "lucide-react"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import { getDeadlineStatus, formatDateTime } from "@/presentation/utils/dateUtils"
import { getPendingAssignments } from "@/business/services/studentDashboardService"
import { getPendingTasks } from "@/business/services/teacherDashboardService"
import type { Task } from "@/business/models/dashboard/types"

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

function getSubmissionProgressClass(submitted: number, total: number): string {
  if (total === 0) return "border-slate-300 bg-slate-100 text-slate-600"

  const ratio = submitted / total

  if (ratio >= 1) return "border-emerald-300 bg-emerald-100 text-emerald-700"
  if (ratio >= 0.5) return "border-amber-300 bg-amber-100 text-amber-700"
  if (ratio > 0) return "border-blue-300 bg-blue-100 text-blue-700"

  return "border-slate-300 bg-slate-100 text-slate-600"
}

export function AssignmentsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isTeacher = user?.role === "teacher"

  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }

    const fetchAssignments = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const userId = parseInt(user.id)

        if (isTeacher) {
          const result = await getPendingTasks(userId, 50)
          setTasks(result)
        } else {
          const result = await getPendingAssignments(userId, 50)
          setTasks(result.assignments)
        }
      } catch (fetchError) {
        console.error("Failed to fetch assignments:", fetchError)
        setError("Failed to load assignments. Please try refreshing the page.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssignments()
  }, [navigate, user, isTeacher])

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user, userInitials })

  const pageTitle = isTeacher ? "Assignments to Check" : "My Assignments"
  const pageDescription = isTeacher
    ? "Review and grade pending student submissions."
    : "View and submit your pending assignments."
  const emptyTitle = isTeacher ? "All caught up" : "All caught up!"
  const emptyDescription = isTeacher
    ? "New pending checks will appear here."
    : "New assignments will appear here when available."

  return (
    <DashboardLayout topBar={topBar}>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          {pageTitle}
        </h1>
        <p className="mt-2 text-base text-slate-500">{pageDescription}</p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-medium text-rose-600">{error}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading assignments...
          </div>
        ) : tasks.length > 0 ? (
          <div className="overflow-x-auto">
            {isTeacher ? (
              <TeacherAssignmentsTable tasks={tasks} onNavigate={navigate} />
            ) : (
              <StudentAssignmentsTable tasks={tasks} onNavigate={navigate} />
            )}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <ClipboardList className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-base font-semibold text-slate-700">{emptyTitle}</p>
            <p className="mt-1 text-sm text-slate-500">{emptyDescription}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

type SortDirection = "asc" | "desc"

interface AssignmentsTableProps {
  tasks: Task[]
  onNavigate: (path: string) => void
}

function TeacherAssignmentsTable({ tasks, onNavigate }: AssignmentsTableProps) {
  const [deadlineSort, setDeadlineSort] = useState<SortDirection>("asc")

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0
      if (!a.deadline) return 1
      if (!b.deadline) return -1

      const dateA = new Date(a.deadline).getTime()
      const dateB = new Date(b.deadline).getTime()

      return deadlineSort === "asc" ? dateA - dateB : dateB - dateA
    })
  }, [tasks, deadlineSort])

  return (
    <table className="w-full min-w-[760px]">
      <thead className="bg-slate-100 text-left">
        <tr>
          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Assignment Name
          </th>
          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Class
          </th>
          <th
            className="cursor-pointer select-none px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:text-slate-800"
            onClick={() => setDeadlineSort(prev => prev === "asc" ? "desc" : "asc")}
          >
            <span className="inline-flex items-center gap-1">
              Deadline
              {deadlineSort === "asc" ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </span>
          </th>
          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Submissions
          </th>
          <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedTasks.map((task) => {
          const deadlineStatus = getDeadlineStatus(task.deadline)
          const submitted = task.submissionCount ?? 0
          const total = task.studentCount ?? 0

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
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getSubmissionProgressClass(submitted, total)}`}
                >
                  {submitted} / {total} submitted
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onNavigate(`/dashboard/assignments/${task.id}/submissions`)}
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
  )
}

function StudentAssignmentsTable({ tasks, onNavigate }: AssignmentsTableProps) {
  const [deadlineSort, setDeadlineSort] = useState<SortDirection>("asc")

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0
      if (!a.deadline) return 1
      if (!b.deadline) return -1

      const dateA = new Date(a.deadline).getTime()
      const dateB = new Date(b.deadline).getTime()

      return deadlineSort === "asc" ? dateA - dateB : dateB - dateA
    })
  }, [tasks, deadlineSort])

  return (
    <table className="w-full min-w-[640px]">
      <thead className="bg-slate-100 text-left">
        <tr>
          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Assignment Name
          </th>
          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Class
          </th>
          <th
            className="cursor-pointer select-none px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:text-slate-800"
            onClick={() => setDeadlineSort(prev => prev === "asc" ? "desc" : "asc")}
          >
            <span className="inline-flex items-center gap-1">
              Deadline
              {deadlineSort === "asc" ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </span>
          </th>
          <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedTasks.map((task) => {
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
              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onNavigate(`/dashboard/assignments/${task.id}`)}
                  className="inline-flex items-center gap-2 rounded-md bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
                >
                  Open
                  <ArrowRight className="h-4 w-4" />
                </button>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
