import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MoreVertical, Mail, Calendar, CheckCircle, XCircle, RefreshCw, Loader2, Trash2, UserPlus, ChevronLeft, ChevronRight, Filter, ChevronDown, User as UserIcon } from "lucide-react";
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout";
import { Avatar } from "@/presentation/components/ui/Avatar";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { useToastStore } from "@/shared/store/useToastStore";
import * as adminService from "@/business/services/adminService";
import type { AdminUser } from "@/business/services/adminService";
import { useDebouncedValue } from "@/presentation/hooks/shared/useDebouncedValue";
import { useDocumentClick } from "@/presentation/hooks/shared/useDocumentClick";
import { useRequestState } from "@/presentation/hooks/shared/useRequestState";
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar";
import * as React from "react";
import type { FieldErrors } from "react-hook-form";
import { cn } from "@/shared/utils/cn";
import { AlertTriangle, X, AlertCircle } from "lucide-react";
import { useZodForm } from "@/presentation/hooks/shared/useZodForm";
import { adminDeleteUserFormSchema, type AdminDeleteUserFormValues } from "@/presentation/schemas/admin/adminUserSchemas";
import { getFirstFormErrorMessage } from "@/presentation/utils/formErrorMap";
import { Shield, Power } from "lucide-react";
import { adminEditUserFormSchema, type AdminEditUserFormValues } from "@/presentation/schemas/admin/adminUserSchemas";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { adminCreateUserFormSchema, type AdminCreateUserFormValues } from "@/presentation/schemas/admin/adminUserSchemas";

// Inlined from src/presentation/components/admin/AdminDeleteUserModal.tsx
interface AdminDeleteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  user: AdminUser | null
}



const INITIAL_DELETE_USER_VALUES: AdminDeleteUserFormValues = {
  confirmation: "",
}



