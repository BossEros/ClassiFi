import { Users } from "lucide-react"
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
}: StudentsTabContentProps) {
  if (students.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
          <Users className="w-8 h-8 text-gray-500" />
        </div>
        <p className="text-gray-300 font-medium mb-1">No students enrolled</p>
        <p className="text-sm text-gray-500">
          Share the class code{" "}
          <span className="text-teal-400 font-mono">{classCode}</span> with your
          students.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white">Enrolled Students</h2>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/10 text-gray-300">
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
            className="w-64 h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div className="border border-white/10 rounded-lg overflow-hidden bg-slate-900/50">
        <div
          className="grid gap-4 px-6 py-3 bg-slate-800/50 border-b border-white/10"
          style={{ gridTemplateColumns: studentGridTemplate }}
        >
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Student
          </div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Email Address
          </div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
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
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-400">No students match your search.</p>
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
        />
      )}
    </div>
  )
}
