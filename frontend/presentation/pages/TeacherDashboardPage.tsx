import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Grid3x3, ClipboardList } from 'lucide-react'
import { DashboardLayout } from '@/presentation/components/dashboard/DashboardLayout'
import { ClassCard } from '@/presentation/components/dashboard/ClassCard'
import { TaskCard } from '@/presentation/components/dashboard/TaskCard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/Card'
import { getCurrentUser } from '@/business/services/auth/authService'
import { getDashboardData } from '@/business/services/dashboard/teacherDashboardService'
import type { User } from '@/business/models/auth/types'
import type { Class, Task } from '@/business/models/dashboard/types'

export function TeacherDashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate('/login')
      return
    }

    setUser(currentUser)

    // Fetch dashboard data from API
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch dashboard data using the teacher's user ID
        const dashboardData = await getDashboardData(parseInt(currentUser.id))

        setClasses(dashboardData.recentClasses)
        setTasks(dashboardData.pendingTasks)
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        setError('Failed to load dashboard data. Please try refreshing the page.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [navigate])

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
        {user && (
          <p className="text-gray-300 ml-11 text-sm">
            Welcome back, <span className="text-white font-semibold">{user.firstName}</span>! Here's what's happening today.
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Recent Classes Panel */}
        <Card className="lg:col-span-7 h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Recent Classes</CardTitle>
            <CardDescription className="text-sm mt-1.5">
              Here you'll see the classes you've recently been active in
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading dashboard...</p>
              </div>
            ) : classes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
                <p className="text-gray-300 font-semibold text-sm mb-1.5">No recent classes found</p>
                <p className="text-xs text-gray-500">
                  Classes you've recently accessed will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* To-Check Panel */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">To-Check</CardTitle>
            <CardDescription className="text-sm mt-1.5">
              Tasks and assignments that need your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Loading...</p>
              </div>
            ) : tasks.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => {
                      // Placeholder: Navigate to task details
                      console.log('Navigate to task:', task.id)
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <ClipboardList className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-300 font-semibold text-sm mb-1.5">All caught up!</p>
                <p className="text-xs text-gray-500">
                  New tasks will appear here when they're assigned.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

