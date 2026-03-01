import { Route } from "react-router-dom"
import { ProtectedRoute } from "@/presentation/components/shared/dashboard/ProtectedRoute"
import AdminEnrollmentsPage from "@/presentation/pages/admin/AdminEnrollmentsPage"
import AdminClassFormPage from "@/presentation/pages/admin/AdminClassFormPage"
import { AdminUsersPage } from "@/presentation/pages/admin/AdminUsersPage"

export const adminRouteElements = (
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
    <Route
      path="/dashboard/admin/classes/new"
      element={
        <ProtectedRoute>
          <AdminClassFormPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/admin/classes/:classId/edit"
      element={
        <ProtectedRoute>
          <AdminClassFormPage />
        </ProtectedRoute>
      }
    />
  </>
)
