import { useState, useEffect } from "react"
import { Input } from "@/presentation/components/ui/Input"
import { Button } from "@/presentation/components/ui/Button"
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from "lucide-react"
import {
  resetPassword,
  initializeResetFlow,
} from "@/business/services/authService"
import { useZodForm } from "@/presentation/hooks/shared/useZodForm"
import {
  resetPasswordFormSchema,
  type ResetPasswordFormValues,
} from "@/presentation/schemas/auth/authSchemas"
import { authTheme } from "@/presentation/constants/authTheme"

interface ResetPasswordPageProps {
  onSuccess?: () => void
}

export function ResetPasswordPage({ onSuccess }: ResetPasswordPageProps) {
  const authInputClassName =
    `${authTheme.input} ${authTheme.inputWithLeadingIcon} ${authTheme.inputWithTrailingIcon}`

  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [tokenError, setTokenError] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useZodForm({
    schema: resetPasswordFormSchema,
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
  })

  const newPasswordField = register("newPassword")
  const confirmPasswordField = register("confirmPassword")

  useEffect(() => {
    let isMounted = true

    const initializeSession = async () => {
      try {
        const result = await initializeResetFlow()

        if (!isMounted) return

        if (result.success) {
          setIsCheckingSession(false)
        } else {
          setTokenError(true)
          setError(result.message || "Failed to verify reset link.")
          setIsCheckingSession(false)
        }
      } catch (err) {
        if (!isMounted) return
        console.error("Reset flow initialization error:", err)
        setTokenError(true)
        setError("An unexpected error occurred.")
        setIsCheckingSession(false)
      }
    }

    initializeSession()

    return () => {
      isMounted = false
    }
  }, [])

  const handleResetPasswordSubmit = async (
    formValues: ResetPasswordFormValues,
  ) => {
    setError(null)

    if (tokenError) {
      setError("Invalid reset link. Please request a new password reset.")
      return
    }

    setIsLoading(true)

    try {
      // Use authService for password reset (follows 3-tier architecture)
      const result = await resetPassword({
        newPassword: formValues.newPassword,
        confirmPassword: formValues.confirmPassword,
      })

      if (result.success) {
        setSuccess(true)

        // Redirect to login after 3 seconds
        setTimeout(() => {
          onSuccess?.()
        }, 3000)
      } else {
        setError(result.message || "Failed to reset password")
      }
    } catch (err) {
      console.error("Password reset error:", err)
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while resetting your password",
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className={authTheme.pageShell}>
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={authTheme.backgroundOrbPrimary}></div>
          <div className={authTheme.backgroundOrbSecondary}></div>
        </div>
        <div className={`${authTheme.cardWrapper} max-w-md`}>
          <div className={`${authTheme.compactCardSurface} text-center`}>
            <div className="flex justify-center mb-6">
              <div className={authTheme.successIconShell}>
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="mb-4 text-3xl font-bold text-[#13211E]">
              Password Reset Complete!
            </h1>
            <p className="mb-6 text-[#5F746E]">
              Your password has been successfully updated. You can now log in
              with your new password.
            </p>
            <p className="text-sm text-[#6A817A]">
              Redirecting to login in 3 seconds...
            </p>
            <Button onClick={onSuccess} className="w-full mt-6">
              Go to Login Now
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (isCheckingSession) {
    return (
      <div className={authTheme.pageShell}>
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={authTheme.backgroundOrbPrimary}></div>
          <div className={authTheme.backgroundOrbSecondary}></div>
        </div>
        <div className={`${authTheme.cardWrapper} max-w-md`}>
          <div className={`${authTheme.compactCardSurface} text-center`}>
            <div className="flex justify-center mb-6">
              <div className={authTheme.loadingSpinnerShell}></div>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-[#13211E]">
              Verifying Reset Link...
            </h1>
            <p className="text-[#5F746E]">
              Please wait while we verify your password reset link.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (tokenError) {
    return (
      <div className={authTheme.pageShell}>
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={authTheme.backgroundOrbPrimary}></div>
          <div className={authTheme.backgroundOrbSecondary}></div>
        </div>
        <div className={`${authTheme.cardWrapper} max-w-md`}>
          <div className={`${authTheme.compactCardSurface} text-center`}>
            <div className="flex justify-center mb-6">
              <div className={authTheme.errorIconShell}>
                <XCircle className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="mb-4 text-3xl font-bold text-[#13211E]">
              Invalid Reset Link
            </h1>
            <p className="mb-6 text-[#5F746E]">{error}</p>
            <Button
              onClick={() => (window.location.href = "/forgot-password")}
              className="w-full"
            >
              Request New Reset Link
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={authTheme.pageShell}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={authTheme.backgroundOrbPrimary}></div>
        <div className={authTheme.backgroundOrbSecondary}></div>
      </div>

      <div className={`${authTheme.cardWrapper} max-w-md`}>
        {/* Card */}
        <div className={authTheme.compactCardSurface}>
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="mb-2 text-3xl font-bold text-[#13211E]">
              Reset Your Password
            </h1>
            <p className="text-[#5F746E]">Enter your new password below</p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(handleResetPasswordSubmit)}
            className="space-y-6"
            noValidate
          >
            {/* Error Message */}
            {error && (
              <div className={authTheme.errorAlert}>
                {error}
              </div>
            )}

            {/* New Password */}
            <div className="space-y-2">
              <label
                htmlFor="newPassword"
                className={authTheme.label}
              >
                New Password
              </label>
              <div className="relative">
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${authTheme.inputIconNonInteractive}`}>
                  <Lock className="w-5 h-5" />
                </div>
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  {...newPasswordField}
                  onBlur={(event) => {
                    newPasswordField.onBlur(event)
                    void trigger("newPassword")
                  }}
                  className={authInputClassName}
                  required
                  disabled={isLoading}
                  hasError={!!errors.newPassword}
                  aria-describedby={
                    errors.newPassword ? "newPassword-error" : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${authTheme.inputIconInteractive} hover:text-[#13211E]`}
                  aria-label={
                    showNewPassword ? "Hide password" : "Show password"
                  }
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p id="newPassword-error" className="text-sm text-rose-600">
                  {errors.newPassword.message}
                </p>
              )}
              <p className={authTheme.helperText}>
                Must be 8+ characters with uppercase, lowercase, number, and
                special character
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className={authTheme.label}
              >
                Confirm New Password
              </label>
              <div className="relative">
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${authTheme.inputIconNonInteractive}`}>
                  <Lock className="w-5 h-5" />
                </div>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your new password"
                  {...confirmPasswordField}
                  onBlur={(event) => {
                    confirmPasswordField.onBlur(event)
                    void trigger("confirmPassword")
                  }}
                  className={authInputClassName}
                  required
                  disabled={isLoading}
                  hasError={!!errors.confirmPassword}
                  aria-describedby={
                    errors.confirmPassword ? "confirmPassword-error" : undefined
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${authTheme.inputIconInteractive} hover:text-[#13211E]`}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="text-sm text-rose-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Resetting Password...</span>
                </div>
              ) : (
                "Reset Password"
              )}
            </Button>

            {/* Back to Login */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => (window.location.href = "/login")}
                className={`text-sm ${authTheme.subtleLink}`}
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
