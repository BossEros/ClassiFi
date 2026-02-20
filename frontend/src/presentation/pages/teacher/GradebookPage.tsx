import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Download, BarChart3, RefreshCw, BookOpen } from "lucide-react"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import { BackButton } from "@/presentation/components/ui/BackButton"
import { GradebookTable } from "@/presentation/components/teacher/gradebook/GradebookTable"
import { GradeOverrideModal } from "@/presentation/components/teacher/gradebook/GradeOverrideModal"
import { StatisticsPanel } from "@/presentation/components/teacher/gradebook/StatisticsPanel"
import {
  useClassGradebook,
  useGradeOverride,
  useGradebookExport,
} from "@/presentation/hooks/teacher/useGradebook"
import { useToast } from "@/presentation/context/ToastContext"
import { getCurrentUser } from "@/business/services/authService"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import {
  getClassById,
  type GradeEntry,
  type GradebookStudent,
} from "@/business/services/classService"
import type { Class } from "@/business/models/dashboard/types"

interface OverrideTarget {
  submissionId: number
  studentName: string
  assignmentName: string
  currentGrade: number | null
  totalScore: number
}

export function GradebookPage() {
  const navigate = useNavigate()
  const { classId } = useParams<{ classId: string }>()
  const { showToast } = useToast()
  const [currentUser] = useState(() => getCurrentUser())

  const [classInfo, setClassInfo] = useState<Class | null>(null)
  const [classLoading, setClassLoading] = useState(true)
  const [overrideTarget, setOverrideTarget] = useState<OverrideTarget | null>(
    null,
  )
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false)

  // Compute parsedClassId early to guard the hook call
  const parsedClassId = classId ? parseInt(classId, 10) : 0
  const isValidClassId =
    !isNaN(parsedClassId) && parsedClassId > 0 && classId !== undefined

  // Validate classId immediately
  useEffect(() => {
    if (!isValidClassId) {
      showToast("Invalid class ID", "error")
      navigate("/dashboard")
    }
  }, [isValidClassId, navigate, showToast])

  // Only call the hook with a valid classId to prevent unnecessary fetches
  // The hook internally guards with classId > 0
  const {
    gradebook,
    statistics,
    isLoading: gradebookLoading,
    error: gradebookError,
    refetch,
  } = useClassGradebook(isValidClassId ? parsedClassId : 0)

  const { override, removeOverride, isOverriding } = useGradeOverride(() => {
    refetch()
    setIsOverrideModalOpen(false)
    showToast("Grade updated successfully")
  })

  const { exportCSV, isExporting } = useGradebookExport()

  // Check authentication and load class info
  useEffect(() => {
    const user = getCurrentUser()
    if (!user) {
      navigate("/login")
      return
    }

    // Only teachers can access gradebook
    if (user.role !== "teacher" && user.role !== "admin") {
      navigate("/dashboard")
      showToast("Only teachers can access the gradebook", "error")
      return
    }

    // Load class info
    const loadClassInfo = async () => {
      if (!parsedClassId) return

      try {
        setClassLoading(true)
        const info = await getClassById(parsedClassId)
        setClassInfo(info)
      } catch (err) {
        console.error("Failed to load class info:", err)
        showToast("Failed to load class information", "error")
      } finally {
        setClassLoading(false)
      }
    }

    loadClassInfo()
  }, [navigate, parsedClassId, showToast])

  const handleGradeClick = (
    student: GradebookStudent,
    grade: GradeEntry,
    assignmentName: string,
    totalScore: number,
  ) => {
    if (!grade.submissionId) return

    setOverrideTarget({
      submissionId: grade.submissionId,
      studentName: student.name,
      assignmentName,
      currentGrade: grade.grade,
      totalScore,
    })
    setIsOverrideModalOpen(true)
  }

  const handleOverrideSubmit = async (
    newGrade: number,
    feedback: string | null,
  ) => {
    if (!overrideTarget) return

    try {
      await override(overrideTarget.submissionId, newGrade, feedback)
    } catch {
      showToast("Failed to update grade", "error")
    }
  }

  const handleRemoveOverride = async () => {
    if (!overrideTarget) return

    try {
      await removeOverride(overrideTarget.submissionId)
    } catch {
      showToast("Failed to remove override", "error")
    }
  }

  const handleExport = async () => {
    try {
      await exportCSV(
        parsedClassId,
        `gradebook-${classInfo?.classCode || parsedClassId}.csv`,
      )
      showToast("Gradebook exported successfully")
    } catch {
      showToast("Failed to export gradebook", "error")
    }
  }

  const isLoading = classLoading || gradebookLoading

  const userInitials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user: currentUser, userInitials })

  return (
    <DashboardLayout topBar={topBar}>
      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading gradebook...</p>
          </div>
        </div>
      ) : gradebookError ? (
        /* Error State */
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-gray-300 font-medium mb-2">
              Error Loading Gradebook
            </p>
            <p className="text-sm text-gray-500 mb-4">{gradebookError}</p>
            <Button onClick={refetch} className="w-auto">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Page Header */}
          <div className="mb-6">
            <BackButton to={`/dashboard/classes/${classId}`} />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Gradebook</h1>
                  <p className="text-gray-400 text-sm">
                    {classInfo?.className}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={refetch}
                  className="w-auto px-4 h-10 bg-white/10 hover:bg-white/20"
                  disabled={gradebookLoading}
                >
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${gradebookLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
                <Button
                  onClick={handleExport}
                  className="w-auto px-4 h-10"
                  disabled={isExporting}
                >
                  <Download
                    className={`w-4 h-4 mr-2 ${isExporting ? "animate-bounce" : ""}`}
                  />
                  {isExporting ? "Exporting..." : "Export CSV"}
                </Button>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Statistics Sidebar */}
            <div className="lg:col-span-1">
              <StatisticsPanel statistics={statistics} />
            </div>

            {/* Gradebook Table */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-white">
                    Student Grades
                  </h2>
                  <p className="text-sm text-gray-400">
                    Click on a grade to override it manually
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  {gradebook && gradebook.students.length > 0 ? (
                    <GradebookTable
                      assignments={gradebook.assignments}
                      students={gradebook.students}
                      onGradeClick={handleGradeClick}
                    />
                  ) : (
                    <div className="py-12 text-center">
                      <p className="text-gray-400">No students enrolled yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Grade Override Modal */}
          {overrideTarget && (
            <GradeOverrideModal
              isOpen={isOverrideModalOpen}
              onClose={() => {
                setIsOverrideModalOpen(false)
                setOverrideTarget(null)
              }}
              onSubmit={handleOverrideSubmit}
              onRemoveOverride={handleRemoveOverride}
              isSubmitting={isOverriding}
              studentName={overrideTarget.studentName}
              assignmentName={overrideTarget.assignmentName}
              currentGrade={overrideTarget.currentGrade}
              totalScore={overrideTarget.totalScore}
            />
          )}
        </>
      )}
    </DashboardLayout>
  )
}


