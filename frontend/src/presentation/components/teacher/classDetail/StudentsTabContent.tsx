import { useEffect, useRef, useState } from "react"
import { ChevronDown, Download, FileText, Filter, Search, Users } from "lucide-react"
import { StudentListItem } from "@/presentation/components/shared/dashboard/StudentListItem"
import { Pagination } from "@/presentation/components/ui/Pagination"
import { Select } from "@/presentation/components/ui/Select"
import { Button } from "@/presentation/components/ui/Button"
import { dashboardTheme } from "@/presentation/constants/dashboardTheme"
import type {
  EnrolledStudent,
  ClassStudentStatusFilter,
} from "@/data/api/class.types"

interface StudentsTabContentProps {
  students: EnrolledStudent[]
  filteredStudents: EnrolledStudent[]
  paginatedStudents: EnrolledStudent[]
  isTeacher: boolean
  classCode?: string
  studentSearchQuery: string
  currentStudentPage: number
  totalStudentPages: number
  studentStatusFilter: Extract<ClassStudentStatusFilter, "active" | "inactive">
  studentStatusCounts: Record<
    Extract<ClassStudentStatusFilter, "active" | "inactive">,
    number
  >
  loadedStudentStatuses: Record<
    Extract<ClassStudentStatusFilter, "active" | "inactive">,
    boolean
  >
  isLoadingStudents: boolean
  studentGridTemplate: string
  onStudentSearchQueryChange: (value: string) => void
  onStudentStatusFilterChange: (
    value: Extract<ClassStudentStatusFilter, "active" | "inactive">,
  ) => void
  onRemoveStudent: (student: EnrolledStudent) => void
  onStudentPageChange: (page: number) => void
  onExportCsv?: () => void
  onDownloadPdf?: () => void
  isExportingCsv?: boolean
  isDownloadingPdf?: boolean
  variant?: "dark" | "light"
}

