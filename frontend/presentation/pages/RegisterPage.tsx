/**
 * Registration Page Component
 * Part of the Presentation Layer - Pages
 */

import { RegisterForm } from '../components/forms/RegisterForm'
import { useNavigate } from 'react-router-dom'

export function RegisterPage() {
  const navigate = useNavigate()

  const handleBackToLogin = () => {
    navigate('/login')
  }

  const handleRegisterSuccess = () => {
    navigate('/dashboard')
  }
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Registration Card */}
      <div className="w-full max-w-2xl relative">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 md:p-10">
          <RegisterForm onBackToLogin={handleBackToLogin} onSuccess={handleRegisterSuccess} />
        </div>
      </div>
    </div>
  )
}
