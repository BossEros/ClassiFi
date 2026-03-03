import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Input } from "@/presentation/components/ui/Input";
import { Button } from "@/presentation/components/ui/Button";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { requestPasswordReset } from "@/business/services/authService";
import { useZodForm } from "@/presentation/hooks/shared/useZodForm";
import { forgotPasswordFormSchema, type ForgotPasswordFormValues } from "@/presentation/schemas/auth/authSchemas";

// Inlined from src/presentation/components/auth/forms/ForgotPasswordForm.tsx
interface ForgotPasswordFormProps {
  onBackToLoginClick?: () => void
}



function ForgotPasswordForm({
  onBackToLoginClick,
}: ForgotPasswordFormProps) {
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
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">Check your email</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            If an account exists with{" "}
            <span className="text-white font-medium">{emailValue}</span>, you
            will receive password reset instructions shortly.
          </p>
        </div>

        <div className="pt-4">
          <p className="text-sm text-gray-400 mb-4">
            Didn't receive an email? Check your spam folder or try again.
          </p>

          <Button
            type="button"
            onClick={() => {
              setIsSuccess(false)
              setError(null)
              reset({ email: "" })
            }}
            className="w-full mb-3 bg-white/5 hover:bg-white/10 from-transparent to-transparent border border-white/10"
          >
            Try another email
          </Button>

          <button
            type="button"
            onClick={onBackToLoginClick}
            className="text-sm text-teal-400 hover:text-teal-300 transition-colors font-medium"
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
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Instructions */}
      <p className="text-gray-400 text-sm leading-relaxed">
        Enter your email address and we'll send you instructions to reset your
        password.
      </p>

      {/* Email Field */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-300"
        >
          Email address
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
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
            className="pl-11"
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
      <div className="border-t border-white/10"></div>

      {/* Back to Login Link */}
      <div className="text-center">
        <p className="text-sm text-slate-400">
          Remember your password?{" "}
          <button
            type="button"
            onClick={onBackToLoginClick}
            className="text-teal-400 hover:text-teal-300 transition-colors font-semibold hover:underline cursor-pointer"
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
