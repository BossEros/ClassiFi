import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout";
import { GradebookContent } from "@/presentation/components/teacher/gradebook/GradebookContent";
import { StudentClassGradesContent } from "@/presentation/components/student/grades/StudentClassGradesContent";
import { BackButton } from "@/presentation/components/ui/BackButton";
import { ClassHeader } from "@/presentation/components/shared/dashboard/ClassHeader";
import { ClassTabs } from "@/presentation/components/shared/dashboard/ClassTabs";
import { ClassCalendarTab } from "@/presentation/components/shared/calendar";
import { AssignmentsTabContent } from "@/presentation/components/teacher/classDetail/AssignmentsTabContent";
import { StudentsTabContent } from "@/presentation/components/teacher/classDetail/StudentsTabContent";
import { useAuthStore } from "@/shared/store/useAuthStore";
import type { ClassTab } from "@/data/api/class.types";
import { getClassDetailData, deleteClass } from "@/business/services/classService";
import { useToastStore } from "@/shared/store/useToastStore";
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar";
import type { User } from "@/data/api/auth.types";
import type { Class, Assignment, EnrolledStudent } from "@/data/api/class.types";
import type { Module } from "@/data/api/class.types";
import type { AssignmentFilter, TeacherAssignmentFilter } from "@/shared/utils/assignmentFilters";
import { filterAssignments, calculateFilterCounts, filterTeacherAssignmentsByTimeline, calculateTeacherFilterCounts, groupAssignments } from "@/shared/utils/assignmentFilters";
import { filterStudentsByQuery } from "@/presentation/pages/teacher/classDetail.helpers";
import { getModulesByClassId, createModule, renameModule, toggleModulePublish, deleteModule } from "@/business/services/moduleService";
import { mergeModuleAssignmentsWithLatestAssignmentState } from "@/presentation/utils/mergeModuleAssignments";
import { X, LogOut, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/presentation/components/ui/Button";
import { leaveClass } from "@/business/services/studentDashboardService";
import * as React from "react";
import { cn } from "@/shared/utils/cn";
import { Trash2 } from "lucide-react";
import { removeStudent } from "@/business/services/classService";

// Inlined from src/presentation/components/teacher/forms/class/DeleteClassModal.tsx
interface DeleteClassModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  className?: string
  isDeleting?: boolean
}

function DeleteClassModal({
  isOpen,
  onClose,
  onConfirm,
  className,
  isDeleting = false,
}: DeleteClassModalProps) {
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
          "relative w-full max-w-[448px] mx-auto p-6 flex-shrink-0",
          "rounded-xl border border-slate-200 bg-white",
          "shadow-xl shadow-black/20",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className={cn(
            "absolute top-4 right-4 cursor-pointer rounded-lg p-1",
            "text-slate-400 hover:text-slate-900 hover:bg-slate-100",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning icon */}
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
        </div>

        {/* Title */}
        <h2
          id="delete-modal-title"
          className="text-xl font-semibold text-slate-900 text-center mb-2"
        >
          Delete Class
        </h2>

        {/* Description */}
        <p className="text-slate-500 text-center mb-6">
          Are you sure you want to delete this class? This action cannot be
          undone. All assignments and student enrollments will be removed.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
              "border border-slate-300 bg-white text-slate-700",
              "hover:bg-slate-50 transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
              "bg-red-500 text-white",
              "hover:bg-red-600 transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {isDeleting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {isDeleting ? "Deleting..." : "Delete Class"}
          </button>
        </div>
      </div>
    </div>
  )
}

// Inlined from src/presentation/components/teacher/forms/class/RemoveStudentModal.tsx
interface RemoveStudentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  classId: number
  teacherId: number
  studentId: number
  studentName: string
}



