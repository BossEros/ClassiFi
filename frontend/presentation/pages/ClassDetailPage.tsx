import { useEffect, useState, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ClipboardList, Users, Plus } from "lucide-react"
import { DashboardLayout } from "@/presentation/components/dashboard/DashboardLayout"
import { Button } from "@/presentation/components/ui/Button"
import { BackButton } from "@/presentation/components/ui/BackButton"
import { ClassHeader } from "@/presentation/components/dashboard/ClassHeader"
import { ClassTabs } from "@/presentation/components/dashboard/ClassTabs"
import { AssignmentFilterBar } from "@/presentation/components/dashboard/AssignmentFilterBar"
import { AssignmentSection } from "@/presentation/components/dashboard/AssignmentSection"
import { StudentListItem } from "@/presentation/components/dashboard/StudentListItem"
import { Pagination } from "@/presentation/components/ui/Pagination"
import { DeleteClassModal } from "@/presentation/components/forms/DeleteClassModal"
import { LeaveClassModal } from "@/presentation/components/forms/LeaveClassModal"
import { DeleteAssignmentModal } from "@/presentation/components/forms/DeleteAssignmentModal"
import { RemoveStudentModal } from "@/presentation/components/forms/RemoveStudentModal"
import { getCurrentUser } from "@/business/services/authService"
import type { ClassTab } from "@/shared/types/class"
import {
  getClassDetailData,
  deleteClass,
  deleteAssignment,
} from "@/business/services/classService"
import { useToast } from "@/shared/context/ToastContext"
import { useTopBar } from "@/presentation/components/dashboard/TopBar"
import type { User } from "@/business/models/auth/types"
import type {
  Class,
  Assignment,
  EnrolledStudent,
} from "@/business/models/dashboard/types"
import type { AssignmentFilter } from "@/shared/utils/assignmentFilters"
import {
  filterAssignments,
  groupAssignments,
  calculateFilterCounts,
} from "@/shared/utils/assignmentFilters"

const STUDENTS_PER_PAGE = 10

