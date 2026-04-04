import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Grid3x3, Plus } from "lucide-react"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import { Card, CardContent } from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import { ClassCard } from "@/presentation/components/shared/dashboard/ClassCard"
import {
  ClassFilters,
  type FilterStatus,
} from "@/presentation/components/shared/dashboard/ClassFilters"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { getAllClasses } from "@/business/services/classService"
import { useToastStore } from "@/shared/store/useToastStore"
import type { Class } from "@/business/models/dashboard/types"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import { dashboardTheme } from "@/presentation/constants/dashboardTheme"

export function ClassesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const showToast = useToastStore((state) => state.showToast)
  const hasShownDeleteToast = useRef(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [status, setStatus] = useState<FilterStatus>("active")
  const currentUser = useAuthStore((state) => state.user)

  useEffect(() => {
    if (location.state?.deleted && !hasShownDeleteToast.current) {
      hasShownDeleteToast.current = true
      showToast("Class deleted successfully")
      navigate(location.pathname, { replace: true })
    }
  }, [location.state, location.pathname, showToast, navigate])

  const fetchData = useCallback(async () => {
    if (!currentUser) {
      navigate("/login")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const allClasses = await getAllClasses(
        parseInt(currentUser.id),
        status === "active",
      )

      setClasses(allClasses)
    } catch {
      setError("Failed to load classes. Please try refreshing the page.")
    } finally {
      setIsLoading(false)
    }
  }, [currentUser, navigate, status])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredClasses = useMemo(() => {
    return classes.filter((classRecord) => {
      if (status === "active" && !classRecord.isActive) {
        return false
      }

      if (status === "archived" && classRecord.isActive) {
        return false
      }

      if (searchQuery) {
        const normalizedQuery = searchQuery.toLowerCase()
        const matchesName = classRecord.className.toLowerCase().includes(normalizedQuery)
        const matchesCode = classRecord.classCode.toLowerCase().includes(normalizedQuery)

        if (!matchesName && !matchesCode) {
          return false
        }
      }

      return true
    })
  }, [classes, searchQuery, status])

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    status !== "active"

  const userInitials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user: currentUser, userInitials })

  return (
    <DashboardLayout topBar={topBar}>
      <div className="mb-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className={dashboardTheme.pageTitle}>Classes</h1>
            <p className={dashboardTheme.pageSubtitle}>
              Manage your courses and students
            </p>
          </div>
          <Button
            onClick={() => navigate("/dashboard/classes/new")}
            className="w-full border border-teal-500/40 bg-teal-600 px-6 text-white hover:bg-teal-700 md:w-auto"
            disabled={isLoading}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Class
          </Button>
        </div>

        <ClassFilters
          onSearchChange={setSearchQuery}
          onStatusChange={setStatus}
          currentFilters={{
            searchQuery,
            status,
          }}
        />

        <div className={`mb-8 ${dashboardTheme.divider}`}></div>
      </div>

      {error && (
        <div className={dashboardTheme.errorSurface}>
          <div className="h-full w-1 rounded-full bg-rose-500" />
          <p className="text-sm font-medium text-rose-700">{error}</p>
        </div>
      )}

      <Card className="border-none bg-transparent p-0 shadow-none backdrop-blur-none">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 text-center">
              <div
                className={`mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 ${dashboardTheme.spinnerTrack} ${dashboardTheme.spinnerHead}`}
              ></div>
              <p className={`${dashboardTheme.loadingText} animate-pulse`}>
                Loading your classes...
              </p>
            </div>
          ) : filteredClasses.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 md:grid-cols-2 lg:grid-cols-3">
              {filteredClasses.map((classItem, classIndex) => (
                <ClassCard
                  key={classItem.id}
                  classItem={classItem}
                  variant="dashboard"
                  accentIndex={classIndex}
                  onClick={() => navigate(`/dashboard/classes/${classItem.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className={dashboardTheme.emptySurface}>
              <div className={dashboardTheme.emptyIconSurface}>
                <Grid3x3 className="h-10 w-10 text-slate-500" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-slate-800">
                No classes found
              </h3>
              <p className="mx-auto mb-8 max-w-sm min-w-[200px] whitespace-normal break-words text-slate-500">
                {hasActiveFilters
                  ? "We couldn't find any classes matching your current filters. Try adjusting them."
                  : "Get started by creating your first class to manage students and assignments."}
              </p>
              {!hasActiveFilters && (
                <Button
                  onClick={() => navigate("/dashboard/classes/new")}
                  className="w-auto border border-teal-500/40 bg-teal-600 hover:bg-teal-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create a Class
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
