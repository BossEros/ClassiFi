import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Grid3x3, Plus } from "lucide-react";
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout";
import { Card, CardContent } from "@/presentation/components/ui/Card";
import { Button } from "@/presentation/components/ui/Button";
import { ClassCard } from "@/presentation/components/shared/dashboard/ClassCard";
import { ClassFilters, type FilterStatus } from "@/presentation/components/shared/dashboard/ClassFilters";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { getDashboardData } from "@/business/services/studentDashboardService";
import { useToastStore } from "@/shared/store/useToastStore";
import type { Class } from "@/business/models/dashboard/types";
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar";
import { X, Check, RefreshCw, Users } from "lucide-react";
import { Input } from "@/presentation/components/ui/Input";
import { joinClass } from "@/business/services/studentDashboardService";
import { useZodForm } from "@/presentation/hooks/shared/useZodForm";
import { getFirstFormErrorMessage } from "@/presentation/utils/formErrorMap";
import { joinClassFormSchema, type JoinClassFormValues } from "@/presentation/schemas/class/classSchemas";
import type { FieldErrors } from "react-hook-form";
import { dashboardTheme } from "@/presentation/constants/dashboardTheme";

// Inlined from src/presentation/components/student/forms/JoinClassModal.tsx
interface JoinClassModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (classInfo: Class) => void
  studentId: number
}



function JoinClassModal({
  isOpen,
  onClose,
  onSuccess,
  studentId,
}: JoinClassModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, watch, setValue, reset } = useZodForm({
    schema: joinClassFormSchema,
    defaultValues: {
      classCode: "",
    },
    mode: "onSubmit",
  })

  const classCodeValue = watch("classCode")
  const classCodeField = register("classCode")

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      reset({ classCode: "" })
      setError(null)
    }
  }, [isOpen, reset])

  const handleClassCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert to uppercase and remove spaces
    const value = e.target.value.toUpperCase().replace(/\s/g, "")
    setValue("classCode", value, {
      shouldDirty: true,
      shouldTouch: true,
    })
    if (error) setError(null)
  }

  const handleJoinClassSubmit = async (formValues: JoinClassFormValues) => {
    setError(null)

    const trimmedCode = formValues.classCode.trim()

    setIsSubmitting(true)
    try {
      const response = await joinClass(studentId, trimmedCode)

      if (!response.success) {
        setError(response.message)
        return
      }

      if (response.classInfo) {
        // Cast is safe: API returns ISO date strings compatible with ISODateString
        onSuccess(response.classInfo as Class)
      }
      onClose()
    } catch {
      setError("Failed to join class. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleJoinClassInvalid = (
    validationErrors: FieldErrors<JoinClassFormValues>,
  ) => {
    const trimmedCode = classCodeValue.trim()
    void trimmedCode // satisfy unused var while keeping it trimmed before call per instruction

    const firstErrorMessage = getFirstFormErrorMessage(validationErrors)

    if (firstErrorMessage) {
      setError(firstErrorMessage)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[448px] min-w-[320px] flex-shrink-0 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/20">
              <Users className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Join Class</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Enter the code provided by your teacher
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(handleJoinClassSubmit, handleJoinClassInvalid)}
          className="space-y-6 w-full"
        >
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Class Code Input */}
          <div className="space-y-3 w-full">
            <label
              htmlFor="classCode"
              className="block text-sm font-medium text-white"
            >
              Class Code
            </label>
            <Input
              id="classCode"
              type="text"
              placeholder="Enter class code (e.g., ABC123)"
              {...classCodeField}
              value={classCodeValue}
              onChange={handleClassCodeChange}
              disabled={isSubmitting}
              maxLength={8}
              className={`text-center text-lg font-mono tracking-widest uppercase ${error ? "border-red-500/50" : ""}`}
              autoFocus
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Ask your teacher for the class code. It's usually 6-8 characters.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !classCodeValue.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Join Class
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function StudentClassesPage() {
  const navigate = useNavigate()
  const showToast = useToastStore((state) => state.showToast)
  const user = useAuthStore((state) => state.user)
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
    if (!user) {
      navigate("/login")
      return
    }

    // Fetch enrolled classes
    const fetchClasses = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getDashboardData(parseInt(user.id))
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
  }, [navigate, user])

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

  const topBar = useTopBar({ user, userInitials })

  return (
    <DashboardLayout topBar={topBar}>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className={dashboardTheme.pageTitle}>My Classes</h1>
            <p className={dashboardTheme.pageSubtitle}>
              View and manage your enrolled courses
            </p>
          </div>
          <Button
            onClick={() => setIsJoinModalOpen(true)}
            className="w-full md:w-auto px-6 bg-teal-600 hover:bg-teal-700 text-white border border-teal-500/40"
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
        <div className={dashboardTheme.errorSurface}>
          <div className="h-full w-1 rounded-full bg-rose-500" />
          <p className="text-sm font-medium text-rose-700">{error}</p>
        </div>
      )}

      {/* Classes Grid */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
