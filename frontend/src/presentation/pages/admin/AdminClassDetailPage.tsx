import { useEffect, useState, useCallback, type MouseEvent as ReactMouseEvent } from "react"
import { createPortal } from "react-dom"
import { useNavigate, useParams } from "react-router-dom"
import {
  AlertTriangle,
  Archive,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Mail,
  MoreVertical,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react"
import { convertToSingleLetterAbbr, formatTimeRange } from "@/presentation/constants/schedule.constants"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import { useDebouncedValue } from "@/presentation/hooks/shared/useDebouncedValue"
import { useDocumentClick } from "@/presentation/hooks/shared/useDocumentClick"
import { Avatar } from "@/presentation/components/ui/Avatar"
import { useToastStore } from "@/shared/store/useToastStore"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { dashboardTheme } from "@/presentation/constants/dashboardTheme"
import { AdminDeleteClassModal } from "@/presentation/components/admin/AdminDeleteClassModal"
import {
  addStudentToClass,
  archiveClass,
  deleteClass,
  getAdminClassDetailData,
  getAllUsers,
  removeStudentFromClass,
  restoreClass,
  type AdminClass,
  type AdminUser,
  type EnrolledStudent,
} from "@/business/services/adminService"

interface AdminClassActionDropdownPosition {
  id: number
  x: number
  y: number
}

// Inlined from src/presentation/components/admin/AdminAddStudentModal.tsx
interface AdminAddStudentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  classId: number
  existingStudents: EnrolledStudent[]
}

