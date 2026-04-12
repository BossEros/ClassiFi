import { useEffect, useMemo, useState, useCallback } from "react"
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, ChevronUp, ChevronDown, ClipboardList, Clock, CheckCircle2, XCircle, ListFilter } from "lucide-react"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import { AssignmentFilters } from "@/presentation/components/shared/dashboard/AssignmentFilters"
import { TablePaginationFooter } from "@/presentation/components/ui/TablePaginationFooter"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import { dashboardTheme } from "@/presentation/constants/dashboardTheme"
import { getDeadlineStatus, formatDateTime } from "@/presentation/utils/dateUtils"
import { getAllTeacherAssignments } from "@/business/services/teacherDashboardService"
import { getEnrolledClasses } from "@/business/services/studentDashboardService"
import { getClassAssignments } from "@/business/services/classService"
import type { Task } from "@/data/api/class.types"

const ITEMS_PER_PAGE = 10

type StudentStatusFilter = "all" | "pending" | "finished" | "missed"
type TeacherStatusFilter = "all" | "pending" | "closed" | "no-submissions"

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

function getStudentStatusBadge(task: Task): { label: string; className: string } {
  const now = new Date()
  const deadlinePassed = task.deadline ? new Date(task.deadline) < now : false

  if (task.hasSubmitted) {
    return { label: "Finished", className: "border-emerald-300 bg-emerald-100 text-emerald-700" }
  }

  if (deadlinePassed) {
    return { label: "Missed", className: "border-rose-300 bg-rose-100 text-rose-700" }
  }

  return { label: "Pending", className: "border-amber-300 bg-amber-100 text-amber-700" }
}

