/**
 * Class Detail Page Component
 * Part of the Presentation Layer - Pages
 * Displays class details with assignments and students tabs
 */

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ClipboardList, Users, Plus, Trash2, Pencil, LogOut } from 'lucide-react'
import { DashboardLayout } from '@/presentation/components/dashboard/DashboardLayout'
import { Card, CardContent, CardHeader } from '@/presentation/components/ui/Card'
import { Button } from '@/presentation/components/ui/Button'
import { Tabs, TabPanel } from '@/presentation/components/ui/Tabs'
import { DropdownMenu } from '@/presentation/components/ui/DropdownMenu'
import { AssignmentCard } from '@/presentation/components/dashboard/AssignmentCard'
import { StudentListItem } from '@/presentation/components/dashboard/StudentListItem'
import { DeleteClassModal } from '@/presentation/components/forms/DeleteClassModal'
import { EditClassModal } from '@/presentation/components/forms/EditClassModal'
import { LeaveClassModal } from '@/presentation/components/forms/LeaveClassModal'
import { CreateAssignmentModal } from '@/presentation/components/forms/CreateAssignmentModal'
import { DeleteAssignmentModal } from '@/presentation/components/forms/DeleteAssignmentModal'
import { RemoveStudentModal } from '@/presentation/components/forms/RemoveStudentModal'
import { getCurrentUser } from '@/business/services/auth/authService'
import { getClassDetailData, deleteClass, deleteAssignment } from '@/business/services/class/classService'
import { useToast } from '@/shared/context/ToastContext'
import type { User } from '@/business/models/auth/types'
import type { Class, Assignment, EnrolledStudent } from '@/business/models/dashboard/types'

