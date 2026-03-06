import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { useState } from "react";
import { Input } from "@/presentation/components/ui/Input";
import { Button } from "@/presentation/components/ui/Button";
import { Eye, EyeOff, Lock, Mail, ArrowRight } from "lucide-react";
import { loginUser } from "@/business/services/authService";
import { useZodForm } from "@/presentation/hooks/shared/useZodForm";
import { loginFormSchema, type LoginFormValues } from "@/presentation/schemas/auth/authSchemas";
import { authTheme } from "@/presentation/constants/authTheme";

// Inlined from src/presentation/components/auth/forms/LoginForm.tsx
interface LoginFormProps {
  onSuccess?: () => void
  onRegisterClick?: () => void
  onForgotPasswordClick?: () => void
}



function LoginForm({
  onSuccess,
  onRegisterClick,
  onForgotPasswordClick,
}: LoginFormProps) {
  const authInputClassName =
    `${authTheme.input} ${authTheme.inputWithLeadingIcon}`

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useZodForm({
    schema: loginFormSchema,
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  })

  const emailField = register("email")
  const passwordField = register("password")

  const handleLogin = async (formValues: LoginFormValues) => {
    setIsLoading(true)
    setError(null)

    const result = await loginUser({
      email: formValues.email,
      password: formValues.password,
    })

    setIsLoading(false)

    if (result.success) {
      onSuccess?.()
    } else {
      setError(result.message || "Login failed")
    }
  }

  return (
    <form onSubmit={handleSubmit(handleLogin)} className="space-y-5" noValidate>
      {/* Error Message */}
      {error && (
        <div className={authTheme.errorAlert}>
          {error}
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className={authTheme.label}
        >
          Email
        </label>
        <div className="relative">
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${authTheme.inputIcon}`}>
            <Mail className="w-5 h-5" />
          </div>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...emailField}
            onBlur={(event) => {
              emailField.onBlur(event)
              void trigger("email")
            }}
            className={authInputClassName}
            required
            aria-required="true"
            disabled={isLoading}
            hasError={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
        </div>
        {errors.email && (
          <p id="email-error" className="text-sm text-rose-600" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className={authTheme.label}
          >
            Password
          </label>
          <button
            type="button"
            onClick={onForgotPasswordClick}
            className={`cursor-pointer text-xs ${authTheme.subtleLink}`}
            tabIndex={-1}
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${authTheme.inputIcon}`}>
            <Lock className="w-5 h-5" />
          </div>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            {...passwordField}
            onBlur={(event) => {
              passwordField.onBlur(event)
            }}
            className={`${authInputClassName} ${authTheme.inputWithTrailingIcon}`}
            required
            aria-required="true"
            disabled={isLoading}
            hasError={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors focus:outline-none ${authTheme.inputIcon} hover:text-[#13211E] focus:text-[#13211E]`}
            aria-label={showPassword ? "Hide password" : "Show password"}
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
        {errors.password && (
          <p id="password-error" className="text-sm text-rose-600" role="alert">
            {errors.password.message}
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
      <div className={authTheme.divider}></div>

      {/* Sign Up Link */}
      <div className="text-center">
        <p className={authTheme.mutedText}>
          Don't have an account?{" "}
          <button
            type="button"
            onClick={onRegisterClick}
            className={`cursor-pointer ${authTheme.link}`}
          >
            Create account
          </button>
        </p>
      </div>
    </form>
  )
}

export function LoginPage() {
  const navigate = useNavigate()

  const handleLoginSuccess = () => {
    // Read latest auth state without calling React hooks in an event callback
    const user = useAuthStore.getState().user

    if (user) {
      // Redirect teachers to the teacher dashboard
      if (user.role === "teacher") {
        navigate("/dashboard")
      } else if (user.role === "student") {
        navigate("/dashboard")
      } else if (user.role === "admin") {
        navigate("/dashboard")
      } else {
        navigate("/dashboard")
      }
    } else {
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
    <div className={authTheme.pageShell}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={authTheme.backgroundOrbPrimary}></div>
        <div className={authTheme.backgroundOrbSecondary}></div>
      </div>

      {/* Login Card */}
      <div className={`${authTheme.cardWrapper} ${authTheme.loginCardWidth}`}>
        <div className={authTheme.cardSurface}>
          <div className="space-y-6 md:space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <h1 className={authTheme.cardTitle}>
                Welcome to{" "}
                <span className="bg-gradient-to-r from-teal-700 to-teal-600 bg-clip-text text-transparent">
                  ClassiFi
                </span>
              </h1>
              <p className={authTheme.cardSubtitle}>
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
        <p className={authTheme.footerText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
