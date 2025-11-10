import { useState } from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Eye, EyeOff, Lock, User, ArrowRight } from 'lucide-react'

interface LoginProps {
  onRegisterClick?: () => void
}

export default function Login({ onRegisterClick }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      console.log('Login attempt with:', { username, password })
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md relative">
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-8 md:p-10 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 mb-4 shadow-lg shadow-purple-500/30">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Welcome to <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">ClassiFi</span>
            </h1>
            <p className="text-gray-400 text-sm">Sign in to your account to continue</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            {/* Username Field */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-300"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-11"
                  required
                  aria-required="true"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300"
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors font-medium"
                  tabIndex={-1}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11"
                  required
                  aria-required="true"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors focus:outline-none focus:text-gray-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full group"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Sign In</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="border-t border-gray-700"></div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <button
                onClick={onRegisterClick}
                className="text-purple-400 hover:text-purple-300 transition-colors font-semibold hover:underline"
              >
                Create account
              </button>
            </p>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-center text-xs text-gray-500 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
