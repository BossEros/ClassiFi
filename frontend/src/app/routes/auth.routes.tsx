import { Navigate, Route } from "react-router-dom"
import { ForgotPasswordPage } from "@/presentation/pages/auth/ForgotPasswordPage"
import { LoginPage } from "@/presentation/pages/auth/LoginPage"
import { RegisterPage } from "@/presentation/pages/auth/RegisterPage"
import {
  EmailConfirmationWrapper,
  ResetPasswordWrapper,
} from "@/app/routes/routeGuards"

export const authRouteElements = (
  <>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordWrapper />} />
    <Route path="/confirm-email" element={<EmailConfirmationWrapper />} />
  </>
)
