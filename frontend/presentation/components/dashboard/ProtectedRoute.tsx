import { Navigate } from 'react-router-dom'
import { getCurrentUser } from '@/business/services/authService'

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

