import { Route } from "react-router-dom"
import { ProtectedRoute } from "@/presentation/components/shared/dashboard/ProtectedRoute"
import { HistoryPage } from "@/presentation/pages/student/HistoryPage"
import { StudentGradesPage } from "@/presentation/pages/student/StudentGradesPage"
import { TasksPage } from "@/presentation/pages/student/TasksPage"

export function StudentRoutes() {
  return (
    <>
      <Route
        path="/dashboard/grades"
        element={
          <ProtectedRoute>
            <StudentGradesPage />
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
    </>
  )
}

