/**
 * Protected Route Component
 * Part of the Presentation Layer - Dashboard Components
 * Wraps routes that require authentication
 */

import { Navigate } from 'react-router-dom'
import { getCurrentUser } from '@/business/services/auth/authService'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const user = getCurrentUser()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

