import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { ToastProvider } from "@/presentation/context/ToastContext"
import { adminRouteElements } from "@/app/routes/admin.routes"
import { authRouteElements } from "@/app/routes/auth.routes"
import {
  AuthRedirectHandler,
} from "@/app/routes/routeGuards"
import { sharedRouteElements } from "@/app/routes/shared.routes"
import { studentRouteElements } from "@/app/routes/student.routes"
import { teacherRouteElements } from "@/app/routes/teacher.routes"

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthRedirectHandler />
        <Routes>
          {authRouteElements}
          {sharedRouteElements}
          {studentRouteElements}
          {teacherRouteElements}
          {adminRouteElements}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
