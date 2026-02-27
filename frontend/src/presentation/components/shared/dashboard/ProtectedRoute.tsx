import { Navigate } from "react-router-dom"
import { useAuthStore } from "@/shared/store/useAuthStore"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const user = useAuthStore((state) => state.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
