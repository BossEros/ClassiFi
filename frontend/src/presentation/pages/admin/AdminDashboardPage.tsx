import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircle,
  ArrowRight,
  BookMarked,
  GraduationCap,
  Loader2,
  RefreshCw,
  ScanSearch,
  SlidersHorizontal,
  UserCog,
  type LucideIcon,
} from "lucide-react"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import { SummaryStatCard } from "@/presentation/components/ui/SummaryStatCard"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/Card"
import * as adminService from "@/business/services/adminService"
import type { ActivityItem, AdminStats } from "@/business/services/adminService"
import { formatTimeAgo } from "@/presentation/utils/dateUtils"
import { useAuthStore } from "@/shared/store/useAuthStore"

interface DashboardStat {
  label: string
  value: string
  helperText?: string
  icon: LucideIcon
  iconClassName: string
}

interface DashboardQuickAction {
  title: string
  description: string
  icon: LucideIcon
  destination: string
  iconClassName: string
}

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [statsData, activityData] = await Promise.all([
        adminService.getAdminStats(),
        adminService.getRecentActivity(10),
      ])

      setStats(statsData)
      setActivity(activityData)
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load dashboard data",
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }

    if (user.role !== "admin") {
      navigate("/dashboard")
      return
    }

    void fetchDashboardData()
  }, [user, navigate, fetchDashboardData])

  const displayStats: DashboardStat[] = stats
    ? [
        {
          label: "Total Students",
          value: stats.totalStudents.toLocaleString(),
          icon: GraduationCap,
          iconClassName: "h-8 w-8 text-sky-600 stroke-[2.25]",
        },
        {
          label: "Total Teachers",
          value: stats.totalTeachers.toLocaleString(),
          icon: UserCog,
          iconClassName: "h-8 w-8 text-teal-600 stroke-[2.25]",
        },
        {
          label: "Active Classes",
          value: stats.activeClasses.toLocaleString(),
          icon: BookMarked,
          iconClassName: "h-8 w-8 text-emerald-600 stroke-[2.25]",
        },
      ]
    : []

  const quickActions: DashboardQuickAction[] = [
    {
      title: "Manage Users",
      description: "View and update platform users and roles.",
      icon: UserCog,
      destination: "/dashboard/users",
      iconClassName: "text-teal-600 stroke-[2.35]",
    },
    {
      title: "System Settings",
      description: "Review shared platform preferences and account settings.",
      icon: SlidersHorizontal,
      destination: "/dashboard/settings",
      iconClassName: "text-sky-600 stroke-[2.35]",
    },
    {
      title: "Manage Classes",
      description: "Open class management to review active and archived classes.",
      icon: BookMarked,
      destination: "/dashboard/classes",
      iconClassName: "text-emerald-600 stroke-[2.35]",
    },
  ]

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user, userInitials })

  return (
    <DashboardLayout topBar={topBar}>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Admin Dashboard
            </h1>
            {user ? (
              <p className="mt-2 text-sm text-slate-500">
                Welcome back, {" "}
                <span className="font-semibold text-slate-900">
                  {user.firstName}
                </span>
                .
              </p>
            ) : null}
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
            <p>{error}</p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-md shadow-slate-200/80">
            <div className="flex items-center gap-3 text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin text-sky-600" />
              <span className="text-sm font-medium">
                Loading admin dashboard data...
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {displayStats.map((stat) => (
                <SummaryStatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  helperText={stat.helperText}
                  icon={stat.icon}
                  variant="light"
                  className="rounded-3xl border-slate-300 shadow-md shadow-slate-200/80 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-300/70"
                  iconContainerClassName="h-auto w-auto rounded-none bg-transparent p-0"
                  iconClassName={stat.iconClassName}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="rounded-3xl border-slate-300 bg-white shadow-md shadow-slate-200/80 lg:col-span-2">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Recent Activity
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    Latest actions across the platform.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {activity.length > 0 ? (
                    <div className="divide-y divide-slate-200">
                      {activity.map((activityItem) => (
                        <div
                          key={activityItem.id}
                          className="flex items-start gap-4 px-6 py-5 transition-colors hover:bg-slate-50"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 shadow-sm">
                            {activityItem.user.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-6 text-slate-600">
                              <span className="font-semibold text-slate-900">
                                {activityItem.user}
                              </span>{" "}
                              {activityItem.description}{" "}
                              <span className="font-medium text-sky-700">
                                {activityItem.target}
                              </span>
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-400">
                              {formatTimeAgo(activityItem.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-6 py-12 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 shadow-sm">
                        <ScanSearch className="h-5 w-5 text-slate-500 stroke-[2.2]" />
                      </div>
                      <p className="mt-4 text-sm font-semibold text-slate-700">
                        No recent activity
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        New admin and platform actions will appear here.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-300 bg-white shadow-md shadow-slate-200/80">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Quick Actions
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    Common administrative tasks.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 px-6 pb-6 pt-4">
                  {quickActions.map((quickAction) => (
                    <button
                      key={quickAction.title}
                      onClick={() => navigate(quickAction.destination)}
                      className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md hover:shadow-slate-200/70"
                    >
                      <quickAction.icon
                        className={`h-5 w-5 shrink-0 ${quickAction.iconClassName}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">
                          {quickAction.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {quickAction.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600" />
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}





