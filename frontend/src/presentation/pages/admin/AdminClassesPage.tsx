import { useEffect, useState, useCallback, type MouseEvent as ReactMouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, XCircle, Plus, Mail } from "lucide-react";
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
import { Archive, BookOpen, ChevronLeft, ChevronRight, Loader2, MoreVertical, RotateCcw, Trash2, Users2 } from "lucide-react";
import { createPortal } from "react-dom";
import * as React from "react";
import { cn } from "@/shared/utils/cn";
import { Avatar } from "@/presentation/components/ui/Avatar";
import { AlertTriangle, X, AlertCircle } from "lucide-react";

// Inlined from src/presentation/components/admin/AdminClassesFilters.tsx
type StatusFilter = "all" | "active" | "archived"

interface AdminClassesFiltersProps {
  searchQuery: string
  statusFilter: StatusFilter
  semesterFilter: number | "all"
  academicYearFilter: string
  onSearchQueryChange: (query: string) => void
  onStatusFilterChange: (status: StatusFilter) => void
  onSemesterFilterChange: (semester: number | "all") => void
  onAcademicYearFilterChange: (academicYear: string) => void
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
  semesterFilter,
  academicYearFilter,
  onSearchQueryChange,
  onStatusFilterChange,
  onSemesterFilterChange,
  onAcademicYearFilterChange,
}: AdminClassesFiltersProps) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showSemesterDropdown, setShowSemesterDropdown] = useState(false)
  const [showAcademicYearDropdown, setShowAcademicYearDropdown] =
    useState(false)

  const academicYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()

    return [
      { value: "all", label: "All S.Y." },
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
    setShowSemesterDropdown(false)
    setShowAcademicYearDropdown(false)
  })

  return (
    <div className="relative z-50">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search classes by name or code..."
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            className="w-full rounded-xl border border-slate-400 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-md shadow-slate-200/70 transition-all hover:border-slate-500 hover:bg-white focus:border-transparent focus:outline-none focus:ring-4 focus:ring-teal-500/15"
          />
        </div>

        <div className="relative">
          <button
            onClick={(event) => {
              event.stopPropagation()
              setShowSemesterDropdown(!showSemesterDropdown)
              setShowStatusDropdown(false)
              setShowAcademicYearDropdown(false)
            }}
            className="cursor-pointer flex min-w-[150px] items-center justify-between gap-2 rounded-xl border border-slate-400 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <div className="flex items-center gap-2">
              <span className="capitalize">
                {getSemesterLabel(semesterFilter)}
              </span>
            </div>
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-500 transition-transform ${
                showSemesterDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showSemesterDropdown && (
            <div className="absolute top-full right-0 z-50 mt-2 w-full min-w-[150px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/90 ring-1 ring-slate-200/80 animate-in fade-in zoom-in-95 duration-200">
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
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all duration-150 ${
                      semesterFilter === option.value
                        ? "border-teal-200 bg-teal-50 text-teal-700 shadow-sm"
                        : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm"
                    }`}
                  >
                    <span className="capitalize font-medium">
                      {option.label}
                    </span>
                    {semesterFilter === option.value && (
                      <CheckCircle className="h-3.5 w-3.5 text-teal-600" />
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
              setShowSemesterDropdown(false)
            }}
            className="cursor-pointer flex min-w-[150px] items-center justify-between gap-2 rounded-xl border border-slate-400 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <div className="flex items-center gap-2">
              <span className="capitalize">
                {academicYearFilter === "all" ? "All S.Y." : academicYearFilter}
              </span>
            </div>
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-500 transition-transform ${
                showAcademicYearDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showAcademicYearDropdown && (
            <div className="absolute top-full right-0 z-50 mt-2 w-full min-w-[150px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/90 ring-1 ring-slate-200/80 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-1.5 space-y-0.5">
                {academicYearOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onAcademicYearFilterChange(option.value)
                      setShowAcademicYearDropdown(false)
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all duration-150 ${
                      academicYearFilter === option.value
                        ? "border-teal-200 bg-teal-50 text-teal-700 shadow-sm"
                        : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm"
                    }`}
                  >
                    <span className="capitalize font-medium">
                      {option.label}
                    </span>
                    {academicYearFilter === option.value && (
                      <CheckCircle className="h-3.5 w-3.5 text-teal-600" />
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
              setShowSemesterDropdown(false)
              setShowAcademicYearDropdown(false)
            }}
            className="cursor-pointer flex min-w-[150px] items-center justify-between gap-2 rounded-xl border border-slate-400 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span className="capitalize">
                {statusFilter === "all" ? "All Status" : statusFilter}
              </span>
            </div>
            <ChevronDown
              className={`h-3.5 w-3.5 text-slate-500 transition-transform ${
                showStatusDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showStatusDropdown && (
            <div className="absolute top-full right-0 z-50 mt-2 w-full min-w-[160px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/90 ring-1 ring-slate-200/80 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-1.5 space-y-0.5">
                {(["all", "active", "archived"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      onStatusFilterChange(status)
                      setShowStatusDropdown(false)
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all duration-150 ${
                      statusFilter === status
                        ? "border-teal-200 bg-teal-50 text-teal-700 shadow-sm"
                        : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm"
                    }`}
                  >
                    <span className="capitalize font-medium">
                      {status === "all" ? "All Status" : status}
                    </span>
                    {statusFilter === status && (
                      <CheckCircle className="h-3.5 w-3.5 text-teal-600" />
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
  totalClasses: number
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



function getClassStatusDisplay(isActive: boolean): {
  dotClassName: string
  textClassName: string
  label: string
} {
  if (isActive) {
    return {
      dotClassName: "bg-emerald-500",
      textClassName: "text-emerald-700",
      label: "Active",
    }
  }

  return {
    dotClassName: "bg-slate-400",
    textClassName: "text-slate-500",
    label: "Archived",
  }
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

function getShortSemesterLabel(semester: number): string {
  return `${semester}${getOrdinalSuffix(semester)} Semester`
}

function getAcademicInfoLabel(selectedClass: AdminClass): string {
  return `${getShortSemesterLabel(selectedClass.semester)} - S.Y. ${selectedClass.academicYear}`
}




function getTeacherInitials(teacherName: string): string {
  const trimmedTeacherName = teacherName.trim()

  if (!trimmedTeacherName) {
    return "?"
  }

  const teacherNameParts = trimmedTeacherName.split(/\s+/)

  if (teacherNameParts.length === 1) {
    return teacherNameParts[0].slice(0, 2).toUpperCase()
  }

  const firstInitial = teacherNameParts[0]?.[0] ?? ""
  const lastInitial = teacherNameParts[teacherNameParts.length - 1]?.[0] ?? ""

  return `${firstInitial}${lastInitial}`.toUpperCase()
}

function AdminClassesTable({
  classes,
  isLoading,
  page,
  totalPages,
  totalClasses,
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
    <div className="overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-md shadow-slate-200/80">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[24%]" />
            <col className="w-[20%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-300 bg-slate-200/85">
              <th className="px-6 py-5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                Class Details
              </th>
              <th className="px-6 py-5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                Teacher
              </th>
              <th className="px-6 py-5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                Semester &amp; Year
              </th>
              <th className="px-6 py-5 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                Students
              </th>
              <th className="px-6 py-5 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                Status
              </th>
              <th className="px-6 py-5 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300/70">
            {isLoading ? (
              [...Array(5)].map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-6 py-5">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-slate-100 rounded" />
                      <div className="h-3 w-48 bg-slate-100 rounded" />
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="h-4 w-24 bg-slate-100 rounded" />
                  </td>
                  <td className="px-6 py-5">
                    <div className="h-4 w-32 bg-slate-100 rounded" />
                  </td>
                  <td className="px-6 py-5">
                    <div className="h-4 w-12 bg-slate-100 rounded" />
                  </td>
                  <td className="px-6 py-5">
                    <div className="h-6 w-16 bg-slate-100 rounded-full" />
                  </td>
                  <td className="px-6 py-5">
                    <div className="h-8 w-8 ml-auto bg-slate-100 rounded" />
                  </td>
                </tr>
              ))
            ) : classes.length > 0 ? (
              classes.map((selectedClass) => {
                const classStatusDisplay = getClassStatusDisplay(selectedClass.isActive)

                return (
                  <tr
                    key={selectedClass.id}
                    onClick={() => onRowClick(selectedClass.id)}
                    className="group cursor-pointer transition-colors duration-200 hover:bg-slate-100"
                  >
                  <td className="px-6 py-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 transition-colors group-hover:text-teal-700">
                          {selectedClass.className}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-3 w-3 text-slate-400" />
                        <p className="text-xs text-slate-500">
                          {selectedClass.classCode}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <Avatar
                        fallback={getTeacherInitials(selectedClass.teacherName)}
                        src={selectedClass.teacherAvatarUrl ?? undefined}
                        size="sm"
                        className="ring-2 ring-transparent transition-all group-hover:ring-teal-100"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">
                          {selectedClass.teacherName}
                        </span>
                        {selectedClass.teacherEmail ? (
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span className="text-xs text-slate-500">
                              {selectedClass.teacherEmail}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-medium text-slate-600">
                      {getAcademicInfoLabel(selectedClass)}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <Users2 className="h-4 w-4 text-cyan-600" strokeWidth={2.35} />
                      <span className="text-sm font-medium text-slate-700">
                        {selectedClass.studentCount}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${classStatusDisplay.dotClassName}`}
                      />
                      <span
                        className={`text-[11px] font-medium ${classStatusDisplay.textClassName}`}
                      >
                        {classStatusDisplay.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="relative inline-block">
                      <button
                        data-admin-class-dropdown-trigger="true"
                        onClick={(event) =>
                          onDropdownClick(event, selectedClass.id)
                        }
                        disabled={actionLoading === selectedClass.id}
                        className={`cursor-pointer rounded-xl border border-slate-300 bg-white p-2 text-slate-500 shadow-sm shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-100 hover:text-slate-800 hover:shadow-md ${
                          activeDropdown?.id === selectedClass.id
                            ? "border-slate-400 bg-slate-100 text-slate-800 shadow-md"
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
                )
              })
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-16 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-slate-100 p-4">
                      <Search className="w-8 h-8 opacity-40" />
                    </div>
                    <p className="text-lg font-medium text-slate-700">
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

      {totalClasses > 0 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-6 py-4">
          <p className="text-sm text-slate-500">
            Page <span className="font-medium text-slate-900">{page}</span> of{" "}
            <span className="font-medium text-slate-900">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={onPreviousPage}
              disabled={page === 1}
              className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNextPage}
              disabled={page === totalPages}
              className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="fixed z-[11000] w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/90 ring-1 ring-slate-200/80 animate-in fade-in zoom-in-95 duration-200"
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
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-slate-700 transition-all duration-150 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm"
              >
                <BookOpen className="h-4 w-4 text-teal-600" />
                Edit Class
              </button>

              {activeClass.isActive && (
                <button
                  onClick={() => onArchiveClass(activeClass.id)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-slate-700 transition-all duration-150 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm"
                >
                  <Archive className="h-4 w-4 text-amber-600" />
                  Archive Class
                </button>
              )}

              {!activeClass.isActive && (
                <button
                  onClick={() => onRestoreClass(activeClass.id)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-slate-700 transition-all duration-150 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm"
                >
                  <RotateCcw className="h-4 w-4 text-emerald-600" />
                  Restore Class
                </button>
              )}

              <div className="mx-2 h-px bg-slate-100" />

              <button
                onClick={() => {
                  onRequestDeleteClass(activeClass)
                  onCloseDropdown()
                }}
                className="group/delete flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-rose-600 transition-all duration-150 hover:border-rose-200 hover:bg-rose-100 hover:text-rose-800 hover:shadow-sm"
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
          "rounded-3xl border border-rose-200 bg-white",
          "shadow-xl",
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
            "absolute top-4 right-4 cursor-pointer rounded-lg p-1",
            "text-slate-400 hover:bg-slate-100 hover:text-slate-700",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
            {step === "warning" ? (
              <AlertTriangle className="h-8 w-8 text-rose-600" />
            ) : (
              <Trash2 className="h-8 w-8 text-rose-600" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2
          id="delete-class-title"
          className="mb-2 text-center text-xl font-semibold text-slate-900"
        >
          {step === "warning" ? "Delete Class?" : "Confirm Deletion"}
        </h2>

        {step === "warning" ? (
          <>
            {/* Class info */}
            <div className="text-center mb-4">
              <p className="text-sm text-slate-500">
                You are about to delete{" "}
                <span className="font-medium text-slate-900">
                  {classData.className}
                </span>
              </p>
              <p className="mt-1 text-xs font-mono text-slate-400">
                Code: {classData.classCode}
              </p>
            </div>

            <div className="mb-6 space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm text-slate-600">
                This action is{" "}
                <span className="font-semibold text-rose-700">
                  permanent and irreversible
                </span>
                . Deleting this class will remove:
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-rose-500">&bull;</span>
                  All class information and settings
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-rose-500">&bull;</span>
                  All assignments and their submissions
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-rose-500">&bull;</span>
                  All student enrollments ({classData.studentCount} students)
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-rose-500">&bull;</span>
                  All plagiarism reports and analysis data
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                type="button"
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
                  "border border-slate-300 bg-white text-slate-700",
                  "hover:bg-slate-100 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                )}
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={handleContinue}
                type="button"
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
                  "bg-red-600 text-white",
                  "hover:bg-red-700 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
                )}
              >
                <AlertTriangle className="h-4 w-4" />
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation form */}
            <p className="mb-6 text-center text-sm text-slate-500">
              To confirm deletion, please type{" "}
              <span className="font-mono font-semibold text-rose-700">
                DELETE
              </span>{" "}
              below.
            </p>

            <div className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <p className="text-sm text-rose-700">{error}</p>
                </div>
              )}

              {/* Type DELETE */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">
                  Type <span className="font-mono text-rose-700">DELETE</span> to
                  confirm
                </label>
                <input
                  type="text"
                  value={confirmation}
                  onChange={(event) => {
                    setConfirmation(event.target.value.toUpperCase())
                    setError(null)
                  }}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg font-mono",
                    "border border-slate-300 bg-white",
                    "text-slate-900 placeholder-slate-300",
                    "focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent",
                    "transition-all duration-200",
                    confirmation === "DELETE" && "border-rose-400",
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
                  type="button"
                  className={cn(
                    "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
                    "border border-slate-300 bg-white text-slate-700",
                    "hover:bg-slate-100 transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isConfirmDisabled}
                  className={cn(
                    "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
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

  const limit = 10

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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Class Management
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage all classes, reassign teachers, and archive or restore
              classes.{" "}
              <span className="text-slate-400">({total} classes)</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchClasses}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => navigate("/dashboard/admin/classes/new")}
              className="cursor-pointer flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-teal-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:bg-teal-700"
            >
              <Plus className="w-4 h-4" />
              <span>Create Class</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <AdminClassesFilters
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          semesterFilter={semesterFilter}
          academicYearFilter={academicYearFilter}
          onSearchQueryChange={setSearchQuery}
          onStatusFilterChange={(status) => {
            setStatusFilter(status)
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
          totalClasses={total}
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










