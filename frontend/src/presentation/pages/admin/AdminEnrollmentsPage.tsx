import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { GraduationCap, RefreshCw, UserPlus, XCircle } from "lucide-react"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import { useDebouncedValue } from "@/presentation/hooks/shared/useDebouncedValue"
import { useRequestState } from "@/presentation/hooks/shared/useRequestState"
import {
  AdminEnrollmentFilters,
  type EnrollmentStatusFilter,
} from "@/presentation/components/admin/AdminEnrollmentFilters"
import { AdminEnrollmentTable } from "@/presentation/components/admin/AdminEnrollmentTable"
import {
  AdminEnrollStudentModal,
  AdminRemoveEnrollmentModal,
  AdminTransferEnrollmentModal,
} from "@/presentation/components/admin/AdminEnrollmentModals"
import * as adminService from "@/business/services/adminService"
import type { AdminEnrollmentRecord } from "@/business/services/adminService"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { useToastStore } from "@/shared/store/useToastStore"

const ENROLLMENT_PAGE_LIMIT = 10

export default function AdminEnrollmentsPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.user)
  const showToast = useToastStore((state) => state.showToast)
  const [enrollments, setEnrollments] = useState<AdminEnrollmentRecord[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<EnrollmentStatusFilter>("all")
  const [semesterFilter, setSemesterFilter] = useState<number | "all">("all")
  const [academicYearFilter, setAcademicYearFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalEnrollments, setTotalEnrollments] = useState(0)
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
  const [transferEnrollment, setTransferEnrollment] = useState<AdminEnrollmentRecord | null>(null)
  const [removeEnrollment, setRemoveEnrollment] = useState<AdminEnrollmentRecord | null>(null)
  const [isEnrollmentActionSubmitting, setIsEnrollmentActionSubmitting] = useState(false)
  const { isLoading, error, setError, executeRequest } = useRequestState(true)

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }

    if (currentUser.role !== "admin") {
      navigate("/dashboard")
    }
  }, [currentUser, navigate])

  useEffect(() => {
    setPage(1)
  }, [
    academicYearFilter,
    debouncedSearchQuery,
    semesterFilter,
    statusFilter,
  ])

  const fetchEnrollments = useCallback(async () => {
    await executeRequest({
      requestFn: () =>
        adminService.getAllEnrollments({
          page,
          limit: ENROLLMENT_PAGE_LIMIT,
          search: debouncedSearchQuery || undefined,
          status: statusFilter,
          semester: semesterFilter === "all" ? undefined : semesterFilter,
          academicYear:
            academicYearFilter === "all" ? undefined : academicYearFilter,
        }),
      onSuccess: (response) => {
        setEnrollments(response.data)
        setTotalPages(response.totalPages)
        setTotalEnrollments(response.total)
      },
      fallbackErrorMessage: "Failed to load enrollment records",
    })
  }, [
    academicYearFilter,
    debouncedSearchQuery,
    executeRequest,
    page,
    semesterFilter,
    statusFilter,
  ])

  useEffect(() => {
    if (currentUser?.role === "admin") {
      void fetchEnrollments()
    }
  }, [currentUser, fetchEnrollments])

  const userInitials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user: currentUser, userInitials })

  const handleManualEnrollment = async (selection: {
    studentId: number
    classId: number
  }) => {
    try {
      setIsEnrollmentActionSubmitting(true)
      await adminService.addStudentToClass(selection.classId, selection.studentId)
      await fetchEnrollments()
      setIsEnrollModalOpen(false)
      showToast("Student enrolled successfully", "success")
    } catch (submissionError) {
      const errorMessage =
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to enroll student"
      setError(errorMessage)
      showToast(errorMessage, "error")
    } finally {
      setIsEnrollmentActionSubmitting(false)
    }
  }

  const handleTransferEnrollment = async (selection: { toClassId: number }) => {
    if (!transferEnrollment) return

    try {
      setIsEnrollmentActionSubmitting(true)
      await adminService.transferStudent({
        studentId: transferEnrollment.studentId,
        fromClassId: transferEnrollment.classId,
        toClassId: selection.toClassId,
      })
      await fetchEnrollments()
      setTransferEnrollment(null)
      showToast("Student transferred successfully", "success")
    } catch (submissionError) {
      const errorMessage =
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to transfer student"
      setError(errorMessage)
      showToast(errorMessage, "error")
    } finally {
      setIsEnrollmentActionSubmitting(false)
    }
  }

  const handleRemoveEnrollment = async () => {
    if (!removeEnrollment) return

    try {
      setIsEnrollmentActionSubmitting(true)
      await adminService.removeStudentFromClass(
        removeEnrollment.classId,
        removeEnrollment.studentId,
      )
      await fetchEnrollments()
      setRemoveEnrollment(null)
      showToast("Student removed from class", "success")
    } catch (submissionError) {
      const errorMessage =
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to remove student"
      setError(errorMessage)
      showToast(errorMessage, "error")
    } finally {
      setIsEnrollmentActionSubmitting(false)
    }
  }

  return (
    <DashboardLayout topBar={topBar}>
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 shadow-sm shadow-sky-100/70">
              <GraduationCap className="h-7 w-7 text-sky-600" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Enrollment Management
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Review enrollment activity across classes and handle routine adds, transfers, and removals in one place.
                <span className="text-slate-400"> ({totalEnrollments} records)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void fetchEnrollments()}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setIsEnrollModalOpen(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:bg-teal-700"
            >
              <UserPlus className="h-4 w-4" />
              Enroll Student
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <XCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <AdminEnrollmentFilters
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          semesterFilter={semesterFilter}
          academicYearFilter={academicYearFilter}
          onSearchQueryChange={setSearchQuery}
          onStatusFilterChange={setStatusFilter}
          onSemesterFilterChange={setSemesterFilter}
          onAcademicYearFilterChange={setAcademicYearFilter}
        />

        <AdminEnrollmentTable
          enrollments={enrollments}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          totalEnrollments={totalEnrollments}
          onPreviousPage={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
          onNextPage={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
          onOpenTransferModal={setTransferEnrollment}
          onOpenRemoveModal={setRemoveEnrollment}
          onOpenClassDetail={(classId) => navigate(`/dashboard/classes/${classId}`)}
        />
      </div>

      <AdminEnrollStudentModal
        isOpen={isEnrollModalOpen}
        isSubmitting={isEnrollmentActionSubmitting}
        onClose={() => setIsEnrollModalOpen(false)}
        onConfirm={handleManualEnrollment}
      />

      <AdminTransferEnrollmentModal
        enrollment={transferEnrollment}
        isSubmitting={isEnrollmentActionSubmitting}
        onClose={() => setTransferEnrollment(null)}
        onConfirm={handleTransferEnrollment}
      />

      <AdminRemoveEnrollmentModal
        enrollment={removeEnrollment}
        isSubmitting={isEnrollmentActionSubmitting}
        onClose={() => setRemoveEnrollment(null)}
        onConfirm={handleRemoveEnrollment}
      />
    </DashboardLayout>
  )
}
