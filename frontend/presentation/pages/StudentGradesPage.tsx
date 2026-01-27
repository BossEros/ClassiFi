import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Trophy, BookOpen, TrendingUp, AlertTriangle } from "lucide-react"
import { DashboardLayout } from "@/presentation/components/dashboard/DashboardLayout"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/presentation/components/ui/Card"
import { BackButton } from "@/presentation/components/ui/BackButton"
import { LatePenaltyBadge } from "@/presentation/components/gradebook/LatePenaltyBadge"
import { useStudentGrades } from "@/presentation/hooks/useGradebook"
import { getCurrentUser } from "@/business/services/authService"
import type { User } from "@/business/models/auth/types"
import type {
  StudentClassGrades,
  StudentGradeEntry,
} from "@/shared/types/gradebook"

export function StudentGradesPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)

  // Load user
  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate("/login")
      return
    }
    setUser(currentUser)
  }, [navigate])

  const studentId = user ? parseInt(user.id, 10) : 0
  const { grades, isLoading, error } = useStudentGrades(studentId)

  // Calculate overall average across all classes
  const calculateOverallAverage = (): number | null => {
    if (!grades.length) return null

    let total = 0
    let count = 0

    grades.forEach((classGrade) => {
      classGrade.assignments.forEach((assignment) => {
        if (assignment.grade !== null && assignment.grade !== undefined) {
          // Calculate percentage for each assignment
          if (assignment.totalScore > 0) {
            const percentage = (assignment.grade / assignment.totalScore) * 100
            total += percentage
            count++
          }
        }
      })
    })

    return count > 0 ? Math.round(total / count) : null
  }

  const overallAverage = calculateOverallAverage()

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-6">
        <BackButton to="/dashboard" />

        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">My Grades</h1>
            <p className="text-slate-300 text-sm">
              View your grades across all classes
            </p>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-300">Loading grades...</p>
          </div>
        </div>
      ) : error ? (
        /* Error State */
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-slate-200 font-medium mb-2">
              Error Loading Grades
            </p>
            <p className="text-sm text-slate-400">{error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Overall Average Card */}
          <div className="mb-6">
            <Card className="bg-gradient-to-r from-teal-500/10 to-teal-500/10 border-teal-500/20">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-teal-500/20 flex items-center justify-center">
                      <Trophy className="w-7 h-7 text-teal-400" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-300">Overall Average</p>
                      {overallAverage !== null ? (
                        <p
                          className={`text-3xl font-bold ${getGradeColor(overallAverage)}`}
                        >
                          {overallAverage}%
                        </p>
                      ) : (
                        <p className="text-2xl font-bold text-slate-400">
                          No grades yet
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-300">Classes Enrolled</p>
                    <p className="text-2xl font-bold text-white">
                      {grades.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grades by Class */}
          {grades.length > 0 ? (
            <div className="space-y-6">
              {grades.map((classGrades) => (
                <ClassGradesCard
                  key={classGrades.classId}
                  classGrades={classGrades}
                  onNavigate={() =>
                    navigate(`/dashboard/classes/${classGrades.classId}`)
                  }
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-slate-200 font-medium mb-1">No grades yet</p>
                <p className="text-sm text-slate-400">
                  Complete assignments to see your grades here.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </DashboardLayout>
  )
}

interface ClassGradesCardProps {
  classGrades: StudentClassGrades
  onNavigate: () => void
}

function ClassGradesCard({ classGrades, onNavigate }: ClassGradesCardProps) {
  // Calculate class average for this student
  const calculateAverage = (): number | null => {
    const gradedAssignments = classGrades.assignments.filter(
      (a) => a.grade !== null && a.grade !== undefined,
    )
    if (gradedAssignments.length === 0) return null

    const total = gradedAssignments.reduce((sum, a) => {
      const percentage =
        a.totalScore > 0 ? ((a.grade ?? 0) / a.totalScore) * 100 : 0
      return sum + percentage
    }, 0)

    return Math.round(total / gradedAssignments.length)
  }

  const average = calculateAverage()
  const gradedCount = classGrades.assignments.filter(
    (a) => a.grade !== null,
  ).length
  const totalCount = classGrades.assignments.length

  return (
    <Card
      className="hover:border-white/20 transition-colors cursor-pointer"
      onClick={onNavigate}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{classGrades.className}</CardTitle>
            <CardDescription>
              {classGrades.teacherName} • {gradedCount}/{totalCount} graded
            </CardDescription>
          </div>
          {average !== null && (
            <div className="text-right">
              <p className="text-sm text-slate-300">Average</p>
              <p className={`text-2xl font-bold ${getGradeColor(average)}`}>
                {average}%
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {classGrades.assignments.length > 0 ? (
          <div className="space-y-2">
            {classGrades.assignments.map((assignment) => (
              <AssignmentGradeRow
                key={assignment.assignmentId}
                assignment={assignment}
              />
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm text-center py-4">
            No assignments in this class yet.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface AssignmentGradeRowProps {
  assignment: StudentGradeEntry
}

function AssignmentGradeRow({ assignment }: AssignmentGradeRowProps) {
  const hasGrade = assignment.grade !== null && assignment.grade !== undefined
  const percentage =
    hasGrade && assignment.totalScore > 0
      ? ((assignment.grade ?? 0) / assignment.totalScore) * 100
      : 0

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {assignment.assignmentName}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-300">
            Max: {assignment.totalScore} points
          </span>
          {assignment.isLate && (
            <LatePenaltyBadge
              penaltyPercent={assignment.penaltyApplied ?? 0}
              small
            />
          )}
          {assignment.isOverridden && (
            <span className="text-xs text-yellow-400">Adjusted</span>
          )}
        </div>
      </div>
      <div className="text-right ml-4">
        {hasGrade ? (
          <>
            <p className={`text-lg font-bold ${getGradeColor(percentage)}`}>
              {assignment.grade}/{assignment.totalScore}
            </p>
            <p className={`text-xs ${getGradeColor(percentage)}`}>
              {Math.round(percentage)}%
            </p>
          </>
        ) : (
          <p className="text-sm text-slate-400">Not graded</p>
        )}
      </div>
    </div>
  )
}

function getGradeColor(percentage: number): string {
  if (percentage >= 90) return "text-green-400"
  if (percentage >= 75) return "text-blue-400"
  if (percentage >= 60) return "text-yellow-400"
  if (percentage >= 40) return "text-orange-400"
  return "text-red-400"
}
