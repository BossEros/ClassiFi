import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { ToastProvider } from "@/presentation/context/ToastContext"
import { AdminRoutes } from "@/app/routes/admin.routes"
import { AuthRoutes } from "@/app/routes/auth.routes"
import {
  AuthRedirectHandler,
} from "@/app/routes/routeGuards"
import { SharedRoutes } from "@/app/routes/shared.routes"
import { StudentRoutes } from "@/app/routes/student.routes"
import { TeacherRoutes } from "@/app/routes/teacher.routes"

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthRedirectHandler />
        <Routes>
          <AuthRoutes />
          <SharedRoutes />
          <StudentRoutes />
          <TeacherRoutes />
          <AdminRoutes />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
