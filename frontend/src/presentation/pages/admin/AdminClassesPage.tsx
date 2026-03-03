import { useEffect, useState, useCallback, type MouseEvent as ReactMouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, XCircle, Plus } from "lucide-react";
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout";
import { useAuthStore } from "@/shared/store/useAuthStore";
import * as adminService from "@/business/services/adminService";
import type { AdminClass } from "@/business/services/adminService";
import { useToastStore } from "@/shared/store/useToastStore";
import { useDebouncedValue } from "@/presentation/hooks/shared/useDebouncedValue";
import { useDocumentClick } from "@/presentation/hooks/shared/useDocumentClick";
import { useRequestState } from "@/presentation/hooks/shared/useRequestState";
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar";
import { useMemo } from "react";
import { CheckCircle, ChevronDown, Filter, Search } from "lucide-react";
import { Archive, BookOpen, ChevronLeft, ChevronRight, Loader2, MoreVertical, RotateCcw, Trash2, User, Users } from "lucide-react";
import { createPortal } from "react-dom";
import * as React from "react";
import { cn } from "@/shared/utils/cn";
import { AlertTriangle, X, AlertCircle } from "lucide-react";

// Inlined from src/presentation/components/admin/AdminClassesFilters.tsx
type StatusFilter = "all" | "active" | "archived"

interface AdminClassesFiltersProps {
  searchQuery: string
  statusFilter: StatusFilter
  yearLevelFilter: number | "all"
  semesterFilter: number | "all"
  academicYearFilter: string
  onSearchQueryChange: (query: string) => void
  onStatusFilterChange: (status: StatusFilter) => void
  onYearLevelFilterChange: (yearLevel: number | "all") => void
  onSemesterFilterChange: (semester: number | "all") => void
  onAcademicYearFilterChange: (academicYear: string) => void
}

function getYearLabel(yearLevel: number | "all"): string {
  if (yearLevel === "all") {
    return "All Years"
  }

  if (yearLevel === 1) {
    return "1st Year"
  }

  if (yearLevel === 2) {
    return "2nd Year"
  }

  if (yearLevel === 3) {
    return "3rd Year"
  }

  return "4th Year"
}

function getSemesterLabel(semester: number | "all"): string {
  if (semester === "all") {
    return "All Semesters"
  }

  if (semester === 1) {
    return "1st Semester"
  }

  return "2nd Semester"
}



