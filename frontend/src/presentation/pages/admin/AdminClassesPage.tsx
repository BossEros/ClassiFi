import { useEffect, useState, useCallback, type MouseEvent as ReactMouseEvent } from "react"
import { useNavigate } from "react-router-dom"
import { RefreshCw, XCircle, Plus } from "lucide-react"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import { AdminDeleteClassModal } from "@/presentation/components/admin/AdminDeleteClassModal"
import { AdminClassesFilters } from "@/presentation/components/admin/AdminClassesFilters"
import { AdminClassesTable } from "@/presentation/components/admin/AdminClassesTable"
import { useAuthStore } from "@/shared/store/useAuthStore"
import * as adminService from "@/business/services/adminService"
import type { AdminClass } from "@/business/services/adminService"
import { useToastStore } from "@/shared/store/useToastStore"
import { useDebouncedValue } from "@/presentation/hooks/shared/useDebouncedValue"
import { useDocumentClick } from "@/presentation/hooks/shared/useDocumentClick"
import { useRequestState } from "@/presentation/hooks/shared/useRequestState"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"

export function AdminClassesPage() {
  const navigate = useNavigate()
  const showToast = useToastStore((state) => state.showToast)
  const currentUser = useAuthStore((state) => state.user)
  const [classes, setClasses] = useState<AdminClass[]>([])
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

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }
    if (currentUser.role !== "admin") {
      navigate("/dashboard")
      return
    }
  }, [currentUser, navigate])

  useEffect(() => {
    if (currentUser?.role === "admin") {
      fetchClasses()
    }
  }, [currentUser, fetchClasses])

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const clickTarget = event.target as HTMLElement | null

    if (
      clickTarget?.closest("[data-admin-class-dropdown-trigger]") ||
      clickTarget?.closest("[data-admin-class-dropdown-menu]")
    ) {
      return
    }

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

  const handleRestoreClass = async (classId: number) => {
    try {
      setActionLoading(classId)
      await adminService.restoreClass(classId)
      await fetchClasses()
      showToast("Class restored successfully", "success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore class")
      showToast("Failed to restore class", "error")
    } finally {
      setActionLoading(null)
      setActiveDropdown(null)
    }
  }

  const handleEditClass = (selectedClass: AdminClass) => {
    navigate(`/dashboard/admin/classes/${selectedClass.id}/edit`)
  }

  const handleDropdownClick = (e: ReactMouseEvent, classId: number) => {
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

  const userInitials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user: currentUser, userInitials })

  return (
    <DashboardLayout topBar={topBar}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Class Management
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              Manage all classes, reassign teachers, and archive or restore
              classes.{" "}
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
              onClick={() => navigate("/dashboard/admin/classes/new")}
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
          onRestoreClass={handleRestoreClass}
          onRequestDeleteClass={setDeletingClass}
          onCloseDropdown={() => setActiveDropdown(null)}
        />
        {/* Modals */}
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
