import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import { CrossClassResultsSection } from "@/presentation/components/teacher/plagiarism"
import { getAssignmentById } from "@/business/services/assignmentService"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import { dashboardTheme } from "@/presentation/constants/dashboardTheme"
import { useAuthStore } from "@/shared/store/useAuthStore"
import type { AssignmentDetail } from "@/business/models/assignment/types"

interface CrossClassSimilarityNavigationState {
  shouldRunInitialAnalysis?: boolean
}

/**
 * Dedicated page for cross-class similarity detection.
 * Allows teachers to compare submissions across matching assignments in different classes.
 *
 * @returns Cross-class similarity page with analysis controls and results display.
 */
export function CrossClassSimilarityPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [shouldRunInitialAnalysis] = useState(() => {
    const navigationState =
      location.state as CrossClassSimilarityNavigationState | null

    return Boolean(navigationState?.shouldRunInitialAnalysis)
  })

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?"

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId || !user) {
        return
      }

      try {
        const assignmentDetail = await getAssignmentById(
          parseInt(assignmentId, 10),
          parseInt(user.id, 10),
        )
        setAssignment(assignmentDetail)
      } catch (assignmentError) {
        console.error("Failed to fetch assignment details:", assignmentError)
      }
    }

    void fetchAssignment()
  }, [assignmentId, user])

  useEffect(() => {
    if (!shouldRunInitialAnalysis) {
      return
    }

    navigate(location.pathname, { replace: true, state: null })
  }, [location.pathname, navigate, shouldRunInitialAnalysis])

  const breadcrumbItems = [
    { label: "Classes", to: "/dashboard/classes" },
    ...(assignment
      ? [
          {
            label: assignment.className || "Class Overview",
            to: `/dashboard/classes/${assignment.classId}`,
          },
          {
            label: assignment.assignmentName || "Assignment Overview",
            to: `/dashboard/assignments/${assignment.id}/submissions`,
          },
          {
            label: "Similarity Analysis",
            to: `/dashboard/assignments/${assignment.id}/similarity`,
          },
        ]
      : []),
    { label: "Cross-Class Check" },
  ]

  const topBar = useTopBar({ user, userInitials, breadcrumbItems })

  if (!assignmentId) {
    return (
      <DashboardLayout topBar={topBar}>
        <div className="py-12 text-center">
          <p className="text-slate-500">No assignment selected.</p>
          <button
            type="button"
            onClick={() => navigate("/dashboard/classes")}
            className="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Go to Classes
          </button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout topBar={topBar}>
      <div className="w-full max-w-full space-y-6 xl:max-w-[1600px]">
        <div className="border-b border-slate-200 pb-6">
          <h1 className={dashboardTheme.pageTitle}>
            Cross-Class Similarity Check
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Compare submissions across your classes to detect similarity between
            students in different sections with matching assignments.
          </p>
        </div>

        <CrossClassResultsSection
          assignmentId={parseInt(assignmentId, 10)}
          shouldRunInitialAnalysis={shouldRunInitialAnalysis}
        />
      </div>
    </DashboardLayout>
  )
}
