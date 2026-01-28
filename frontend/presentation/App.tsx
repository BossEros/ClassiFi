import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom"
import { ToastProvider } from "@/shared/context/ToastContext"
import { LoginPage } from "@/presentation/pages/LoginPage"
import { RegisterPage } from "@/presentation/pages/RegisterPage"
import { ForgotPasswordPage } from "@/presentation/pages/ForgotPasswordPage"
import { ResetPasswordPage } from "@/presentation/pages/ResetPasswordPage"
import { TeacherDashboardPage } from "@/presentation/pages/TeacherDashboardPage"
import { StudentDashboardPage } from "@/presentation/pages/StudentDashboardPage"
import { ClassesPage } from "@/presentation/pages/ClassesPage"
import { StudentClassesPage } from "@/presentation/pages/StudentClassesPage"
import { ClassDetailPage } from "@/presentation/pages/ClassDetailPage"
import { AssignmentsPage } from "@/presentation/pages/AssignmentsPage"
import { AssignmentDetailPage } from "@/presentation/pages/AssignmentDetailPage"
import { AssignmentSubmissionsPage } from "@/presentation/pages/AssignmentSubmissionsPage"
import { SimilarityResultsPage } from "@/presentation/pages/SimilarityResultsPage"
import { TasksPage } from "@/presentation/pages/TasksPage"
import { HistoryPage } from "@/presentation/pages/HistoryPage"
import { ClassFormPage } from "@/presentation/pages/ClassFormPage"
import { CourseworkFormPage } from "@/presentation/pages/CourseworkFormPage"
import { EmailConfirmationPage } from "@/presentation/pages/EmailConfirmationPage"
import { SettingsPage } from "@/presentation/pages/SettingsPage"
import { AdminDashboardPage } from "@/presentation/pages/AdminDashboardPage"
import { AdminUsersPage } from "@/presentation/pages/AdminUsersPage"
import { AdminClassesPage } from "@/presentation/pages/AdminClassesPage"
import { AdminClassDetailPage } from "@/presentation/pages/AdminClassDetailPage"
import { GradebookPage } from "@/presentation/pages/GradebookPage"
import { StudentGradesPage } from "@/presentation/pages/StudentGradesPage"
import AdminEnrollmentsPage from "@/presentation/pages/AdminEnrollmentsPage"
import { ProtectedRoute } from "@/presentation/components/dashboard/ProtectedRoute"
import { getCurrentUser } from "@/business/services/authService"
import { useEffect, type ReactNode } from "react"

// Component to render dashboard based on user role
function RoleBasedDashboard() {
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

  // Default to student dashboard
  return <StudentDashboardPage />
}

// Component to handle classes page - show different pages based on role
function RoleBasedClassesPage() {
  const user = getCurrentUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Students see their enrolled classes page
  if (user.role === "student") {
    return <StudentClassesPage />
  }

  // Admins see the admin classes oversight page
  if (user.role === "admin") {
    return <AdminClassesPage />
  }

  // Teachers see the full classes page
  return <ClassesPage />
}

// Component to handle class detail page - show admin version for admins
function RoleBasedClassDetailPage() {
  const user = getCurrentUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === "admin") {
    return <AdminClassDetailPage />
  }

  return <ClassDetailPage />
}

// Component to handle redirects for Supabase email confirmation and password reset
function AuthRedirectHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    // Check for query parameters (Supabase sends token_hash as query param)
    const searchParams = new URLSearchParams(window.location.search)
    const tokenHash = searchParams.get("token_hash")
    const tokenType = searchParams.get("type")

    if (tokenHash && tokenType) {
      if (tokenType === "recovery") {
        // Password reset flow - preserve the query params
        navigate(`/reset-password${window.location.search}`, { replace: true })
      } else if (tokenType === "signup" || tokenType === "email") {
        // Email confirmation flow - preserve the query params
        navigate(`/confirm-email${window.location.search}`, { replace: true })
      }
      return
    }

    // Fallback: Check for hash-based parameters (old flow or access_token)
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

// Wrapper for ResetPasswordPage to handle navigation
function ResetPasswordWrapper() {
  const navigate = useNavigate()
  return (
    <ResetPasswordPage
      onSuccess={() => navigate("/login", { replace: true })}
    />
  )
}

// Wrapper for EmailConfirmationPage to handle navigation
function EmailConfirmationWrapper() {
  const navigate = useNavigate()
  return (
    <EmailConfirmationPage
      onRedirectToLogin={() => navigate("/login", { replace: true })}
    />
  )
}

// Component to ensure only teachers can access a route
function TeacherOnlyRoute({ children }: { children: ReactNode }) {
  const user = getCurrentUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== "teacher") {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthRedirectHandler />
        <Routes>
          {/* Default route - redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Authentication routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordWrapper />} />
          <Route path="/confirm-email" element={<EmailConfirmationWrapper />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleBasedDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/grades"
            element={
              <ProtectedRoute>
                <StudentGradesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/classes"
            element={
              <ProtectedRoute>
                <RoleBasedClassesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/classes/new"
            element={
              <ProtectedRoute>
                <TeacherOnlyRoute>
                  <ClassFormPage />
                </TeacherOnlyRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/classes/:classId/edit"
            element={
              <ProtectedRoute>
                <ClassFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/classes/:classId/coursework/new"
            element={
              <ProtectedRoute>
                <CourseworkFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/classes/:classId/coursework/:assignmentId/edit"
            element={
              <ProtectedRoute>
                <CourseworkFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/classes/:classId"
            element={
              <ProtectedRoute>
                <RoleBasedClassDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/classes/:classId/gradebook"
            element={
              <ProtectedRoute>
                <GradebookPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/assignments"
            element={
              <ProtectedRoute>
                <AssignmentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/assignments/:assignmentId"
            element={
              <ProtectedRoute>
                <AssignmentDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/assignments/:assignmentId/submissions"
            element={
              <ProtectedRoute>
                <AssignmentSubmissionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/assignments/:assignmentId/similarity"
            element={
              <ProtectedRoute>
                <SimilarityResultsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/tasks"
            element={
              <ProtectedRoute>
                <TasksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/users"
            element={
              <ProtectedRoute>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/enrollments"
            element={
              <ProtectedRoute>
                <AdminEnrollmentsPage />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
