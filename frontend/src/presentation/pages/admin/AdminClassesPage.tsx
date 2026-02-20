import { useEffect, useState, useCallback, type MouseEvent } from "react"
import { useNavigate } from "react-router-dom"
import {
  RefreshCw,
  XCircle,
  Plus,
} from "lucide-react"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import { AdminCreateClassModal } from "@/presentation/components/admin/AdminCreateClassModal"
import { AdminDeleteClassModal } from "@/presentation/components/admin/AdminDeleteClassModal"
import { AdminClassesFilters } from "@/presentation/components/admin/AdminClassesFilters"
import { AdminClassesTable } from "@/presentation/components/admin/AdminClassesTable"
import { getCurrentUser } from "@/business/services/authService"
import * as adminService from "@/business/services/adminService"
import type { AdminClass, AdminUser } from "@/business/services/adminService"
import type { User as AuthUser } from "@/business/models/auth/types"
import { useToast } from "@/presentation/context/ToastContext"
import { useDebouncedValue } from "@/presentation/hooks/shared/useDebouncedValue"
import { useDocumentClick } from "@/presentation/hooks/shared/useDocumentClick"
import { useRequestState } from "@/presentation/hooks/shared/useRequestState"

export function AdminClassesPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [classes, setClasses] = useState<AdminClass[]>([])
  const [teachers, setTeachers] = useState<AdminUser[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "archived"
  >("all")
  const [yearLevelFilter, setYearLevelFilter] = useState<number | "all">("all")
  const [semesterFilter, setSemesterFilter] = useState<number | "all">("all")
  const [academicYearFilter, setAcademicYearFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [activeDropdown, setActiveDropdown] = useState<{
    id: number
    x: number
    y: number
  } | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [deletingClass, setDeletingClass] = useState<AdminClass | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [classToEdit, setClassToEdit] = useState<AdminClass | null>(null)
  const { isLoading, error, setError, executeRequest } = useRequestState(true)

  const limit = 20

  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  // Fetch classes
  const fetchClasses = useCallback(async () => {
    await executeRequest({
      requestFn: () =>
        adminService.getAllClasses({
          page,
          limit,
          search: debouncedSearch || undefined,
          status: statusFilter,
          yearLevel: yearLevelFilter === "all" ? undefined : yearLevelFilter,
          semester: semesterFilter === "all" ? undefined : semesterFilter,
          academicYear:
            academicYearFilter === "all" ? undefined : academicYearFilter,
        }),
      onSuccess: (response) => {
        setClasses(response.data)
        setTotalPages(response.totalPages)
        setTotal(response.total)
      },
      fallbackErrorMessage: "Failed to load classes",
    })
  }, [
    page,
    limit,
    debouncedSearch,
    statusFilter,
    yearLevelFilter,
    semesterFilter,
    academicYearFilter,
    executeRequest,
  ])

  // Fetch teachers
  const fetchTeachers = useCallback(async () => {
    try {
      const response = await adminService.getAllTeachers()
      setTeachers(response)
    } catch (err) {
      console.error("Failed to load teachers:", err)
    }
  }, [])

  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      navigate("/login")
      return
    }
    if (user.role !== "admin") {
      navigate("/dashboard")
      return
    }
    setCurrentUser(user)
    fetchTeachers()
  }, [navigate, fetchTeachers])

  useEffect(() => {
    if (currentUser) {
      fetchClasses()
    }
  }, [currentUser, fetchClasses])

  const handleClickOutside = useCallback(() => {
    setActiveDropdown(null)
  }, [])

  useDocumentClick(handleClickOutside)

  const handleArchiveClass = async (classId: number) => {
    try {
      setActionLoading(classId)
      await adminService.archiveClass(classId)
      await fetchClasses()
      showToast("Class archived successfully", "success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive class")
      showToast("Failed to archive class", "error")
    } finally {
      setActionLoading(null)
      setActiveDropdown(null)
    }
  }

  const handleEditClass = (cls: AdminClass) => {
    setClassToEdit(cls)
    setShowCreateModal(true)
  }

  const handleDropdownClick = (e: MouseEvent, classId: number) => {
    e.stopPropagation()
    if (activeDropdown?.id === classId) {
      setActiveDropdown(null)
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    setActiveDropdown({
      id: classId,
      x: rect.left - 224 + rect.width, // Position to the left of the button (w-56 = 224px)
      y: rect.bottom + 8, // Slight gap below button
    })
  }

  const handleDeleteClass = async () => {
    if (!deletingClass) return

    try {
      setActionLoading(deletingClass.id)
      await adminService.deleteClass(deletingClass.id)
      await fetchClasses()
      showToast("Class deleted successfully", "success")
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete class"
      showToast(`Failed to delete class: ${errorMessage}`, "error")
    } finally {
      setActionLoading(null)
      setActiveDropdown(null)
      setDeletingClass(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Class Management
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              Manage all classes, reassign teachers, and archive classes.{" "}
              <span className="text-gray-500">({total} classes)</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchClasses}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 border border-blue-500/40 transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Class</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <AdminClassesFilters
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          yearLevelFilter={yearLevelFilter}
          semesterFilter={semesterFilter}
          academicYearFilter={academicYearFilter}
          onSearchQueryChange={setSearchQuery}
          onStatusFilterChange={(status) => {
            setStatusFilter(status)
            setPage(1)
          }}
          onYearLevelFilterChange={(yearLevel) => {
            setYearLevelFilter(yearLevel)
            setPage(1)
          }}
          onSemesterFilterChange={(semester) => {
            setSemesterFilter(semester)
            setPage(1)
          }}
          onAcademicYearFilterChange={(academicYear) => {
            setAcademicYearFilter(academicYear)
            setPage(1)
          }}
        />

        <AdminClassesTable
          classes={classes}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          activeDropdown={activeDropdown}
          actionLoading={actionLoading}
          onRowClick={(classId) => navigate(`/dashboard/classes/${classId}`)}
          onDropdownClick={handleDropdownClick}
          onPreviousPage={() => setPage((prev) => Math.max(1, prev - 1))}
          onNextPage={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          onEditClass={handleEditClass}
          onArchiveClass={handleArchiveClass}
          onRequestDeleteClass={setDeletingClass}
          onCloseDropdown={() => setActiveDropdown(null)}
        />
        {/* Modals */}

        <AdminCreateClassModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setClassToEdit(null)
          }}
          onSuccess={() => {
            fetchClasses()
            showToast(
              classToEdit
                ? "Class updated successfully"
                : "Class created successfully",
              "success",
            )
          }}
          teachers={teachers}
          classToEdit={classToEdit}
        />

        <AdminDeleteClassModal
          isOpen={!!deletingClass}
          onClose={() => setDeletingClass(null)}
          onConfirm={handleDeleteClass}
          classData={deletingClass}
        />
      </div>
    </DashboardLayout>
  )
}


