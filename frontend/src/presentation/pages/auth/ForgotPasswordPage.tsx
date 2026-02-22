import { ForgotPasswordForm } from "@/presentation/components/auth/forms/ForgotPasswordForm"
import { useNavigate } from "react-router-dom"

export function ForgotPasswordPage() {
  const navigate = useNavigate()

  const handleBackToLogin = () => {
    navigate("/login")
  }
  return (
    <div className="min-h-screen w-full grid place-items-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 p-6 md:p-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Forgot Password Card */}
      <div className="w-full max-w-[448px] min-w-[320px] relative">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-6 sm:p-8 md:p-10">
          <div className="space-y-6 md:space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                Forgot Password?
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                No worries, we'll help you reset it
              </p>
            </div>

            {/* Forgot Password Form */}
            <ForgotPasswordForm onBackToLoginClick={handleBackToLogin} />
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
