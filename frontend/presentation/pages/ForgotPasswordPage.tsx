import { ForgotPasswordForm } from '../components/forms/ForgotPasswordForm'
import { useNavigate } from 'react-router-dom'

export function ForgotPasswordPage() {
  const navigate = useNavigate()

  const handleBackToLogin = () => {
    navigate('/login')
  }
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Forgot Password Card */}
      <div className="w-full max-w-md relative">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 md:p-10 space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Forgot Password?
            </h1>
            <p className="text-gray-400 text-base">
              No worries, we'll help you reset it
            </p>
          </div>

          {/* Forgot Password Form */}
          <ForgotPasswordForm onBackToLoginClick={handleBackToLogin} />
        </div>

        {/* Footer Text */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
