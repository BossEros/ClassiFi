import { useState } from "react"
import { Input } from "../ui/Input"
import { Button } from "../ui/Button"
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react"
import { loginUser } from "@/business/services/authService"
import { validateField } from "@/business/validation/authValidation"

interface LoginFormProps {
  onSuccess?: () => void
  onRegisterClick?: () => void
  onForgotPasswordClick?: () => void
}

export function LoginForm({
  onSuccess,
  onRegisterClick,
  onForgotPasswordClick,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setFieldErrors({})

    const result = await loginUser({ email, password })

    setIsLoading(false)

    if (result.success) {
      onSuccess?.()
    } else {
      setError(result.message || "Login failed")
    }
  }

  // Handle field blur for real-time validation
  const handleFieldBlur = (fieldName: string, value: string) => {
    // For login, don't validate password complexity on blur
    // Only validate it's not empty on form submit
    if (fieldName === "password") {
      return
    }

    const error = validateField(fieldName, value)

    if (error) {
      setFieldErrors((prev) => ({ ...prev, [fieldName]: error }))
    } else {
      setFieldErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldName]
        return newErrors
      })
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-5" noValidate>
      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-300"
        >
          Email
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Mail className="w-5 h-5" />
          </div>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={(e) => handleFieldBlur("email", e.target.value)}
            className="pl-11"
            required
            aria-required="true"
            disabled={isLoading}
            hasError={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
          />
        </div>
        {fieldErrors.email && (
          <p id="email-error" className="text-sm text-red-400" role="alert">
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-300"
          >
            Password
          </label>
          <button
            type="button"
            onClick={onForgotPasswordClick}
            className="text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium cursor-pointer"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Lock className="w-5 h-5" />
          </div>
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={(e) => handleFieldBlur("password", e.target.value)}
            className="pl-11 pr-11"
            required
            aria-required="true"
            disabled={isLoading}
            hasError={!!fieldErrors.password}
            aria-describedby={
              fieldErrors.password ? "password-error" : undefined
            }
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors focus:outline-none focus:text-slate-300"
            aria-label={showPassword ? "Hide password" : "Show password"}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {fieldErrors.password && (
          <p id="password-error" className="text-sm text-red-400" role="alert">
            {fieldErrors.password}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full group" isLoading={isLoading}>
        {isLoading ? (
          "Signing in..."
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <span>Sign In</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </Button>

      {/* Divider */}
      <div className="border-t border-white/10"></div>

      {/* Sign Up Link */}
      <div className="text-center">
        <p className="text-sm text-slate-400">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onRegisterClick}
            className="text-teal-400 hover:text-teal-300 transition-colors font-semibold hover:underline cursor-pointer"
          >
            Create account
          </button>
        </p>
      </div>
    </form>
  )
}
