import { useEffect, type ReactNode } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { getCurrentUser } from "@/business/services/authService"
import { AdminDashboardPage } from "@/presentation/pages/admin/AdminDashboardPage"
import { AdminClassDetailPage } from "@/presentation/pages/admin/AdminClassDetailPage"
import { AdminClassesPage } from "@/presentation/pages/admin/AdminClassesPage"
import { ClassesPage } from "@/presentation/pages/teacher/ClassesPage"
import { ClassDetailPage } from "@/presentation/pages/teacher/ClassDetailPage"
import { EmailConfirmationPage } from "@/presentation/pages/auth/EmailConfirmationPage"
import { ResetPasswordPage } from "@/presentation/pages/auth/ResetPasswordPage"
import { StudentClassesPage } from "@/presentation/pages/student/StudentClassesPage"
import { StudentDashboardPage } from "@/presentation/pages/student/StudentDashboardPage"
import { TeacherDashboardPage } from "@/presentation/pages/teacher/TeacherDashboardPage"

export function RoleBasedDashboard() {
  const user = getCurrentUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === "student") {
    return <StudentDashboardPage />
  }

  if (user.role === "teacher") {
    return <TeacherDashboardPage />
  }

  if (user.role === "admin") {
    return <AdminDashboardPage />
  }

  return <StudentDashboardPage />
}

export function RoleBasedClassesPage() {
  const user = getCurrentUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === "student") {
    return <StudentClassesPage />
  }

  if (user.role === "admin") {
    return <AdminClassesPage />
  }

  return <ClassesPage />
}

export function RoleBasedClassDetailPage() {
  const user = getCurrentUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === "admin") {
    return <AdminClassDetailPage />
  }

  return <ClassDetailPage />
}

export function AuthRedirectHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const tokenHash = searchParams.get("token_hash")
    const tokenType = searchParams.get("type")

    if (tokenHash && tokenType) {
      if (tokenType === "recovery") {
        navigate(`/reset-password${window.location.search}`, { replace: true })
      } else if (tokenType === "signup" || tokenType === "email") {
        navigate(`/confirm-email${window.location.search}`, { replace: true })
      }

      return
    }

    const hash = window.location.hash
    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.substring(1))
      const hashTokenType = params.get("type")

      if (hashTokenType === "recovery") {
        navigate(`/reset-password${hash}`, { replace: true })
      } else if (hashTokenType === "signup") {
        navigate(`/confirm-email${hash}`, { replace: true })
      }
    }
  }, [navigate])

  return null
}

export function ResetPasswordWrapper() {
  const navigate = useNavigate()

  return (
    <ResetPasswordPage
      onSuccess={() => navigate("/login", { replace: true })}
    />
  )
}

export function EmailConfirmationWrapper() {
  const navigate = useNavigate()

  return (
    <EmailConfirmationPage
      onRedirectToLogin={() => navigate("/login", { replace: true })}
    />
  )
}

export function TeacherOnlyRoute({ children }: { children: ReactNode }) {
  const user = getCurrentUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== "teacher") {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export function LegacyCourseworkNewRedirect() {
  const { classId } = useParams<{ classId: string }>()

  if (!classId) {
    return <Navigate to="/dashboard/classes" replace />
  }

  return <Navigate to={`/dashboard/classes/${classId}/assignments/new`} replace />
}

export function LegacyCourseworkEditRedirect() {
  const { classId, assignmentId } = useParams<{
    classId: string
    assignmentId: string
  }>()

  if (!classId || !assignmentId) {
    return <Navigate to="/dashboard/classes" replace />
  }

  return (
    <Navigate
      to={`/dashboard/classes/${classId}/assignments/${assignmentId}/edit`}
      replace
    />
  )
}