function RemoveStudentModal({
  isOpen,
  onClose,
  onSuccess,
  classId,
  teacherId,
  studentId,
  studentName,
}: RemoveStudentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      await removeStudent(classId, studentId, teacherId)
      onSuccess()
      onClose()
    } catch {
      setError("Failed to remove student. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] grid place-items-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 mx-auto w-full max-w-[448px] flex-shrink-0 rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-rose-50 p-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Remove Student</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {/* Warning Message */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-slate-700">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-slate-900">{studentName}</span>{" "}
              from this class?
            </p>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-amber-500">•</span>
                <span>
                  The student will lose access to all class assignments
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-amber-500">•</span>
                <span>
                  Their submissions will be preserved but they cannot submit new
                  work
                </span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Remove Student
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Inlined from src/presentation/components/shared/forms/LeaveClassModal.tsx
interface LeaveClassModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  studentId: number
  classId: number
  className: string
}



function LeaveClassModal({
  isOpen,
  onClose,
  onSuccess,
  studentId,
  classId,
  className,
}: LeaveClassModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await leaveClass(studentId, classId)

      if (!response.success) {
        setError(response.message || "Failed to leave class")
        return
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError("Failed to leave class. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-[448px] flex-shrink-0 rounded-2xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-rose-50 p-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Leave Class</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 w-full">
          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {/* Warning Message */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-700">
              Are you sure you want to leave{" "}
              <span className="font-semibold text-slate-900">{className}</span>?
            </p>
            <ul className="mt-3 space-y-2 text-xs text-slate-500">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-amber-500">•</span>
                <span>
                  You will lose access to all class assignments and materials
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-amber-500">•</span>
                <span>
                  Your submissions will still be visible to your teacher
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-amber-500">•</span>
                <span>You will need a new class code to rejoin later</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              Leave Class
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const STUDENTS_PER_PAGE = 10
const STUDENT_GRID_TEMPLATE = "400px 1fr 150px 60px"

/**
 * Displays detailed information about a class including assignments, students, and management options.
 *
 * @returns JSX.Element - The class detail page component with tabs for assignments and students
 */
export function ClassDetailPage() {
  const navigate = useNavigate()
  const { classId } = useParams<{ classId: string }>()
  const parsedClassId = classId ? parseInt(classId, 10) : 0
  const currentUser = useAuthStore((state) => state.user)
  const showToast = useToastStore((state) => state.showToast)

  const [user, setUser] = useState<User | null>(null)
  const [classInfo, setClassInfo] = useState<Class | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [students, setStudents] = useState<EnrolledStudent[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ClassTab>("assignments")
  const [assignmentFilter, setAssignmentFilter] =
    useState<AssignmentFilter>("all")
  const [teacherAssignmentFilter, setTeacherAssignmentFilter] =
    useState<TeacherAssignmentFilter>("all")
  const [currentStudentPage, setCurrentStudentPage] = useState(1)
  const [studentSearchQuery, setStudentSearchQuery] = useState("")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)

  // Student management state
  const [isRemoveStudentModalOpen, setIsRemoveStudentModalOpen] =
    useState(false)
  const [studentToRemove, setStudentToRemove] =
    useState<EnrolledStudent | null>(null)

  // Check if user is a teacher or student
  const isTeacher = user?.role === "teacher" || user?.role === "admin"
  const isStudent = user?.role === "student"
  const isLightClassView = true

  // Derived state for filtered and grouped assignments
  const filteredAssignments = useMemo(
    () => filterAssignments(assignments, assignmentFilter),
    [assignments, assignmentFilter],
  )

  const groupedAssignments = useMemo(
    () =>
      isTeacher
        ? filterTeacherAssignmentsByTimeline(
            assignments,
            teacherAssignmentFilter,
          )
        : groupAssignments(filteredAssignments),
    [isTeacher, assignments, teacherAssignmentFilter, filteredAssignments],
  )

  const modulesWithLatestAssignmentState = useMemo(
    () =>
      mergeModuleAssignmentsWithLatestAssignmentState(modules, assignments),
    [modules, assignments],
  )

  const filterCounts = useMemo(
    () => calculateFilterCounts(assignments),
    [assignments],
  )

  const teacherFilterCounts = useMemo(
    () => calculateTeacherFilterCounts(assignments),
    [assignments],
  )

  // Pagination calculations for students
  const filteredStudents = useMemo(
    () => filterStudentsByQuery(students, studentSearchQuery),
    [students, studentSearchQuery],
  )

  const totalStudentPages = useMemo(
    () => Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE),
    [filteredStudents.length],
  )

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentStudentPage - 1) * STUDENTS_PER_PAGE
    const endIndex = startIndex + STUDENTS_PER_PAGE
    return filteredStudents.slice(startIndex, endIndex)
  }, [filteredStudents, currentStudentPage])

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }

    setUser(currentUser)

    // Fetch class data
    const fetchClassData = async () => {
      if (!classId) {
        setError("Class not found")
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Only pass teacherId if user is actually a teacher
        const isTeacher =
          currentUser.role === "teacher" || currentUser.role === "admin"
        const isStudent = currentUser.role === "student"
        const data = await getClassDetailData(
          parseInt(classId),
          isTeacher ? parseInt(currentUser.id) : undefined,
          isStudent ? parseInt(currentUser.id) : undefined,
        )

        setClassInfo(data.classInfo)
        setAssignments(data.assignments)
        setStudents(data.students)

        // Fetch modules for this class
        try {
          const fetchedModules = await getModulesByClassId(parseInt(classId))
          setModules(fetchedModules)
        } catch (moduleError) {
          setModules([])
        }
      } catch (err) {
        setError("Failed to load class. Please try refreshing the page.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchClassData()
  }, [navigate, classId, currentUser])

  const handleRemoveStudentClick = (student: EnrolledStudent) => {
    setStudentToRemove(student)
    setIsRemoveStudentModalOpen(true)
  }

  const handleRemoveStudentSuccess = () => {
    if (studentToRemove) {
      const updatedStudents = students.filter(
        (s) => s.id !== studentToRemove.id,
      )
      setStudents(updatedStudents)
      const filteredUpdatedStudents = filterStudentsByQuery(
        updatedStudents,
        studentSearchQuery,
      )

      // If current page becomes empty, go to previous page
      const newTotalPages = Math.ceil(
        filteredUpdatedStudents.length / STUDENTS_PER_PAGE,
      )
      if (currentStudentPage > newTotalPages && newTotalPages > 0) {
        setCurrentStudentPage(newTotalPages)
      }

      showToast("Student removed successfully")
      setStudentToRemove(null)
    }
  }

  const handleStudentPageChange = (page: number) => {
    setCurrentStudentPage(page)
  }

  const handleTabChange = (tab: ClassTab) => {
    setActiveTab(tab)
    // Reset to page 1 when switching to students tab
    if (tab === "students") {
      setCurrentStudentPage(1)
    }
  }

  const handleDeleteClass = async () => {
    if (!user || !classId) return

    try {
      setIsDeleting(true)
      await deleteClass(parseInt(classId), parseInt(user.id))
      navigate("/dashboard/classes", { state: { deleted: true } })
    } catch (err) {
      setError("Failed to delete class. Please try again.")
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
    }
  }

  const handleCreateModule = async (name: string) => {
    if (!user || !classId) return

    try {
      const newModule = await createModule(parseInt(classId), name)
      setModules((previous) => [...previous, newModule])
      showToast("Module created successfully")
    } catch (err) {
      showToast("Failed to create module. Please try again.")
    }
  }

  const handleRenameModule = async (moduleId: number, name: string) => {
    if (!user) return

    try {
      await renameModule(moduleId, name)
      setModules((previous) =>
        previous.map((m) => (m.id === moduleId ? { ...m, name } : m)),
      )
      showToast("Module renamed successfully")
    } catch (err) {
      showToast("Failed to rename module. Please try again.")
    }
  }

  const handleDeleteModule = async (moduleId: number) => {
    if (!user) return

    try {
      const deletedModule = modules.find((m) => m.id === moduleId)
      const deletedAssignmentIds = new Set(deletedModule?.assignments.map((a) => a.id) ?? [])
      await deleteModule(moduleId)
      setModules((previous) => previous.filter((m) => m.id !== moduleId))
      setAssignments((previous) => previous.filter((a) => !deletedAssignmentIds.has(a.id)))
      showToast("Module deleted successfully")
    } catch (err) {
      showToast("Failed to delete module. Please try again.")
    }
  }

  const handleToggleModulePublish = async (moduleId: number, isPublished: boolean) => {
    if (!user) return

    try {
      await toggleModulePublish(moduleId, isPublished)
      setModules((previous) =>
        previous.map((m) => (m.id === moduleId ? { ...m, isPublished } : m)),
      )
      showToast(isPublished ? "Module published" : "Module unpublished")
    } catch {
      showToast("Failed to update module. Please try again.")
    }
  }

  const handleAssignmentClick = (assignmentId: number) => {
    // Teachers see submissions page, students see assignment detail page
    if (isTeacher) {
      navigate(`/dashboard/assignments/${assignmentId}/submissions`)
    } else {
      navigate(`/dashboard/assignments/${assignmentId}`)
    }
  }

  const handleLeaveSuccess = () => {
    showToast("You have left the class")
    navigate("/dashboard")
  }

  const handleEditClass = () => {
    navigate(`/dashboard/classes/${classId}/edit`)
  }

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({
    user,
    userInitials,
    breadcrumbItems: [
      { label: "Classes", to: "/dashboard/classes" },
      {
        label: classInfo?.className || "Class Overview",
        to: classInfo ? `/dashboard/classes/${classInfo.id}` : undefined,
      },
    ],
  })

  return (
    <DashboardLayout topBar={topBar}>
      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div
              className={`mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 ${isLightClassView ? "border-slate-200 border-t-teal-500" : "border-white/30 border-t-white"}`}
            ></div>
            <p className={isLightClassView ? "text-slate-500" : "text-gray-400"}>Loading class...</p>
          </div>
        </div>
      ) : error && !classInfo ? (
        /* Error State */
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <div
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isLightClassView ? "border border-rose-200 bg-rose-50" : "bg-red-500/20"}`}
            >
              <ClipboardList className={`w-8 h-8 ${isLightClassView ? "text-rose-500" : "text-red-400"}`} />
            </div>
            <p className={`mb-2 font-medium ${isLightClassView ? "text-slate-900" : "text-gray-300"}`}>
              Error Loading Class
            </p>
            <p className={`mb-4 text-sm ${isLightClassView ? "text-slate-500" : "text-gray-500"}`}>{error}</p>
            <BackButton
              to={isStudent ? "/dashboard" : "/dashboard/classes"}
              label={`Back to ${isStudent ? "Dashboard" : "Classes"}`}
              className={isLightClassView ? "mx-auto -ml-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900" : "mx-auto"}
            />
          </div>
        </div>
      ) : (
        /* Main Content */
        <>
          {/* Class Header */}
          <ClassHeader
            className="mb-8"
            classNameTitle={classInfo?.className || ""}
            instructorName={classInfo?.teacherName || "Unknown"}
            classCode={classInfo?.classCode}
            description={classInfo?.description || undefined}
            semester={classInfo?.semester}
            academicYear={classInfo?.academicYear}
            schedule={{
              days: classInfo?.schedule?.days || [],
              startTime: classInfo?.schedule?.startTime || "",
              endTime: classInfo?.schedule?.endTime || "",
            }}
            studentCount={classInfo?.studentCount || 0}
            isTeacher={isTeacher}
            variant={isLightClassView ? "light" : "dark"}
            onEditClass={handleEditClass}
            onDeleteClass={() => setIsDeleteModalOpen(true)}
            onLeaveClass={() => setIsLeaveModalOpen(true)}
          />

          {/* Error Message */}
          {error && (
            <div
              className={`mb-6 rounded-lg border p-4 ${isLightClassView ? "border-rose-200 bg-rose-50" : "border-red-500/20 bg-red-500/10"}`}
            >
              <p className={`text-sm ${isLightClassView ? "text-rose-700" : "text-red-400"}`}>{error}</p>
            </div>
          )}

          {/* Tabs and Content */}
          <ClassTabs
            activeTab={activeTab}
            onTabChange={handleTabChange}
            variant={isLightClassView ? "light" : "dark"}
            showIcons={!isLightClassView}
          >
            {/* Assignments Tab */}
            {activeTab === "assignments" && (
              <AssignmentsTabContent
                assignments={assignments}
                groupedAssignments={groupedAssignments}
                assignmentFilter={assignmentFilter}
                filterCounts={filterCounts}
                teacherAssignmentFilter={teacherAssignmentFilter}
                teacherFilterCounts={teacherFilterCounts}
                isTeacher={isTeacher}
                onFilterChange={setAssignmentFilter}
                onTeacherFilterChange={setTeacherAssignmentFilter}
                onCreateAssignment={(moduleId?: number) => {
                  const baseUrl = `/dashboard/classes/${classId}/assignments/new`
                  navigate(moduleId ? `${baseUrl}?moduleId=${moduleId}` : baseUrl)
                }}
                onAssignmentClick={handleAssignmentClick}
                modules={modulesWithLatestAssignmentState}
                onCreateModule={handleCreateModule}
                onRenameModule={handleRenameModule}
                onDeleteModule={handleDeleteModule}
                onToggleModulePublish={handleToggleModulePublish}
                variant={isLightClassView ? "light" : "dark"}
              />
            )}

            {/* Students Tab */}
            {activeTab === "students" && (
              <StudentsTabContent
                students={students}
                filteredStudents={filteredStudents}
                paginatedStudents={paginatedStudents}
                isTeacher={isTeacher}
                classCode={classInfo?.classCode}
                studentSearchQuery={studentSearchQuery}
                currentStudentPage={currentStudentPage}
                totalStudentPages={totalStudentPages}
                studentGridTemplate={STUDENT_GRID_TEMPLATE}
                onStudentSearchQueryChange={(value) => {
                  setStudentSearchQuery(value)
                  setCurrentStudentPage(1)
                }}
                onRemoveStudent={handleRemoveStudentClick}
                onStudentPageChange={handleStudentPageChange}
                variant={isLightClassView ? "light" : "dark"}
              />
            )}

            {/* Calendar Tab */}
            {activeTab === "calendar" && classInfo && (
              <ClassCalendarTab
                classId={classInfo.id}
                className={classInfo.className}
              />
            )}

            {activeTab === "grades" &&
              (isTeacher ? (
                <GradebookContent
                  classId={parsedClassId}
                  classCode={classInfo?.classCode}
                  className={classInfo?.className}
                  teacherName={classInfo?.teacherName}
                  variant={isLightClassView ? "light" : "dark"}
                />
              ) : (
                <StudentClassGradesContent
                  classId={parsedClassId}
                  studentId={user ? parseInt(user.id, 10) : 0}
                  studentName={user ? `${user.firstName} ${user.lastName}` : undefined}
                  variant={isLightClassView ? "light" : "dark"}
                />
              ))}
          </ClassTabs>

          {/* Teacher Modals */}
          {isTeacher && (
            <>
              {/* Delete Class Modal */}
              <DeleteClassModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteClass}
                isDeleting={isDeleting}
              />

              {/* Remove Student Modal */}
              {studentToRemove && classId && (
                <RemoveStudentModal
                  isOpen={isRemoveStudentModalOpen}
                  onClose={() => {
                    setIsRemoveStudentModalOpen(false)
                    setStudentToRemove(null)
                  }}
                  onSuccess={handleRemoveStudentSuccess}
                  classId={parseInt(classId)}
                  teacherId={parseInt(user.id)}
                  studentId={studentToRemove.id}
                  studentName={
                    [studentToRemove.firstName, studentToRemove.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                    studentToRemove.fullName ||
                    ""
                  }
                />
              )}
            </>
          )}

          {/* Student Modals */}
          {isStudent && classInfo && (
            <LeaveClassModal
              isOpen={isLeaveModalOpen}
              onClose={() => setIsLeaveModalOpen(false)}
              onSuccess={handleLeaveSuccess}
              studentId={parseInt(user.id)}
              classId={parseInt(classId!)}
              className={classInfo.className}
            />
          )}
        </>
      )}
    </DashboardLayout>
  )
}

