/**
 * Student Dashboard Page Component
 * Part of the Presentation Layer - Pages
 * Main dashboard view for students with My Classes and Pending Assignments panels
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Grid3x3, FileText, Plus } from 'lucide-react'
import { DashboardLayout } from '@/presentation/components/dashboard/DashboardLayout'
import { ClassCard } from '@/presentation/components/dashboard/ClassCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/Card'
import { Button } from '@/presentation/components/ui/Button'
import { JoinClassModal } from '@/presentation/components/forms/JoinClassModal'
import { getCurrentUser } from '@/business/services/auth/authService'
import { getDashboardData } from '@/business/services/dashboard/studentDashboardService'
import { useToast } from '@/shared/context/ToastContext'
import type { User } from '@/business/models/auth/types'
import type { Class, Task } from '@/business/models/dashboard/types'

export function StudentDashboardPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [enrolledClasses, setEnrolledClasses] = useState<Class[]>([])
  const [pendingAssignments, setPendingAssignments] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)

  const fetchDashboardData = async (studentId: number) => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await getDashboardData(studentId)
      setEnrolledClasses(data.enrolledClasses)
      setPendingAssignments(data.pendingAssignments)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError('Failed to load dashboard data. Please try refreshing the page.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate('/login')
      return
    }

    setUser(currentUser)
    fetchDashboardData(currentUser.id)
  }, [navigate])

  const handleJoinClass = () => {
    setIsJoinModalOpen(true)
  }

  const handleJoinSuccess = (classInfo: Class) => {
    // Add the new class to the list
    setEnrolledClasses((prev) => [classInfo, ...prev])
    showToast(`Successfully joined ${classInfo.name}!`, 'success')
  }

  const formatDeadline = (deadline: Date) => {
    const now = new Date()
    const diff = deadline.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

    if (days < 0) return 'Overdue'
    if (days === 0) return 'Due today'
    if (days === 1) return 'Due tomorrow'
    return `Due in ${days} days`
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <Home className="w-5 h-5 text-purple-300" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Home</h1>
        </div>
        <p className="text-gray-300 ml-11 text-sm">
          Welcome back, <span className="text-white font-semibold">{user.firstName}</span>! Here's what's happening today.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* My Classes Panel */}
        <Card className="lg:col-span-7 h-fit">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">My Classes</CardTitle>
                <CardDescription className="text-sm mt-1.5">
                  Classes you're enrolled in
                </CardDescription>
              </div>
              <Button
                onClick={handleJoinClass}
                className="w-auto px-4 h-9"
              >
                <Plus className="w-4 h-4 mr-2" />
                Join Class
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {enrolledClasses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {enrolledClasses.map((classItem) => (
                  <ClassCard
                    key={classItem.id}
                    classItem={classItem}
                    onClick={() => navigate(`/dashboard/classes/${classItem.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <Grid3x3 className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-300 font-semibold text-sm mb-1.5">No classes yet</p>
                <p className="text-xs text-gray-500 mb-4">
                  Join a class using a class code from your teacher.
                </p>
                <Button
                  onClick={handleJoinClass}
                  className="w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Join Class
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Assignments Panel */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Pending</CardTitle>
            <CardDescription className="text-sm mt-1.5">
              Assignments that need your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingAssignments.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {pendingAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    onClick={() => navigate(`/dashboard/assignments/${assignment.id}`)}
                    className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                  >
                    <h4 className="text-sm font-medium text-white mb-1 truncate">
                      {assignment.title}
                    </h4>
                    <p className="text-xs text-gray-400 mb-2 truncate">
                      {assignment.className}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {assignment.programmingLanguage}
                      </span>
                      <span className={`text-xs font-medium ${
                        new Date(assignment.deadline) < new Date()
                          ? 'text-red-400'
                          : 'text-purple-400'
                      }`}>
                        {formatDeadline(new Date(assignment.deadline))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-300 font-semibold text-sm mb-1.5">All caught up!</p>
                <p className="text-xs text-gray-500">
                  New assignments will appear here when assigned.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Join Class Modal */}
      <JoinClassModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSuccess={handleJoinSuccess}
        studentId={user.id}
      />
    </DashboardLayout>
  )
}
