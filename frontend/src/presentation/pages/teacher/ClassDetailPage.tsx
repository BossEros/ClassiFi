import { useEffect, useState, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ClipboardList, BarChart3 } from "lucide-react"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import { GradebookContent } from "@/presentation/components/teacher/gradebook/GradebookContent"
import { BackButton } from "@/presentation/components/ui/BackButton"
import { ClassHeader } from "@/presentation/components/shared/dashboard/ClassHeader"
import { ClassTabs } from "@/presentation/components/shared/dashboard/ClassTabs"
import { ClassCalendarTab } from "@/presentation/components/shared/calendar"
import { DeleteClassModal } from "@/presentation/components/teacher/forms/class/DeleteClassModal"
import { LeaveClassModal } from "@/presentation/components/shared/forms/LeaveClassModal"
import { RemoveStudentModal } from "@/presentation/components/teacher/forms/class/RemoveStudentModal"
import { AssignmentsTabContent } from "@/presentation/components/teacher/classDetail/AssignmentsTabContent"
import { StudentsTabContent } from "@/presentation/components/teacher/classDetail/StudentsTabContent"
import { useAuthStore } from "@/shared/store/useAuthStore"
import type { ClassTab } from "@/shared/types/class"
import {
  getClassDetailData,
  deleteClass,
} from "@/business/services/classService"
import { useToastStore } from "@/shared/store/useToastStore"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import type { User } from "@/business/models/auth/types"
import type {
  Class,
  Assignment,
  EnrolledStudent,
} from "@/business/models/dashboard/types"
import type {
  AssignmentFilter,
  TeacherAssignmentFilter,
} from "@/shared/utils/assignmentFilters"
import {
  filterAssignments,
  calculateFilterCounts,
  filterTeacherAssignmentsByTimeline,
  calculateTeacherFilterCounts,
  groupAssignments,
} from "@/shared/utils/assignmentFilters"
import { filterStudentsByQuery } from "@/presentation/pages/teacher/classDetail.helpers"

const STUDENTS_PER_PAGE = 10
const STUDENT_GRID_TEMPLATE = "400px 1fr 150px 60px"

/**
 * Displays detailed information about a class including assignments, students, and management options.
 *
 * @returns JSX.Element - The class detail page component with tabs for assignments and students
 */
export function ClassDetailPage() {
  const navigate = useNavigate()
  const { classId } = useParams<{ classId: string }>()
  const parsedClassId = classId ? parseInt(classId, 10) : 0
  const currentUser = useAuthStore((state) => state.user)
  const showToast = useToastStore((state) => state.showToast)

  const [user, setUser] = useState<User | null>(null)
  const [classInfo, setClassInfo] = useState<Class | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [students, setStudents] = useState<EnrolledStudent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ClassTab>("assignments")
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>("all")
  const [teacherAssignmentFilter, setTeacherAssignmentFilter] =
    useState<TeacherAssignmentFilter>("all")
  const [currentStudentPage, setCurrentStudentPage] = useState(1)
  const [studentSearchQuery, setStudentSearchQuery] = useState("")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)

  // Student management state
  const [isRemoveStudentModalOpen, setIsRemoveStudentModalOpen] = useState(false)
  const [studentToRemove, setStudentToRemove] = useState<EnrolledStudent | null>(null)

  // Check if user is a teacher or student
  const isTeacher = user?.role === "teacher" || user?.role === "admin"
  const isStudent = user?.role === "student"

  // Derived state for filtered and grouped assignments
  const filteredAssignments = useMemo(
    () => filterAssignments(assignments, assignmentFilter),
    [assignments, assignmentFilter],
  )

  const groupedAssignments = useMemo(
    () =>
      isTeacher
        ? filterTeacherAssignmentsByTimeline(
            assignments,
            teacherAssignmentFilter,
          )
        : groupAssignments(filteredAssignments),
    [isTeacher, assignments, teacherAssignmentFilter, filteredAssignments],
  )

  const filterCounts = useMemo(
    () => calculateFilterCounts(assignments),
    [assignments],
  )

  const teacherFilterCounts = useMemo(
    () => calculateTeacherFilterCounts(assignments),
    [assignments],
  )

  // Pagination calculations for students
  const filteredStudents = useMemo(
    () => filterStudentsByQuery(students, studentSearchQuery),
    [students, studentSearchQuery],
  )

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
  }, [navigate, classId, currentUser])

  const handleRemoveStudentClick = (student: EnrolledStudent) => {
    setStudentToRemove(student)
    setIsRemoveStudentModalOpen(true)
  }

  const handleRemoveStudentSuccess = () => {
    if (studentToRemove) {
      const updatedStudents = students.filter(
        (s) => s.id !== studentToRemove.id,
      )
      setStudents(updatedStudents)
      const filteredUpdatedStudents = filterStudentsByQuery(
        updatedStudents,
        studentSearchQuery,
      )

      // If current page becomes empty, go to previous page
      const newTotalPages = Math.ceil(
        filteredUpdatedStudents.length / STUDENTS_PER_PAGE,
      )
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

  const handleEditClass = () => {
    navigate(`/dashboard/classes/${classId}/edit`)
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
              {/* Assignments Tab */}
              {activeTab === "assignments" && (
                <AssignmentsTabContent
                  assignments={assignments}
                  groupedAssignments={groupedAssignments}
                  assignmentFilter={assignmentFilter}
                  filterCounts={filterCounts}
                  teacherAssignmentFilter={teacherAssignmentFilter}
                  teacherFilterCounts={teacherFilterCounts}
                  isTeacher={isTeacher}
                  onFilterChange={setAssignmentFilter}
                  onTeacherFilterChange={setTeacherAssignmentFilter}
                  onCreateAssignment={() =>
                    navigate(`/dashboard/classes/${classId}/assignments/new`)
                  }
                  onAssignmentClick={handleAssignmentClick}
                />
              )}

              {/* Students Tab */}
              {activeTab === "students" && (
                <StudentsTabContent
                  students={students}
                  filteredStudents={filteredStudents}
                  paginatedStudents={paginatedStudents}
                  isTeacher={isTeacher}
                  classCode={classInfo?.classCode}
                  studentSearchQuery={studentSearchQuery}
                  currentStudentPage={currentStudentPage}
                  totalStudentPages={totalStudentPages}
                  studentGridTemplate={STUDENT_GRID_TEMPLATE}
                  onStudentSearchQueryChange={(value) => {
                    setStudentSearchQuery(value)
                    setCurrentStudentPage(1)
                  }}
                  onRemoveStudent={handleRemoveStudentClick}
                  onStudentPageChange={handleStudentPageChange}
                />
              )}

              {/* Calendar Tab */}
              {activeTab === "calendar" && classInfo && (
                <ClassCalendarTab
                  classId={classInfo.id}
                  className={classInfo.className}
                />
              )}

              {activeTab === "grades" &&
                (isTeacher ? (
                  <GradebookContent
                    classId={parsedClassId}
                    classCode={classInfo?.classCode}
                  />
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                      <BarChart3 className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-300 font-medium mb-1">Grades Coming Soon</p>
                    <p className="text-sm text-gray-500">Your grades will be displayed here.</p>
                  </div>
                ))}
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
