import { Route } from "react-router-dom"
import { ProtectedRoute } from "@/presentation/components/dashboard/ProtectedRoute"
import AdminEnrollmentsPage from "@/presentation/pages/admin/AdminEnrollmentsPage"
import { AdminUsersPage } from "@/presentation/pages/admin/AdminUsersPage"

export function AdminRoutes() {
  return (
    <>
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
    </>
  )
}
