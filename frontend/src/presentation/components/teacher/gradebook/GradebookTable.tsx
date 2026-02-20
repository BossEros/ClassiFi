import type {
  GradebookAssignment,
  GradebookStudent,
  GradeEntry,
} from "@/shared/types/gradebook"
import { GradeCell } from "@/presentation/components/teacher/gradebook/GradeCell"

interface GradebookTableProps {
  assignments: GradebookAssignment[]
  students: GradebookStudent[]
  onGradeClick: (
    student: GradebookStudent,
    grade: GradeEntry,
    assignmentName: string,
    totalScore: number,
  ) => void
}

export function GradebookTable({
  assignments,
  students,
  onGradeClick,
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
            <th className="sticky left-0 z-20 bg-gray-800/95 backdrop-blur-sm px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[200px]">
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
                <td className="sticky left-0 z-10 bg-gray-900/95 backdrop-blur-sm px-4 py-3 whitespace-nowrap border-r border-white/5">
                  <div>
                    <p className="text-sm font-medium text-white">
                      {student.name}
                    </p>
                    <p className="text-xs text-gray-500">{student.email}</p>
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
                        onClick={() => {
                          if (grade) {
                            onGradeClick(
                              student,
                              grade,
                              assignment.name,
                              assignment.totalScore,
                            )
                          }
                        }}
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
                    <span className="text-gray-500 text-sm">—</span>
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

