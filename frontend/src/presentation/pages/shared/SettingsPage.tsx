import { useState, useEffect } from "react"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import { Avatar } from "@/presentation/components/ui/Avatar"
import { useAuthStore } from "@/shared/store/useAuthStore"
import type { User } from "@/shared/types/auth"
import {
  User as UserIcon,
  Lock,
  Mail,
  Bell,
  Camera,
  Trash2,
  AlertTriangle,
  Shield,
} from "lucide-react"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import * as React from "react"
import { cn } from "@/shared/utils/cn"
import {
  X,
  Upload,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon,
} from "lucide-react"
import { uploadAvatar } from "@/business/services/userService"
import {
  validateImageFile,
  FILE_VALIDATION,
} from "@/presentation/utils/imageValidation"
import { Eye, EyeOff } from "lucide-react"
import { changePassword } from "@/business/services/authService"
import type { ChangePasswordRequest } from "@/shared/types/auth"
import type { FieldErrors } from "react-hook-form"
import { useZodForm } from "@/presentation/hooks/shared/useZodForm"
import {
  changePasswordFormSchema,
  type ChangePasswordFormValues,
} from "@/presentation/schemas/auth/authSchemas"
import { getFirstFormErrorMessage } from "@/presentation/utils/formErrorMap"
import { deleteAccount } from "@/business/services/authService"
import { useNavigate } from "react-router-dom"
import {
  deleteAccountFormSchema,
  type DeleteAccountFormValues,
} from "@/presentation/schemas/auth/authSchemas"
import { Toggle } from "@/presentation/components/ui/Toggle"
import { updateNotificationPreferences } from "@/business/services/userService"
import { dashboardTheme } from "@/presentation/constants/dashboardTheme"

const LIGHT_SURFACE_CARD_CLASSES =
  "border-slate-300 bg-white shadow-md shadow-slate-200/70"
const LIGHT_MODAL_SHELL_CLASSES =
  "rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/30"
const LIGHT_MODAL_CLOSE_BUTTON_CLASSES =
  "absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
const LIGHT_MODAL_SECONDARY_BUTTON_CLASSES =
  "flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-200/60 transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50"
const LIGHT_INPUT_BASE_CLASSES =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm shadow-slate-200/60 transition-all duration-200 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"

// Inlined from src/presentation/components/shared/settings/AvatarUploadModal.tsx
interface AvatarUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (avatarUrl: string) => void
  currentAvatarUrl?: string
}

