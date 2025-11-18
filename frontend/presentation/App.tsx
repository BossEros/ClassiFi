/**
 * Main Application Component
 * Part of the Presentation Layer
 */

import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { TeacherDashboardPage } from './pages/TeacherDashboardPage'
import { ClassesPage } from './pages/ClassesPage'
import { TasksPage } from './pages/TasksPage'
import { HistoryPage } from './pages/HistoryPage'
import { EmailConfirmationPage } from './pages/EmailConfirmationPage'
import { ProtectedRoute } from './components/dashboard/ProtectedRoute'
import { useEffect } from 'react'

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
              <TeacherDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/classes"
          element={
            <ProtectedRoute>
              <ClassesPage />
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

        {/* Catch all - redirect to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
