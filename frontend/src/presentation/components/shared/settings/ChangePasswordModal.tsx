import * as React from "react"
import { cn } from "@/shared/utils/cn"
import { Lock, X, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import { changePassword } from "@/business/services/authService"
import type { ChangePasswordRequest } from "@/business/models/auth/types"
import type { FieldErrors } from "react-hook-form"
import { useZodForm } from "@/presentation/hooks/shared/useZodForm"
import {
  changePasswordFormSchema,
  type ChangePasswordFormValues,
} from "@/presentation/schemas/auth/authSchemas"
import { getFirstFormErrorMessage } from "@/presentation/utils/formErrorMap"

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const INITIAL_FORM_STATE: ChangePasswordRequest = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false)
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const { register, handleSubmit, watch, reset } = useZodForm({
    schema: changePasswordFormSchema,
    defaultValues: INITIAL_FORM_STATE,
    mode: "onSubmit",
  })

  const currentPasswordField = register("currentPassword")
  const newPasswordField = register("newPassword")
  const confirmPasswordField = register("confirmPassword")

  const currentPasswordValue = watch("currentPassword")
  const newPasswordValue = watch("newPassword")
  const confirmPasswordValue = watch("confirmPassword")

  React.useEffect(() => {
    if (!isOpen) {
      reset(INITIAL_FORM_STATE)
      setError(null)
      setSuccess(false)
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
    }
  }, [isOpen, reset])

  React.useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose, isSubmitting])

  const handleValidSubmit = async (formValues: ChangePasswordFormValues) => {
    setError(null)
    setIsSubmitting(true)

    try {
      const result = await changePassword(formValues)

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 3500)
      } else {
        setError(result.message || "Failed to change password")
      }
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInvalidSubmit = (
    validationErrors: FieldErrors<ChangePasswordFormValues>,
  ) => {
    const firstErrorMessage = getFirstFormErrorMessage(validationErrors)

    if (firstErrorMessage) {
      setError(firstErrorMessage)
    }
  }

  const getPasswordStrength = (
    password: string,
  ): { label: string; color: string; width: string } => {
    if (!password) return { label: "", color: "", width: "0%" }

    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++

    const levels = [
      { label: "Weak", color: "bg-red-500", width: "25%" },
      { label: "Fair", color: "bg-orange-500", width: "50%" },
      { label: "Good", color: "bg-yellow-500", width: "75%" },
      { label: "Strong", color: "bg-green-500", width: "100%" },
    ]

    return levels[Math.min(strength, 3)] || levels[0]
  }

  const passwordStrength = getPasswordStrength(newPasswordValue)
  const hasPasswordMismatch =
    !!confirmPasswordValue && newPasswordValue !== confirmPasswordValue

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />

      <div
        className={cn(
          "relative w-[calc(100%-2rem)] min-w-[320px] max-w-[480px] mx-4 p-6 shrink-0",
          "rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-sm",
          "shadow-xl shadow-black/20",
          "animate-in fade-in-0 zoom-in-95 duration-200",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
      >
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className={cn(
            "absolute top-4 right-4 p-1 rounded-lg",
            "text-gray-400 hover:text-white hover:bg-white/10",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-4">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              success ? "bg-green-500/20" : "bg-blue-500/20",
            )}
          >
            {success ? (
              <CheckCircle className="w-8 h-8 text-green-400 shrink-0" />
            ) : (
              <Lock className="w-8 h-8 text-blue-400 shrink-0" />
            )}
          </div>
        </div>

        <h2
          id="change-password-title"
          className="text-xl font-semibold text-white text-center mb-2"
        >
          {success ? "Password Changed!" : "Change Password"}
        </h2>

        <p className="text-gray-400 text-center mb-6 text-sm w-full">
          {success
            ? "Your password has been updated successfully."
            : "Enter your current password and choose a new one."}
        </p>

        {!success && (
          <form
            onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
            className="space-y-4"
            noValidate
          >
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 w-full">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-400 flex-1">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  {...currentPasswordField}
                  value={currentPasswordValue}
                  onChange={(event) => {
                    currentPasswordField.onChange(event)
                    setError(null)
                  }}
                  className={cn(
                    "w-full px-4 py-3 pr-12 rounded-lg",
                    "bg-black/20 border border-white/10",
                    "text-white placeholder-gray-500",
                    "focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent",
                    "transition-all duration-200",
                  )}
                  placeholder="Enter current password"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-5 h-5 shrink-0" />
                  ) : (
                    <Eye className="w-5 h-5 shrink-0" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  {...newPasswordField}
                  value={newPasswordValue}
                  onChange={(event) => {
                    newPasswordField.onChange(event)
                    setError(null)
                  }}
                  className={cn(
                    "w-full px-4 py-3 pr-12 rounded-lg",
                    "bg-black/20 border border-white/10",
                    "text-white placeholder-gray-500",
                    "focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent",
                    "transition-all duration-200",
                  )}
                  placeholder="Enter new password"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5 shrink-0" />
                  ) : (
                    <Eye className="w-5 h-5 shrink-0" />
                  )}
                </button>
              </div>
              {newPasswordValue && (
                <div className="space-y-1">
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        passwordStrength.color,
                      )}
                      style={{ width: passwordStrength.width }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Password strength:{" "}
                    <span
                      className={cn(
                        passwordStrength.color === "bg-red-500" &&
                          "text-red-400",
                        passwordStrength.color === "bg-orange-500" &&
                          "text-orange-400",
                        passwordStrength.color === "bg-yellow-500" &&
                          "text-yellow-400",
                        passwordStrength.color === "bg-green-500" &&
                          "text-green-400",
                      )}
                    >
                      {passwordStrength.label}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...confirmPasswordField}
                  value={confirmPasswordValue}
                  onChange={(event) => {
                    confirmPasswordField.onChange(event)
                    setError(null)
                  }}
                  className={cn(
                    "w-full px-4 py-3 pr-12 rounded-lg",
                    "bg-black/20 border border-white/10",
                    "text-white placeholder-gray-500",
                    "focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent",
                    "transition-all duration-200",
                    hasPasswordMismatch && "border-red-500/50 focus:ring-red-500",
                  )}
                  placeholder="Confirm new password"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 shrink-0" />
                  ) : (
                    <Eye className="w-5 h-5 shrink-0" />
                  )}
                </button>
              </div>
              {hasPasswordMismatch && (
                <p className="text-xs text-red-400">Passwords do not match</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
                  "border border-white/20 text-white",
                  "hover:bg-white/10 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || hasPasswordMismatch}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
                  "bg-teal-600 text-white border border-teal-500/40",
                  "hover:bg-teal-700",
                  "transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                {isSubmitting ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
