/**
 * Classes Page Component
 * Part of the Presentation Layer - Pages
 * Displays all classes for the teacher with ability to create new classes
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Grid3x3, Plus } from 'lucide-react'
import { DashboardLayout } from '@/presentation/components/dashboard/DashboardLayout'
import { Card, CardContent } from '@/presentation/components/ui/Card'
import { Button } from '@/presentation/components/ui/Button'
import { ClassCard } from '@/presentation/components/dashboard/ClassCard'
import { CreateClassModal } from '@/presentation/components/forms/CreateClassModal'
import { getCurrentUser } from '@/business/services/auth/authService'
import { getAllClasses } from '@/business/services/class/classService'
import type { User } from '@/business/models/auth/types'
import type { Class } from '@/business/models/dashboard/types'

export function ClassesPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate('/login')
      return
    }

    setUser(currentUser)

    // Fetch all classes
    const fetchClasses = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const allClasses = await getAllClasses(parseInt(currentUser.id))
        setClasses(allClasses)
      } catch (err) {
        console.error('Failed to fetch classes:', err)
        setError('Failed to load classes. Please try refreshing the page.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchClasses()
  }, [navigate])

  const handleCreateSuccess = async () => {
    // Refresh the classes list
    if (user) {
      try {
        const allClasses = await getAllClasses(parseInt(user.id))
        setClasses(allClasses)
      } catch (err) {
        console.error('Failed to refresh classes:', err)
      }
    }
  }

  if (isLoading || !user) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading classes...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Grid3x3 className="w-6 h-6 text-white" />
            <h1 className="text-3xl font-bold text-white">Classes</h1>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="w-auto px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create a Class
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
          {classes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((classItem) => (
                <ClassCard
                  key={classItem.id}
                  classItem={classItem}
                  onClick={() => {
                    // TODO: Navigate to class details
                    console.log('Navigate to class:', classItem.id)
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <Grid3x3 className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-gray-300 font-medium mb-1">No classes found</p>
              <p className="text-sm text-gray-500 mb-4">
                Create your first class to get started.
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create a Class
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Class Modal */}
      <CreateClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreateSuccess}
        teacherId={parseInt(user.id)}
      />
    </DashboardLayout>
  )
}