function AdminDeleteUserModal({
  isOpen,
  onClose,
  onConfirm,
  user,
}: AdminDeleteUserModalProps) {
  const { register, handleSubmit, watch, setValue, reset } = useZodForm({
    schema: adminDeleteUserFormSchema,
    defaultValues: INITIAL_DELETE_USER_VALUES,
    mode: "onSubmit",
  })
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [step, setStep] = React.useState<"warning" | "confirm">("warning")

  const confirmationField = register("confirmation")
  const confirmationValue = watch("confirmation")

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      reset(INITIAL_DELETE_USER_VALUES)
      setError(null)
      setStep("warning")
      setIsDeleting(false)
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

  const handleValidSubmit = async () => {
    setError(null)
    setIsDeleting(true)

    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user")
      setIsDeleting(false)
    }
  }

  const handleInvalidSubmit = (
    validationErrors: FieldErrors<AdminDeleteUserFormValues>,
  ) => {
    const firstErrorMessage = getFirstFormErrorMessage(validationErrors)

    if (firstErrorMessage) {
      setError(firstErrorMessage)
    }
  }

  const isConfirmDisabled = confirmationValue !== "DELETE" || isDeleting

  if (!isOpen || !user) return null

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
          "relative w-full max-w-md min-w-[450px] mx-4 p-6",
          "rounded-xl border border-red-500/20 bg-slate-900/95 backdrop-blur-sm",
          "shadow-xl shadow-red-500/10",
          "animate-in fade-in-0 zoom-in-95 duration-200",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-user-title"
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
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500/20">
            {step === "warning" ? (
              <AlertTriangle className="w-8 h-8 text-red-400" />
            ) : (
              <Trash2 className="w-8 h-8 text-red-400" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2
          id="delete-user-title"
          className="text-xl font-semibold text-center mb-2 text-white"
        >
          {step === "warning" ? "Delete User?" : "Confirm Deletion"}
        </h2>

        {step === "warning" ? (
          <>
            {/* User info */}
            <div className="text-center mb-4">
              <p className="text-gray-400 text-sm">
                You are about to delete{" "}
                <span className="text-white font-medium">
                  {user.firstName} {user.lastName}
                </span>
              </p>
            </div>

            <div className="space-y-3 mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-gray-300">
                This action is{" "}
                <span className="text-red-400 font-semibold">
                  permanent and irreversible
                </span>
                . Deleting this user will remove:
              </p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">&bull;</span>
                  Their profile and personal information
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">&bull;</span>
                  All submissions and assignments
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">&bull;</span>
                  All class enrollments and associations
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
        ) : (
          <>
            {/* Confirmation form */}
            <p className="text-gray-400 text-center mb-6 text-sm">
              To confirm deletion, please type{" "}
              <span className="text-red-400 font-mono font-semibold">
                DELETE
              </span>{" "}
              below.
            </p>

            <form
              onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
              className="space-y-4"
              noValidate
            >
              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

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
                  onChange={(event) => {
                    setValue("confirmation", event.target.value.toUpperCase(), {
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
                  autoFocus
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
                    "flex-1 px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2",
                    "bg-red-600 text-white",
                    "hover:bg-red-700 transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete User
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// Inlined from src/presentation/components/admin/AdminEditUserModal.tsx
interface AdminEditUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: AdminUser | null
}



const INITIAL_EDIT_FORM_VALUES: AdminEditUserFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  role: "student",
  isActive: false,
}



function AdminEditUserModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: AdminEditUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, watch, setValue, reset } = useZodForm({
    schema: adminEditUserFormSchema,
    defaultValues: INITIAL_EDIT_FORM_VALUES,
    mode: "onSubmit",
  })

  const firstNameField = register("firstName")
  const lastNameField = register("lastName")
  const emailField = register("email")
  const roleField = register("role")

  const firstName = watch("firstName")
  const lastName = watch("lastName")
  const email = watch("email")
  const role = watch("role")
  const isActive = watch("isActive")

  useEffect(() => {
    if (!user) {
      return
    }

    reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    })
  }, [user, reset])

  if (!isOpen || !user) return null

  const handleValidSubmit = async (formValues: AdminEditUserFormValues) => {
    try {
      setIsLoading(true)
      setError(null)

      const updateOperations: Array<{
        label: string
        promise: Promise<unknown>
      }> = []

      const shouldUpdateRole = formValues.role !== user.role
      const shouldToggleUserStatus = formValues.isActive !== user.isActive
      const shouldUpdateUserDetails =
        formValues.firstName !== user.firstName ||
        formValues.lastName !== user.lastName
      const shouldUpdateUserEmail = formValues.email !== user.email

      if (shouldUpdateRole) {
        updateOperations.push({
          label: "update user role",
          promise: adminService.updateUserRole(user.id, formValues.role),
        })
      }

      if (shouldToggleUserStatus) {
        updateOperations.push({
          label: "toggle user status",
          promise: adminService.toggleUserStatus(user.id),
        })
      }

      if (shouldUpdateUserDetails) {
        updateOperations.push({
          label: "update user details",
          promise: adminService.updateUserDetails(user.id, {
            firstName: formValues.firstName,
            lastName: formValues.lastName,
          }),
        })
      }

      if (shouldUpdateUserEmail) {
        updateOperations.push({
          label: "update user email",
          promise: adminService.updateUserEmail(user.id, formValues.email),
        })
      }

      if (updateOperations.length === 0) {
        onClose()
        return
      }

      const operationResults = await Promise.allSettled(
        updateOperations.map((operation) => operation.promise),
      )

      const hasChanges = operationResults.some(
        (operationResult) => operationResult.status === "fulfilled",
      )
      const failedOperations: string[] = []

      operationResults.forEach((operationResult, operationIndex) => {
        if (operationResult.status === "rejected") {
          const operationLabel = updateOperations[operationIndex]?.label
          const operationError =
            operationResult.reason instanceof Error
              ? operationResult.reason.message
              : "Unknown error"

          failedOperations.push(
            `${operationLabel ?? "update user operation"}: ${operationError}`,
          )
        }
      })

      if (failedOperations.length > 0) {
        const partialChangesMessage = hasChanges
          ? "Some changes may have been applied. "
          : ""

        throw new Error(
          `${partialChangesMessage}Failed to complete the following operations: ${failedOperations.join("; ")}`,
        )
      }

      if (hasChanges) {
        onSuccess()
        onClose()
      } else {
        onClose()
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to update user",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleInvalidSubmit = (
    validationErrors: FieldErrors<AdminEditUserFormValues>,
  ) => {
    const firstErrorMessage = getFirstFormErrorMessage(validationErrors)

    if (firstErrorMessage) {
      setError(firstErrorMessage)
    }
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md min-w-[450px] transform overflow-hidden rounded-2xl bg-slate-900/95 p-6 text-left shadow-2xl transition-all border border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Edit User
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Modify user permissions and status
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <Loader2 className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
          className="space-y-6"
          noValidate
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Personal Information
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 ml-1">
                  First Name
                </label>
                <input
                  type="text"
                  {...firstNameField}
                  value={firstName}
                  onChange={(event) => {
                    firstNameField.onChange(event)
                    if (error) setError(null)
                  }}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                  placeholder="First Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 ml-1">
                  Last Name
                </label>
                <input
                  type="text"
                  {...lastNameField}
                  value={lastName}
                  onChange={(event) => {
                    lastNameField.onChange(event)
                    if (error) setError(null)
                  }}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                  placeholder="Last Name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="email"
                  {...emailField}
                  value={email}
                  onChange={(event) => {
                    emailField.onChange(event)
                    if (error) setError(null)
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 ml-1 italic">
                For account recovery if user lost email access
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5 pt-2">
              <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Account Settings
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 ml-1">
                  Role Assignment
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <select
                    {...roleField}
                    value={role}
                    onChange={(event) => {
                      roleField.onChange(event)
                      if (error) setError(null)
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all appearance-none cursor-pointer hover:bg-white/5"
                  >
                    <option value="student" className="bg-slate-900 text-white">
                      Student
                    </option>
                    <option value="teacher" className="bg-slate-900 text-white">
                      Teacher
                    </option>
                    <option value="admin" className="bg-slate-900 text-white">
                      Admin
                    </option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 ml-1">
                  Account Status
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setValue("isActive", !isActive, {
                      shouldDirty: true,
                      shouldTouch: true,
                    })
                    if (error) setError(null)
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all group ${
                    isActive
                      ? "bg-emerald-500/10 border-emerald-500/50 hover:bg-emerald-500/20"
                      : "bg-red-500/10 border-red-500/50 hover:bg-red-500/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${isActive ? "bg-emerald-500/20" : "bg-red-500/20"}`}
                    >
                      <Power
                        className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-red-400"}`}
                      />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">
                        {isActive ? "Active Account" : "Suspended Account"}
                      </div>
                      <div
                        className={`text-xs ${isActive ? "text-emerald-400/70" : "text-red-400/70"}`}
                      >
                        {isActive
                          ? "User has full system access"
                          : "User access is currently blocked"}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`w-11 h-6 rounded-full relative transition-colors border ${isActive ? "bg-emerald-500 border-emerald-400" : "bg-red-900/50 border-red-500/50"}`}
                  >
                    <div
                      className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-sm ${isActive ? "left-[22px]" : "left-0.5"}`}
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 border border-teal-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Save Changes</span>
                  <CheckCircle className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Inlined from src/presentation/components/admin/AdminUserModal.tsx
interface AdminUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}



const INITIAL_FORM_DATA: AdminCreateUserFormValues = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  role: "student",
}



function AdminUserModal({
  isOpen,
  onClose,
  onSuccess,
}: AdminUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    trigger,
    clearErrors,
    reset,
    formState: { errors },
  } = useZodForm({
    schema: adminCreateUserFormSchema,
    defaultValues: INITIAL_FORM_DATA,
    mode: "onSubmit",
  })

  const firstNameField = register("firstName")
  const lastNameField = register("lastName")
  const emailField = register("email")
  const passwordField = register("password")
  const roleField = register("role")

  const firstNameValue = watch("firstName")
  const lastNameValue = watch("lastName")
  const emailValue = watch("email")
  const passwordValue = watch("password")
  const roleValue = watch("role")

  if (!isOpen) return null

  const handleValidSubmit = async (formValues: AdminCreateUserFormValues) => {
    try {
      setIsLoading(true)
      setError(null)

      await adminService.createUser(formValues)

      onSuccess()
      onClose()
      reset(INITIAL_FORM_DATA)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create user",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleInvalidSubmit = (
    validationErrors: FieldErrors<AdminCreateUserFormValues>,
  ) => {
    const firstErrorMessage = getFirstFormErrorMessage(validationErrors)

    if (firstErrorMessage) {
      setError(firstErrorMessage)
    }
  }

  const passwordError = errors.password?.message

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md min-w-[450px] transform overflow-hidden rounded-2xl bg-slate-900/95 p-6 text-left shadow-2xl transition-all border border-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Create User
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Add a new user to the system
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <Loader2 className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 ml-1">
                First Name
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  {...firstNameField}
                  value={firstNameValue}
                  onChange={(event) => {
                    firstNameField.onChange(event)
                    if (error) setError(null)
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  placeholder="John"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-400 ml-1">
                Last Name
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  {...lastNameField}
                  value={lastNameValue}
                  onChange={(event) => {
                    lastNameField.onChange(event)
                    if (error) setError(null)
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 ml-1">
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="email"
                {...emailField}
                value={emailValue}
                onChange={(event) => {
                  emailField.onChange(event)
                  if (error) setError(null)
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                placeholder="john.doe@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 ml-1">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                {...passwordField}
                value={passwordValue}
                onChange={(event) => {
                  passwordField.onChange(event)

                  if (passwordError) {
                    clearErrors("password")
                  }

                  if (error) {
                    setError(null)
                  }
                }}
                onBlur={(event) => {
                  passwordField.onBlur(event)
                  void trigger("password")
                }}
                className={`w-full pl-10 pr-10 py-2.5 bg-black/20 border rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all ${passwordError ? "border-red-500/50" : "border-white/10"}`}
                placeholder="********"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {passwordError ? (
              <p className="text-xs text-red-400 ml-1">{passwordError}</p>
            ) : (
              <p className="text-xs text-gray-500 ml-1">
                Must be 8+ characters with uppercase, lowercase, number, and
                special character
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 ml-1">
              Role
            </label>
            <div className="relative group">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
              <select
                {...roleField}
                value={roleValue}
                onChange={(event) => {
                  roleField.onChange(event)
                  if (error) setError(null)
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="student" className="bg-slate-900">
                  Student
                </option>
                <option value="teacher" className="bg-slate-900">
                  Teacher
                </option>
                <option value="admin" className="bg-slate-900">
                  Admin
                </option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-gray-500" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !!passwordError}
              className="flex-1 px-4 py-3 rounded-xl bg-teal-600 text-white hover:bg-teal-700 border border-teal-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create User</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AdminUsersPage() {
  const navigate = useNavigate()
  const showToast = useToastStore((state) => state.showToast)
  const currentUser = useAuthStore((state) => state.user)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<
    "all" | "student" | "teacher" | "admin"
  >("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [activeDropdown, setActiveDropdown] = useState<{
    id: number
    x: number
    y: number
  } | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const { isLoading, error, setError, executeRequest } = useRequestState(true)

  const limit = 20

  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  // Fetch users
  const fetchUsers = useCallback(async () => {
    await executeRequest({
      requestFn: () =>
        adminService.getAllUsers({
          page,
          limit,
          search: debouncedSearch || undefined,
          role: roleFilter,
        }),
      onSuccess: (response) => {
        setUsers(response.data)
        setTotalPages(response.totalPages)
        setTotal(response.total)
      },
      fallbackErrorMessage: "Failed to load users",
    })
  }, [page, limit, debouncedSearch, roleFilter, executeRequest])

  useEffect(() => {
    if (!currentUser) {
      navigate("/login")
      return
    }
    if (currentUser.role !== "admin") {
      navigate("/dashboard")
      return
    }
  }, [currentUser, navigate])

  useEffect(() => {
    if (currentUser?.role === "admin") {
      fetchUsers()
    }
  }, [currentUser, fetchUsers])

  const handleClickOutside = useCallback(() => {
    setActiveDropdown(null)
    setShowFilterDropdown(false)
  }, [])

  useDocumentClick(handleClickOutside)

  const handleDropdownClick = (e: React.MouseEvent, userId: number) => {
    e.stopPropagation()
    if (activeDropdown?.id === userId) {
      setActiveDropdown(null)
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    setActiveDropdown({
      id: userId,
      x: rect.left - 240 + rect.width, // Position to the left of the button (w-60 = 240px)
      y: rect.bottom + 8, // Slight gap below button
    })
  }

  const handleDeleteUser = async (userId: number) => {
    try {
      setActionLoading(userId)
      await adminService.deleteUser(userId)
      await fetchUsers()
      setTotal((t) => t - 1)
      showToast("User deleted successfully", "success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user")
      throw err
    } finally {
      setActionLoading(null)
      setActiveDropdown(null)
    }
  }

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]"
      case "teacher":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
      case "student":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20"
    }
  }

  const userInitials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user: currentUser, userInitials })

  return (
    <DashboardLayout topBar={topBar}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              User Management
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              Manage system access, roles, and permissions.{" "}
              <span className="text-gray-500">({total} users)</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchUsers}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 border border-blue-500/40 transition-colors font-medium text-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Filters Bar */}
        <div className="relative z-50 p-1 rounded-2xl bg-slate-900/50 backdrop-blur-md border border-white/5">
          <div className="flex flex-col md:flex-row gap-4 p-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/5 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all"
              />
            </div>

            {/* Role Filter Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowFilterDropdown(!showFilterDropdown)
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-gray-300 hover:bg-white/5 hover:text-white transition-all min-w-[150px] justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-gray-400" />
                  <span className="capitalize">
                    {roleFilter === "all" ? "All Roles" : roleFilter}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-500 transition-transform ${showFilterDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showFilterDropdown && (
                <div className="absolute top-full right-0 mt-1 min-w-[160px] w-full bg-[#0B1120] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5">
                  <div className="p-1.5 space-y-0.5">
                    {(["all", "student", "teacher", "admin"] as const).map(
                      (role) => (
                        <button
                          key={role}
                          onClick={() => {
                            setRoleFilter(role)
                            setPage(1)
                            setShowFilterDropdown(false)
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all border border-transparent ${
                            roleFilter === role
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                              : "text-gray-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span className="capitalize font-medium">
                            {role === "all" ? "All Roles" : role}
                          </span>
                          {roleFilter === role && (
                            <CheckCircle className="w-3.5 h-3.5 text-blue-400" />
                          )}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden">
          {/* Glowing effect */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-50" />

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  // Loading Skeletons
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/5" />
                          <div className="space-y-2">
                            <div className="h-4 w-32 bg-white/5 rounded" />
                            <div className="h-3 w-24 bg-white/5 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-20 bg-white/5 rounded-full" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-24 bg-white/5 rounded-full" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-24 bg-white/5 rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-8 w-8 ml-auto bg-white/5 rounded" />
                      </td>
                    </tr>
                  ))
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="group hover:bg-white/[0.02] transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            fallback={`${user.firstName[0]}${user.lastName[0]} `}
                            src={user.avatarUrl ?? undefined}
                            size="sm"
                            className="ring-2 ring-transparent group-hover:ring-white/10 transition-all"
                          />
                          <div>
                            <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">
                              {user.firstName} {user.lastName}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3 h-3 text-gray-500" />
                              <p className="text-xs text-gray-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${getRoleBadgeStyle(user.role)}`}
                        >
                          {user.role.charAt(0).toUpperCase() +
                            user.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${user.isActive ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-gray-500"}`}
                          />
                          <span
                            className={`text-[11px] font-medium ${user.isActive ? "text-gray-300" : "text-gray-500"}`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-xs font-mono">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => handleDropdownClick(e, user.id)}
                            disabled={actionLoading === user.id}
                            className={`p-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors ${activeDropdown?.id === user.id ? "bg-white/10 text-white" : ""}`}
                          >
                            {actionLoading === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <MoreVertical className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-16 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 rounded-full bg-white/5">
                          <Search className="w-8 h-8 opacity-40" />
                        </div>
                        <p className="text-lg font-medium text-gray-400">
                          No users found
                        </p>
                        <p className="text-sm">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01]">
              <p className="text-sm text-gray-500">
                Page <span className="font-medium text-white">{page}</span> of{" "}
                <span className="font-medium text-white">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Floating Dropdown */}
        {activeDropdown &&
          (() => {
            const user = users.find((u) => u.id === activeDropdown.id)
            if (!user) return null

            return (
              <div
                className="fixed w-60 bg-[#0B1120] backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/5"
                style={{
                  left: activeDropdown.x,
                  top: activeDropdown.y,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-1.5 space-y-1">
                  {/* Edit Section */}
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setEditingUser(user)
                        setActiveDropdown(null)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white rounded-lg transition-all"
                    >
                      <UserIcon className="w-4 h-4 text-blue-400" />
                      Edit User Details
                    </button>
                  </div>

                  <div className="h-[1px] bg-white/5 mx-2" />

                  {/* Danger Section */}
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setDeletingUser(user)
                        setActiveDropdown(null)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-all group/delete"
                    >
                      <Trash2 className="w-4 h-4 group-hover/delete:animate-bounce" />
                      Delete User
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}

        {/* Modals */}
        <AdminUserModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchUsers()
            setTotal((t) => t + 1)
            showToast("User created successfully", "success")
          }}
        />

        <AdminEditUserModal
          isOpen={!!editingUser}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            fetchUsers()
            setEditingUser(null)
            showToast("User updated successfully", "success")
          }}
        />

        <AdminDeleteUserModal
          isOpen={!!deletingUser}
          user={deletingUser}
          onClose={() => setDeletingUser(null)}
          onConfirm={async () => {
            if (deletingUser) {
              await handleDeleteUser(deletingUser.id)
            }
          }}
        />
      </div>
    </DashboardLayout>
  )
}