export function AssignmentsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClass, setSelectedClass] = useState("all")
  const [statusFilter, setStatusFilter] = useState<StudentStatusFilter>("all")
  const [teacherStatusFilter, setTeacherStatusFilter] = useState<TeacherStatusFilter>("all")
  const [currentPage, setCurrentPage] = useState(1)

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
          const result = await getAllTeacherAssignments(userId)
          setTasks(result)
        } else {
          const enrolledClassesResponse = await getEnrolledClasses(userId)
          const allAssignments = await Promise.all(
            enrolledClassesResponse.classes.map((cls) =>
              getClassAssignments(cls.id, userId),
            ),
          )
          setTasks(allAssignments.flat())
        }
      } catch {
        setError("Failed to load assignments. Please try refreshing the page.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssignments()
  }, [navigate, user, isTeacher])

  const classOptions = useMemo(() => {
    const uniqueClasses = [...new Set(tasks.map((task) => task.className).filter(Boolean))]
    uniqueClasses.sort((a, b) => (a ?? "").localeCompare(b ?? ""))

    return [
      { value: "all", label: "All Classes" },
      ...uniqueClasses.map((name) => ({ value: name!, label: name! })),
    ]
  }, [tasks])

  const normalizedQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (normalizedQuery) {
        const matchesName = task.assignmentName.toLowerCase().includes(normalizedQuery)

        if (!matchesName) return false
      }

      if (selectedClass !== "all") {
        if (task.className !== selectedClass) return false
      }

      if (!isTeacher && statusFilter !== "all") {
        const now = new Date()
        const deadlinePassed = task.deadline ? new Date(task.deadline) < now : false

        if (statusFilter === "pending" && (task.hasSubmitted || deadlinePassed)) return false
        if (statusFilter === "finished" && !task.hasSubmitted) return false
        if (statusFilter === "missed" && (task.hasSubmitted || !deadlinePassed)) return false
      }

      if (isTeacher && teacherStatusFilter !== "all") {
        const now = new Date()
        const deadlinePassed = task.deadline ? new Date(task.deadline) < now : false
        const submitted = task.submissionCount ?? 0
        const total = task.studentCount ?? 0

        if (teacherStatusFilter === "pending" && (deadlinePassed || submitted >= total)) return false
        if (teacherStatusFilter === "closed" && !deadlinePassed) return false
        if (teacherStatusFilter === "no-submissions" && (deadlinePassed || submitted > 0)) return false
      }

      return true
    })
  }, [tasks, normalizedQuery, selectedClass, statusFilter, teacherStatusFilter, isTeacher])

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / ITEMS_PER_PAGE))

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }, [])

  const handleClassChange = useCallback((className: string) => {
    setSelectedClass(className)
    setCurrentPage(1)
  }, [])

  const handleStatusChange = useCallback((status: StudentStatusFilter) => {
    setStatusFilter(status)
    setCurrentPage(1)
  }, [])

  const handleTeacherStatusChange = useCallback((status: TeacherStatusFilter) => {
    setTeacherStatusFilter(status)
    setCurrentPage(1)
  }, [])
  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user, userInitials })

  const pageTitle = isTeacher ? "All Assignments" : "My Assignments"
  const pageDescription = isTeacher
    ? "View and manage all assignments across your active classes."
    : "View and submit your assignments."
  const emptyTitle = isTeacher ? "No assignments found" : "All caught up!"
  const emptyDescription = isTeacher
    ? "No assignments match the selected filter."
    : "No assignments match the selected filter."

  const studentStatusCounts = useMemo(() => {
    if (isTeacher) return null
    const now = new Date()

    return {
      all: tasks.length,
      pending: tasks.filter((t) => !t.hasSubmitted && (!t.deadline || new Date(t.deadline) >= now)).length,
      finished: tasks.filter((t) => t.hasSubmitted).length,
      missed: tasks.filter((t) => !t.hasSubmitted && !!t.deadline && new Date(t.deadline) < now).length,
    }
  }, [tasks, isTeacher])

  const teacherStatusCounts = useMemo(() => {
    if (!isTeacher) return null
    const now = new Date()

    return {
      all: tasks.length,
      pending: tasks.filter((t) => {
        const deadlinePassed = t.deadline ? new Date(t.deadline) < now : false
        const submitted = t.submissionCount ?? 0
        const total = t.studentCount ?? 0

        return !deadlinePassed && submitted < total
      }).length,
      closed: tasks.filter((t) => !!t.deadline && new Date(t.deadline) < now).length,
      "no-submissions": tasks.filter((t) => {
        const deadlinePassed = t.deadline ? new Date(t.deadline) < now : false

        return !deadlinePassed && (t.submissionCount ?? 0) === 0
      }).length,
    }
  }, [tasks, isTeacher])

  const hasActiveFilters =
    normalizedQuery.length > 0 ||
    selectedClass !== "all" ||
    (!isTeacher && statusFilter !== "all") ||
    (isTeacher && teacherStatusFilter !== "all")

  return (
    <DashboardLayout topBar={topBar}>
      <div className="mb-8">
        <h1 className={dashboardTheme.pageTitle}>
          {pageTitle}
        </h1>
        <p className={dashboardTheme.pageSubtitle}>{pageDescription}</p>
      </div>

      {!isLoading && tasks.length > 0 && (
        <AssignmentFilters
          onSearchChange={handleSearchChange}
          onClassChange={handleClassChange}
          currentFilters={{ searchQuery, selectedClass }}
          classOptions={classOptions}
        />
      )}

      {!isLoading && !isTeacher && studentStatusCounts && (
        <div className="mb-6 flex flex-wrap gap-2">
          {(
            [
              { key: "all", label: "All", icon: <ListFilter className="h-3.5 w-3.5" /> },
              { key: "pending", label: "Pending", icon: <Clock className="h-3.5 w-3.5" /> },
              { key: "finished", label: "Finished", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
              { key: "missed", label: "Missed", icon: <XCircle className="h-3.5 w-3.5" /> },
            ] as { key: StudentStatusFilter; label: string; icon: ReactNode }[]
          ).map(({ key, label, icon }) => {
            const isActive = statusFilter === key
            const count = studentStatusCounts[key]
            const activeStyles: Record<StudentStatusFilter, string> = {
              all: "bg-slate-800 text-white border-slate-800",
              pending: "bg-amber-500 text-white border-amber-500",
              finished: "bg-emerald-500 text-white border-emerald-500",
              missed: "bg-rose-500 text-white border-rose-500",
            }

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleStatusChange(key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? activeStyles[key]
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {icon}
                {label}
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.5 text-xs font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {!isLoading && isTeacher && teacherStatusCounts && (
        <div className="mb-6 flex flex-wrap gap-2">
          {(
            [
              { key: "all", label: "All", icon: <ListFilter className="h-3.5 w-3.5" /> },
              { key: "pending", label: "Pending", icon: <Clock className="h-3.5 w-3.5" /> },
              { key: "closed", label: "Closed", icon: <XCircle className="h-3.5 w-3.5" /> },
              { key: "no-submissions", label: "No Submissions", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
            ] as { key: TeacherStatusFilter; label: string; icon: ReactNode }[]
          ).map(({ key, label, icon }) => {
            const isActive = teacherStatusFilter === key
            const count = teacherStatusCounts[key]
            const activeStyles: Record<TeacherStatusFilter, string> = {
              all: "bg-slate-800 text-white border-slate-800",
              pending: "bg-amber-500 text-white border-amber-500",
              closed: "bg-slate-500 text-white border-slate-500",
              "no-submissions": "bg-blue-500 text-white border-blue-500",
            }

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleTeacherStatusChange(key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? activeStyles[key]
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {icon}
                {label}
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.5 text-xs font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

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
        ) : filteredTasks.length > 0 ? (
          <div>
            <div className="overflow-x-auto">
              {isTeacher ? (
                <TeacherAssignmentsTable
                  tasks={filteredTasks}
                  onNavigate={navigate}
                  currentPage={currentPage}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
              ) : (
                <StudentAssignmentsTable
                  tasks={filteredTasks}
                  onNavigate={navigate}
                  currentPage={currentPage}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-4">
              <TablePaginationFooter
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredTasks.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
                variant="light"
              />
            </div>
          </div>
        ) : hasActiveFilters ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <ClipboardList className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-base font-semibold text-slate-700">No matching assignments</p>
            <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filter.</p>
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
  currentPage: number
  itemsPerPage: number
}

function TeacherAssignmentsTable({ tasks, onNavigate, currentPage, itemsPerPage }: AssignmentsTableProps) {
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

  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage

    return sortedTasks.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedTasks, currentPage, itemsPerPage])

  return (
    <>
      {/* Mobile card layout */}
      <div className="lg:hidden divide-y divide-slate-200">
        {paginatedTasks.map((task) => {
          const deadlineStatus = getDeadlineStatus(task.deadline)
          const submitted = task.submittedCount ?? 0
          const ungraded = task.submissionCount ?? 0
          const total = task.studentCount ?? 0

          return (
            <div key={`mobile-${task.id}`} className="p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{task.assignmentName}</p>
                <p className="text-xs text-slate-500 mt-0.5">{task.className || "Unknown class"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getDeadlineBadgeClass(deadlineStatus)}`}>
                  <Clock className="h-3 w-3" />
                  {task.deadline ? formatDateTime(task.deadline) : "No deadline"}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getSubmissionProgressClass(submitted, total)}`}>
                  {submitted}/{total} submitted
                </span>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getSubmissionProgressClass(ungraded, total)}`}>
                  {ungraded} ungraded
                </span>
              </div>
              <button
                onClick={() => onNavigate(`/dashboard/assignments/${task.id}/submissions`)}
                className="inline-flex items-center gap-2 rounded-md bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
              >
                Review
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>

      {/* Desktop table layout */}
      <table className="hidden lg:table w-full">
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
            Submitted
          </th>
          <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
            Ungraded Submissions
          </th>
          <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        {paginatedTasks.map((task) => {
          const deadlineStatus = getDeadlineStatus(task.deadline)
          const submitted = task.submittedCount ?? 0
          const ungraded = task.submissionCount ?? 0
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
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getSubmissionProgressClass(ungraded, total)}`}
                >
                  {ungraded} ungraded
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
    </>
  )
}

function StudentAssignmentsTable({ tasks, onNavigate, currentPage, itemsPerPage }: AssignmentsTableProps) {
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

  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage

    return sortedTasks.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedTasks, currentPage, itemsPerPage])

  return (
    <>
      {/* Mobile card layout */}
      <div className="lg:hidden divide-y divide-slate-200">
        {paginatedTasks.map((task) => {
          const deadlineStatus = getDeadlineStatus(task.deadline)
          const { label: statusLabel, className: statusClass } = getStudentStatusBadge(task)

          return (
            <div key={`mobile-${task.id}`} className="p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{task.assignmentName}</p>
                <p className="text-xs text-slate-500 mt-0.5">{task.className || "Unknown class"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass}`}>
                  {statusLabel}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getDeadlineBadgeClass(deadlineStatus)}`}>
                  <Clock className="h-3 w-3" />
                  {task.deadline ? formatDateTime(task.deadline) : "No deadline"}
                </span>
              </div>
              <div>
                <button
                  onClick={() => onNavigate(`/dashboard/assignments/${task.id}`)}
                  className="inline-flex items-center gap-2 rounded-md bg-teal-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-600"
                >
                  Open
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop table layout */}
      <table className="hidden lg:table w-full">
        <thead className="bg-slate-100 text-left">
          <tr>
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Assignment Name
            </th>
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Class
            </th>
            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-600">
              Status
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
          {paginatedTasks.map((task) => {
            const deadlineStatus = getDeadlineStatus(task.deadline)
            const { label: statusLabel, className: statusClass } = getStudentStatusBadge(task)

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
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}>
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
                    {statusLabel}
                  </span>
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
    </>
  )
}