function AdminClassesFilters({
  searchQuery,
  statusFilter,
  yearLevelFilter,
  semesterFilter,
  academicYearFilter,
  onSearchQueryChange,
  onStatusFilterChange,
  onYearLevelFilterChange,
  onSemesterFilterChange,
  onAcademicYearFilterChange,
}: AdminClassesFiltersProps) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showYearDropdown, setShowYearDropdown] = useState(false)
  const [showSemesterDropdown, setShowSemesterDropdown] = useState(false)
  const [showAcademicYearDropdown, setShowAcademicYearDropdown] =
    useState(false)

  const academicYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()

    return [
      { value: "all", label: "All A.Y." },
      ...Array.from({ length: 4 }).map((_, index) => {
        const startYear = currentYear - index
        const endYear = startYear + 1
        return {
          value: `${startYear}-${endYear}`,
          label: `${startYear}-${endYear}`,
        }
      }),
    ]
  }, [])

  useDocumentClick(() => {
    setShowStatusDropdown(false)
    setShowYearDropdown(false)
    setShowSemesterDropdown(false)
    setShowAcademicYearDropdown(false)
  })

  return (
    <div className="relative z-50 p-1 rounded-2xl bg-slate-900/50 backdrop-blur-md border border-white/5">
      <div className="flex flex-col md:flex-row gap-4 p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search classes by name or code..."
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all"
          />
        </div>

        <div className="relative">
          <button
            onClick={(event) => {
              event.stopPropagation()
              setShowYearDropdown(!showYearDropdown)
              setShowStatusDropdown(false)
              setShowSemesterDropdown(false)
              setShowAcademicYearDropdown(false)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white transition-all min-w-[140px] justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="capitalize">
                {getYearLabel(yearLevelFilter)}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-500 transition-transform ${
                showYearDropdown ? "rotate-180" : ""
              }`}
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
                      onYearLevelFilterChange(option.value as number | "all")
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

        <div className="relative">
          <button
            onClick={(event) => {
              event.stopPropagation()
              setShowSemesterDropdown(!showSemesterDropdown)
              setShowStatusDropdown(false)
              setShowYearDropdown(false)
              setShowAcademicYearDropdown(false)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white transition-all min-w-[150px] justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="capitalize">
                {getSemesterLabel(semesterFilter)}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-500 transition-transform ${
                showSemesterDropdown ? "rotate-180" : ""
              }`}
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
                      onSemesterFilterChange(option.value as number | "all")
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

        <div className="relative">
          <button
            onClick={(event) => {
              event.stopPropagation()
              setShowAcademicYearDropdown(!showAcademicYearDropdown)
              setShowStatusDropdown(false)
              setShowYearDropdown(false)
              setShowSemesterDropdown(false)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white transition-all min-w-[150px] justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <span className="capitalize">
                {academicYearFilter === "all" ? "All A.Y." : academicYearFilter}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-500 transition-transform ${
                showAcademicYearDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showAcademicYearDropdown && (
            <div className="absolute top-full right-0 mt-1 min-w-[150px] w-full bg-[#0B1120] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5">
              <div className="p-1.5 space-y-0.5">
                {academicYearOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onAcademicYearFilterChange(option.value)
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

        <div className="relative">
          <button
            onClick={(event) => {
              event.stopPropagation()
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
              className={`w-3.5 h-3.5 text-gray-500 transition-transform ${
                showStatusDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showStatusDropdown && (
            <div className="absolute top-full right-0 mt-1 min-w-[160px] w-full bg-[#0B1120] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5">
              <div className="p-1.5 space-y-0.5">
                {(["all", "active", "archived"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      onStatusFilterChange(status)
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
  )
}

// Inlined from src/presentation/components/admin/AdminClassesTable.tsx
interface DropdownPosition {
  id: number
  x: number
  y: number
}



interface AdminClassesTableProps {
  classes: AdminClass[]
  isLoading: boolean
  page: number
  totalPages: number
  activeDropdown: DropdownPosition | null
  actionLoading: number | null
  onRowClick: (classId: number) => void
  onDropdownClick: (event: ReactMouseEvent, classId: number) => void
  onPreviousPage: () => void
  onNextPage: () => void
  onEditClass: (selectedClass: AdminClass) => void
  onArchiveClass: (classId: number) => void
  onRestoreClass: (classId: number) => void
  onRequestDeleteClass: (selectedClass: AdminClass) => void
  onCloseDropdown: () => void
}



function getStatusBadgeStyle(isActive: boolean): string {
  return isActive
    ? "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]"
    : "bg-gray-500/10 text-gray-400 border-gray-500/20"
}



function getOrdinalSuffix(value: number): string {
  if (value === 1) {
    return "st"
  }

  if (value === 2) {
    return "nd"
  }

  if (value === 3) {
    return "rd"
  }

  return "th"
}



function AdminClassesTable({
  classes,
  isLoading,
  page,
  totalPages,
  activeDropdown,
  actionLoading,
  onRowClick,
  onDropdownClick,
  onPreviousPage,
  onNextPage,
  onEditClass,
  onArchiveClass,
  onRestoreClass,
  onRequestDeleteClass,
  onCloseDropdown,
}: AdminClassesTableProps) {
  const activeClass = activeDropdown
    ? (classes.find((item) => item.id === activeDropdown.id) ?? null)
    : null

  const dropdownWidthPx = 224
  const dropdownVerticalOffsetPx = 8
  const viewportPaddingPx = 8
  const maxLeftPx =
    typeof window !== "undefined"
      ? Math.max(viewportPaddingPx, window.innerWidth - dropdownWidthPx - viewportPaddingPx)
      : activeDropdown?.x ?? 0
  const safeLeftPx = activeDropdown
    ? Math.min(Math.max(activeDropdown.x, viewportPaddingPx), maxLeftPx)
    : 0
  const safeTopPx = activeDropdown
    ? Math.max(activeDropdown.y, dropdownVerticalOffsetPx)
    : 0

  return (
    <div className="relative rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden">
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
              [...Array(5)].map((_, index) => (
                <tr key={index} className="animate-pulse">
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
              classes.map((selectedClass) => (
                <tr
                  key={selectedClass.id}
                  onClick={() => onRowClick(selectedClass.id)}
                  className="group hover:bg-white/[0.02] transition-colors duration-200 cursor-pointer"
                >
                  <td className="px-6 py-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                          {selectedClass.className}
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
                          {selectedClass.teacherName}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-medium text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/10">
                          {selectedClass.yearLevel}
                          {getOrdinalSuffix(selectedClass.yearLevel)} Year
                        </span>
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">
                          {selectedClass.semester}
                          {getOrdinalSuffix(selectedClass.semester)} Sem
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 pl-1">
                        A.Y. {selectedClass.academicYear}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <span className="text-sm text-gray-300 font-medium">
                        {selectedClass.studentCount}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeStyle(selectedClass.isActive)}`}
                    >
                      {selectedClass.isActive ? "Active" : "Archived"}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="relative inline-block">
                      <button
                        data-admin-class-dropdown-trigger="true"
                        onClick={(event) =>
                          onDropdownClick(event, selectedClass.id)
                        }
                        disabled={actionLoading === selectedClass.id}
                        className={`p-2 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors ${
                          activeDropdown?.id === selectedClass.id
                            ? "bg-white/10 text-white ring-1 ring-white/10"
                            : ""
                        }`}
                      >
                        {actionLoading === selectedClass.id ? (
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01]">
          <p className="text-sm text-gray-500">
            Page <span className="font-medium text-white">{page}</span> of{" "}
            <span className="font-medium text-white">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={onPreviousPage}
              disabled={page === 1}
              className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNextPage}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {activeDropdown &&
        activeClass &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            data-admin-class-dropdown-menu="true"
            className="fixed w-56 bg-[#0B1120] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[11000] overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5"
            style={{
              left: safeLeftPx,
              top: safeTopPx,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-1.5 space-y-1">
              <button
                onClick={() => {
                  onEditClass(activeClass)
                  onCloseDropdown()
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg transition-all"
              >
                <BookOpen className="w-4 h-4 text-blue-400" />
                Edit Class
              </button>

              {activeClass.isActive && (
                <button
                  onClick={() => onArchiveClass(activeClass.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg transition-all"
                >
                  <Archive className="w-4 h-4 text-yellow-500" />
                  Archive Class
                </button>
              )}

              {!activeClass.isActive && (
                <button
                  onClick={() => onRestoreClass(activeClass.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg transition-all"
                >
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  Restore Class
                </button>
              )}

              <div className="h-[1px] bg-white/5 mx-2" />

              <button
                onClick={() => {
                  onRequestDeleteClass(activeClass)
                  onCloseDropdown()
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all group/delete"
              >
                <Trash2 className="w-4 h-4 group-hover/delete:animate-bounce" />
                Delete Class
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

// Inlined from src/presentation/components/admin/AdminDeleteClassModal.tsx
interface AdminDeleteClassModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  classData: AdminClass | null
}



function AdminDeleteClassModal({
  isOpen,
  onClose,
  onConfirm,
  classData,
}: AdminDeleteClassModalProps) {
  const [confirmation, setConfirmation] = React.useState("")
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [step, setStep] = React.useState<"warning" | "confirm">("warning")

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setConfirmation("")
      setError(null)
      setStep("warning")
      setIsDeleting(false)
    }
  }, [isOpen])

  // Close on escape key
  React.useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose, isDeleting])

  const handleContinue = () => {
    setStep("confirm")
  }

  const handleDelete = async () => {
    setError(null)
    setIsDeleting(true)

    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete class")
      setIsDeleting(false)
    }
  }

  const isConfirmDisabled = confirmation !== "DELETE" || isDeleting

  if (!isOpen || !classData) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-md min-w-[500px] mx-4 p-6",
          "rounded-xl border border-red-500/20 bg-slate-900/95 backdrop-blur-sm",
          "shadow-xl shadow-red-500/10",
          "animate-in fade-in-0 zoom-in-95 duration-200",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-class-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className={cn(
            "absolute top-4 right-4 p-1 rounded-lg",
            "text-gray-400 hover:text-white hover:bg-white/10",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500/20">
            {step === "warning" ? (
              <AlertTriangle className="w-8 h-8 text-red-400" />
            ) : (
              <Trash2 className="w-8 h-8 text-red-400" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2
          id="delete-class-title"
          className="text-xl font-semibold text-center mb-2 text-white"
        >
          {step === "warning" ? "Delete Class?" : "Confirm Deletion"}
        </h2>

        {step === "warning" ? (
          <>
            {/* Class info */}
            <div className="text-center mb-4">
              <p className="text-gray-400 text-sm">
                You are about to delete{" "}
                <span className="text-white font-medium">
                  {classData.className}
                </span>
              </p>
              <p className="text-gray-500 text-xs mt-1 font-mono">
                Code: {classData.classCode}
              </p>
            </div>

            <div className="space-y-3 mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-gray-300">
                This action is{" "}
                <span className="text-red-400 font-semibold">
                  permanent and irreversible
                </span>
                . Deleting this class will remove:
              </p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  All class information and settings
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  All assignments and their submissions
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  All student enrollments ({classData.studentCount} students)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  All plagiarism reports and analysis data
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
                  "border border-white/20 text-white",
                  "hover:bg-white/10 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
                  "bg-red-500/20 border border-red-500/30 text-red-400",
                  "hover:bg-red-500/30 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
                )}
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation form */}
            <p className="text-gray-400 text-center mb-6 text-sm">
              To confirm deletion, please type{" "}
              <span className="text-red-400 font-mono font-semibold">
                DELETE
              </span>{" "}
              below.
            </p>

            <div className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Type DELETE */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Type <span className="text-red-400 font-mono">DELETE</span> to
                  confirm
                </label>
                <input
                  type="text"
                  value={confirmation}
                  onChange={(e) => {
                    setConfirmation(e.target.value.toUpperCase())
                    setError(null)
                  }}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg font-mono",
                    "bg-black/20 border border-white/10",
                    "text-white placeholder-gray-500",
                    "focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent",
                    "transition-all duration-200",
                    confirmation === "DELETE" && "border-red-500/50",
                  )}
                  placeholder="DELETE"
                  disabled={isDeleting}
                  autoFocus
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep("warning")}
                  disabled={isDeleting}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
                    "border border-white/20 text-white",
                    "hover:bg-white/10 transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  Back
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isConfirmDisabled}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2",
                    "bg-red-600 text-white",
                    "hover:bg-red-700 transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Class
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

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
