/**
 * Class Detail Page Component
 * Part of the Presentation Layer - Pages
 * Displays class details with assignments and students tabs
 */

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ClipboardList, Users, Plus, Trash2, Pencil } from 'lucide-react'
import { DashboardLayout } from '@/presentation/components/dashboard/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/Card'
import { Button } from '@/presentation/components/ui/Button'
import { Tabs, TabPanel } from '@/presentation/components/ui/Tabs'
import { DropdownMenu } from '@/presentation/components/ui/DropdownMenu'
import { AssignmentCard } from '@/presentation/components/dashboard/AssignmentCard'
import { StudentListItem } from '@/presentation/components/dashboard/StudentListItem'
import { DeleteClassModal } from '@/presentation/components/forms/DeleteClassModal'
import { EditClassModal } from '@/presentation/components/forms/EditClassModal'
import { getCurrentUser } from '@/business/services/auth/authService'
import { getClassDetailData, deleteClass } from '@/business/services/class/classService'
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

  const tabs = [
    { id: 'assignments', label: 'Assignments', icon: ClipboardList },
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

        const data = await getClassDetailData(
          parseInt(classId),
          parseInt(currentUser.id)
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
    // TODO: Navigate to assignment details page
    console.log('Navigate to assignment:', assignmentId)
  }

  const handleEditClass = () => {
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = async () => {
    // Refresh class data after successful edit
    if (classId && user) {
      try {
        const data = await getClassDetailData(
          parseInt(classId),
          parseInt(user.id)
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

  if (isLoading || !user) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading class...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error && !classInfo) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-gray-300 font-medium mb-2">Error Loading Class</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <Button
              onClick={() => navigate('/dashboard/classes')}
              className="w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Classes
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-6">
        {/* Back button and title row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/classes')}
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

          <DropdownMenu items={dropdownItems} />
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
            {activeTab === 'assignments' && (
              <Button
                onClick={() => {
                  // TODO: Open create assignment modal
                  console.log('Create assignment')
                }}
                className="w-auto px-4 h-10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Assignment
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
                    />
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                    <ClipboardList className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-300 font-medium mb-1">No assignments yet</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Create your first assignment to get started.
                  </p>
                  <Button
                    onClick={() => {
                      // TODO: Open create assignment modal
                      console.log('Create assignment')
                    }}
                    className="w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Assignment
                  </Button>
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
    </DashboardLayout>
  )
}
