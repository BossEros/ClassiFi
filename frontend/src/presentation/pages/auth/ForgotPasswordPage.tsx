import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Input } from "@/presentation/components/ui/Input";
import { Button } from "@/presentation/components/ui/Button";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { requestPasswordReset } from "@/business/services/authService";
import { useZodForm } from "@/presentation/hooks/shared/useZodForm";
import { forgotPasswordFormSchema, type ForgotPasswordFormValues } from "@/presentation/schemas/auth/authSchemas";
import { authTheme } from "@/presentation/constants/authTheme";

// Inlined from src/presentation/components/auth/forms/ForgotPasswordForm.tsx
interface ForgotPasswordFormProps {
  onBackToLoginClick?: () => void
}



function ForgotPasswordForm({
  onBackToLoginClick,
}: ForgotPasswordFormProps) {
  const authInputClassName =
    `${authTheme.input} ${authTheme.inputWithLeadingIcon}`

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    reset,
    formState: { errors },
  } = useZodForm({
    schema: forgotPasswordFormSchema,
    defaultValues: {
      email: "",
    },
    mode: "onSubmit",
  })

  const emailValue = watch("email")
  const emailField = register("email")

  const handleForgotPasswordSubmit = async (
    formValues: ForgotPasswordFormValues,
  ) => {
    setIsLoading(true)
    setError(null)

    const result = await requestPasswordReset({ email: formValues.email })

    setIsLoading(false)

    if (result.success) {
      setIsSuccess(true)
    } else {
      setError(result.message || "Failed to process request")
    }
  }

  // Success state view
  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-[#EAF7F1]`}>
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-[#13211E]">Check your email</h3>
          <p className={authTheme.contentText}>
            If an account exists with{" "}
            <span className="font-medium text-[#13211E]">{emailValue}</span>, you
            will receive password reset instructions shortly.
          </p>
        </div>

        <div className="pt-4">
          <p className="mb-4 text-sm text-[#5F746E]">
            Didn't receive an email? Check your spam folder or try again.
          </p>

          <Button
            type="button"
            onClick={() => {
              setIsSuccess(false)
              setError(null)
              reset({ email: "" })
            }}
            variant="secondary"
            className="mb-3 w-full rounded-xl border border-[#B8C8C2] bg-[#EDF3F1] text-[#334944] hover:bg-[#F0F5F3] hover:border-[#9FB3AC]"
          >
            Try another email
          </Button>

          <button
            type="button"
            onClick={onBackToLoginClick}
            className={`text-sm ${authTheme.subtleLink}`}
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  // Form view
  return (
    <form
      onSubmit={handleSubmit(handleForgotPasswordSubmit)}
      className="space-y-5"
      noValidate
    >
      {/* Error Message */}
      {error && (
        <div className={authTheme.errorAlert}>
          {error}
        </div>
      )}

      {/* Instructions */}
      <p className={authTheme.contentText}>
        Enter your email address and we'll send you instructions to reset your
        password.
      </p>

      {/* Email Field */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className={authTheme.label}
        >
          Email address
        </label>
        <div className="relative">
          <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${authTheme.inputIcon}`}>
            <Mail className="w-5 h-5" />
          </div>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
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
          <p id="email-error" className="text-sm text-red-400" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full group" isLoading={isLoading}>
        {isLoading ? (
          "Sending..."
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <span>Send reset instructions</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </Button>

      {/* Divider */}
      <div className={authTheme.divider}></div>

      {/* Back to Login Link */}
      <div className="text-center">
        <p className={authTheme.mutedText}>
          Remember your password?{" "}
          <button
            type="button"
            onClick={onBackToLoginClick}
            className={`cursor-pointer ${authTheme.link}`}
          >
            Sign in
          </button>
        </p>
      </div>
    </form>
  )
}

export function ForgotPasswordPage() {
  const navigate = useNavigate()

  const handleBackToLogin = () => {
    navigate("/login")
  }
  return (
    <div className={authTheme.pageShell}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={authTheme.backgroundOrbPrimary}></div>
        <div className={authTheme.backgroundOrbSecondary}></div>
      </div>

      {/* Forgot Password Card */}
      <div className={`${authTheme.cardWrapper} ${authTheme.loginCardWidth}`}>
        <div className={authTheme.cardSurface}>
          <div className="space-y-6 md:space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <h1 className={authTheme.cardTitle}>
                Forgot Password?
              </h1>
              <p className={authTheme.cardSubtitle}>
                No worries, we'll help you reset it
              </p>
            </div>

            {/* Forgot Password Form */}
            <ForgotPasswordForm onBackToLoginClick={handleBackToLogin} />
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