function AvatarUploadModal({
  isOpen,
  onClose,
  onSuccess,
  currentAvatarUrl,
}: AvatarUploadModalProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [preview, setPreview] = React.useState<string | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Reset state when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null)
      setPreview(null)
      setError(null)
      setSuccess(false)
      setIsDragging(false)
    }
  }, [isOpen])

  // Clean up preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  // Close on escape key
  React.useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isUploading) {
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
  }, [isOpen, onClose, isUploading])

  const handleFileSelect = (file: File) => {
    const validationError = validateImageFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setSelectedFile(file)
    setError(null)

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)

    const response = await uploadAvatar({
      file: selectedFile,
      currentAvatarUrl,
    })

    setIsUploading(false)

    if (response.success && response.avatarUrl) {
      setSuccess(true)
      setTimeout(() => {
        onSuccess?.(response.avatarUrl!)
        onClose()
      }, 1500)
    } else {
      setError(response.message || "Failed to upload avatar")
    }
  }

  const handleRemoveSelected = () => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setSelectedFile(null)
    setPreview(null)
    setError(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isUploading ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-[calc(100%-2rem)] max-w-[540px] mx-4 p-6 shrink-0",
          LIGHT_MODAL_SHELL_CLASSES,
          "animate-in fade-in-0 zoom-in-95 duration-200",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-upload-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isUploading}
          className={LIGHT_MODAL_CLOSE_BUTTON_CLASSES}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              success ? "bg-emerald-50" : "bg-teal-50",
            )}
          >
            {success ? (
              <CheckCircle className="w-8 h-8 text-emerald-600 shrink-0" />
            ) : (
              <Camera className="w-8 h-8 text-teal-600 shrink-0" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2
          id="avatar-upload-title"
          className="mb-2 text-center text-xl font-semibold text-slate-900"
        >
          {success ? "Avatar Updated!" : "Change Profile Picture"}
        </h2>

        {/* Description */}
        <p className="mb-6 w-full text-center text-sm text-slate-500">
          {success
            ? "Your profile picture has been updated."
            : "Upload a new profile picture. Max file size is 5MB."}
        </p>

        {!success && (
          <div className="space-y-4">
            {/* Error message */}
            {error && (
              <div className="flex w-full items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <p className="flex-1 text-sm text-rose-700">{error}</p>
              </div>
            )}

            {/* Preview or Drop Zone */}
            {preview ? (
              <div className="relative">
                <div className="aspect-square w-40 mx-auto rounded-full overflow-hidden border-2 border-teal-500/30">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={handleRemoveSelected}
                  className={cn(
                    "absolute top-0 right-1/2 translate-x-[4.5rem] p-1 rounded-full",
                    "border border-slate-200 bg-white text-slate-500 shadow-sm shadow-slate-200/60",
                    "hover:bg-slate-100 hover:text-slate-700",
                    "transition-colors duration-200",
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer w-full flex flex-col items-center",
                  "transition-all duration-200",
                  isDragging
                    ? "border-teal-500 bg-teal-50"
                    : "border-slate-300 bg-slate-50 hover:border-teal-400 hover:bg-teal-50/70",
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={FILE_VALIDATION.ACCEPTED_IMAGE_TYPES.join(",")}
                  onChange={handleInputChange}
                  className="hidden"
                />

                {currentAvatarUrl ? (
                  <div className="mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full border-2 border-slate-200">
                    <img
                      src={currentAvatarUrl}
                      alt="Current avatar"
                      className="w-full h-full object-cover opacity-50"
                    />
                  </div>
                ) : (
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-slate-200 bg-white">
                    <ImageIcon className="h-8 w-8 text-slate-400" />
                  </div>
                )}

                <div className="mb-2 flex w-full flex-col items-center justify-center gap-2">
                  <Upload className="h-5 w-5 shrink-0 text-teal-600" />
                  <span className="block w-full font-medium text-slate-800">
                    {isDragging ? "Drop image here" : "Click or drag to upload"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  JPEG, PNG, GIF, or WebP | Max 5MB
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={isUploading}
                className={LIGHT_MODAL_SECONDARY_BUTTON_CLASSES}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
                  "border border-teal-600 bg-teal-600 text-white",
                  "hover:bg-teal-700",
                  "transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Inlined from src/presentation/components/shared/settings/ChangePasswordModal.tsx
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
          "relative w-[calc(100%-2rem)] max-w-[480px] mx-4 p-6 shrink-0",
          LIGHT_MODAL_SHELL_CLASSES,
          "animate-in fade-in-0 zoom-in-95 duration-200",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
      >
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className={LIGHT_MODAL_CLOSE_BUTTON_CLASSES}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-4">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              success ? "bg-emerald-50" : "bg-sky-50",
            )}
          >
            {success ? (
              <CheckCircle className="w-8 h-8 text-emerald-600 shrink-0" />
            ) : (
              <Lock className="w-8 h-8 text-sky-600 shrink-0" />
            )}
          </div>
        </div>

        <h2
          id="change-password-title"
          className="mb-2 text-center text-xl font-semibold text-slate-900"
        >
          {success ? "Password Changed!" : "Change Password"}
        </h2>

        <p className="mb-6 w-full text-center text-sm text-slate-500">
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
              <div className="flex w-full items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <p className="flex-1 text-sm text-rose-700">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
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
                  className={cn(LIGHT_INPUT_BASE_CLASSES, "pr-12")}
                  placeholder="Enter current password"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
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
              <label className="text-sm font-medium text-slate-700">
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
                  className={cn(LIGHT_INPUT_BASE_CLASSES, "pr-12")}
                  placeholder="Enter new password"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
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
                  <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        passwordStrength.color,
                      )}
                      style={{ width: passwordStrength.width }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Password strength:{" "}
                    <span
                      className={cn(
                        passwordStrength.color === "bg-red-500" &&
                          "text-rose-500",
                        passwordStrength.color === "bg-orange-500" &&
                          "text-orange-400",
                        passwordStrength.color === "bg-yellow-500" &&
                          "text-yellow-400",
                        passwordStrength.color === "bg-green-500" &&
                          "text-emerald-600",
                      )}
                    >
                      {passwordStrength.label}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
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
                    LIGHT_INPUT_BASE_CLASSES,
                    "pr-12",
                    hasPasswordMismatch &&
                      "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20",
                  )}
                  placeholder="Confirm new password"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 shrink-0" />
                  ) : (
                    <Eye className="w-5 h-5 shrink-0" />
                  )}
                </button>
              </div>
              {hasPasswordMismatch && (
                <p className="text-xs text-rose-600">Passwords do not match</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className={LIGHT_MODAL_SECONDARY_BUTTON_CLASSES}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || hasPasswordMismatch}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
                  "border border-teal-600 bg-teal-600 text-white",
                  "hover:bg-teal-700",
                  "transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
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

// Inlined from src/presentation/components/shared/settings/DeleteAccountModal.tsx
interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
}

const INITIAL_DELETE_ACCOUNT_VALUES: DeleteAccountFormValues = {
  password: "",
  confirmation: "",
}

export function DeleteAccountModal({
  isOpen,
  onClose,
}: DeleteAccountModalProps) {
  const navigate = useNavigate()
  const { register, handleSubmit, watch, setValue, reset } = useZodForm({
    schema: deleteAccountFormSchema,
    defaultValues: INITIAL_DELETE_ACCOUNT_VALUES,
    mode: "onSubmit",
  })
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [step, setStep] = React.useState<"warning" | "confirm" | "success">(
    "warning",
  )
  const [showPassword, setShowPassword] = React.useState(false)

  const passwordField = register("password")
  const confirmationField = register("confirmation")
  const passwordValue = watch("password")
  const confirmationValue = watch("confirmation")

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      reset(INITIAL_DELETE_ACCOUNT_VALUES)
      setError(null)
      setStep("warning")
    }
  }, [isOpen, reset])

  // Close on escape key
  React.useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
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
  }, [isOpen, onClose, isDeleting])

  const handleContinue = () => {
    setStep("confirm")
  }

  const handleValidSubmit = async (formValues: DeleteAccountFormValues) => {
    setError(null)
    setIsDeleting(true)

    try {
      const result = await deleteAccount(formValues)

      if (result.success) {
        // Show success message before redirecting
        setStep("success")
        setTimeout(() => {
          navigate("/", { replace: true })
        }, 3500)
      } else {
        setError(result.message || "Failed to delete account")
      }
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleInvalidSubmit = (
    validationErrors: FieldErrors<DeleteAccountFormValues>,
  ) => {
    const firstErrorMessage = getFirstFormErrorMessage(validationErrors)

    if (firstErrorMessage) {
      setError(firstErrorMessage)
    }
  }

  const isConfirmDisabled =
    confirmationValue !== "DELETE" || !passwordValue || isDeleting

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-[calc(100%-2rem)] max-w-[480px] mx-4 p-6 shrink-0",
          "rounded-2xl border border-rose-200 bg-white shadow-2xl shadow-rose-200/50",
          "animate-in fade-in-0 zoom-in-95 duration-200",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className={cn(
            LIGHT_MODAL_CLOSE_BUTTON_CLASSES,
            "focus-visible:ring-rose-500",
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              step === "success" ? "bg-emerald-50" : "bg-rose-50",
            )}
          >
            {step === "warning" ? (
              <AlertTriangle className="w-8 h-8 text-rose-600 shrink-0" />
            ) : step === "confirm" ? (
              <Trash2 className="w-8 h-8 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle className="w-8 h-8 text-emerald-600 shrink-0" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2
          id="delete-account-title"
          className={cn(
            "mb-2 text-center text-xl font-semibold",
            step === "success" ? "text-emerald-700" : "text-slate-900",
          )}
        >
          {step === "warning"
            ? "Delete Account?"
            : step === "confirm"
              ? "Confirm Deletion"
              : "Account Deleted"}
        </h2>

        {step === "warning" ? (
          <>
            {/* Warning content */}
            <p className="mb-4 w-full text-center text-sm text-slate-600">
              {/* Permanent and irreversible text */}
              This action is{" "}
              <span className="font-semibold text-rose-700">
                permanent and irreversible
              </span>
              .
            </p>

            <div className="mb-6 space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm text-slate-700">
                Deleting your account will permanently remove:
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-rose-600">&bull;</span>
                  <span className="flex-1 min-w-0">
                    Your profile and personal information
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-rose-600">&bull;</span>
                  <span className="flex-1 min-w-0">
                    All your submissions and assignment
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-rose-600">&bull;</span>
                  <span className="flex-1 min-w-0">
                    Your enrollments in all classes
                  </span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className={LIGHT_MODAL_SECONDARY_BUTTON_CLASSES}
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
                  "border border-rose-200 bg-rose-100 text-rose-700",
                  "hover:bg-rose-200 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                )}
              >
                Continue
              </button>
            </div>
          </>
        ) : step === "confirm" ? (
          <>
            {/* Confirmation form */}
            <p className="mb-6 text-center text-sm text-slate-600">
              Please confirm your decision by entering your password and typing{" "}
              <span className="font-mono font-semibold text-rose-700">
                DELETE
              </span>
              .
            </p>

            <form
              onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
              className="space-y-4"
              noValidate
            >
              {/* Error message */}
              {error && (
                <div className="flex w-full items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <p className="flex-1 text-sm text-rose-700">{error}</p>
                </div>
              )}

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Your Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...passwordField}
                    value={passwordValue}
                    onChange={(e) => {
                      passwordField.onChange(e)
                      setError(null)
                    }}
                    className={cn(
                      LIGHT_INPUT_BASE_CLASSES,
                      "pr-12 focus:border-rose-500 focus:ring-rose-500/20",
                    )}
                    placeholder="Enter your password"
                    disabled={isDeleting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Type DELETE */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Type <span className="font-mono text-rose-700">DELETE</span>{" "}
                  to confirm
                </label>
                <input
                  type="text"
                  {...confirmationField}
                  value={confirmationValue}
                  onChange={(e) => {
                    setValue("confirmation", e.target.value.toUpperCase(), {
                      shouldDirty: true,
                      shouldTouch: true,
                    })
                    setError(null)
                  }}
                  className={cn(
                    LIGHT_INPUT_BASE_CLASSES,
                    "font-mono focus:border-rose-500 focus:ring-rose-500/20",
                    confirmationValue === "DELETE" && "border-rose-400",
                  )}
                  placeholder="DELETE"
                  disabled={isDeleting}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep("warning")}
                  disabled={isDeleting}
                  type="button"
                  className={LIGHT_MODAL_SECONDARY_BUTTON_CLASSES}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isConfirmDisabled}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
                    "bg-red-600 text-white",
                    "hover:bg-red-700 transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  {isDeleting ? "Deleting..." : "Delete My Account"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            {/* Success message */}
            <p className="mb-6 text-center text-sm text-slate-600">
              Your account has been permanently deleted. All your data has been
              removed.
            </p>
            <p className="text-center text-xs text-slate-500">
              Redirecting to home page...
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// Inlined from src/presentation/components/shared/settings/NotificationPreferences.tsx
/**
 * Notification preferences component.
 * Allows users to toggle global email and in-app notification settings.
 */
function NotificationPreferences() {
  const user = useAuthStore((state) => state.user)
  const [updating, setUpdating] = useState(false)

  if (!user) return null

  const handleToggle = async (
    field: "emailNotificationsEnabled" | "inAppNotificationsEnabled",
  ) => {
    setUpdating(true)

    try {
      await updateNotificationPreferences(
        field === "emailNotificationsEnabled"
          ? !user.emailNotificationsEnabled
          : user.emailNotificationsEnabled,
        field === "inAppNotificationsEnabled"
          ? !user.inAppNotificationsEnabled
          : user.inAppNotificationsEnabled,
      )
    } catch {
    } finally {
      setUpdating(false)
    }
  }

  const channels = [
    {
      field: "emailNotificationsEnabled" as const,
      label: "Email Notifications",
      description:
        "Receive notifications by email, even if they are not shown in your dashboard inbox",
      icon: Mail,
      iconBgClass: "bg-teal-50",
      iconClass: "text-teal-600",
      enabled: user.emailNotificationsEnabled,
    },
    {
      field: "inAppNotificationsEnabled" as const,
      label: "In-App Notifications",
      description:
        "Show notifications inside your dashboard inbox and notification bell",
      icon: Bell,
      iconBgClass: "bg-amber-50",
      iconClass: "text-amber-600",
      enabled: user.inAppNotificationsEnabled,
    },
  ]

  return (
    <div className="space-y-3">
      {channels.map((channel) => (
        <div
          key={channel.field}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm shadow-slate-200/60"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                channel.iconBgClass,
              )}
            >
              <channel.icon className={cn("w-5 h-5", channel.iconClass)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900">
                {channel.label}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {channel.description}
              </p>
            </div>
          </div>
          <Toggle
            enabled={channel.enabled}
            onChange={() => handleToggle(channel.field)}
            disabled={updating}
            variant="light"
          />
        </div>
      ))}
    </div>
  )
}

export function SettingsPage() {
  const currentUser = useAuthStore((state) => state.user)
  const [user, setUser] = useState<User | null>(currentUser)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false)
  const [isAvatarUploadOpen, setIsAvatarUploadOpen] = useState(false)

  useEffect(() => {
    setUser(currentUser)
  }, [currentUser])

  const handleAvatarSuccess = (avatarUrl: string) => {
    if (user) {
      setUser({ ...user, avatarUrl })
    }
  }

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?"
  const topBar = useTopBar({
    user,
    userInitials,
  })

  if (!user) return null

  return (
    <DashboardLayout topBar={topBar}>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="mb-8">
          <h1 className={dashboardTheme.pageTitle}>
            Account Settings
          </h1>
          <p className={dashboardTheme.pageSubtitle}>
            Manage your profile information and preferences.
          </p>
        </div>

        <div className="space-y-6">
          {/* ===== PROFILE SETTINGS ===== */}
          <Card className={cn("rounded-2xl", LIGHT_SURFACE_CARD_CLASSES)}>
            <div className="px-6 pt-6 pb-6">
              {/* Avatar + Name row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div
                  className="relative group cursor-pointer shrink-0 self-center sm:self-auto"
                  onClick={() => setIsAvatarUploadOpen(true)}
                >
                  <Avatar
                    size="lg"
                    src={user.avatarUrl}
                    fallback={userInitials}
                    className="w-24 h-24 text-2xl border-4 border-white shadow-lg transition-all duration-200 group-hover:shadow-xl ring-2 ring-white"
                  />
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="flex-1 min-w-0 pb-1 text-center sm:text-left">
                  <h2 className="text-xl font-semibold text-slate-900 truncate">
                    {user.firstName} {user.lastName}
                  </h2>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                    <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-medium capitalize text-teal-700">
                      {user.role}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => setIsAvatarUploadOpen(true)}
                  className="h-9 w-auto shrink-0 self-center sm:self-auto border border-slate-300 bg-white px-4 text-xs text-slate-700 shadow-sm shadow-slate-200/60 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-offset-white"
                >
                  <Camera className="w-3.5 h-3.5 mr-1.5" />
                  Change Photo
                </Button>
              </div>

              {/* Divider */}
              <div className="mt-6 mb-5 border-t border-slate-200" />

              {/* Details */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
                    <UserIcon className="w-3.5 h-3.5" />
                    First Name
                  </label>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800">
                    {user.firstName}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
                    <UserIcon className="w-3.5 h-3.5" />
                    Last Name
                  </label>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800">
                    {user.lastName}
                  </div>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                    Email Address
                  </label>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800">
                    {user.email}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* ===== NOTIFICATION PREFERENCES ===== */}
          <Card className={cn("rounded-2xl", LIGHT_SURFACE_CARD_CLASSES)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Bell className="w-5 h-5 text-amber-500" />
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-slate-500">
                Choose how you'd like to receive notifications and where they should appear
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationPreferences />
            </CardContent>
          </Card>

          {/* ===== SECURITY ===== */}
          <Card className={cn("rounded-2xl", LIGHT_SURFACE_CARD_CLASSES)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Shield className="w-5 h-5 text-sky-500" />
                Security
              </CardTitle>
              <CardDescription className="text-slate-500">
                Keep your account secure with a strong password
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Password row */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm shadow-slate-200/60">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50">
                    <Lock className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      Account Password
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      Update your password to keep your account secure
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="h-9 w-auto shrink-0 border border-slate-300 bg-white px-4 text-xs text-slate-700 shadow-sm shadow-slate-200/60 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-offset-white"
                >
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ===== DANGER ZONE ===== */}
          <Card className="rounded-2xl border-rose-200 bg-white shadow-md shadow-rose-100/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-rose-500">
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 shadow-sm shadow-rose-100/60">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100">
                    <Trash2 className="w-5 h-5 text-rose-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      Delete Account
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsDeleteAccountOpen(true)}
                  className="h-9 w-auto shrink-0 border border-rose-600 bg-rose-600 px-4 text-xs text-white hover:bg-rose-700 focus-visible:ring-rose-500 focus-visible:ring-offset-white"
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      <DeleteAccountModal
        isOpen={isDeleteAccountOpen}
        onClose={() => setIsDeleteAccountOpen(false)}
      />

      <AvatarUploadModal
        isOpen={isAvatarUploadOpen}
        onClose={() => setIsAvatarUploadOpen(false)}
        onSuccess={handleAvatarSuccess}
        currentAvatarUrl={user.avatarUrl}
      />
    </DashboardLayout>
  )
}


