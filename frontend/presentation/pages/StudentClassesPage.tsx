/**
 * Student Classes Page Component
 * Part of the Presentation Layer - Pages
 * Displays all enrolled classes for the student
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Grid3x3, Plus } from 'lucide-react'
import { DashboardLayout } from '@/presentation/components/dashboard/DashboardLayout'
import { Card, CardContent } from '@/presentation/components/ui/Card'
import { Button } from '@/presentation/components/ui/Button'
import { ClassCard } from '@/presentation/components/dashboard/ClassCard'
import { JoinClassModal } from '@/presentation/components/forms/JoinClassModal'
import { getCurrentUser } from '@/business/services/auth/authService'
import { getDashboardData } from '@/business/services/dashboard/studentDashboardService'
import { useToast } from '@/shared/context/ToastContext'
import type { User } from '@/business/models/auth/types'
import type { Class } from '@/business/models/dashboard/types'

export function StudentClassesPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate('/login')
      return
    }

    setUser(currentUser)

    // Fetch enrolled classes
    const fetchClasses = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getDashboardData(parseInt(currentUser.id))
        setClasses(data.enrolledClasses)
      } catch (err) {
        console.error('Failed to fetch classes:', err)
        setError('Failed to load classes. Please try refreshing the page.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchClasses()
  }, [navigate])

  const handleJoinSuccess = (classInfo: Class) => {
    // Add the new class to the list
    setClasses((prev) => [classInfo, ...prev])
    showToast(`Successfully joined ${classInfo.name}!`, 'success')
  }

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Grid3x3 className="w-6 h-6 text-white" />
            <h1 className="text-3xl font-bold text-white">My Classes</h1>
          </div>
          <Button
            onClick={() => setIsJoinModalOpen(true)}
            className="w-auto px-6"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Join a Class
          </Button>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4"></div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Classes Grid */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading classes...</p>
            </div>
          ) : classes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((classItem) => (
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
              <p className="text-gray-300 font-medium mb-1">No classes yet</p>
              <p className="text-sm text-gray-500 mb-4">
                Join a class using a class code from your teacher.
              </p>
              <Button
                onClick={() => setIsJoinModalOpen(true)}
                className="w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Join a Class
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Join Class Modal */}
      {user && (
        <JoinClassModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          onSuccess={handleJoinSuccess}
          studentId={user.id}
        />
      )}
    </DashboardLayout>
  )
}
