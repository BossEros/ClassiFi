import { Route } from "react-router-dom"
import { ProtectedRoute } from "@/presentation/components/shared/dashboard/ProtectedRoute"
import { AssignmentDetailPage } from "@/presentation/pages/shared/AssignmentDetailPage"
import { AssignmentsPage } from "@/presentation/pages/shared/AssignmentsPage"
import CalendarPage from "@/presentation/pages/shared/CalendarPage"
import { NotificationsPage } from "@/presentation/pages/shared/NotificationsPage"
import { SettingsPage } from "@/presentation/pages/shared/SettingsPage"
import {
  RoleBasedClassDetailPage,
  RoleBasedClassesPage,
  RoleBasedDashboard,
} from "@/app/routes/routeGuards"

export function SharedRoutes() {
  return (
    <>
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
        path="/dashboard/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/calendar"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
    </>
  )
}

