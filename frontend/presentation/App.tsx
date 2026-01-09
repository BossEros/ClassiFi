import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { ToastProvider } from '@/shared/context/ToastContext'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { TeacherDashboardPage } from './pages/TeacherDashboardPage'
import { StudentDashboardPage } from './pages/StudentDashboardPage'
import { ClassesPage } from './pages/ClassesPage'
import { StudentClassesPage } from './pages/StudentClassesPage'
import { ClassDetailPage } from './pages/ClassDetailPage'
import { AssignmentsPage } from './pages/AssignmentsPage'
import { AssignmentDetailPage } from './pages/AssignmentDetailPage'
import { AssignmentSubmissionsPage } from './pages/AssignmentSubmissionsPage'
import { SimilarityResultsPage } from './pages/SimilarityResultsPage'
import { TasksPage } from './pages/TasksPage'
import { HistoryPage } from './pages/HistoryPage'
import { ClassFormPage } from './pages/ClassFormPage'
import { CourseworkFormPage } from './pages/CourseworkFormPage'
import { EmailConfirmationPage } from './pages/EmailConfirmationPage'
import { SettingsPage } from './pages/SettingsPage'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { AdminClassesPage } from './pages/AdminClassesPage'
import { AdminClassDetailPage } from './pages/AdminClassDetailPage'
import AdminEnrollmentsPage from './pages/AdminEnrollmentsPage'
import { ProtectedRoute } from './components/dashboard/ProtectedRoute'
import { getCurrentUser } from '@/business/services/authService'
import { useEffect } from 'react'

// Component to render dashboard based on user role
function RoleBasedDashboard() {
  const user = getCurrentUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role === 'student') {
    return <StudentDashboardPage />
  }

  if (user.role === 'admin') {
    return <AdminDashboardPage />
  }

  // Default to teacher dashboard for teachers and admins
  return <TeacherDashboardPage />
}

// Component to handle classes page - show different pages based on role
function RoleBasedClassesPage() {
  const user = getCurrentUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Students see their enrolled classes page
  if (user.role === 'student') {
    return <StudentClassesPage />
  }

  // Admins see the admin classes oversight page
  if (user.role === 'admin') {
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

  if (user.role === 'admin') {
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
    const tokenHash = searchParams.get('token_hash')
    const tokenType = searchParams.get('type')

    if (tokenHash && tokenType) {
      if (tokenType === 'recovery') {
        // Password reset flow - preserve the query params
        navigate(`/reset-password${window.location.search}`, { replace: true })
      } else if (tokenType === 'signup' || tokenType === 'email') {
        // Email confirmation flow - preserve the query params
        navigate(`/confirm-email${window.location.search}`, { replace: true })
      }
      return
    }

    // Fallback: Check for hash-based parameters (old flow or access_token)
    const hash = window.location.hash
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1))
      const hashTokenType = params.get('type')

      if (hashTokenType === 'recovery') {
        navigate(`/reset-password${hash}`, { replace: true })
      } else if (hashTokenType === 'signup') {
        navigate(`/confirm-email${hash}`, { replace: true })
      }
    }
  }, [navigate])

  return null
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
          <Route path="/reset-password" element={<ResetPasswordPage onSuccess={() => window.location.href = '/login'} />} />
          <Route path="/confirm-email" element={<EmailConfirmationPage onRedirectToLogin={() => window.location.href = '/login'} />} />

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
                <ClassFormPage />
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
