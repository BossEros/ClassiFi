import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  MoreVertical,
  Users,
  User,
  Archive,
  RefreshCw,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  ChevronDown,
  CheckCircle,
  XCircle,
  Plus,
  BookOpen,
} from "lucide-react"
import { DashboardLayout } from "@/presentation/components/dashboard/DashboardLayout"
import { AdminCreateClassModal } from "@/presentation/components/admin/AdminCreateClassModal"
import { AdminDeleteClassModal } from "@/presentation/components/admin/AdminDeleteClassModal"
import { getCurrentUser } from "@/business/services/authService"
import * as adminService from "@/business/services/adminService"
import type { AdminClass, AdminUser } from "@/business/services/adminService"
import type { User as AuthUser } from "@/business/models/auth/types"
import { useToast } from "@/shared/context/ToastContext"
import { useDebouncedValue } from "@/presentation/hooks/useDebouncedValue"
import { useDocumentClick } from "@/presentation/hooks/useDocumentClick"
import { useRequestState } from "@/presentation/hooks/useRequestState"

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
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showYearDropdown, setShowYearDropdown] = useState(false)
  const [showSemesterDropdown, setShowSemesterDropdown] = useState(false)
  const [showAcademicYearDropdown, setShowAcademicYearDropdown] =
    useState(false)
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
    setShowStatusDropdown(false)
    setShowYearDropdown(false)
    setShowSemesterDropdown(false)
    setShowAcademicYearDropdown(false)
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

  const handleDropdownClick = (e: React.MouseEvent, classId: number) => {
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

  const getStatusBadgeStyle = (isActive: boolean) => {
    return isActive
      ? "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
      : "bg-gray-500/10 text-gray-400 border-gray-500/20"
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

        {/* Filters Bar */}
        <div className="relative z-50 p-1 rounded-2xl bg-slate-900/50 backdrop-blur-md border border-white/5">
          <div className="flex flex-col md:flex-row gap-4 p-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search classes by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all"
              />
            </div>

            {/* Year Level Filter Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowYearDropdown(!showYearDropdown)
                  setShowStatusDropdown(false)
                  setShowSemesterDropdown(false)
                  setShowAcademicYearDropdown(false)
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white transition-all min-w-[140px] justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="capitalize">
                    {yearLevelFilter === "all"
                      ? "All Years"
                      : yearLevelFilter === 1
                        ? "1st Year"
                        : yearLevelFilter === 2
                          ? "2nd Year"
                          : yearLevelFilter === 3
                            ? "3rd Year"
                            : "4th Year"}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-500 transition-transform ${showYearDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showYearDropdown && (
                <div className="absolute top-full right-0 mt-1 min-w-[140px] w-full bg-[#0B1120] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5">
                  <div className="p-1.5 space-y-0.5">
                    {[
                      { value: "all", label: "All Years" },
                      { value: 1, label: "1st Year" },
                      { value: 2, label: "2nd Year" },
                      { value: 3, label: "3rd Year" },
                      { value: 4, label: "4th Year" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setYearLevelFilter(option.value as number | "all")
                          setPage(1)
                          setShowYearDropdown(false)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all border border-transparent ${
                          yearLevelFilter === option.value
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/10"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="capitalize font-medium">
                          {option.label}
                        </span>
                        {yearLevelFilter === option.value && (
                          <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Semester Filter Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSemesterDropdown(!showSemesterDropdown)
                  setShowStatusDropdown(false)
                  setShowYearDropdown(false)
                  setShowAcademicYearDropdown(false)
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white transition-all min-w-[150px] justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="capitalize">
                    {semesterFilter === "all"
                      ? "All Semesters"
                      : semesterFilter === 1
                        ? "1st Semester"
                        : "2nd Semester"}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-500 transition-transform ${showSemesterDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showSemesterDropdown && (
                <div className="absolute top-full right-0 mt-1 min-w-[150px] w-full bg-[#0B1120] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5">
                  <div className="p-1.5 space-y-0.5">
                    {[
                      { value: "all", label: "All Semesters" },
                      { value: 1, label: "1st Semester" },
                      { value: 2, label: "2nd Semester" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSemesterFilter(option.value as number | "all")
                          setPage(1)
                          setShowSemesterDropdown(false)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all border border-transparent ${
                          semesterFilter === option.value
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/10"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="capitalize font-medium">
                          {option.label}
                        </span>
                        {semesterFilter === option.value && (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Academic Year Filter Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAcademicYearDropdown(!showAcademicYearDropdown)
                  setShowStatusDropdown(false)
                  setShowYearDropdown(false)
                  setShowSemesterDropdown(false)
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white transition-all min-w-[150px] justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="capitalize">
                    {academicYearFilter === "all"
                      ? "All A.Y."
                      : `${academicYearFilter}`}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-500 transition-transform ${showAcademicYearDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showAcademicYearDropdown && (
                <div className="absolute top-full right-0 mt-1 min-w-[150px] w-full bg-[#0B1120] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5">
                  <div className="p-1.5 space-y-0.5">
                    {[
                      { value: "all", label: "All A.Y." },
                      // Dynamic Generation: Current year, plus 3 previous years
                      ...Array.from({ length: 4 }).map((_, i) => {
                        const currentYear = new Date().getFullYear()
                        // Adjust start year logic as needed. Assuming typical academic year starts in current year or previous year.
                        // Let's assume current Academic Year is roughly now.
                        // Actually, more robustly:
                        const startYear = currentYear - i
                        const endYear = startYear + 1
                        return {
                          value: `${startYear}-${endYear}`,
                          label: `${startYear}-${endYear}`,
                        }
                      }),
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setAcademicYearFilter(option.value)
                          setPage(1)
                          setShowAcademicYearDropdown(false)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all border border-transparent ${
                          academicYearFilter === option.value
                            ? "bg-orange-500/10 text-orange-400 border-orange-500/10"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="capitalize font-medium">
                          {option.label}
                        </span>
                        {academicYearFilter === option.value && (
                          <CheckCircle className="w-3.5 h-3.5 text-orange-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status Filter Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowStatusDropdown(!showStatusDropdown)
                  setShowYearDropdown(false)
                  setShowSemesterDropdown(false)
                  setShowAcademicYearDropdown(false)
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white transition-all min-w-[150px] justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-gray-400" />
                  <span className="capitalize">
                    {statusFilter === "all" ? "All Status" : statusFilter}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-500 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showStatusDropdown && (
                <div className="absolute top-full right-0 mt-1 min-w-[160px] w-full bg-[#0B1120] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5">
                  <div className="p-1.5 space-y-0.5">
                    {(["all", "active", "archived"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status)
                          setPage(1)
                          setShowStatusDropdown(false)
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all border border-transparent ${
                          statusFilter === status
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <span className="capitalize font-medium">
                          {status === "all" ? "All Status" : status}
                        </span>
                        {statusFilter === status && (
                          <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden">
          {/* Glowing effect */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[35%]">
                    Class Details
                  </th>
                  <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[20%]">
                    Teacher
                  </th>
                  <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[20%]">
                    Academic Info
                  </th>
                  <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[10%]">
                    Students
                  </th>
                  <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-[10%]">
                    Status
                  </th>
                  <th className="px-6 py-5 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right w-[5%]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  // Loading Skeletons
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-5">
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-white/5 rounded" />
                          <div className="h-3 w-48 bg-white/5 rounded" />
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-4 w-24 bg-white/5 rounded" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-4 w-32 bg-white/5 rounded" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-4 w-12 bg-white/5 rounded" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-6 w-16 bg-white/5 rounded-full" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-8 w-8 ml-auto bg-white/5 rounded" />
                      </td>
                    </tr>
                  ))
                ) : classes.length > 0 ? (
                  classes.map((cls) => (
                    <tr
                      key={cls.id}
                      onClick={() => navigate(`/dashboard/classes/${cls.id}`)}
                      className="group hover:bg-white/[0.02] transition-colors duration-200 cursor-pointer"
                    >
                      <td className="px-6 py-5">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                              {cls.className}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/5 text-gray-400 shrink-0">
                            <User className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-300 font-medium">
                              {cls.teacherName}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/10">
                              {cls.yearLevel}
                              {cls.yearLevel === 1
                                ? "st"
                                : cls.yearLevel === 2
                                  ? "nd"
                                  : cls.yearLevel === 3
                                    ? "rd"
                                    : "th"}{" "}
                              Year
                            </span>
                            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">
                              {cls.semester}
                              {cls.semester === 1 ? "st" : "nd"} Sem
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 pl-1">
                            A.Y. {cls.academicYear}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                          </div>
                          <span className="text-sm text-gray-300 font-medium">
                            {cls.studentCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeStyle(cls.isActive)}`}
                        >
                          {cls.isActive ? "Active" : "Archived"}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => handleDropdownClick(e, cls.id)}
                            disabled={actionLoading === cls.id}
                            className={`p-2 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors ${activeDropdown?.id === cls.id ? "bg-white/10 text-white ring-1 ring-white/10" : ""}`}
                          >
                            {actionLoading === cls.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <MoreVertical className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-full bg-white/5">
                          <Search className="w-8 h-8 opacity-40" />
                        </div>
                        <p className="text-lg font-medium text-gray-400">
                          No classes found
                        </p>
                        <p className="text-sm">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01]">
              <p className="text-sm text-gray-500">
                Page <span className="font-medium text-white">{page}</span> of{" "}
                <span className="font-medium text-white">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Floating Dropdown */}
        {activeDropdown &&
          (() => {
            const cls = classes.find((c) => c.id === activeDropdown.id)
            if (!cls) return null

            return (
              <div
                className="fixed w-56 bg-[#0B1120] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5"
                style={{
                  left: activeDropdown.x,
                  top: activeDropdown.y,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-1.5 space-y-1">
                  <button
                    onClick={() => {
                      handleEditClass(cls)
                      setActiveDropdown(null)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg transition-all"
                  >
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    Edit Class
                  </button>

                  {cls.isActive && (
                    <button
                      onClick={() => handleArchiveClass(cls.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg transition-all"
                    >
                      <Archive className="w-4 h-4 text-yellow-500" />
                      Archive Class
                    </button>
                  )}

                  <div className="h-[1px] bg-white/5 mx-2" />

                  <button
                    onClick={() => {
                      setDeletingClass(cls)
                      setActiveDropdown(null)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all group/delete"
                  >
                    <Trash2 className="w-4 h-4 group-hover/delete:animate-bounce" />
                    Delete Class
                  </button>
                </div>
              </div>
            )
          })()}

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