export function ClassDetailPage() {
  const navigate = useNavigate()
  const { classId } = useParams<{ classId: string }>()
  const { showToast } = useToast()

  const [user, setUser] = useState<User | null>(null)
  const [classInfo, setClassInfo] = useState<Class | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [students, setStudents] = useState<EnrolledStudent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ClassTab>("coursework")
  const [assignmentFilter, setAssignmentFilter] =
    useState<AssignmentFilter>("all")
  const [currentStudentPage, setCurrentStudentPage] = useState(1)
  const [studentSearchQuery, setStudentSearchQuery] = useState("")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)

  // Assignment management state
  const [isDeleteAssignmentModalOpen, setIsDeleteAssignmentModalOpen] =
    useState(false)
  const [assignmentToDelete, setAssignmentToDelete] =
    useState<Assignment | null>(null)
  const [isDeletingAssignment, setIsDeletingAssignment] = useState(false)

  // Student management state
  const [isRemoveStudentModalOpen, setIsRemoveStudentModalOpen] =
    useState(false)
  const [studentToRemove, setStudentToRemove] =
    useState<EnrolledStudent | null>(null)

  // Check if user is a teacher or student
  const isTeacher = user?.role === "teacher" || user?.role === "admin"
  const isStudent = user?.role === "student"

  // Derived state for filtered and grouped assignments
  const filteredAssignments = useMemo(
    () => filterAssignments(assignments, assignmentFilter),
    [assignments, assignmentFilter],
  )

  const groupedAssignments = useMemo(
    () => groupAssignments(filteredAssignments),
    [filteredAssignments],
  )

  const filterCounts = useMemo(
    () => calculateFilterCounts(assignments),
    [assignments],
  )

  // Pagination calculations for students
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) {
      return students
    }

    const query = studentSearchQuery.toLowerCase()
    return students.filter(
      (student) =>
        student.fullName?.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.firstName.toLowerCase().includes(query) ||
        student.lastName.toLowerCase().includes(query)
    )
  }, [students, studentSearchQuery])

  const totalStudentPages = useMemo(
    () => Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE),
    [filteredStudents.length],
  )

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentStudentPage - 1) * STUDENTS_PER_PAGE
    const endIndex = startIndex + STUDENTS_PER_PAGE
    return filteredStudents.slice(startIndex, endIndex)
  }, [filteredStudents, currentStudentPage])

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate("/login")
      return
    }

    setUser(currentUser)

    // Fetch class data
    const fetchClassData = async () => {
      if (!classId) {
        setError("Class not found")
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Only pass teacherId if user is actually a teacher
        const isTeacher =
          currentUser.role === "teacher" || currentUser.role === "admin"
        const data = await getClassDetailData(
          parseInt(classId),
          isTeacher ? parseInt(currentUser.id) : undefined,
        )

        setClassInfo(data.classInfo)
        setAssignments(data.assignments)
        setStudents(data.students)
      } catch (err) {
        console.error("Failed to fetch class data:", err)
        setError("Failed to load class. Please try refreshing the page.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchClassData()
  }, [navigate, classId])

  const handleRemoveStudentClick = (student: EnrolledStudent) => {
    setStudentToRemove(student)
    setIsRemoveStudentModalOpen(true)
  }

  const handleRemoveStudentSuccess = () => {
    if (studentToRemove) {
      const updatedStudents = students.filter((s) => s.id !== studentToRemove.id)
      setStudents(updatedStudents)

      // If current page becomes empty, go to previous page
      const newTotalPages = Math.ceil(updatedStudents.length / STUDENTS_PER_PAGE)
      if (currentStudentPage > newTotalPages && newTotalPages > 0) {
        setCurrentStudentPage(newTotalPages)
      }

      showToast("Student removed successfully")
      setStudentToRemove(null)
    }
  }

  const handleStudentPageChange = (page: number) => {
    setCurrentStudentPage(page)
  }

  const handleTabChange = (tab: ClassTab) => {
    setActiveTab(tab)
    // Reset to page 1 when switching to students tab
    if (tab === "students") {
      setCurrentStudentPage(1)
    }
  }

  const handleDeleteClass = async () => {
    if (!user || !classId) return

    try {
      setIsDeleting(true)
      await deleteClass(parseInt(classId), parseInt(user.id))
      navigate("/dashboard/classes", { state: { deleted: true } })
    } catch (err) {
      console.error("Failed to delete class:", err)
      setError("Failed to delete class. Please try again.")
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
    }
  }

  const handleAssignmentClick = (assignmentId: number) => {
    // Teachers see submissions page, students see assignment detail page
    if (isTeacher) {
      navigate(`/dashboard/assignments/${assignmentId}/submissions`)
    } else {
      navigate(`/dashboard/assignments/${assignmentId}`)
    }
  }

  const handleLeaveSuccess = () => {
    showToast("You have left the class")
    navigate("/dashboard")
  }

  const handleEditAssignment = (assignment: Assignment) => {
    navigate(`/dashboard/classes/${classId}/coursework/${assignment.id}/edit`)
  }

  const handleDeleteAssignmentClick = (assignment: Assignment) => {
    setAssignmentToDelete(assignment)
    setIsDeleteAssignmentModalOpen(true)
  }

  const handleConfirmDeleteAssignment = async () => {
    if (!user || !assignmentToDelete) return

    try {
      setIsDeletingAssignment(true)
      await deleteAssignment(assignmentToDelete.id, parseInt(user.id))

      // Remove from list
      setAssignments(assignments.filter((a) => a.id !== assignmentToDelete.id))
      showToast("Coursework deleted successfully")
      setIsDeleteAssignmentModalOpen(false)
      setAssignmentToDelete(null)
    } catch (err) {
      console.error("Failed to delete assignment:", err)
      showToast("Failed to delete coursework", "error")
    } finally {
      setIsDeletingAssignment(false)
    }
  }

  const handleEditClass = () => {
    navigate(`/dashboard/classes/${classId}/edit`)
  }

  const handleViewGradebook = () => {
    navigate(`/dashboard/classes/${classId}/gradebook`)
  }

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user, userInitials })

  return (
    <DashboardLayout topBar={topBar}>
      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading class...</p>
          </div>
        </div>
      ) : error && !classInfo ? (
        /* Error State */
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-gray-300 font-medium mb-2">
              Error Loading Class
            </p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <BackButton
              to={isStudent ? "/dashboard" : "/dashboard/classes"}
              label={`Back to ${isStudent ? "Dashboard" : "Classes"}`}
              className="mx-auto"
            />
          </div>
        </div>
      ) : (
        /* Main Content */
        <>
          {/* Back Button */}
          <div className="mb-6">
            <BackButton to={isStudent ? "/dashboard" : "/dashboard/classes"} />
          </div>

          {/* Class Header */}
          <ClassHeader
            className="mb-6"
            classNameTitle={classInfo?.className || ""}
            instructorName={classInfo?.teacherName || "Unknown"}
            description={classInfo?.description || undefined}
            schedule={{
              days: classInfo?.schedule?.days || [],
              startTime: classInfo?.schedule?.startTime || "",
              endTime: classInfo?.schedule?.endTime || "",
            }}
            studentCount={classInfo?.studentCount || 0}
            isTeacher={isTeacher}
            onEditClass={handleEditClass}
            onDeleteClass={() => setIsDeleteModalOpen(true)}
            onLeaveClass={() => setIsLeaveModalOpen(true)}
            onViewGradebook={handleViewGradebook}
          />

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Tabs and Content */}
          <div className="bg-slate-900 border border-white/10 rounded-lg p-6">
            <ClassTabs activeTab={activeTab} onTabChange={handleTabChange}>
              {/* Coursework Tab */}
              {activeTab === "coursework" && (
                <div className="space-y-6">
                  {/* Filter Bar and Add Button */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <AssignmentFilterBar
                      activeFilter={assignmentFilter}
                      onFilterChange={setAssignmentFilter}
                      counts={filterCounts}
                    />
                    {isTeacher && (
                      <Button
                        onClick={() =>
                          navigate(
                            `/dashboard/classes/${classId}/coursework/new`,
                          )
                        }
                        className="w-full sm:w-auto"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Coursework
                      </Button>
                    )}
                  </div>

                  {/* Assignment Sections */}
                  {assignments.length > 0 ? (
                    <div className="space-y-6">
                      <AssignmentSection
                        title="CURRENT & UPCOMING"
                        assignments={groupedAssignments.current}
                        onAssignmentClick={handleAssignmentClick}
                        onEditAssignment={handleEditAssignment}
                        onDeleteAssignment={handleDeleteAssignmentClick}
                        isTeacher={isTeacher}
                      />
                      <AssignmentSection
                        title="PAST ASSIGNMENTS"
                        assignments={groupedAssignments.past}
                        onAssignmentClick={handleAssignmentClick}
                        onEditAssignment={handleEditAssignment}
                        onDeleteAssignment={handleDeleteAssignmentClick}
                        isTeacher={isTeacher}
                      />

                      {/* Empty state for filtered results */}
                      {filteredAssignments.length === 0 && (
                        <div className="py-12 text-center">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                            <ClipboardList className="w-8 h-8 text-gray-500" />
                          </div>
                          <p className="text-gray-300 font-medium mb-1">
                            No assignments match this filter
                          </p>
                          <p className="text-sm text-gray-500">
                            Try selecting a different filter to see more
                            assignments.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                        <ClipboardList className="w-8 h-8 text-gray-500" />
                      </div>
                      <p className="text-gray-300 font-medium mb-1">
                        No coursework yet
                      </p>
                      {isTeacher ? (
                        <>
                          <p className="text-sm text-gray-500 mb-4">
                            Create your first coursework to get started.
                          </p>
                          <Button
                            onClick={() =>
                              navigate(
                                `/dashboard/classes/${classId}/coursework/new`,
                              )
                            }
                            className="w-auto"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Coursework
                          </Button>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">
                          Your teacher hasn't created any coursework yet.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Students Tab */}
              {activeTab === "students" && (
                <div className="space-y-6">
                  {students.length > 0 ? (
                    <>
                      {/* Header with Search */}
                      <div className="flex items-center justify-between gap-4">
                        {/* Title with Count */}
                        <div className="flex items-center gap-3">
                          <h2 className="text-xl font-bold text-white">
                            Enrolled Students
                          </h2>
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/10 text-gray-300">
                            {students.length}
                          </span>
                        </div>

                        {/* Search */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search students..."
                            value={studentSearchQuery}
                            onChange={(e) => {
                              setStudentSearchQuery(e.target.value)
                              setCurrentStudentPage(1) // Reset to first page on search
                            }}
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

                      {/* Table Container */}
                      <div className="border border-white/10 rounded-lg overflow-hidden bg-slate-900/50">
                        {/* Table Header */}
                        <div className="grid grid-cols-[400px_470px_150px_60px] gap-4 px-6 py-3 bg-slate-800/50 border-b border-white/10">
                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Student
                          </div>
                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Email Address
                          </div>
                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Role
                          </div>
                          <div className="w-10"></div> {/* Space for remove button */}
                        </div>

                        {/* Student List */}
                        {filteredStudents.length > 0 ? (
                          <div>
                            {paginatedStudents.map((student, index) => (
                              <StudentListItem
                                key={student.id}
                                student={student}
                                isLast={index === paginatedStudents.length - 1}
                                onRemove={
                                  isTeacher
                                    ? () => handleRemoveStudentClick(student)
                                    : undefined
                                }
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="py-12 text-center">
                            <p className="text-gray-400">
                              No students match your search.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Pagination Controls */}
                      {totalStudentPages > 1 && filteredStudents.length > 0 && (
                        <Pagination
                          currentPage={currentStudentPage}
                          totalPages={totalStudentPages}
                          totalItems={filteredStudents.length}
                          itemsPerPage={STUDENTS_PER_PAGE}
                          onPageChange={handleStudentPageChange}
                        />
                      )}
                    </>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-500" />
                      </div>
                      <p className="text-gray-300 font-medium mb-1">
                        No students enrolled
                      </p>
                      <p className="text-sm text-gray-500">
                        Share the class code{" "}
                        <span className="text-teal-400 font-mono">
                          {classInfo?.classCode}
                        </span>{" "}
                        with your students.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Calendar Tab (Placeholder) */}
              {activeTab === "calendar" && (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <ClipboardList className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-300 font-medium mb-1">
                    Calendar Coming Soon
                  </p>
                  <p className="text-sm text-gray-500">
                    This feature is under development.
                  </p>
                </div>
              )}
            </ClassTabs>
          </div>

          {/* Teacher Modals */}
          {isTeacher && (
            <>
              {/* Delete Class Modal */}
              <DeleteClassModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteClass}
                isDeleting={isDeleting}
              />

              {/* Delete Assignment Modal */}
              <DeleteAssignmentModal
                isOpen={isDeleteAssignmentModalOpen}
                onClose={() => {
                  setIsDeleteAssignmentModalOpen(false)
                  setAssignmentToDelete(null)
                }}
                onConfirm={handleConfirmDeleteAssignment}
                isDeleting={isDeletingAssignment}
                assignmentTitle={assignmentToDelete?.assignmentName}
              />

              {/* Remove Student Modal */}
              {studentToRemove && classId && (
                <RemoveStudentModal
                  isOpen={isRemoveStudentModalOpen}
                  onClose={() => {
                    setIsRemoveStudentModalOpen(false)
                    setStudentToRemove(null)
                  }}
                  onSuccess={handleRemoveStudentSuccess}
                  classId={parseInt(classId)}
                  teacherId={parseInt(user.id)}
                  studentId={studentToRemove.id}
                  studentName={
                    [studentToRemove.firstName, studentToRemove.lastName]
                      .filter(Boolean)
                      .join(" ") ||
                    studentToRemove.fullName ||
                    ""
                  }
                />
              )}
            </>
          )}

          {/* Student Modals */}
          {isStudent && classInfo && (
            <LeaveClassModal
              isOpen={isLeaveModalOpen}
              onClose={() => setIsLeaveModalOpen(false)}
              onSuccess={handleLeaveSuccess}
              studentId={parseInt(user.id)}
              classId={parseInt(classId!)}
              className={classInfo.className}
            />
          )}
        </>
      )}
    </DashboardLayout>
  )
}