type TabType = 'assignments' | 'students'

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
  const [activeTab, setActiveTab] = useState<TabType>('assignments')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [isCreateAssignmentModalOpen, setIsCreateAssignmentModalOpen] = useState(false)

  // Assignment management state
  const [isDeleteAssignmentModalOpen, setIsDeleteAssignmentModalOpen] = useState(false)
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null)
  const [isDeletingAssignment, setIsDeletingAssignment] = useState(false)
  const [assignmentToEdit, setAssignmentToEdit] = useState<Assignment | undefined>(undefined)

  // Student management state
  const [isRemoveStudentModalOpen, setIsRemoveStudentModalOpen] = useState(false)
  const [studentToRemove, setStudentToRemove] = useState<EnrolledStudent | null>(null)

  // Check if user is a teacher or student
  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'
  const isStudent = user?.role === 'student'

  const tabs = [
    { id: 'assignments', label: 'Coursework', icon: ClipboardList },
    { id: 'students', label: 'Students', icon: Users }
  ]

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate('/login')
      return
    }

    setUser(currentUser)

    // Fetch class data
    const fetchClassData = async () => {
      if (!classId) {
        setError('Class not found')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Only pass teacherId if user is actually a teacher
        const isTeacher = currentUser.role === 'teacher' || currentUser.role === 'admin'
        const data = await getClassDetailData(
          parseInt(classId),
          isTeacher ? parseInt(currentUser.id) : undefined
        )

        setClassInfo(data.classInfo)
        setAssignments(data.assignments)
        setStudents(data.students)
      } catch (err) {
        console.error('Failed to fetch class data:', err)
        setError('Failed to load class. Please try refreshing the page.')
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
      setStudents(students.filter(s => s.id !== studentToRemove.id))
      showToast('Student removed successfully')
      setStudentToRemove(null)
    }
  }

  const handleDeleteClass = async () => {
    if (!user || !classId) return

    try {
      setIsDeleting(true)
      await deleteClass(parseInt(classId), parseInt(user.id))
      navigate('/dashboard/classes', { state: { deleted: true } })
    } catch (err) {
      console.error('Failed to delete class:', err)
      setError('Failed to delete class. Please try again.')
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
    showToast('You have left the class')
    navigate('/dashboard')
  }

  const handleCreateAssignmentSuccess = async (assignment: Assignment) => {
    // Add new assignment to the list
    setAssignments([assignment, ...assignments])
    setAssignments([assignment, ...assignments])
    showToast('Coursework created successfully')
  }

  const handleUpdateAssignmentSuccess = async (updatedAssignment: Assignment) => {
    setAssignments(assignments.map(a => a.id === updatedAssignment.id ? updatedAssignment : a))
    setAssignmentToEdit(undefined)
    showToast('Coursework updated successfully')
  }

  const handleEditAssignment = (assignment: Assignment) => {
    setAssignmentToEdit(assignment)
    setIsCreateAssignmentModalOpen(true)
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
      setAssignments(assignments.filter(a => a.id !== assignmentToDelete.id))
      showToast('Coursework deleted successfully')
      setIsDeleteAssignmentModalOpen(false)
      setAssignmentToDelete(null)
    } catch (err) {
      console.error('Failed to delete assignment:', err)
      showToast('Failed to delete coursework', 'error')
    } finally {
      setIsDeletingAssignment(false)
    }
  }

  const handleEditClass = () => {
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = async () => {
    // Refresh class data after successful edit
    if (classId && user) {
      try {
        // Only pass teacherId if user is actually a teacher
        const data = await getClassDetailData(
          parseInt(classId),
          isTeacher ? parseInt(user.id) : undefined
        )
        setClassInfo(data.classInfo)
        setAssignments(data.assignments)
        setStudents(data.students)
        showToast('Class updated successfully')
      } catch (err) {
        console.error('Failed to refresh class data:', err)
      }
    }
  }

  const dropdownItems = [
    {
      id: 'edit',
      label: 'Edit Class',
      icon: Pencil,
      variant: 'default' as const,
      onClick: handleEditClass
    },
    {
      id: 'delete',
      label: 'Delete Class',
      icon: Trash2,
      variant: 'danger' as const,
      onClick: () => setIsDeleteModalOpen(true)
    }
  ]

  return (
    <DashboardLayout>
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
            <p className="text-gray-300 font-medium mb-2">Error Loading Class</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <Button
              onClick={() => navigate(isStudent ? '/dashboard' : '/dashboard/classes')}
              className="w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {isStudent ? 'Dashboard' : 'Classes'}
            </Button>
          </div>
        </div>
      ) : (
        /* Main Content */
        <>
      {/* Page Header */}
      <div className="mb-6">
        {/* Back button and title row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(isStudent ? '/dashboard' : '/dashboard/classes')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {classInfo?.name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-400">
                  Class Code: <span className="text-purple-400 font-mono">{classInfo?.code}</span>
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-sm text-gray-400">
                  {classInfo?.studentCount} {classInfo?.studentCount === 1 ? 'Student' : 'Students'}
                </span>
              </div>
            </div>
          </div>

          {/* Teacher controls: Edit and Delete */}
          {isTeacher && <DropdownMenu items={dropdownItems} />}

          {/* Student controls: Leave Class */}
          {isStudent && (
            <Button
              onClick={() => setIsLeaveModalOpen(true)}
              className="w-auto px-4 h-10 bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Leave Class
            </Button>
          )}
        </div>

        {/* Description if exists */}
        {classInfo?.description && (
          <p className="text-gray-400 text-sm mb-4 max-w-2xl">
            {classInfo.description}
          </p>
        )}

        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Tabs and Content */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={(tabId) => setActiveTab(tabId as TabType)}
            />
            {/* Only teachers can add assignments */}
            {isTeacher && activeTab === 'assignments' && (
              <Button
                onClick={() => setIsCreateAssignmentModalOpen(true)}
                className="w-auto px-4 h-10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Coursework
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <TabPanel>
              {assignments.length > 0 ? (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={assignment}
                      onClick={() => handleAssignmentClick(assignment.id)}
                      onEdit={isTeacher ? () => handleEditAssignment(assignment) : undefined}
                      onDelete={isTeacher ? () => handleDeleteAssignmentClick(assignment) : undefined}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <ClipboardList className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-300 font-medium mb-1">No coursework yet</p>
                  {isTeacher ? (
                    <>
                      <p className="text-sm text-gray-500 mb-4">
                        Create your first coursework to get started.
                      </p>
                      <Button
                        onClick={() => setIsCreateAssignmentModalOpen(true)}
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
            </TabPanel>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <TabPanel>
              {students.length > 0 ? (
                <div className="space-y-3">
                  {students.map((student) => (
                    <StudentListItem
                      key={student.id}
                      student={student}
                      onRemove={isTeacher ? () => handleRemoveStudentClick(student) : undefined}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <Users className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-300 font-medium mb-1">No students enrolled</p>
                  <p className="text-sm text-gray-500">
                    Share the class code <span className="text-purple-400 font-mono">{classInfo?.code}</span> with your students.
                  </p>
                </div>
              )}
            </TabPanel>
          )}
        </CardContent>
      </Card>

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

          {/* Edit Class Modal */}
          {classInfo && (
            <EditClassModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSuccess={handleEditSuccess}
              teacherId={parseInt(user.id)}
              classData={classInfo}
            />
          )}

          {/* Delete Assignment Modal */}
          <DeleteAssignmentModal
            isOpen={isDeleteAssignmentModalOpen}
            onClose={() => {
              setIsDeleteAssignmentModalOpen(false)
              setAssignmentToDelete(null)
            }}
            onConfirm={handleConfirmDeleteAssignment}
            isDeleting={isDeletingAssignment}
            assignmentTitle={assignmentToDelete?.title}
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
              studentName={studentToRemove.fullName}
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
          className={classInfo.name}
        />
      )}

      {/* Create Assignment Modal */}
      {isTeacher && classInfo && (
        <CreateAssignmentModal
          isOpen={isCreateAssignmentModalOpen}
          onClose={() => {
            setIsCreateAssignmentModalOpen(false)
            setAssignmentToEdit(undefined)
          }}
          onSuccess={assignmentToEdit ? handleUpdateAssignmentSuccess : handleCreateAssignmentSuccess}
          classId={parseInt(classId!)}
          teacherId={parseInt(user.id)}
          assignment={assignmentToEdit}
        />
      )}
        </>
      )}
    </DashboardLayout>
  )
}
