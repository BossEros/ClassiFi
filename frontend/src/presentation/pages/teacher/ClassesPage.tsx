import { useEffect, useState, useRef, useMemo, useCallback } from "react"
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
import { getCurrentUser } from "@/business/services/authService"
import { getAllClasses } from "@/business/services/classService"
import { useToast } from "@/presentation/context/ToastContext"
import type { Class } from "@/business/models/dashboard/types"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"

export function ClassesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const hasShownDeleteToast = useRef(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [status, setStatus] = useState<FilterStatus>("active")
  const [selectedTerm, setSelectedTerm] = useState("all")
  const [selectedYearLevel, setSelectedYearLevel] = useState("all")
  const [currentUser] = useState(() => getCurrentUser())

  // Show toast if redirected from class deletion
  useEffect(() => {
    if (location.state?.deleted && !hasShownDeleteToast.current) {
      hasShownDeleteToast.current = true
      showToast("Class deleted successfully")
      // Clear state to prevent showing again on refresh
      navigate(location.pathname, { replace: true })
    }
  }, [location.state, location.pathname, showToast, navigate])

  const fetchData = useCallback(async () => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate("/login")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const activeOnlyParam = status === "active"

      const allClasses = await getAllClasses(
        parseInt(currentUser.id),
        activeOnlyParam,
      )

      setClasses(allClasses)
    } catch (err) {
      console.error("Failed to fetch classes:", err)
      setError("Failed to load classes. Please try refreshing the page.")
    } finally {
      setIsLoading(false)
    }
  }, [navigate, status])

  // Fetch classes when status changes (backend filter)
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Extract unique terms from classes for the dropdown
  const terms = useMemo(() => {
    const uniqueTerms = new Set<string>()
    classes.forEach((c) => {
      if (c.academicYear && c.semester) {
        uniqueTerms.add(`${c.academicYear} - Semester ${c.semester}`)
      }
    })
    return Array.from(uniqueTerms).sort().reverse() // Newest first
  }, [classes])

  // Extract unique year levels from classes
  const yearLevels = useMemo(() => {
    const uniqueLevels = new Set<string>(["1", "2", "3", "4"]) // Default year levels
    classes.forEach((c) => {
      if (c.yearLevel) {
        uniqueLevels.add(c.yearLevel.toString())
      }
    })
    return Array.from(uniqueLevels).sort() // Low to High
  }, [classes])

  // Client-side filtering for Search, Term, and Year Level (and strictly archived status)
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      // 1. Status Filter (Refinement)
      // Since backend 'activeOnly=false' returns ALL, we need to manually filter if 'archived' is selected
      if (status === "archived" && c.isActive) return false

      // 2. Term Filter
      if (selectedTerm !== "all") {
        const termString = `${c.academicYear} - Semester ${c.semester}`
        if (termString !== selectedTerm) return false
      }

      // 3. Year Level Filter
      if (selectedYearLevel !== "all") {
        if (c.yearLevel.toString() !== selectedYearLevel) return false
      }

      // 4. Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchName = c.className.toLowerCase().includes(query)
        const matchCode = c.classCode.toLowerCase().includes(query)
        if (!matchName && !matchCode) return false
      }

      return true
    })
  }, [classes, status, selectedTerm, selectedYearLevel, searchQuery])

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    status !== "active" ||
    selectedTerm !== "all" ||
    selectedYearLevel !== "all"

  const userInitials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user: currentUser, userInitials })

  return (
    <DashboardLayout topBar={topBar}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300">
              Classes
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Manage your courses and students
            </p>
          </div>
          <Button
            onClick={() => navigate("/dashboard/classes/new")}
            className="w-full md:w-auto px-6 bg-teal-600 hover:bg-teal-700 text-white border border-teal-500/40"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Class
          </Button>
        </div>

        {/* Filters */}
        <div className="p-1">
          <ClassFilters
            onSearchChange={setSearchQuery}
            onStatusChange={setStatus}
            onTermChange={setSelectedTerm}
            onYearLevelChange={setSelectedYearLevel}
            currentFilters={{
              searchQuery,
              status,
              selectedTerm,
              selectedYearLevel,
            }}
            terms={terms}
            yearLevels={yearLevels}
          />
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8"></div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
          <div className="w-1 h-full bg-red-500 rounded-full" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Classes Grid */}
      <Card className="border-none bg-transparent shadow-none backdrop-blur-none p-0">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-slate-300 animate-pulse">
                Loading your classes...
              </p>
            </div>
          ) : filteredClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {filteredClasses.map((classItem) => (
                <ClassCard
                  key={classItem.id}
                  classItem={classItem}
                  onClick={() => navigate(`/dashboard/classes/${classItem.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="w-full py-20 px-6 text-center bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                <Grid3x3 className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No classes found
              </h3>
              <p className="text-slate-300 max-w-sm min-w-[200px] mx-auto mb-8 whitespace-normal break-words">
                {hasActiveFilters
                  ? "We couldn't find any classes matching your current filters. Try adjusting them."
                  : "Get started by creating your first class to manage students and assignments."}
              </p>
              {!hasActiveFilters && (
                <Button
                  onClick={() => navigate("/dashboard/classes/new")}
                  className="w-auto bg-teal-600 hover:bg-teal-700 border border-teal-500/40"
                >
                  <Plus className="w-4 h-4 mr-2" />
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

