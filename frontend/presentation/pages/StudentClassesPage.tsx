import { useEffect, useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Grid3x3, Plus, Bell, BookOpen } from "lucide-react"
import { DashboardLayout } from "@/presentation/components/dashboard/DashboardLayout"
import { Card, CardContent } from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import { Avatar } from "@/presentation/components/ui/Avatar"
import { ClassCard } from "@/presentation/components/dashboard/ClassCard"
import { JoinClassModal } from "@/presentation/components/forms/JoinClassModal"
import {
  ClassFilters,
  type FilterStatus,
} from "@/presentation/components/dashboard/ClassFilters"
import { getCurrentUser } from "@/business/services/authService"
import { getDashboardData } from "@/business/services/studentDashboardService"
import { useToast } from "@/shared/context/ToastContext"
import type { User } from "@/business/models/auth/types"
import type { Class } from "@/business/models/dashboard/types"

export function StudentClassesPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)

  // Filter States
  const [searchQuery, setSearchQuery] = useState("")
  const [status, setStatus] = useState<FilterStatus>("active")
  const [selectedTerm, setSelectedTerm] = useState("all")
  const [selectedYearLevel, setSelectedYearLevel] = useState("all")

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate("/login")
      return
    }

    setUser(currentUser)

    // Fetch enrolled classes
    const fetchClasses = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getDashboardData(parseInt(currentUser.id))
        // Cast is safe: API returns ISO date strings compatible with ISODateString
        setClasses(data.enrolledClasses as Class[])
      } catch (err) {
        console.error("Failed to fetch classes:", err)
        setError("Failed to load classes. Please try refreshing the page.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchClasses()
  }, [navigate])

  const handleJoinSuccess = (classInfo: Class) => {
    // Add the new class to the list
    setClasses((prev) => [classInfo, ...prev])
    showToast(`Successfully joined ${classInfo.className}!`, "success")
  }

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
      if (c.yearLevel !== undefined && c.yearLevel !== null) {
        uniqueLevels.add(c.yearLevel.toString())
      }
    })
    return Array.from(uniqueLevels).sort() // Low to High
  }, [classes])

  // Client-side filtering logic
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      // 1. Status Filter
      if (status === "archived" && c.isActive) return false
      if (status === "active" && !c.isActive) return false // Students might have inactive classes if archived by teacher?
      // Assuming 'active' implies showing only active classes by default

      // 2. Term Filter
      if (selectedTerm !== "all") {
        const termString = `${c.academicYear} - Semester ${c.semester}`
        if (termString !== selectedTerm) return false
      }

      // 3. Year Level Filter
      if (selectedYearLevel !== "all") {
        if (!c.yearLevel || c.yearLevel.toString() !== selectedYearLevel)
          return false
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

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = {
    sidebar: (
      <div className="h-16 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 flex items-center px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            ClassiFi
          </h1>
        </div>
      </div>
    ),
    main: (
      <div className="h-16 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 flex items-center px-6 lg:px-8 shrink-0">
        <div className="flex items-center justify-end w-full gap-4">
          {/* Notifications */}
          <button
            className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-300" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Separator */}
          <div className="h-8 w-px bg-white/20"></div>

          {/* User Profile */}
          <button
            onClick={() => navigate("/dashboard/settings")}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">
                {user ? `${user.firstName} ${user.lastName}` : "User"}
              </p>
              <p className="text-xs text-slate-400">
                {user
                  ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                  : "Student"}
              </p>
            </div>
            <Avatar
              size="sm"
              src={user?.avatarUrl}
              fallback={userInitials}
              alt={user ? `${user.firstName} ${user.lastName}` : "User"}
            />
          </button>
        </div>
      </div>
    ),
  }

  return (
    <DashboardLayout topBar={topBar}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Classes</h1>
            <p className="text-slate-400 text-base">
              View and manage your enrolled courses
            </p>
          </div>
          <Button
            onClick={() => setIsJoinModalOpen(true)}
            className="w-full md:w-auto px-6 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20 transition-all hover:scale-105"
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Join a Class
          </Button>
        </div>

        {/* Filters */}
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
                {searchQuery || status !== "active"
                  ? "We couldn't find any classes matching your current filters. Try adjusting them."
                  : "You haven't enrolled in any classes yet."}
              </p>
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
          studentId={parseInt(user.id)}
        />
      )}
    </DashboardLayout>
  )
}
