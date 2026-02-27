import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { ToastContainer } from "@/presentation/components/ui/Toast"
import { useToastStore } from "@/shared/store/useToastStore"
import { adminRouteElements } from "@/app/routes/admin.routes"
import { authRouteElements } from "@/app/routes/auth.routes"
import { AuthRedirectHandler } from "@/app/routes/routeGuards"
import { sharedRouteElements } from "@/app/routes/shared.routes"
import { studentRouteElements } from "@/app/routes/student.routes"
import { teacherRouteElements } from "@/app/routes/teacher.routes"

function App() {
  const toasts = useToastStore((state) => state.toasts)
  const dismissToast = useToastStore((state) => state.dismissToast)

  return (
    <BrowserRouter>
      <AuthRedirectHandler />
      <Routes>
        {authRouteElements}
        {sharedRouteElements}
        {studentRouteElements}
        {teacherRouteElements}
        {adminRouteElements}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </BrowserRouter>
  )
}

export default App
