import { Route } from "react-router-dom"
import { ProtectedRoute } from "@/presentation/components/shared/dashboard/ProtectedRoute"
import { AssignmentFormPage } from "@/presentation/pages/teacher/AssignmentFormPage"
import { AssignmentSubmissionsPage } from "@/presentation/pages/teacher/AssignmentSubmissionsPage"
import { ClassFormPage } from "@/presentation/pages/teacher/ClassFormPage"
import { GradebookPage } from "@/presentation/pages/teacher/GradebookPage"
import { SimilarityResultsPage } from "@/presentation/pages/teacher/SimilarityResultsPage"
import { TeacherOnlyRoute } from "@/app/routes/routeGuards"

export const teacherRouteElements = (
  <>
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
      path="/dashboard/classes/:classId/assignments/new"
      element={
        <ProtectedRoute>
          <AssignmentFormPage />
        </ProtectedRoute>
      }
    />
    <Route
      path="/dashboard/classes/:classId/assignments/:assignmentId/edit"
      element={
        <ProtectedRoute>
          <AssignmentFormPage />
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
  </>
)

