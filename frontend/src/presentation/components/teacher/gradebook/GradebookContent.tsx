import { useState, useRef, useEffect } from "react";
import { Download, BarChart3, RefreshCw, FileText, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/presentation/components/ui/Card";
import { Button } from "@/presentation/components/ui/Button";
import { useClassGradebook, useGradebookExport } from "@/presentation/hooks/teacher/useGradebook";
import { useToastStore } from "@/shared/store/useToastStore";
import { downloadPdfDocument } from "@/presentation/utils/pdfDownload";
import type { GradebookAssignment, GradebookStudent, GradeEntry } from "@/shared/types/gradebook";
import { X, Edit2 } from "lucide-react";
import { dashboardTheme } from "@/presentation/constants/dashboardTheme";
import { buildGradeReportData, GradeReportDocument } from "./pdf/gradeReportPdf";

interface GradeCellProps {
  grade: GradeEntry | null
  totalScore: number
  variant?: "dark" | "light"
}

function GradeCell({ grade, totalScore, variant = "dark" }: GradeCellProps) {
  if (!grade || !grade.submissionId) {
    return (
      <span
        className={`inline-flex h-8 w-12 items-center justify-center rounded text-xs ${variant === "light" ? "text-slate-400" : "text-gray-500"}`}
      >
        -
      </span>
    )
  }

  if (grade.grade === null) {
    return (
      <span
        className={`inline-flex h-8 w-12 items-center justify-center rounded text-xs ${variant === "light" ? "bg-slate-100 text-slate-500" : "bg-gray-700/50 text-gray-400"}`}
        title="Not graded yet"
      >
        <X className="w-3 h-3" />
      </span>
    )
  }

  const percentage = totalScore > 0 ? (grade.grade / totalScore) * 100 : 0
  const colorClass = getGradeColorClass(percentage, variant)

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[48px] h-8 px-2 rounded text-sm font-medium ${colorClass}`}
      title={`${grade.grade}/${totalScore} (${Math.round(percentage)}%)`}
    >
      <span>{grade.grade}</span>
      {grade.isOverridden && (
        <span className="ml-1" title="Manually overridden">
          <Edit2
            className={`h-3 w-3 ${variant === "light" ? "text-amber-500" : "text-yellow-400"}`}
          />
        </span>
      )}
    </span>
  )
}





function getGradeColorClass(
  percentage: number,
  variant: "dark" | "light",
): string {
  if (variant === "light") {
    if (percentage >= 90) return "border border-emerald-200 bg-emerald-50 text-emerald-800"
    if (percentage >= 75) return "border border-sky-200 bg-sky-50 text-sky-800"
    if (percentage >= 60) return "border border-amber-200 bg-amber-50 text-amber-800"
    if (percentage >= 40) return "border border-orange-200 bg-orange-50 text-orange-800"
    return "border border-rose-200 bg-rose-50 text-rose-800"
  }

  if (percentage >= 90) return "bg-green-500/20 text-green-400"
  if (percentage >= 75) return "bg-blue-500/20 text-blue-400"
  if (percentage >= 60) return "bg-yellow-500/20 text-yellow-400"
  if (percentage >= 40) return "bg-orange-500/20 text-orange-400"
  return "bg-red-500/20 text-red-400"
}



interface GradebookTableProps {
  assignments: GradebookAssignment[]
  students: GradebookStudent[]
  variant?: "dark" | "light"
}



function GradebookTable({
  assignments,
  students,
  variant = "dark",
}: GradebookTableProps) {
  // Calculate averages for each student
  const calculateStudentAverage = (grades: GradeEntry[]) => {
    const validGrades = grades.filter((g) => g.grade !== null)
    if (validGrades.length === 0) return null

    // Find corresponding assignment for each grade to get totalScore
    const total = validGrades.reduce((sum, g) => {
      const assignment = assignments.find((a) => a.id === g.assignmentId)
      if (!assignment) return sum

      // Guard against division by zero - skip assignments with totalScore of 0
      if (assignment.totalScore === 0) {
        console.warn(
          `[GradebookTable] Assignment "${assignment.name}" (id: ${assignment.id}) has totalScore of 0, skipping in average calculation`,
        )
        return sum
      }

      return sum + ((g.grade as number) / assignment.totalScore) * 100
    }, 0)

    return Math.round(total / validGrades.length)
  }

  if (assignments.length === 0) {
    return (
      <div
        className={`p-8 text-center ${variant === "light" ? "text-slate-500" : "text-gray-400"}`}
      >
        <p>No assignments created yet</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead className="sticky top-0 z-10">
          <tr
            className={`border-b ${variant === "light" ? "border-slate-200 bg-slate-100/95" : "border-white/10 bg-gray-800/80 backdrop-blur-sm"}`}
          >
            <th
              className={`sticky left-0 z-20 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] w-[180px] min-w-[180px] max-w-[180px] ${variant === "light" ? "border-r border-slate-200 bg-slate-100/95 text-slate-500" : "bg-gray-800/95 backdrop-blur-sm text-gray-400"}`}
            >
              Student
            </th>
            {assignments.map((assignment) => (
              <th
                key={assignment.id}
                className={`px-3 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] min-w-[100px] ${variant === "light" ? "text-slate-500" : "text-gray-400"}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span
                    className="truncate max-w-[120px]"
                    title={assignment.name}
                  >
                    {assignment.name}
                  </span>
                  <span
                    className={`font-normal normal-case ${variant === "light" ? "text-slate-400" : "text-gray-500"}`}
                  >
                    /{assignment.totalScore}
                  </span>
                </div>
              </th>
            ))}
            <th
              className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] min-w-[80px] ${variant === "light" ? "text-slate-500" : "text-gray-400"}`}
            >
              Average
            </th>
          </tr>
        </thead>
        <tbody
          className={variant === "light" ? "divide-y divide-slate-200" : "divide-y divide-white/5"}
        >
          {students.map((student) => {
            const average = calculateStudentAverage(student.grades)

            return (
              <tr
                key={student.id}
                className={`transition-colors ${variant === "light" ? "hover:bg-slate-50" : "hover:bg-white/5"}`}
              >
                <td
                  className={`sticky left-0 z-10 px-4 py-3 w-[180px] min-w-[180px] max-w-[180px] ${variant === "light" ? "border-r border-slate-200 bg-white" : "border-r border-white/5 bg-gray-900/95 backdrop-blur-sm"}`}
                >
                  <div>
                    <p
                      className={`truncate text-sm font-medium ${variant === "light" ? "text-slate-800" : "text-white"}`}
                      title={student.name}
                    >
                      {student.name}
                    </p>
                  </div>
                </td>
                {assignments.map((assignment) => {
                  const grade = student.grades.find(
                    (g) => g.assignmentId === assignment.id,
                  )

                  return (
                    <td key={assignment.id} className="px-3 py-3 text-center">
                      <GradeCell
                        grade={grade ?? null}
                        totalScore={assignment.totalScore}
                        variant={variant}
                      />
                    </td>
                  )
                })}
                <td className="px-4 py-3 text-center">
                  {average !== null ? (
                    <span
                      className={`inline-flex items-center justify-center w-12 h-8 rounded text-sm font-medium ${getAverageColorClass(average, variant)}`}
                    >
                      {average}%
                    </span>
                  ) : (
                    <span
                      className={`text-sm ${variant === "light" ? "text-slate-400" : "text-gray-500"}`}
                    >
                      -
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}



function getAverageColorClass(
  average: number,
  variant: "dark" | "light",
): string {
  if (variant === "light") {
    if (average >= 90) return "border border-emerald-200 bg-emerald-50 text-emerald-800"
    if (average >= 75) return "border border-sky-200 bg-sky-50 text-sky-800"
    if (average >= 60) return "border border-amber-200 bg-amber-50 text-amber-800"
    return "border border-rose-200 bg-rose-50 text-rose-800"
  }

  if (average >= 90) return "bg-green-500/20 text-green-400"
  if (average >= 75) return "bg-blue-500/20 text-blue-400"
  if (average >= 60) return "bg-yellow-500/20 text-yellow-400"
  return "bg-red-500/20 text-red-400"
}

interface GradebookContentProps {
  classId: number
  classCode?: string
  className?: string
  teacherName?: string
  variant?: "dark" | "light"
}

/**
 * Reusable gradebook content section used by both GradebookPage and ClassDetail grades tab.
 */
export function GradebookContent({
  classId,
  classCode,
  className,
  teacherName,
  variant = "dark",
}: GradebookContentProps) {
  const showToast = useToastStore((state) => state.showToast)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsExportMenuOpen(false)
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [])

  const {
    gradebook,
    isLoading: gradebookLoading,
    error: gradebookError,
    refetch,
  } = useClassGradebook(classId)

  const { exportCSV, isExporting } = useGradebookExport()

  const handleExport = async () => {
    try {
      await exportCSV(classId, `gradebook-${classCode || classId}.csv`)
      showToast("Gradebook exported successfully")
    } catch {
      showToast("Failed to export gradebook", "error")
    }
  }

  const handleDownloadPdf = async () => {
    if (!gradebook) return

    try {
      setIsDownloadingPdf(true)
      const reportData = buildGradeReportData({
        gradebook,
        className,
        classCode,
        teacherName,
      })

      await downloadPdfDocument({
        document: <GradeReportDocument data={reportData} />,
        fileName: `grade-report-${classCode || classId}.pdf`,
      })

      showToast("Grade report downloaded successfully")
    } catch (error) {
      console.error("Failed to download grade report:", error)
      showToast("Failed to download grade report", "error")
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  if (gradebookLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div
            className={`mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 ${variant === "light" ? "border-slate-200 border-t-teal-600" : "border-white/30 border-t-white"}`}
          ></div>
          <p className={variant === "light" ? "text-slate-500" : "text-gray-400"}>
            Loading gradebook...
          </p>
        </div>
      </div>
    )
  }

  if (gradebookError) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-md">
          <div
            className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${variant === "light" ? "bg-rose-50" : "bg-red-500/20"}`}
          >
            <BarChart3
              className={`h-8 w-8 ${variant === "light" ? "text-rose-500" : "text-red-400"}`}
            />
          </div>
          <p
            className={`mb-2 font-medium ${variant === "light" ? "text-slate-800" : "text-gray-300"}`}
          >
            Error Loading Gradebook
          </p>
          <p
            className={`mb-4 text-sm ${variant === "light" ? "text-slate-500" : "text-gray-500"}`}
          >
            {gradebookError}
          </p>
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
          <h2
            className={variant === "light" ? dashboardTheme.sectionTitle : "text-lg font-semibold tracking-tight text-white"}
          >
            Gradebook
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={refetch}
            className={`h-10 w-auto px-4 ${variant === "light" ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50" : "bg-white/10 hover:bg-white/20"}`}
            disabled={gradebookLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${gradebookLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <div className="relative" ref={exportMenuRef}>
            <Button
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
              className="w-auto px-4 h-10"
              disabled={isExporting || isDownloadingPdf}
            >
              <Download
                className={`w-4 h-4 mr-2 ${isExporting || isDownloadingPdf ? "animate-bounce" : ""}`}
              />
              {isExporting ? "Exporting..." : isDownloadingPdf ? "Preparing..." : "Export"}
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>

            {isExportMenuOpen && (
              <div
                className={`absolute right-0 top-full mt-2 z-50 min-w-[180px] overflow-hidden p-1 rounded-lg shadow-lg shadow-black/20 ${
                  variant === "light"
                    ? "border border-slate-200 bg-white"
                    : "border border-white/10 bg-slate-900/95 backdrop-blur-sm"
                }`}
              >
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false)
                    handleExport()
                  }}
                  disabled={isExporting}
                  className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors duration-150 cursor-pointer ${
                    variant === "light"
                      ? "text-slate-700 hover:bg-teal-100 hover:text-teal-800"
                      : "text-gray-300 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Export as CSV
                </button>
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false)
                    handleDownloadPdf()
                  }}
                  disabled={isDownloadingPdf || !gradebook}
                  className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition-colors duration-150 cursor-pointer ${
                    variant === "light"
                      ? "text-slate-700 hover:bg-teal-100 hover:text-teal-800"
                      : "text-gray-300 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Download as PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Card
        className={
          variant === "light"
            ? "border-slate-200 bg-white shadow-sm backdrop-blur-0"
            : undefined
        }
      >
        <CardHeader className={variant === "light" ? "border-b border-slate-200" : undefined}>
          <h2
            className={`text-lg font-semibold ${variant === "light" ? "text-slate-900" : "text-white"}`}
          >
            Student Grades
          </h2>
          <p
            className={`text-sm ${variant === "light" ? "text-slate-500" : "text-gray-400"}`}
          >
            Read-only grade overview
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {gradebook && gradebook.students.length > 0 ? (
            <GradebookTable
              assignments={gradebook.assignments}
              students={gradebook.students}
              variant={variant}
            />
          ) : (
            <div className="py-12 text-center">
              <p className={variant === "light" ? "text-slate-500" : "text-gray-400"}>
                No students enrolled yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