function AdminAddStudentModal({
  isOpen,
  onClose,
  onSuccess,
  classId,
  existingStudents,
}: AdminAddStudentModalProps) {
  const showToast = useToastStore((state) => state.showToast)
  const [searchQuery, setSearchQuery] = useState("")
  const [students, setStudents] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState<number | null>(null)
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)

  const hasSearchQuery = searchQuery.trim().length > 0
  const availableStudentCountLabel = `${students.length} ${
    hasSearchQuery ? "matching" : "available"
  } student${students.length === 1 ? "" : "s"}`
  const emptyStateTitle = hasSearchQuery ? "No students found" : "No available students"
  const emptyStateDescription = hasSearchQuery
    ? "Try adjusting the student name or email you entered."
    : "All active students are already enrolled in this class."

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isSubmitting === null) {
        onClose()
      }
    }

    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", handleEscapeKey)

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.removeEventListener("keydown", handleEscapeKey)
    }
  }, [isOpen, isSubmitting, onClose])

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("")
      setStudents([])
      setIsLoading(false)
      setIsSubmitting(null)
      return
    }

    const fetchStudents = async () => {
      try {
        setIsLoading(true)
        const response = await getAllUsers({
          role: "student",
          search: debouncedSearchQuery || undefined,
          limit: 12,
          status: "active",
        })

        const enrolledStudentIds = new Set(existingStudents.map((student) => student.id))
        const availableStudents = response.data.filter(
          (student) => !enrolledStudentIds.has(student.id),
        )

        setStudents(availableStudents)
      } catch {
        // Keep the modal open with an empty list when the student search fails.
      } finally {
        setIsLoading(false)
      }
    }

    void fetchStudents()
  }, [debouncedSearchQuery, existingStudents, isOpen])

  const handleAddStudent = async (student: AdminUser) => {
    try {
      setIsSubmitting(student.id)
      await addStudentToClass(classId, student.id)
      showToast(
        `Successfully enrolled ${student.firstName} ${student.lastName}`,
        "success",
      )
      onSuccess()
      setStudents((previousStudents) =>
        previousStudents.filter((availableStudent) => availableStudent.id !== student.id),
      )
    } catch {
      showToast("Failed to enroll student", "error")
    } finally {
      setIsSubmitting(null)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
        onClick={isSubmitting === null ? onClose : undefined}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-class-enroll-student-title"
        aria-describedby="admin-class-enroll-student-description"
        className="relative z-10 flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl animate-in fade-in-0 zoom-in-95 duration-200"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting !== null}
          aria-label="Close enroll student modal"
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-6 shadow-sm shadow-slate-200/40">
          <div className="min-w-0 pr-10">
            <h2
              id="admin-class-enroll-student-title"
              className="text-xl font-semibold text-slate-900"
            >
              Enroll Student
            </h2>
            <p
              id="admin-class-enroll-student-description"
              className="mt-1 text-sm leading-6 text-slate-600"
            >
              Add an active student to this class. Students who are already
              enrolled are hidden from the list below.
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto bg-white px-6 py-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full min-w-0 lg:flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-500 shadow-sm shadow-slate-200/70 transition-all hover:border-slate-400 hover:bg-white focus:border-transparent focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/15"
                autoFocus
              />
            </div>

            <div className="inline-flex items-center gap-2 self-start rounded-xl border border-teal-200 bg-teal-50 px-3.5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-teal-700 shadow-sm shadow-teal-100/80 lg:self-auto">
              <Users className="h-4 w-4 text-teal-600" />
              <span>{availableStudentCountLabel}</span>
            </div>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-12 text-slate-500 shadow-sm shadow-slate-200/70">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Loading available students...</p>
              </div>
            ) : students.length > 0 ? (
              students.map((student) => (
                <div
                  key={student.id}
                  className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-md shadow-slate-200/80 ring-1 ring-slate-200/60 transition-all duration-200 hover:-translate-y-1 hover:border-slate-300 hover:bg-slate-50 hover:shadow-xl hover:shadow-slate-200/90 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                      src={student.avatarUrl ?? undefined}
                      fallback={`${student.firstName[0]}${student.lastName[0]}`}
                      className="h-10 w-10 ring-2 ring-slate-100"
                    />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="truncate text-xs text-slate-500">{student.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddStudent(student)}
                    disabled={isSubmitting === student.id}
                    className="inline-flex min-w-[116px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-teal-500/30 bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-200/80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting === student.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    Enroll
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-12 text-center shadow-sm shadow-slate-200/50">
                <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Search className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-slate-700">{emptyStateTitle}</p>
                <p className="text-xs leading-5 text-slate-500">
                  {emptyStateDescription}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface AdminRemoveStudentModalProps {
  isOpen: boolean
  isRemoving: boolean
  student: EnrolledStudent | null
  onClose: () => void
  onConfirm: () => Promise<void>
}

function AdminRemoveStudentModal({
  isOpen,
  isRemoving,
  student,
  onClose,
  onConfirm,
}: AdminRemoveStudentModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isRemoving) {
        onClose()
      }
    }

    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, isRemoving, onClose])

  if (!isOpen || !student) {
    return null
  }

  if (typeof document === "undefined") {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] grid place-items-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isRemoving ? onClose : undefined}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-student-title"
        aria-describedby="remove-student-description"
        className="relative z-10 flex-shrink-0 overflow-hidden rounded-3xl border border-rose-200 bg-white shadow-xl animate-in fade-in-0 zoom-in-95 duration-200"
        style={{
          width: "min(448px, calc(100vw - 2rem))",
          maxWidth: "calc(100vw - 2rem)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isRemoving}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Close remove student modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="px-6 pb-4 pt-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <h2
            id="remove-student-title"
            className="text-xl font-semibold text-slate-900"
          >
            Remove Student?
          </h2>
          <p
            id="remove-student-description"
            className="mt-2 text-sm leading-6 text-slate-600"
          >
            This will unenroll{" "}
            <span className="font-semibold text-slate-900">
              {student.firstName} {student.lastName}
            </span>{" "}
            from the class.
          </p>
        </div>

        <div className="mx-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar
              fallback={`${student.firstName[0] ?? "?"}${student.lastName[0] ?? ""}`}
              src={student.avatarUrl ?? undefined}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800">
                {student.firstName} {student.lastName}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                <p className="truncate text-xs text-slate-500">{student.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isRemoving}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isRemoving}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRemoving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Remove Student
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function AdminClassDetailPage() {
  const navigate = useNavigate()
  const { classId } = useParams<{ classId: string }>()
  const showToast = useToastStore((state) => state.showToast)
  const currentUser = useAuthStore((state) => state.user)
  const parsedClassId = classId ? Number.parseInt(classId, 10) : null

  const [classInfo, setClassInfo] = useState<AdminClass | null>(null)
  const [students, setStudents] = useState<EnrolledStudent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [studentActionLoadingId, setStudentActionLoadingId] = useState<number | null>(null)
  const [classActionLoadingId, setClassActionLoadingId] = useState<number | null>(null)
  const [studentPendingRemoval, setStudentPendingRemoval] =
    useState<EnrolledStudent | null>(null)
  const [classPendingDeletion, setClassPendingDeletion] = useState<AdminClass | null>(null)
  const [activeClassActionsMenu, setActiveClassActionsMenu] =
    useState<AdminClassActionDropdownPosition | null>(null)

  const fetchClassData = useCallback(async () => {
    if (parsedClassId === null || Number.isNaN(parsedClassId)) {
      setErrorMessage("Class not found")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setErrorMessage(null)

      const data = await getAdminClassDetailData(parsedClassId)
      setClassInfo(data.classInfo)
      setStudents(data.students)
    } catch {
      setErrorMessage("Failed to load class details")
    } finally {
      setIsLoading(false)
    }
  }, [parsedClassId])

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }

    if (currentUser.role !== "admin") {
      navigate("/dashboard")
      return
    }

    void fetchClassData()
  }, [currentUser, navigate, fetchClassData])

  const handleClassActionsDocumentClick = useCallback((event: MouseEvent) => {
    const clickTarget = event.target as HTMLElement | null

    if (
      clickTarget?.closest("[data-admin-class-dropdown-trigger]") ||
      clickTarget?.closest("[data-admin-class-dropdown-menu]")
    ) {
      return
    }

    setActiveClassActionsMenu(null)
  }, [])

  useDocumentClick(handleClassActionsDocumentClick)

  const handleEditClass = useCallback(() => {
    if (!classInfo) {
      return
    }

    navigate(`/dashboard/admin/classes/${classInfo.id}/edit`)
  }, [classInfo, navigate])

  const handleClassActionsClick = useCallback(
    (event: ReactMouseEvent<HTMLButtonElement>) => {
      if (!classInfo) {
        return
      }

      event.stopPropagation()

      if (activeClassActionsMenu?.id === classInfo.id) {
        setActiveClassActionsMenu(null)
        return
      }

      const triggerBounds = event.currentTarget.getBoundingClientRect()
      setActiveClassActionsMenu({
        id: classInfo.id,
        x: triggerBounds.left - 224 + triggerBounds.width,
        y: triggerBounds.bottom + 8,
      })
    },
    [activeClassActionsMenu, classInfo],
  )

  const handleArchiveClass = useCallback(async () => {
    if (!classInfo) {
      return
    }

    try {
      setClassActionLoadingId(classInfo.id)
      await archiveClass(classInfo.id)
      await fetchClassData()
      showToast("Class archived successfully", "success")
    } catch {
      showToast("Failed to archive class", "error")
    } finally {
      setClassActionLoadingId(null)
      setActiveClassActionsMenu(null)
    }
  }, [classInfo, fetchClassData, showToast])

  const handleRestoreClass = useCallback(async () => {
    if (!classInfo) {
      return
    }

    try {
      setClassActionLoadingId(classInfo.id)
      await restoreClass(classInfo.id)
      await fetchClassData()
      showToast("Class restored successfully", "success")
    } catch {
      showToast("Failed to restore class", "error")
    } finally {
      setClassActionLoadingId(null)
      setActiveClassActionsMenu(null)
    }
  }, [classInfo, fetchClassData, showToast])

  const handleDeleteClass = useCallback(async () => {
    if (!classPendingDeletion) {
      return
    }

    try {
      setClassActionLoadingId(classPendingDeletion.id)
      await deleteClass(classPendingDeletion.id)
      showToast("Class deleted successfully", "success")
      navigate("/dashboard/classes")
    } catch {
      showToast("Failed to delete class", "error")
    } finally {
      setClassActionLoadingId(null)
      setActiveClassActionsMenu(null)
      setClassPendingDeletion(null)
    }
  }, [classPendingDeletion, navigate, showToast])

  const handleRemoveStudent = async (studentId: number) => {
    if (parsedClassId === null || Number.isNaN(parsedClassId)) {
      return
    }

    try {
      setStudentActionLoadingId(studentId)
      await removeStudentFromClass(parsedClassId, studentId)
      setStudents((previousStudents) =>
        previousStudents.filter((student) => student.id !== studentId),
      )
      showToast("Student removed from class", "success")
      setStudentPendingRemoval(null)
    } catch {
      showToast("Failed to remove student", "error")
    } finally {
      setStudentActionLoadingId(null)
    }
  }

  const filteredStudents = students.filter((student) => {
    const normalizedSearchQuery = searchQuery.toLowerCase()

    return (
      student.firstName.toLowerCase().includes(normalizedSearchQuery) ||
      student.lastName.toLowerCase().includes(normalizedSearchQuery) ||
      student.email.toLowerCase().includes(normalizedSearchQuery)
    )
  })

  const studentsPerPage = 10
  const totalFilteredStudents = filteredStudents.length
  const totalStudentPages = Math.max(
    1,
    Math.ceil(totalFilteredStudents / studentsPerPage),
  )
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage,
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalStudentPages))
  }, [totalStudentPages])

  const userInitials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({
    user: currentUser,
    userInitials,
    breadcrumbItems: [
      { label: "Classes", to: "/dashboard/classes" },
      { label: classInfo?.className || "Class Overview" },
    ],
  })

  const classTeacherInitials = classInfo?.teacherName
    ? classInfo.teacherName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((namePart) => namePart[0])
        .join("")
        .toUpperCase()
    : "CL"

  const semesterLabel =
    classInfo?.semester === 1 ? "1st Semester" : "2nd Semester"

  const scheduleText = classInfo?.schedule.days.length
    ? `${convertToSingleLetterAbbr(classInfo.schedule.days).join("")} ${formatTimeRange(classInfo.schedule.startTime, classInfo.schedule.endTime)}`
    : null

  const dropdownWidthPx = 224
  const dropdownVerticalOffsetPx = 8
  const viewportPaddingPx = 8
  const maxLeftPx =
    typeof window !== "undefined"
      ? Math.max(
          viewportPaddingPx,
          window.innerWidth - dropdownWidthPx - viewportPaddingPx,
        )
      : activeClassActionsMenu?.x ?? 0
  const safeDropdownLeftPx = activeClassActionsMenu
    ? Math.min(
        Math.max(activeClassActionsMenu.x, viewportPaddingPx),
        maxLeftPx,
      )
    : 0
  const safeDropdownTopPx = activeClassActionsMenu
    ? Math.max(activeClassActionsMenu.y, dropdownVerticalOffsetPx)
    : 0

  if (isLoading) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-slate-500">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-teal-500" />
            <p className="text-sm font-medium">Loading class details...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (errorMessage || !classInfo) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-md shadow-slate-200/80">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-500">
              <XCircle className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Error Loading Class</h2>
            <p className="mt-2 text-sm text-slate-500">
              {errorMessage || "Class not found"}
            </p>
            <button
              onClick={fetchClassData}
              className="mt-6 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout topBar={topBar}>
      <div className="w-full min-w-0 space-y-6">
        <div className="relative overflow-hidden rounded-3xl border border-slate-300 bg-white p-6 shadow-md shadow-slate-200/80">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-teal-500 via-sky-500 to-transparent" />

          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {classInfo.isActive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-lg border border-slate-300 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                      Archived
                    </span>
                  )}

                  <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <span>Class Code</span>
                    <span className="font-mono text-xs tracking-[0.14em] text-slate-900">
                      {classInfo.classCode}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h1 className={dashboardTheme.pageTitle}>
                    {classInfo.className}
                  </h1>
                  {classInfo.description ? (
                    <p className="max-w-3xl whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                      {classInfo.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex justify-end lg:pl-6">
                <button
                  type="button"
                  data-admin-class-dropdown-trigger="true"
                  onClick={handleClassActionsClick}
                  disabled={classActionLoadingId === classInfo.id}
                  className={`inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white p-2 text-slate-500 shadow-sm shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-100 hover:text-slate-800 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${
                    activeClassActionsMenu?.id === classInfo.id
                      ? "border-slate-400 bg-slate-100 text-slate-800 shadow-md"
                      : ""
                  }`}
                  aria-label="Class actions"
                  aria-haspopup="menu"
                  aria-expanded={activeClassActionsMenu?.id === classInfo.id}
                >
                  {classActionLoadingId === classInfo.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreVertical className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm shadow-slate-200/60">
                <Avatar
                  src={classInfo.teacherAvatarUrl ?? undefined}
                  fallback={classTeacherInitials}
                  size="sm"
                  className="ring-2 ring-white"
                />
                <span className="truncate">{classInfo.teacherName}</span>
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm shadow-slate-200/60">
                <Calendar className="h-3.5 w-3.5 text-sky-600" />
                <span>{semesterLabel} - S.Y. {classInfo.academicYear}</span>
              </div>

              {scheduleText && (
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm shadow-slate-200/60">
                  <Clock className="h-3.5 w-3.5 text-violet-500" />
                  <span>{scheduleText}</span>
                </div>
              )}

              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm shadow-slate-200/60">
                <Users className="h-3.5 w-3.5 text-teal-600" />
                <span>{students.length} students</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full min-w-0 lg:flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search enrolled students by name or email..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm shadow-slate-200/70 transition-all hover:border-slate-400 hover:bg-white focus:border-transparent focus:outline-none focus:ring-4 focus:ring-teal-500/15"
              />
            </div>

            <button
              onClick={() => setShowAddStudentModal(true)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 lg:shrink-0"
            >
              <UserPlus className="h-4 w-4" />
              Enroll Student
            </button>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-md shadow-slate-200/80">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-300 bg-slate-200/85">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                      Student
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                      Email
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                      Enrolled On
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300/70">
                  {totalFilteredStudents > 0 ? (
                    paginatedStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="group transition-colors duration-200 hover:bg-slate-100"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={student.avatarUrl ?? undefined}
                              fallback={`${student.firstName[0]}${student.lastName[0]}`}
                              size="sm"
                              className="ring-2 ring-transparent transition-all group-hover:ring-teal-100"
                            />
                            <span className="text-sm font-medium text-slate-900 transition-colors group-hover:text-teal-700">
                              {student.firstName} {student.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            <span>{student.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            <span>{new Date(student.enrolledAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => setStudentPendingRemoval(student)}
                              disabled={studentActionLoadingId === student.id}
                              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 transition-all hover:bg-rose-100 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                              title="Remove student"
                            >
                              {studentActionLoadingId === student.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-14 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-3">
                          <div className="rounded-full bg-slate-100 p-4">
                            <Search className="h-8 w-8 opacity-40" />
                          </div>
                          <p className="text-lg font-medium text-slate-700">No students found</p>
                          <p className="text-sm">No students match the current search.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalFilteredStudents > 0 ? (
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-6 py-4">
                <p className="text-sm text-slate-500">
                  Page <span className="font-medium text-slate-900">{currentPage}</span> of {" "}
                  <span className="font-medium text-slate-900">{totalStudentPages}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((previousPage) => Math.max(1, previousPage - 1))
                    }
                    disabled={currentPage === 1}
                    className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((previousPage) =>
                        Math.min(totalStudentPages, previousPage + 1),
                      )
                    }
                    disabled={currentPage === totalStudentPages}
                    className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {activeClassActionsMenu &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            data-admin-class-dropdown-menu="true"
            className="fixed z-[11000] w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/90 ring-1 ring-slate-200/80 animate-in fade-in zoom-in-95 duration-200"
            style={{
              left: safeDropdownLeftPx,
              top: safeDropdownTopPx,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-1 p-1.5">
              <button
                onClick={() => {
                  handleEditClass()
                  setActiveClassActionsMenu(null)
                }}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-slate-700 transition-all duration-150 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm"
              >
                <BookOpen className="h-4 w-4 text-teal-600" />
                Edit Class
              </button>

              {classInfo.isActive ? (
                <button
                  onClick={handleArchiveClass}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-slate-700 transition-all duration-150 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm"
                >
                  <Archive className="h-4 w-4 text-amber-600" />
                  Archive Class
                </button>
              ) : (
                <button
                  onClick={handleRestoreClass}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-slate-700 transition-all duration-150 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm"
                >
                  <RotateCcw className="h-4 w-4 text-emerald-600" />
                  Restore Class
                </button>
              )}

              <div className="mx-2 h-px bg-slate-100" />

              <button
                onClick={() => {
                  setClassPendingDeletion(classInfo)
                  setActiveClassActionsMenu(null)
                }}
                className="group/delete flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-rose-600 transition-all duration-150 hover:border-rose-200 hover:bg-rose-100 hover:text-rose-800 hover:shadow-sm"
              >
                <Trash2 className="h-4 w-4 group-hover/delete:animate-bounce" />
                Delete Class
              </button>
            </div>
          </div>,
          document.body,
        )}

        <AdminAddStudentModal
          isOpen={showAddStudentModal}
          onClose={() => setShowAddStudentModal(false)}
          onSuccess={fetchClassData}
          classId={parsedClassId ?? 0}
          existingStudents={students}
        />
        <AdminRemoveStudentModal
          isOpen={!!studentPendingRemoval}
          isRemoving={
            !!studentPendingRemoval &&
            studentActionLoadingId === studentPendingRemoval.id
          }
          student={studentPendingRemoval}
          onClose={() => {
            if (studentActionLoadingId !== null) {
              return
            }

            setStudentPendingRemoval(null)
          }}
          onConfirm={async () => {
            if (!studentPendingRemoval) {
              return
            }

            await handleRemoveStudent(studentPendingRemoval.id)
          }}
        />
        <AdminDeleteClassModal
          isOpen={!!classPendingDeletion}
          onClose={() => setClassPendingDeletion(null)}
          onConfirm={handleDeleteClass}
          classData={classPendingDeletion}
        />
      </div>
    </DashboardLayout>
  )
}





