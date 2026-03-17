import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Check, Grid3x3, Plus, RefreshCw, Users, X } from "lucide-react"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import { Card, CardContent } from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import { ClassCard } from "@/presentation/components/shared/dashboard/ClassCard"
import {
  ClassFilters,
  type FilterStatus,
} from "@/presentation/components/shared/dashboard/ClassFilters"
import { useAuthStore } from "@/shared/store/useAuthStore"
import {
  getDashboardData,
  joinClass,
} from "@/business/services/studentDashboardService"
import { useToastStore } from "@/shared/store/useToastStore"
import type { Class } from "@/business/models/dashboard/types"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import { Input } from "@/presentation/components/ui/Input"
import { useZodForm } from "@/presentation/hooks/shared/useZodForm"
import { getFirstFormErrorMessage } from "@/presentation/utils/formErrorMap"
import {
  joinClassFormSchema,
  type JoinClassFormValues,
} from "@/presentation/schemas/class/classSchemas"
import type { FieldErrors } from "react-hook-form"
import { dashboardTheme } from "@/presentation/constants/dashboardTheme"

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

  useEffect(() => {
    if (!isOpen) {
      reset({ classCode: "" })
      setError(null)
    }
  }, [isOpen, reset])

  const handleClassCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value.toUpperCase().replace(/\s/g, "")
    setValue("classCode", nextValue, {
      shouldDirty: true,
      shouldTouch: true,
    })
    if (error) setError(null)
  }

  const handleJoinClassSubmit = async (formValues: JoinClassFormValues) => {
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await joinClass(studentId, formValues.classCode.trim())

      if (!response.success) {
        setError(response.message)
        return
      }

      if (response.classInfo) {
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
    const firstErrorMessage = getFirstFormErrorMessage(validationErrors)

    if (firstErrorMessage) {
      setError(firstErrorMessage)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-[448px] min-w-[320px] flex-shrink-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-teal-100 p-2">
              <Users className="h-5 w-5 text-teal-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Join Class</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Enter the code provided by your teacher
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(handleJoinClassSubmit, handleJoinClassInvalid)}
          className="w-full space-y-6"
        >
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <div className="w-full space-y-3">
            <label htmlFor="classCode" className="block text-sm font-medium text-slate-700">
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
              className={`h-12 border border-slate-300 bg-white text-center text-lg font-mono tracking-widest uppercase text-slate-800 placeholder:text-slate-400 shadow-sm hover:border-slate-400 focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20 ${error ? "border-rose-400" : ""}`}
              autoFocus
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              Ask your teacher for the class code. It's usually 6-8 characters.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !classCodeValue.trim()}
              className="flex-1 rounded-md border border-teal-600 bg-teal-600 text-white hover:bg-teal-500"
            >
              {isSubmitting ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
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
  const [searchQuery, setSearchQuery] = useState("")
  const [status, setStatus] = useState<FilterStatus>("active")

  useEffect(() => {
    if (!user) {
      navigate("/login")
      return
    }

    const fetchClasses = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getDashboardData(parseInt(user.id))
        setClasses(data.enrolledClasses as Class[])
      } catch (error) {
        console.error("Failed to fetch classes:", error)
        setError("Failed to load classes. Please try refreshing the page.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchClasses()
  }, [navigate, user])

  const handleJoinSuccess = (classInfo: Class) => {
    setClasses((previousClasses) => [classInfo, ...previousClasses])
    showToast(`Successfully joined ${classInfo.className}!`, "success")
  }

  const filteredClasses = useMemo(() => {
    return classes.filter((classRecord) => {
      if (status === "active" && !classRecord.isActive) return false
      if (status === "archived" && classRecord.isActive) return false

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

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user, userInitials })

  return (
    <DashboardLayout topBar={topBar}>
      <div className="mb-8">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className={dashboardTheme.pageTitle}>My Classes</h1>
            <p className={dashboardTheme.pageSubtitle}>
              View and manage your enrolled courses
            </p>
          </div>
          <Button
            onClick={() => setIsJoinModalOpen(true)}
            className="w-full border border-teal-500/40 bg-teal-600 px-6 text-white hover:bg-teal-700 md:w-auto"
            disabled={isLoading}
          >
            <Plus className="mr-2 h-4 w-4" />
            Join a Class
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
                {searchQuery || status !== "active"
                  ? "We couldn't find any classes matching your current filters. Try adjusting them."
                  : "You haven't enrolled in any classes yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