export function StudentsTabContent({
  students,
  filteredStudents,
  paginatedStudents,
  isTeacher,
  classCode,
  studentSearchQuery,
  currentStudentPage,
  totalStudentPages,
  studentStatusFilter,
  studentStatusCounts,
  loadedStudentStatuses,
  isLoadingStudents,
  studentGridTemplate,
  onStudentSearchQueryChange,
  onStudentStatusFilterChange,
  onRemoveStudent,
  onStudentPageChange,
  onExportCsv,
  onDownloadPdf,
  isExportingCsv = false,
  isDownloadingPdf = false,
  variant = "dark",
}: StudentsTabContentProps) {
  const isLight = variant === "light"
  const exportMenuRef = useRef<HTMLDivElement | null>(null)
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)

  // Preserve the teacher-only remove action inputs so the trash button can be restored quickly later.
  void onRemoveStudent

  const shouldShowRosterEmptyState =
    !isLoadingStudents && students.length === 0 && !studentSearchQuery.trim()
  const rosterEmptyStateTitle = isTeacher
    ? studentStatusFilter === "inactive"
      ? "No inactive students"
      : "No active students"
    : "No students enrolled"
  const rosterEmptyStateDescription = isTeacher
    ? studentStatusFilter === "inactive"
      ? "There are no deactivated students enrolled in this class right now."
      : "Share the class code with your students so they can join this class."
    : "Share the class code with your students so they can join this class."
  const searchPlaceholder = isTeacher
    ? studentStatusFilter === "inactive"
      ? "Search inactive students..."
      : "Search active students..."
    : "Search students..."
  const studentStatusOptions = (["active", "inactive"] as const).map(
    (statusOption) => {
      const hasLoadedStatusCount = loadedStudentStatuses[statusOption]
      const statusCountLabel = hasLoadedStatusCount
        ? String(studentStatusCounts[statusOption])
        : "..."
      const statusLabel = statusOption === "active" ? "Active" : "Inactive"

      return {
        value: statusOption,
        label: `${statusLabel} (${statusCountLabel})`,
      }
    },
  )
  const isExportDisabled =
    isLoadingStudents ||
    filteredStudents.length === 0 ||
    isExportingCsv ||
    isDownloadingPdf ||
    !onExportCsv ||
    !onDownloadPdf

  useEffect(() => {
    if (!isExportMenuOpen) {
      return
    }

    function closeMenuOnOutsideClick(event: MouseEvent): void {
      if (!exportMenuRef.current?.contains(event.target as Node)) {
        setIsExportMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", closeMenuOnOutsideClick)

    return () => {
      document.removeEventListener("mousedown", closeMenuOnOutsideClick)
    }
  }, [isExportMenuOpen])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2
            className={
              isLight
                ? dashboardTheme.sectionTitle
                : "text-lg font-semibold tracking-tight text-white"
            }
          >
            Enrolled Students
          </h2>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${isLight ? "border border-slate-200 bg-slate-100 text-slate-600" : "bg-white/10 text-gray-300"}`}
          >
            {students.length}
          </span>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          <div className="relative w-full sm:w-64">
            <label htmlFor="student-search" className="sr-only">
              Search students by name or email
            </label>
            <input
              id="student-search"
              type="text"
              placeholder={searchPlaceholder}
              value={studentSearchQuery}
              onChange={(event) => onStudentSearchQueryChange(event.target.value)}
              className={`h-11 w-full rounded-lg border pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:border-transparent sm:h-10 ${isLight ? "border-slate-300 bg-slate-50 text-slate-800 shadow-sm placeholder:text-slate-400 hover:border-slate-400 hover:bg-white focus:ring-teal-500/20" : "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:ring-teal-500"}`}
            />
            <Search
              className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isLight ? "text-slate-400" : "text-gray-500"}`}
            />
          </div>

          {isTeacher && (
            <>
              <div className="group relative w-full sm:w-[200px]">
                <Filter
                  className={`pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 ${
                    isLight ? "text-slate-400" : "text-gray-500"
                  }`}
                  aria-hidden="true"
                />
                <Select
                  value={studentStatusFilter}
                  onChange={(value) =>
                    onStudentStatusFilterChange(
                      value as Extract<ClassStudentStatusFilter, "active" | "inactive">,
                    )
                  }
                  options={studentStatusOptions}
                  aria-label="Filter enrolled students by account status"
                  disabled={isLoadingStudents}
                  variant={variant}
                  className="h-11 cursor-pointer pl-9 pr-10 sm:h-10"
                />
              </div>

              <div className="relative w-full sm:w-auto" ref={exportMenuRef}>
                <Button
                  onClick={() => setIsExportMenuOpen((previous) => !previous)}
                  className="h-11 w-full px-4 sm:h-10 sm:w-auto"
                  disabled={isExportDisabled}
                >
                  <Download
                    className={`mr-2 h-4 w-4 ${isExportingCsv || isDownloadingPdf ? "animate-bounce" : ""}`}
                  />
                  {isExportingCsv
                    ? "Exporting..."
                    : isDownloadingPdf
                      ? "Preparing..."
                      : "Export"}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>

                {isExportMenuOpen && (
                  <div
                    className={`absolute right-0 top-full z-50 mt-2 min-w-[180px] overflow-hidden rounded-lg p-1 shadow-lg shadow-black/20 ${
                      isLight
                        ? "border border-slate-200 bg-white"
                        : "border border-white/10 bg-slate-900/95 backdrop-blur-sm"
                    }`}
                  >
                    <button
                      onClick={() => {
                        setIsExportMenuOpen(false)
                        onExportCsv?.()
                      }}
                      disabled={isExportingCsv}
                      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors duration-150 ${
                        isLight
                          ? "text-slate-700 hover:bg-teal-100 hover:text-teal-800"
                          : "text-gray-300 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      <Download className="h-4 w-4" />
                      Export as CSV
                    </button>
                    <button
                      onClick={() => {
                        setIsExportMenuOpen(false)
                        onDownloadPdf?.()
                      }}
                      disabled={isDownloadingPdf}
                      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors duration-150 ${
                        isLight
                          ? "text-slate-700 hover:bg-teal-100 hover:text-teal-800"
                          : "text-gray-300 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                      Download as PDF
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {isLoadingStudents ? (
        <div
          className={`rounded-lg border py-12 text-center ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-slate-900/50"}`}
        >
          <p className={isLight ? "text-slate-500" : "text-gray-400"}>
            Loading students...
          </p>
        </div>
      ) : shouldShowRosterEmptyState ? (
        <div className="py-12 text-center">
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isLight ? "border border-slate-200 bg-slate-100" : "bg-white/5"}`}
          >
            <Users
              className={`w-8 h-8 ${isLight ? "text-slate-400" : "text-gray-500"}`}
            />
          </div>
          <p
            className={`mb-1 font-medium ${isLight ? "text-slate-800" : "text-gray-300"}`}
          >
            {rosterEmptyStateTitle}
          </p>
          <p
            className={`text-sm ${isLight ? "text-slate-500" : "text-gray-500"}`}
          >
            {!isTeacher || studentStatusFilter === "active" ? (
              <>
                {rosterEmptyStateDescription}{" "}
                <span
                  className={`font-mono ${isLight ? "text-teal-700" : "text-teal-400"}`}
                >
                  {classCode}
                </span>
                .
              </>
            ) : (
              rosterEmptyStateDescription
            )}
          </p>
        </div>
      ) : filteredStudents.length > 0 ? (
        <>
          <div className="space-y-3 md:hidden">
            {paginatedStudents.map((student) => (
              <StudentListItem
                key={`mobile-${student.id}`}
                student={student}
                layoutMode="card"
                /*
                onRemove={
                  isTeacher ? () => onRemoveStudent(student) : undefined
                }
                */
                variant={variant}
              />
            ))}
          </div>

          <div
            className={`hidden overflow-hidden rounded-lg border md:block ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-slate-900/50"}`}
          >
            <div
              className={`grid gap-4 px-6 py-3 border-b ${isLight ? "border-slate-200 bg-slate-100" : "border-white/10 bg-slate-800/50"}`}
              style={{ gridTemplateColumns: studentGridTemplate }}
            >
              <div
                className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-gray-400"}`}
              >
                Student
              </div>
              <div
                className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-gray-400"}`}
              >
                Email Address
              </div>
              <div
                className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-gray-400"}`}
              >
                Status
              </div>
              <div className="w-10"></div>
            </div>

            <div>
              {paginatedStudents.map((student, index) => (
                <StudentListItem
                  key={student.id}
                  student={student}
                  isLast={index === paginatedStudents.length - 1}
                  gridTemplate={studentGridTemplate}
                  /*
                  onRemove={
                    isTeacher ? () => onRemoveStudent(student) : undefined
                  }
                  */
                  variant={variant}
                />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div
          className={`rounded-lg border py-12 text-center ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-slate-900/50"}`}
        >
          <p className={isLight ? "text-slate-500" : "text-gray-400"}>
            No students match your search.
          </p>
        </div>
      )}

      {totalStudentPages > 1 && filteredStudents.length > 0 && !isLoadingStudents && (
        <Pagination
          currentPage={currentStudentPage}
          totalPages={totalStudentPages}
          totalItems={filteredStudents.length}
          itemsPerPage={10}
          onPageChange={onStudentPageChange}
          variant={variant}
        />
      )}
    </div>
  )
}
