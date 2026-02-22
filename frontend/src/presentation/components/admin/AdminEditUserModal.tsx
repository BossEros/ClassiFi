import { useEffect, useState } from "react"
import { X, Mail, Shield, Loader2, Power, CheckCircle } from "lucide-react"
import type { FieldErrors } from "react-hook-form"
import * as adminService from "@/business/services/adminService"
import type { AdminUser } from "@/business/services/adminService"
import { useZodForm } from "@/presentation/hooks/shared/useZodForm"
import {
  adminEditUserFormSchema,
  type AdminEditUserFormValues,
} from "@/presentation/schemas/admin/adminUserSchemas"
import { getFirstFormErrorMessage } from "@/presentation/utils/formErrorMap"

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

export function AdminEditUserModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: AdminEditUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
  } = useZodForm({
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

      let hasChanges = false

      if (formValues.role !== user.role) {
        try {
          await adminService.updateUserRole(user.id, formValues.role)
          hasChanges = true
        } catch (updateRoleError) {
          throw new Error(
            `Failed to update user role: ${updateRoleError instanceof Error ? updateRoleError.message : "Unknown error"}`,
          )
        }
      }

      if (formValues.isActive !== user.isActive) {
        try {
          await adminService.toggleUserStatus(user.id)
          hasChanges = true
        } catch (toggleStatusError) {
          throw new Error(
            `Failed to toggle user status: ${toggleStatusError instanceof Error ? toggleStatusError.message : "Unknown error"}`,
          )
        }
      }

      if (
        formValues.firstName !== user.firstName ||
        formValues.lastName !== user.lastName
      ) {
        try {
          await adminService.updateUserDetails(user.id, {
            firstName: formValues.firstName,
            lastName: formValues.lastName,
          })
          hasChanges = true
        } catch (updateDetailsError) {
          throw new Error(
            `Failed to update user details: ${updateDetailsError instanceof Error ? updateDetailsError.message : "Unknown error"}`,
          )
        }
      }

      if (formValues.email !== user.email) {
        try {
          await adminService.updateUserEmail(user.id, formValues.email)
          hasChanges = true
        } catch (updateEmailError) {
          throw new Error(
            `Failed to update user email: ${updateEmailError instanceof Error ? updateEmailError.message : "Unknown error"}`,
          )
        }
      }

      if (hasChanges) {
        onSuccess()
        onClose()
      } else {
        onClose()
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to update user",
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
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
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
