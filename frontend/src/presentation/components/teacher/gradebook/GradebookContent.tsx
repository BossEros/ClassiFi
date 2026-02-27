import { useState } from "react"
import { Download, BarChart3, RefreshCw } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import { GradebookTable } from "@/presentation/components/teacher/gradebook/GradebookTable"
import { GradeOverrideModal } from "@/presentation/components/teacher/gradebook/GradeOverrideModal"
import {
  useClassGradebook,
  useGradeOverride,
  useGradebookExport,
} from "@/presentation/hooks/teacher/useGradebook"
import { useToastStore } from "@/shared/store/useToastStore"
import type { GradeEntry, GradebookStudent } from "@/shared/types/gradebook"

interface GradebookContentProps {
  classId: number
  classCode?: string
}

interface OverrideTarget {
  submissionId: number
  studentName: string
  assignmentName: string
  currentGrade: number | null
  totalScore: number
}

/**
 * Reusable gradebook content section used by both GradebookPage and ClassDetail grades tab.
 */
export function GradebookContent({
  classId,
  classCode,
}: GradebookContentProps) {
  const showToast = useToastStore((state) => state.showToast)
  const [overrideTarget, setOverrideTarget] = useState<OverrideTarget | null>(
    null,
  )
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false)

  const {
    gradebook,
    isLoading: gradebookLoading,
    error: gradebookError,
    refetch,
  } = useClassGradebook(classId)

  const { override, removeOverride, isOverriding } = useGradeOverride(() => {
    refetch()
    setIsOverrideModalOpen(false)
    setOverrideTarget(null)
    showToast("Grade updated successfully")
  })

  const { exportCSV, isExporting } = useGradebookExport()

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
      await exportCSV(classId, `gradebook-${classCode || classId}.csv`)
      showToast("Gradebook exported successfully")
    } catch {
      showToast("Failed to export gradebook", "error")
    }
  }

  if (gradebookLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading gradebook...</p>
        </div>
      </div>
    )
  }

  if (gradebookError) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-gray-300 font-medium mb-2">Error Loading Gradebook</p>
          <p className="text-sm text-gray-500 mb-4">{gradebookError}</p>
          <Button onClick={refetch} className="w-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Gradebook</h2>
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

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Student Grades</h2>
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
  )
}
