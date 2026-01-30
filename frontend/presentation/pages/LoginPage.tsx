import { LoginForm } from "../components/forms/LoginForm"
import { useNavigate } from "react-router-dom"
import { getCurrentUser } from "@/business/services/authService"

export function LoginPage() {
  const navigate = useNavigate()

  const handleLoginSuccess = () => {
    // Get the logged-in user to check their role
    const user = getCurrentUser()

    if (user) {
      // Redirect teachers to the teacher dashboard
      if (user.role === "teacher") {
        navigate("/dashboard")
      } else if (user.role === "student") {
        // TODO: Redirect students to student dashboard when implemented
        navigate("/dashboard")
      } else if (user.role === "admin") {
        // TODO: Redirect admins to admin dashboard when implemented
        navigate("/dashboard")
      } else {
        // Fallback to dashboard
        navigate("/dashboard")
      }
    } else {
      // Fallback if user data is not available
      navigate("/dashboard")
    }
  }

  const handleRegisterClick = () => {
    navigate("/register")
  }

  const handleForgotPasswordClick = () => {
    navigate("/forgot-password")
  }

  return (
    <div className="min-h-screen w-full grid place-items-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 p-6 md:p-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[448px] min-w-[320px] relative">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-6 sm:p-8 md:p-10">
          <div className="space-y-6 md:space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-teal-400 to-teal-300 bg-clip-text text-transparent">
                  ClassiFi
                </span>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Sign in to your account to continue
              </p>
            </div>

            {/* Login Form */}
            <LoginForm
              onSuccess={handleLoginSuccess}
              onRegisterClick={handleRegisterClick}
              onForgotPasswordClick={handleForgotPasswordClick}
            />
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-xs text-slate-400 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
