import { Download, BarChart3, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/presentation/components/ui/Card";
import { Button } from "@/presentation/components/ui/Button";
import { useClassGradebook, useGradebookExport } from "@/presentation/hooks/teacher/useGradebook";
import { useToastStore } from "@/shared/store/useToastStore";
import type { GradebookAssignment, GradebookStudent, GradeEntry } from "@/shared/types/gradebook";
import { X, Edit2 } from "lucide-react";

// Inlined from src/presentation/components/teacher/gradebook/GradebookTable.tsx
// Inlined from src/presentation/components/teacher/gradebook/GradeCell.tsx
interface GradeCellProps {
  grade: GradeEntry | null
  totalScore: number
}





function GradeCell({ grade, totalScore }: GradeCellProps) {
  if (!grade || !grade.submissionId) {
    return (
      <span className="inline-flex items-center justify-center w-12 h-8 rounded text-xs text-gray-500">
        -
      </span>
    )
  }

  if (grade.grade === null) {
    return (
      <span
        className="inline-flex items-center justify-center w-12 h-8 rounded bg-gray-700/50 text-gray-400 text-xs"
        title="Not graded yet"
      >
        <X className="w-3 h-3" />
      </span>
    )
  }

  const percentage = totalScore > 0 ? (grade.grade / totalScore) * 100 : 0
  const colorClass = getGradeColorClass(percentage)

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[48px] h-8 px-2 rounded text-sm font-medium ${colorClass}`}
      title={`${grade.grade}/${totalScore} (${Math.round(percentage)}%)`}
    >
      <span>{grade.grade}</span>
      {grade.isOverridden && (
        <span className="ml-1" title="Manually overridden">
          <Edit2 className="w-3 h-3 text-yellow-400" />
        </span>
      )}
    </span>
  )
}





function getGradeColorClass(percentage: number): string {
  if (percentage >= 90) return "bg-green-500/20 text-green-400"
  if (percentage >= 75) return "bg-blue-500/20 text-blue-400"
  if (percentage >= 60) return "bg-yellow-500/20 text-yellow-400"
  if (percentage >= 40) return "bg-orange-500/20 text-orange-400"
  return "bg-red-500/20 text-red-400"
}



interface GradebookTableProps {
  assignments: GradebookAssignment[]
  students: GradebookStudent[]
}



function GradebookTable({ assignments, students }: GradebookTableProps) {
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
      <div className="p-8 text-center text-gray-400">
        <p>No assignments created yet</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead className="sticky top-0 z-10">
          <tr className="bg-gray-800/80 backdrop-blur-sm border-b border-white/10">
            <th className="sticky left-0 z-20 bg-gray-800/95 backdrop-blur-sm px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-[180px] min-w-[180px] max-w-[180px]">
              Student
            </th>
            {assignments.map((assignment) => (
              <th
                key={assignment.id}
                className="px-3 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[100px]"
              >
                <div className="flex flex-col items-center gap-1">
                  <span
                    className="truncate max-w-[120px]"
                    title={assignment.name}
                  >
                    {assignment.name}
                  </span>
                  <span className="text-gray-500 font-normal normal-case">
                    /{assignment.totalScore}
                  </span>
                </div>
              </th>
            ))}
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[80px]">
              Average
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {students.map((student) => {
            const average = calculateStudentAverage(student.grades)

            return (
              <tr
                key={student.id}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="sticky left-0 z-10 bg-gray-900/95 backdrop-blur-sm px-4 py-3 border-r border-white/5 w-[180px] min-w-[180px] max-w-[180px]">
                  <div>
                    <p
                      className="text-sm font-medium text-white truncate"
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
                      />
                    </td>
                  )
                })}
                <td className="px-4 py-3 text-center">
                  {average !== null ? (
                    <span
                      className={`inline-flex items-center justify-center w-12 h-8 rounded text-sm font-medium ${getAverageColorClass(average)}`}
                    >
                      {average}%
                    </span>
                  ) : (
                    <span className="text-gray-500 text-sm">-</span>
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



function getAverageColorClass(average: number): string {
  if (average >= 90) return "bg-green-500/20 text-green-400"
  if (average >= 75) return "bg-blue-500/20 text-blue-400"
  if (average >= 60) return "bg-yellow-500/20 text-yellow-400"
  return "bg-red-500/20 text-red-400"
}

interface GradebookContentProps {
  classId: number
  classCode?: string
}

/**
 * Reusable gradebook content section used by both GradebookPage and ClassDetail grades tab.
 */
export function GradebookContent({
  classId,
  classCode,
}: GradebookContentProps) {
  const showToast = useToastStore((state) => state.showToast)

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
          <p className="text-sm text-gray-400">Read-only grade overview</p>
        </CardHeader>
        <CardContent className="p-0">
          {gradebook && gradebook.students.length > 0 ? (
            <GradebookTable
              assignments={gradebook.assignments}
              students={gradebook.students}
            />
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-400">No students enrolled yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
