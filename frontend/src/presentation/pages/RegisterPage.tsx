import { RegisterForm } from "../components/forms/RegisterForm"
import { useNavigate } from "react-router-dom"

export function RegisterPage() {
  const navigate = useNavigate()

  const handleBackToLogin = () => {
    navigate("/login")
  }

  const handleRegisterSuccess = () => {
    navigate("/login")
  }
  return (
    <div className="min-h-screen w-full grid place-items-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 p-6 md:p-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Registration Card */}
      <div className="w-full max-w-[672px] min-w-[320px] relative">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-6 sm:p-8 md:p-10">
          <RegisterForm
            onBackToLogin={handleBackToLogin}
            onSuccess={handleRegisterSuccess}
          />
        </div>
      </div>
    </div>
  )
}
