import { Search, Users } from "lucide-react"
import { StudentListItem } from "@/presentation/components/shared/dashboard/StudentListItem"
import { Pagination } from "@/presentation/components/ui/Pagination"
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
  isLoadingStudents: boolean
  studentGridTemplate: string
  onStudentSearchQueryChange: (value: string) => void
  onStudentStatusFilterChange: (
    value: Extract<ClassStudentStatusFilter, "active" | "inactive">,
  ) => void
  onRemoveStudent: (student: EnrolledStudent) => void
  onStudentPageChange: (page: number) => void
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
  isLoadingStudents,
  studentGridTemplate,
  onStudentSearchQueryChange,
  onStudentStatusFilterChange,
  onRemoveStudent,
  onStudentPageChange,
  variant = "dark",
}: StudentsTabContentProps) {
  const isLight = variant === "light"

  // Preserve the teacher-only remove action inputs so the trash button can be restored quickly later.
  void isTeacher
  void onRemoveStudent

  const shouldShowRosterEmptyState =
    !isLoadingStudents && students.length === 0 && !studentSearchQuery.trim()
  const rosterEmptyStateTitle =
    studentStatusFilter === "inactive"
      ? "No inactive students"
      : "No active students"
  const rosterEmptyStateDescription =
    studentStatusFilter === "inactive"
      ? "There are no deactivated students enrolled in this class right now."
      : "Share the class code with your students so they can join this class."

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

          <div
            className={`inline-flex rounded-xl p-1 ${isLight ? "border border-slate-200 bg-slate-100" : "border border-white/10 bg-white/5"}`}
          >
            {(["active", "inactive"] as const).map((statusOption) => {
              const isSelected = studentStatusFilter === statusOption

              return (
                <button
                  key={statusOption}
                  type="button"
                  onClick={() => onStudentStatusFilterChange(statusOption)}
                  disabled={isLoadingStudents}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    isSelected
                      ? isLight
                        ? "bg-white text-teal-700 shadow-sm"
                        : "bg-teal-500/20 text-teal-300"
                      : isLight
                        ? "text-slate-600 hover:text-slate-900"
                        : "text-gray-400 hover:text-white"
                  }`}
                >
                  {statusOption === "active" ? "Active" : "Inactive"}
                </button>
              )
            })}
          </div>
        </div>

        <div className="relative w-full sm:w-auto">
          <label htmlFor="student-search" className="sr-only">
            Search students by name or email
          </label>
          <input
            id="student-search"
            type="text"
            placeholder="Search students..."
            value={studentSearchQuery}
            onChange={(event) => onStudentSearchQueryChange(event.target.value)}
            className={`h-11 w-full rounded-lg border pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:border-transparent sm:h-10 sm:w-64 ${isLight ? "border-slate-300 bg-slate-50 text-slate-800 shadow-sm placeholder:text-slate-400 hover:border-slate-400 hover:bg-white focus:ring-teal-500/20" : "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:ring-teal-500"}`}
          />
          <Search
            className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isLight ? "text-slate-400" : "text-gray-500"}`}
          />
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
            {studentStatusFilter === "active" ? (
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
