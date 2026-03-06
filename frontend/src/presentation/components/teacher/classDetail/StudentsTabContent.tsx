import { Search, Users } from "lucide-react"
import { StudentListItem } from "@/presentation/components/shared/dashboard/StudentListItem"
import { Pagination } from "@/presentation/components/ui/Pagination"
import type { EnrolledStudent } from "@/business/models/dashboard/types"

interface StudentsTabContentProps {
  students: EnrolledStudent[]
  filteredStudents: EnrolledStudent[]
  paginatedStudents: EnrolledStudent[]
  isTeacher: boolean
  classCode?: string
  studentSearchQuery: string
  currentStudentPage: number
  totalStudentPages: number
  studentGridTemplate: string
  onStudentSearchQueryChange: (value: string) => void
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
  studentGridTemplate,
  onStudentSearchQueryChange,
  onRemoveStudent,
  onStudentPageChange,
  variant = "dark",
}: StudentsTabContentProps) {
  const isLight = variant === "light"

  if (students.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isLight ? "border border-slate-200 bg-slate-100" : "bg-white/5"}`}>
          <Users className={`w-8 h-8 ${isLight ? "text-slate-400" : "text-gray-500"}`} />
        </div>
        <p className={`mb-1 font-medium ${isLight ? "text-slate-800" : "text-gray-300"}`}>No students enrolled</p>
        <p className={`text-sm ${isLight ? "text-slate-500" : "text-gray-500"}`}>
          Share the class code{" "}
          <span className={`font-mono ${isLight ? "text-teal-700" : "text-teal-400"}`}>{classCode}</span> with your
          students.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className={`text-xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>Enrolled Students</h2>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${isLight ? "border border-slate-200 bg-slate-100 text-slate-600" : "bg-white/10 text-gray-300"}`}>
            {students.length}
          </span>
        </div>

        <div className="relative">
          <label htmlFor="student-search" className="sr-only">
            Search students by name or email
          </label>
          <input
            id="student-search"
            type="text"
            placeholder="Search students..."
            value={studentSearchQuery}
            onChange={(event) => onStudentSearchQueryChange(event.target.value)}
            className={`h-10 w-64 rounded-lg border pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:border-transparent ${isLight ? "border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:ring-teal-500/20" : "border-white/10 bg-white/5 text-white placeholder-gray-500 focus:ring-teal-500"}`}
          />
          <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isLight ? "text-slate-400" : "text-gray-500"}`} />
        </div>
      </div>

      <div className={`overflow-hidden rounded-lg border ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-slate-900/50"}`}>
        <div
          className={`grid gap-4 px-6 py-3 border-b ${isLight ? "border-slate-200 bg-slate-100" : "border-white/10 bg-slate-800/50"}`}
          style={{ gridTemplateColumns: studentGridTemplate }}
        >
          <div className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-gray-400"}`}>
            Student
          </div>
          <div className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-gray-400"}`}>
            Email Address
          </div>
          <div className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-slate-500" : "text-gray-400"}`}>
            Role
          </div>
          <div className="w-10"></div>
        </div>

        {filteredStudents.length > 0 ? (
          <div>
            {paginatedStudents.map((student, index) => (
              <StudentListItem
                key={student.id}
                student={student}
                isLast={index === paginatedStudents.length - 1}
                gridTemplate={studentGridTemplate}
                onRemove={
                  isTeacher ? () => onRemoveStudent(student) : undefined
                }
                variant={variant}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className={isLight ? "text-slate-500" : "text-gray-400"}>No students match your search.</p>
          </div>
        )}
      </div>

      {totalStudentPages > 1 && filteredStudents.length > 0 && (
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
