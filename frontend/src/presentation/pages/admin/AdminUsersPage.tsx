import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search, MoreVertical, Mail, Calendar, CheckCircle, XCircle, RefreshCw, Loader2, Trash2, UserPlus, ChevronLeft, ChevronRight, Filter, ChevronDown, User as UserIcon, Users, Plus, Upload, Download, AlertCircle as AlertCircleIcon, CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout";
import { Avatar } from "@/presentation/components/ui/Avatar";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { useToastStore } from "@/shared/store/useToastStore";
import * as adminService from "@/business/services/adminService";
import type { AdminUser, BulkCreateResult } from "@/business/services/adminService";
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
import type { AdminBulkUserRow } from "@/presentation/schemas/admin/adminUserSchemas";
import { dashboardTheme } from "@/presentation/constants/dashboardTheme";

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

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-md mx-4 p-6",
          "rounded-3xl border border-rose-200 bg-white",
          "shadow-xl",
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
            "absolute top-4 right-4 cursor-pointer rounded-lg p-1",
            "text-slate-400 hover:bg-slate-100 hover:text-slate-700",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
            {step === "warning" ? (
              <AlertTriangle className="h-8 w-8 text-rose-600" />
            ) : (
              <Trash2 className="h-8 w-8 text-rose-600" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2
          id="delete-user-title"
          className="mb-2 text-center text-xl font-semibold text-slate-900"
        >
          {step === "warning" ? "Delete User?" : "Confirm Deletion"}
        </h2>

        {step === "warning" ? (
          <>
            {/* User info */}
            <div className="text-center mb-4">
              <p className="text-sm text-slate-500">
                You are about to delete{" "}
                <span className="font-medium text-slate-900">
                  {user.firstName} {user.lastName}
                </span>
              </p>
            </div>

            <div className="mb-6 space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm text-slate-600">
                This action is{" "}
                <span className="font-semibold text-rose-700">
                  permanent and irreversible
                </span>
                . Deleting this user will remove:
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-rose-500">&bull;</span>
                  Their profile and personal information
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-rose-500">&bull;</span>
                  All submissions and assignments
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-rose-500">&bull;</span>
                  All class enrollments and associations
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
                  "border border-slate-300 bg-white text-slate-700",
                  "hover:bg-slate-100 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                )}
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={handleContinue}
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
                  "bg-red-600 text-white",
                  "hover:bg-red-700 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
                )}
              >
                <AlertTriangle className="h-4 w-4" />
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation form */}
            <p className="mb-6 text-center text-sm text-slate-500">
              To confirm deletion, please type{" "}
              <span className="font-mono font-semibold text-rose-700">
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
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <p className="text-sm text-rose-700">{error}</p>
                </div>
              )}

              {/* Type DELETE */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">
                  Type <span className="font-mono text-rose-700">DELETE</span>{" "}
                  to confirm
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
                    "border border-slate-300 bg-white",
                    "text-slate-900 placeholder-slate-300",
                    "focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent",
                    "transition-all duration-200",
                    confirmationValue === "DELETE" && "border-rose-400",
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
                    "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
                    "border border-slate-300 bg-white text-slate-700",
                    "hover:bg-slate-100 transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isConfirmDisabled}
                  className={cn(
                    "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
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
    </div>,
    document.body,
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

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-xl transition-all">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              Edit User
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Modify user permissions and status
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <Loader2 className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        <form
          onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
          className="space-y-6"
          noValidate
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Personal Information
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="ml-1 text-sm font-semibold text-slate-700">
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm leading-5 text-slate-900 transition-all placeholder:text-slate-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  placeholder="First Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="ml-1 text-sm font-semibold text-slate-700">
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm leading-5 text-slate-900 transition-all placeholder:text-slate-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  placeholder="Last Name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-sm font-semibold text-slate-700">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-teal-600" />
                <input
                  type="email"
                  {...emailField}
                  value={email}
                  onChange={(event) => {
                    emailField.onChange(event)
                    if (error) setError(null)
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm leading-5 text-slate-900 transition-all placeholder:text-slate-300 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  placeholder="user@example.com"
                  required
                />
              </div>
              <p className="ml-1 text-xs italic text-slate-400">
                For account recovery if user lost email access
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Account Settings
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="ml-1 text-sm font-semibold text-slate-700">
                  Role Assignment
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    {...roleField}
                    value={role}
                    onChange={(event) => {
                      roleField.onChange(event)
                      if (error) setError(null)
                    }}
                    className="w-full appearance-none cursor-pointer rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm leading-5 text-slate-900 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500/30 hover:bg-slate-50"
                  >
                    <option value="student" className="bg-white text-slate-900">
                      Student
                    </option>
                    <option value="teacher" className="bg-white text-slate-900">
                      Teacher
                    </option>
                    <option value="admin" className="bg-white text-slate-900">
                      Admin
                    </option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-sm font-semibold text-slate-700">
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
                  className={`group flex w-full items-center justify-between rounded-2xl border p-3 transition-all ${
                    isActive
                      ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                      : "border-rose-200 bg-rose-50 hover:bg-rose-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-lg p-2 ${isActive ? "bg-emerald-100" : "bg-rose-100"}`}
                    >
                      <Power
                        className={`h-4 w-4 ${isActive ? "text-emerald-700" : "text-rose-700"}`}
                      />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-slate-900">
                        {isActive ? "Active Account" : "Suspended Account"}
                      </div>
                      <div
                        className={`text-xs ${isActive ? "text-emerald-700/80" : "text-rose-700/80"}`}
                      >
                        {isActive
                          ? "User has full system access"
                          : "User access is currently blocked"}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`relative h-6 w-11 rounded-full border transition-colors ${isActive ? "border-emerald-300 bg-emerald-500" : "border-rose-300 bg-rose-200"}`}
                  >
                    <div
                      className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-sm ${isActive ? "left-[22px]" : "left-0.5"}`}
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-teal-500/30 bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

// ─── Bulk Create User Modal ───────────────────────────────────────────────────

interface AdminBulkUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (createdCount: number) => void
}

const EMPTY_BULK_ROW: AdminBulkUserRow = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "student",
}

function BulkUserRow({
  index,
  row,
  onChange,
  onRemove,
  canRemove,
  rowError,
}: {
  index: number
  row: AdminBulkUserRow
  onChange: (index: number, field: keyof AdminBulkUserRow, value: string) => void
  onRemove: (index: number) => void
  canRemove: boolean
  rowError?: Partial<Record<keyof AdminBulkUserRow, string>>
}) {
  const [showPw, setShowPw] = useState(false)

  return (
    <div className="flex gap-2 items-start py-3 border-b border-slate-100 last:border-b-0">
      <span className="mt-2.5 w-6 shrink-0 text-center text-xs font-medium text-slate-400">{index + 1}</span>

      {/* First Name */}
      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={row.firstName}
          onChange={(e) => onChange(index, "firstName", e.target.value)}
          placeholder="First name"
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-transparent",
            rowError?.firstName ? "border-rose-400" : "border-slate-300",
          )}
        />
      </div>

      {/* Last Name */}
      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={row.lastName}
          onChange={(e) => onChange(index, "lastName", e.target.value)}
          placeholder="Last name"
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-transparent",
            rowError?.lastName ? "border-rose-400" : "border-slate-300",
          )}
        />
      </div>

      {/* Email */}
      <div className="flex-[2] min-w-0">
        <input
          type="email"
          value={row.email}
          onChange={(e) => onChange(index, "email", e.target.value)}
          placeholder="email@example.com"
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-transparent",
            rowError?.email ? "border-rose-400" : "border-slate-300",
          )}
        />
      </div>

      {/* Password */}
      <div className="flex-[1.5] min-w-0 relative">
        <input
          type={showPw ? "text" : "password"}
          value={row.password}
          onChange={(e) => onChange(index, "password", e.target.value)}
          placeholder="Password"
          className={cn(
            "w-full rounded-lg border px-3 py-2 pr-8 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-transparent",
            rowError?.password ? "border-rose-400" : "border-slate-300",
          )}
        />
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          tabIndex={-1}
        >
          {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Role */}
      <div className="w-28 shrink-0">
        <select
          value={row.role}
          onChange={(e) => onChange(index, "role", e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-transparent cursor-pointer"
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        disabled={!canRemove}
        className="mt-1.5 shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

function AdminBulkUserModal({ isOpen, onClose, onSuccess }: AdminBulkUserModalProps) {
  const [rows, setRows] = useState<AdminBulkUserRow[]>([{ ...EMPTY_BULK_ROW }])
  const [rowErrors, setRowErrors] = useState<Partial<Record<keyof AdminBulkUserRow, string>>[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [result, setResult] = useState<BulkCreateResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!isOpen) {
      setRows([{ ...EMPTY_BULK_ROW }])
      setRowErrors([])
      setGlobalError(null)
      setResult(null)
      setIsLoading(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleRowChange = (index: number, field: keyof AdminBulkUserRow, value: string) => {
    setRows((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r))
    setGlobalError(null)
    setRowErrors((prev) => {
      const next = [...prev]
      if (next[index]) {
        const { [field]: _removed, ...rest } = next[index] as Record<string, string>
        next[index] = rest
      }
      return next
    })
  }

  const handleAddRow = () => {
    setRows((prev) => [...prev, { ...EMPTY_BULK_ROW }])
  }

  const handleRemoveRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index))
    setRowErrors((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.trim().split("\n").filter(Boolean).slice(1)
      const parsed: AdminBulkUserRow[] = []
      for (const line of lines) {
        const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
        if (cols.length < 5) continue
        parsed.push({
          firstName: cols[0] ?? "",
          lastName: cols[1] ?? "",
          email: cols[2] ?? "",
          password: cols[3] ?? "",
          role: (["student", "teacher", "admin"].includes(cols[4] ?? "") ? cols[4] : "student") as AdminBulkUserRow["role"],
        })
      }
      if (parsed.length > 0) {
        setRows(parsed)
        setRowErrors([])
        setGlobalError(null)
      } else {
        setGlobalError("No valid rows found in CSV. Expected: firstName, lastName, email, password, role")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const handleDownloadTemplate = () => {
    const csvContent = "firstName,lastName,email,password,role\nJohn,Doe,john.doe@example.com,SecurePass123!,student\nJane,Smith,jane.smith@example.com,SecurePass123!,teacher"
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "bulk_users_template.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const validateRows = (): boolean => {
    const errors: Partial<Record<keyof AdminBulkUserRow, string>>[] = rows.map((row) => {
      const rowValidationError: Partial<Record<keyof AdminBulkUserRow, string>> = {}
      if (!row.firstName.trim()) rowValidationError.firstName = "Required"
      if (!row.lastName.trim()) rowValidationError.lastName = "Required"
      if (!row.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) rowValidationError.email = "Valid email required"
      if (row.password.length < 8) rowValidationError.password = "8+ chars required"
      return rowValidationError
    })
    setRowErrors(errors)
    return errors.every((e) => Object.keys(e).length === 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateRows()) {
      setGlobalError("Fix the highlighted fields before submitting.")
      return
    }
    setIsLoading(true)
    setGlobalError(null)
    try {
      const bulkResult = await adminService.bulkCreateUsers(rows)
      setResult(bulkResult)
      if (bulkResult.created.length > 0) {
        onSuccess(bulkResult.created.length)
      }
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Failed to create users")
    } finally {
      setIsLoading(false)
    }
  }

  // ── Result summary screen ─────────────────────────────────────────────────
  if (result) {
    return createPortal(
      <div className="fixed inset-0 z-[10000] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative flex flex-col w-full h-full bg-white">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900">Bulk Create — Results</h3>
              <p className="mt-1 text-sm text-slate-500">
                {result.created.length} created · {result.errors.length} failed
              </p>
            </div>
            <button onClick={onClose} className="cursor-pointer rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {result.created.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <h4 className="font-semibold text-slate-800">Successfully Created ({result.created.length})</h4>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 divide-y divide-emerald-100">
                  {result.created.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                      <span className="font-medium text-slate-800">{u.firstName} {u.lastName}</span>
                      <span className="text-slate-500">{u.email}</span>
                      <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 capitalize">{u.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.errors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircleIcon className="w-5 h-5 text-rose-500" />
                  <h4 className="font-semibold text-slate-800">Failed ({result.errors.length})</h4>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50 divide-y divide-rose-100">
                  {result.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                      <AlertCircleIcon className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                      <div>
                        <span className="font-medium text-slate-800">{err.email}</span>
                        <p className="text-rose-600">{err.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>,
      document.body,
    )
  }

  // ── Entry screen ──────────────────────────────────────────────────────────
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative flex flex-col w-full h-full bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">Add Users in Bulk</h3>
            <p className="mt-1 text-sm text-slate-500">Fill in each row or upload a CSV file</p>
          </div>
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCSVUpload} />
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
            <button onClick={onClose} className="cursor-pointer rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 ml-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Column headers */}
        <div className="flex gap-2 px-6 py-2 bg-slate-50 border-b border-slate-200 shrink-0">
          <span className="w-6 shrink-0" />
          <span className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-500">First Name</span>
          <span className="flex-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Last Name</span>
          <span className="flex-[2] text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
          <span className="flex-[1.5] text-xs font-semibold uppercase tracking-wide text-slate-500">Password</span>
          <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">Role</span>
          <span className="w-8 shrink-0" />
        </div>

        {/* Rows */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6">
            {rows.map((row, i) => (
              <BulkUserRow
                key={i}
                index={i}
                row={row}
                onChange={handleRowChange}
                onRemove={handleRemoveRow}
                canRemove={rows.length > 1}
                rowError={rowErrors[i]}
              />
            ))}

            <button
              type="button"
              onClick={handleAddRow}
              className="flex cursor-pointer items-center gap-2 mt-3 mb-4 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 w-full justify-center"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-slate-200">
            {globalError && (
              <div className="flex items-start gap-3 mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
                <AlertCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                <p className="text-sm text-rose-700">{globalError}</p>
              </div>
            )}
            <div className="flex gap-3 p-6">
              <button
                type="button"
                onClick={onClose}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-teal-500/40 bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    <span>Create {rows.length} User{rows.length !== 1 ? "s" : ""}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
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

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative flex flex-col w-full h-full bg-white text-left shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              Create User
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Add a new user to the system
            </p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
          className="flex flex-col flex-1 min-h-0"
          noValidate
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                <Loader2 className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="ml-1 text-sm font-semibold text-slate-700">
                First Name
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-teal-600" />
                <input
                  type="text"
                  {...firstNameField}
                  value={firstNameValue}
                  onChange={(event) => {
                    firstNameField.onChange(event)
                    if (error) setError(null)
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm leading-5 text-slate-900 placeholder-slate-300 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  placeholder="John"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="ml-1 text-sm font-semibold text-slate-700">
                Last Name
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-teal-600" />
                <input
                  type="text"
                  {...lastNameField}
                  value={lastNameValue}
                  onChange={(event) => {
                    lastNameField.onChange(event)
                    if (error) setError(null)
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm leading-5 text-slate-900 placeholder-slate-300 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-sm font-semibold text-slate-700">
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-teal-600" />
              <input
                type="email"
                {...emailField}
                value={emailValue}
                onChange={(event) => {
                  emailField.onChange(event)
                  if (error) setError(null)
                }}
                className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm leading-5 text-slate-900 placeholder-slate-300 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                placeholder="john.doe@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-sm font-semibold text-slate-700">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-teal-600" />
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
                className={`w-full rounded-xl border bg-white py-2.5 pl-10 pr-10 text-sm leading-5 text-slate-900 placeholder-slate-300 placeholder:tracking-[0.2em] transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500/30 ${passwordError ? "border-rose-400" : "border-slate-300"}`}
                placeholder="********"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition-colors hover:text-slate-700"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {passwordError ? (
              <p className="ml-1 text-xs text-rose-600">{passwordError}</p>
            ) : (
              <p className="ml-1 text-xs text-slate-500">
                Must be 8+ characters with uppercase, lowercase, number, and
                special character
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-sm font-semibold text-slate-700">
              Role
            </label>
            <div className="relative group">
              <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-teal-600" />
              <select
                {...roleField}
                value={roleValue}
                onChange={(event) => {
                  roleField.onChange(event)
                  if (error) setError(null)
                }}
                className="w-full appearance-none cursor-pointer rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm leading-5 text-slate-900 placeholder-slate-300 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              >
                <option value="student" className="bg-white text-slate-900">
                  Student
                </option>
                <option value="teacher" className="bg-white text-slate-900">
                  Teacher
                </option>
                <option value="admin" className="bg-white text-slate-900">
                  Admin
                </option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-500" />
              </div>
            </div>
          </div>
          </div>

          <div className="flex gap-3 p-6 border-t border-slate-200 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !!passwordError}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-teal-500/40 bg-teal-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
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
    </div>,
    document.body,
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
  const [showBulkCreateModal, setShowBulkCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const { isLoading, error, setError, executeRequest } = useRequestState(true)

  const limit = 10

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
        return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700"
      case "teacher":
        return "border-sky-200 bg-sky-50 text-sky-700"
      case "student":
        return "border-emerald-200 bg-emerald-50 text-emerald-700"
      default:
        return "border-slate-200 bg-slate-100 text-slate-600"
    }
  }

  const userInitials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user: currentUser, userInitials })

  return (
    <DashboardLayout topBar={topBar}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={dashboardTheme.pageTitle}>
              User Management
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Manage system access, roles, and permissions.{" "}
              <span className="text-slate-400">({total} users)</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchUsers}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowBulkCreateModal(true)}
              className="cursor-pointer flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50"
            >
              <Users className="w-4 h-4" />
              <span>Add in Bulk</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="cursor-pointer flex items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-teal-200/60 transition-all duration-200 hover:-translate-y-0.5 hover:bg-teal-700"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Filters Bar */}
        <div className="relative z-50">
          <div className="flex flex-col gap-4 md:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-400 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-md shadow-slate-200/70 transition-all hover:border-slate-500 hover:bg-white focus:border-transparent focus:outline-none focus:ring-4 focus:ring-teal-500/15"
              />
            </div>

            {/* Role Filter Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowFilterDropdown(!showFilterDropdown)
                }}
                className="cursor-pointer flex min-w-[150px] items-center justify-between gap-2 rounded-xl border border-slate-400 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-md shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  <span className="capitalize">
                    {roleFilter === "all" ? "All Roles" : roleFilter}
                  </span>
                </div>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-500 transition-transform ${showFilterDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showFilterDropdown && (
                <div className="absolute top-full right-0 z-50 mt-2 w-full min-w-[170px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/90 ring-1 ring-slate-200/80 animate-in fade-in zoom-in-95 duration-200">
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
                          className={`flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all duration-150 ${
                            roleFilter === role
                              ? "border-teal-200 bg-teal-50 text-teal-700 shadow-sm"
                              : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm"
                          }`}
                        >
                          <span className="capitalize font-medium">
                            {role === "all" ? "All Roles" : role}
                          </span>
                          {roleFilter === role && (
                            <CheckCircle className="h-3.5 w-3.5 text-teal-600" />
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
        <div className="overflow-hidden rounded-3xl border border-slate-300 bg-white shadow-md shadow-slate-200/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-200/85">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                    User
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                    Role
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.12em] text-slate-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300/70">
                {isLoading ? (
                  // Loading Skeletons
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100" />
                          <div className="space-y-2">
                            <div className="h-4 w-32 rounded bg-slate-100" />
                            <div className="h-3 w-24 rounded bg-slate-100" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-20 rounded-full bg-slate-100" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 w-24 rounded-full bg-slate-100" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-24 rounded bg-slate-100" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="ml-auto h-8 w-8 rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="group transition-colors duration-200 hover:bg-slate-100"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            fallback={`${user.firstName[0]}${user.lastName[0]} `}
                            src={user.avatarUrl ?? undefined}
                            size="sm"
                            className="ring-2 ring-transparent transition-all group-hover:ring-teal-100"
                          />
                          <div>
                            <p className="text-sm font-medium text-slate-900 transition-colors group-hover:text-teal-700">
                              {user.firstName} {user.lastName}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Mail className="h-3 w-3 text-slate-400" />
                              <p className="text-xs text-slate-500">
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
                            className={`h-2 w-2 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-slate-400"}`}
                          />
                          <span
                            className={`text-[11px] font-medium ${user.isActive ? "text-emerald-700" : "text-slate-500"}`}
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-500">
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
                            className={`cursor-pointer rounded-xl border border-slate-300 bg-white p-2 text-slate-500 shadow-sm shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-100 hover:text-slate-800 hover:shadow-md ${activeDropdown?.id === user.id ? "border-slate-400 bg-slate-100 text-slate-800 shadow-md" : ""}`}
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
                      className="px-6 py-16 text-center text-slate-500"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="rounded-full bg-slate-100 p-4">
                          <Search className="w-8 h-8 opacity-40" />
                        </div>
                        <p className="text-lg font-medium text-slate-700">
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
          {total > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-6 py-4">
              <p className="text-sm text-slate-500">
                Page <span className="font-medium text-slate-900">{page}</span> of{" "}
                <span className="font-medium text-slate-900">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-slate-300 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="fixed z-[100] w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/90 ring-1 ring-slate-200/80 animate-in fade-in zoom-in-95 duration-200"
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
                      className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-slate-700 transition-all duration-150 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm"
                    >
                      <UserIcon className="h-4 w-4 text-teal-600" />
                      Edit User Details
                    </button>
                  </div>

                  <div className="mx-2 h-px bg-slate-100" />

                  {/* Danger Section */}
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setDeletingUser(user)
                        setActiveDropdown(null)
                      }}
                      className="group/delete flex w-full cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-sm text-rose-600 transition-all duration-150 hover:border-rose-200 hover:bg-rose-100 hover:text-rose-800 hover:shadow-sm"
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
        <AdminBulkUserModal
          isOpen={showBulkCreateModal}
          onClose={() => setShowBulkCreateModal(false)}
          onSuccess={(createdCount) => {
            fetchUsers()
            setTotal((t) => t + createdCount)
          }}
        />

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
















