import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Users, Grid3x3, FileText, Activity, UserPlus, Settings, RefreshCw, Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/presentation/components/dashboard/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/Card'
import { getCurrentUser } from '@/business/services/authService'
import * as adminService from '@/business/services/adminService'
import type { AdminStats, ActivityItem } from '@/business/services/adminService'
import type { User } from '@/business/models/auth/types'

interface DashboardStat {
    label: string
    value: string
    change: string
    trend: 'up' | 'down' | 'neutral'
    icon: any
    color: string
}

export function AdminDashboardPage() {
    const navigate = useNavigate()
    const [user, setUser] = useState<User | null>(null)
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [activity, setActivity] = useState<ActivityItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)
            const [statsData, activityData] = await Promise.all([
                adminService.getAdminStats(),
                adminService.getRecentActivity(10)
            ])
            setStats(statsData)
            setActivity(activityData)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        const currentUser = getCurrentUser()
        if (!currentUser) {
            navigate('/login')
            return
        }
        if (currentUser.role !== 'admin') {
            navigate('/dashboard')
            return
        }
        setUser(currentUser)
        fetchData()
    }, [navigate, fetchData])

    // Format stats for display
    const displayStats: DashboardStat[] = stats ? [
        { label: 'Total Users', value: stats.totalUsers.toLocaleString(), change: `${stats.totalStudents} students, ${stats.totalTeachers} teachers`, trend: 'neutral', icon: Users, color: 'text-blue-400' },
        { label: 'Active Classes', value: `${stats.activeClasses}/${stats.totalClasses}`, change: `${stats.totalClasses} total`, trend: 'up', icon: Grid3x3, color: 'text-purple-400' },
        { label: 'Total Submissions', value: stats.totalSubmissions.toLocaleString(), change: 'All time', trend: 'up', icon: FileText, color: 'text-green-400' },
        { label: 'Plagiarism Reports', value: stats.totalPlagiarismReports.toLocaleString(), change: 'Analyses', trend: 'neutral', icon: Activity, color: 'text-orange-400' },
    ] : []

    const formatRelativeTime = (timestamp: string) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    }

    return (
        <DashboardLayout>
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20">
                            <Home className="w-5 h-5 text-blue-300" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Dashboard</h1>
                            {user && (
                                <p className="text-gray-300 text-sm">
                                    Welcome back, <span className="text-white font-semibold">{user.firstName}</span>!
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={fetchData}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {displayStats.map((stat, index) => (
                            <Card key={index} className="border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                                            <stat.icon className="w-5 h-5" />
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.trend === 'up' ? 'bg-green-500/10 text-green-400' :
                                            stat.trend === 'down' ? 'bg-red-500/10 text-red-400' : 'bg-gray-500/10 text-gray-400'
                                            }`}>
                                            {stat.change}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                                        <p className="text-sm text-gray-400">{stat.label}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Recent Activity Panel */}
                        <Card className="lg:col-span-2 border-white/5 bg-white/5">
                            <CardHeader>
                                <CardTitle className="text-lg">Recent Activity</CardTitle>
                                <CardDescription>Latest actions across the platform</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {activity.length > 0 ? (
                                        activity.map((item) => (
                                            <div key={item.id} className="flex items-start gap-4">
                                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white ring-2 ring-white/5">
                                                    {item.user.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-gray-300">
                                                        <span className="font-semibold text-white">{item.user}</span> {item.description} <span className="text-blue-300">{item.target}</span>
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">{formatRelativeTime(item.timestamp)}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-4">No recent activity</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions Panel */}
                        <Card className="border-white/5 bg-white/5">
                            <CardHeader>
                                <CardTitle className="text-lg">Quick Actions</CardTitle>
                                <CardDescription>Common administrative tasks</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <button
                                    onClick={() => navigate('/dashboard/users')}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                                >
                                    <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 group-hover:text-purple-200 group-hover:bg-purple-500/30 transition-colors">
                                        <UserPlus className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-white">Manage Users</p>
                                        <p className="text-xs text-gray-400">View and manage all users</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => navigate('/dashboard/settings')}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                                >
                                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 group-hover:text-blue-200 group-hover:bg-blue-500/30 transition-colors">
                                        <Settings className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-white">System Settings</p>
                                        <p className="text-xs text-gray-400">Configure global preferences</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => navigate('/dashboard/classes')}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                                >
                                    <div className="p-2 rounded-lg bg-green-500/20 text-green-300 group-hover:text-green-200 group-hover:bg-green-500/30 transition-colors">
                                        <Grid3x3 className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-white">Manage Classes</p>
                                        <p className="text-xs text-gray-400">View and edit all classes</p>
                                    </div>
                                </button>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </DashboardLayout>
    )
}
