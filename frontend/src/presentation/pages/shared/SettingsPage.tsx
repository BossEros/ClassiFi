import { useState, useEffect } from "react";
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/presentation/components/ui/Card";
import { Button } from "@/presentation/components/ui/Button";
import { Avatar } from "@/presentation/components/ui/Avatar";
import { useAuthStore } from "@/shared/store/useAuthStore";
import type { User } from "@/business/models/auth/types";
import { User as UserIcon, Lock, Mail, Bell, Camera, Trash2, AlertTriangle } from "lucide-react";
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar";
import * as React from "react";
import { cn } from "@/shared/utils/cn";
import { X, Upload, AlertCircle, CheckCircle, Image as ImageIcon } from "lucide-react";
import { uploadAvatar } from "@/business/services/userService";
import { validateImageFile, FILE_VALIDATION } from "@/presentation/utils/imageValidation";
import { Eye, EyeOff } from "lucide-react";
import { changePassword } from "@/business/services/authService";
import type { ChangePasswordRequest } from "@/business/models/auth/types";
import type { FieldErrors } from "react-hook-form";
import { useZodForm } from "@/presentation/hooks/shared/useZodForm";
import { changePasswordFormSchema, type ChangePasswordFormValues } from "@/presentation/schemas/auth/authSchemas";
import { getFirstFormErrorMessage } from "@/presentation/utils/formErrorMap";
import { deleteAccount } from "@/business/services/authService";
import { useNavigate } from "react-router-dom";
import { deleteAccountFormSchema, type DeleteAccountFormValues } from "@/presentation/schemas/auth/authSchemas";
import { Toggle } from "@/presentation/components/ui/Toggle";
import { notificationPreferenceService } from "@/business/services/notificationPreferenceService";
import type { NotificationPreference, NotificationType } from "@/business/models/notification/preference.types";

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
          "relative w-[calc(100%-2rem)] min-w-[320px] max-w-[540px] mx-4 p-6 shrink-0",
          "rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-sm",
          "shadow-xl shadow-black/20",
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

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              success ? "bg-green-500/20" : "bg-teal-500/20",
            )}
          >
            {success ? (
              <CheckCircle className="w-8 h-8 text-green-400 shrink-0" />
            ) : (
              <Camera className="w-8 h-8 text-teal-400 shrink-0" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2
          id="avatar-upload-title"
          className="text-xl font-semibold text-white text-center mb-2"
        >
          {success ? "Avatar Updated!" : "Change Profile Picture"}
        </h2>

        {/* Description */}
        <p className="text-gray-400 text-center mb-6 text-sm w-full">
          {success
            ? "Your profile picture has been updated."
            : "Upload a new profile picture. Max file size is 5MB."}
        </p>

        {!success && (
          <div className="space-y-4">
            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 w-full">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-400 flex-1">{error}</p>
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
                    "bg-slate-800 border border-white/10 text-gray-400",
                    "hover:text-white hover:bg-slate-700",
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
                    ? "border-teal-500 bg-teal-500/10"
                    : "border-white/20 hover:border-teal-500/50 hover:bg-white/5",
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
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-2 border-white/10">
                    <img
                      src={currentAvatarUrl}
                      alt="Current avatar"
                      className="w-full h-full object-cover opacity-50"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center border-2 border-white/10">
                    <ImageIcon className="w-8 h-8 text-gray-500" />
                  </div>
                )}

                <div className="flex flex-col items-center justify-center gap-2 mb-2 w-full">
                  <Upload className="w-5 h-5 text-teal-400 shrink-0" />
                  <span className="text-white font-medium block w-full">
                    {isDragging ? "Drop image here" : "Click or drag to upload"}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  JPEG, PNG, GIF, or WebP • Max 5MB
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={isUploading}
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
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
                  "bg-teal-600 text-white border border-teal-500/40",
                  "hover:bg-teal-700",
                  "transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
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
                    hasPasswordMismatch &&
                      "border-red-500/50 focus:ring-red-500",
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
          "relative w-[calc(100%-2rem)] min-w-[320px] max-w-[480px] mx-4 p-6 shrink-0",
          "rounded-xl border border-red-500/20 bg-slate-900/95 backdrop-blur-sm",
          "shadow-xl shadow-red-500/10",
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
            "absolute top-4 right-4 p-1 rounded-lg",
            "text-gray-400 hover:text-white hover:bg-white/10",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              step === "success" ? "bg-green-500/20" : "bg-red-500/20",
            )}
          >
            {step === "warning" ? (
              <AlertTriangle className="w-8 h-8 text-red-400 shrink-0" />
            ) : step === "confirm" ? (
              <Trash2 className="w-8 h-8 text-red-400 shrink-0" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-400 shrink-0" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2
          id="delete-account-title"
          className={cn(
            "text-xl font-semibold text-center mb-2",
            step === "success" ? "text-green-400" : "text-white",
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
            <p className="text-gray-400 text-center mb-4 text-sm w-full">
              {/* Permanent and irreversible text */}
              This action is{" "}
              <span className="text-red-400 font-semibold">
                permanent and irreversible
              </span>
              .
            </p>

            <div className="space-y-3 mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-gray-300">
                Deleting your account will permanently remove:
              </p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5 shrink-0">&bull;</span>
                  <span className="flex-1 min-w-0">
                    Your profile and personal information
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5 shrink-0">&bull;</span>
                  <span className="flex-1 min-w-0">
                    All your submissions and assignment
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5 shrink-0">&bull;</span>
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
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
                  "border border-white/20 text-white",
                  "hover:bg-white/10 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
                  "bg-red-500/20 border border-red-500/30 text-red-400",
                  "hover:bg-red-500/30 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
                )}
              >
                Continue
              </button>
            </div>
          </>
        ) : step === "confirm" ? (
          <>
            {/* Confirmation form */}
            <p className="text-gray-400 text-center mb-6 text-sm">
              Please confirm your decision by entering your password and typing{" "}
              <span className="text-red-400 font-mono font-semibold">
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
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 w-full">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-400 flex-1">{error}</p>
                </div>
              )}

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
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
                      "w-full px-4 py-3 pr-12 rounded-lg",
                      "bg-black/20 border border-white/10",
                      "text-white placeholder-gray-500",
                      "focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent",
                      "transition-all duration-200",
                    )}
                    placeholder="Enter your password"
                    disabled={isDeleting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
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
                <label className="text-sm font-medium text-gray-300">
                  Type <span className="text-red-400 font-mono">DELETE</span> to
                  confirm
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
                    "w-full px-4 py-3 rounded-lg font-mono",
                    "bg-black/20 border border-white/10",
                    "text-white placeholder-gray-500",
                    "focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent",
                    "transition-all duration-200",
                    confirmationValue === "DELETE" && "border-red-500/50",
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
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
                    "border border-white/20 text-white",
                    "hover:bg-white/10 transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
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
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
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
            <p className="text-gray-400 text-center mb-6 text-sm">
              Your account has been permanently deleted. All your data has been
              removed.
            </p>
            <p className="text-gray-500 text-center text-xs">
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
 * Allows users to configure email and in-app notification settings.
 */
function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const prefs = await notificationPreferenceService.getPreferences()
      setPreferences(prefs)
    } catch (error) {
      console.error("Failed to load notification preferences:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (
    type: NotificationType,
    field: "emailEnabled" | "inAppEnabled",
    currentValue: boolean,
  ) => {
    const updateKey = `${type}-${field}`

    // Add the key to the updating set
    setUpdating((prev) => new Set(prev).add(updateKey))

    // Helper to remove the key from the updating set
    const clearUpdating = () => {
      setUpdating((prev) => {
        const next = new Set(prev)
        next.delete(updateKey)

        return next
      })
    }

    const preference = preferences.find((p) => p.notificationType === type)

    if (!preference) {
      clearUpdating()

      return
    }

    try {
      const updatedPreference =
        await notificationPreferenceService.updatePreference(
          type,
          field === "emailEnabled" ? !currentValue : preference.emailEnabled,
          field === "inAppEnabled" ? !currentValue : preference.inAppEnabled,
        )

      setPreferences((prev) =>
        prev.map((p) => (p.notificationType === type ? updatedPreference : p)),
      )
    } catch (error) {
      console.error("Failed to update notification preference:", error)
    } finally {
      clearUpdating()
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 rounded-lg bg-white/5 border border-white/5 animate-pulse"
          >
            <div className="h-4 bg-white/10 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-white/10 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {preferences.map((preference) => {
        const label = notificationPreferenceService.getNotificationTypeLabel(
          preference.notificationType,
        )
        const description =
          notificationPreferenceService.getNotificationTypeDescription(
            preference.notificationType,
          )

        return (
          <div
            key={preference.notificationType}
            className="p-4 rounded-lg bg-white/5 border border-white/5"
          >
            <div className="mb-3">
              <h4 className="text-sm font-medium text-white">{label}</h4>
              <p className="text-xs text-slate-400 mt-1">{description}</p>
            </div>

            <div className="space-y-3">
              {/* Email Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">Email</span>
                </div>
                <Toggle
                  enabled={preference.emailEnabled}
                  onChange={() =>
                    handleToggle(
                      preference.notificationType,
                      "emailEnabled",
                      preference.emailEnabled,
                    )
                  }
                  disabled={updating.has(
                    `${preference.notificationType}-emailEnabled`,
                  )}
                />
              </div>

              {/* In-App Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">In-App</span>
                </div>
                <Toggle
                  enabled={preference.inAppEnabled}
                  onChange={() =>
                    handleToggle(
                      preference.notificationType,
                      "inAppEnabled",
                      preference.inAppEnabled,
                    )
                  }
                  disabled={updating.has(
                    `${preference.notificationType}-inAppEnabled`,
                  )}
                />
              </div>
            </div>
          </div>
        )
      })}
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
    // Update user state to reflect new avatar
    if (user) {
      setUser({ ...user, avatarUrl })
    }
  }

  const handlePasswordChangeSuccess = () => {
    //TO-DO: Handle success (e.g., show notification)
  }

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?"
  const topBar = useTopBar({
    user,
    userInitials,
    onProfileClick: () => {}, // No-op since we're already on settings page
  })

  if (!user) return null

  return (
    <DashboardLayout topBar={topBar}>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400 text-base">
            Manage your account preferences and security
          </p>
        </div>

        {/* Profile Card */}
        <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-teal-400" />
              Profile Information
            </CardTitle>
            <CardDescription>Your personal account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6 p-4 rounded-xl bg-white/5 border border-white/5">
              {/* Clickable Avatar with Edit Overlay */}
              <div
                className="relative group cursor-pointer"
                onClick={() => setIsAvatarUploadOpen(true)}
              >
                <Avatar
                  size="lg"
                  src={user.avatarUrl}
                  fallback={userInitials}
                  className="w-20 h-20 text-xl border-2 border-teal-500/30 transition-all duration-200 group-hover:border-teal-500/60"
                />
                {/* Edit overlay */}
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {user.firstName} {user.lastName}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-medium capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">
                  First Name
                </label>
                <div className="p-3 rounded-lg bg-black/20 border border-white/10 text-slate-200">
                  {user.firstName}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">
                  Last Name
                </label>
                <div className="p-3 rounded-lg bg-black/20 border border-white/10 text-slate-200">
                  {user.lastName}
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-200 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-300" />
                  Email Address
                </label>
                <div className="p-3 rounded-lg bg-black/20 border border-white/10 text-slate-200">
                  {user.email}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Notifications Row */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-400" />
                Security
              </CardTitle>
              <CardDescription>Password and authentication</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">Password</p>
                    <p className="text-xs text-slate-300 truncate">
                      Change your password
                    </p>
                  </div>
                  <Button
                    onClick={() => setIsChangePasswordOpen(true)}
                    className="w-auto h-8 px-3 text-xs border border-white/10 bg-transparent hover:bg-white/10 shrink-0"
                  >
                    Change
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-400" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationPreferences />
            </CardContent>
          </Card>
        </div>

        {/* Danger Zone */}
        <Card className="border-red-500/20 bg-slate-900/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg bg-red-500/5 border border-red-500/20">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="truncate">Delete Account</span>
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button
                onClick={() => setIsDeleteAccountOpen(true)}
                className="w-auto h-9 px-4 text-xs bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 hover:text-red-300 shrink-0"
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onSuccess={handlePasswordChangeSuccess}
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
