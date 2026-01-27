import { useState, useEffect } from "react"
import { X, Mail, Shield, Loader2, Power, CheckCircle } from "lucide-react"
import * as adminService from "@/business/services/adminService"
import type { AdminUser } from "@/business/services/adminService"

interface AdminEditUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: AdminUser | null
}

export function AdminEditUserModal({
  isOpen,
  onClose,
  onSuccess,
  user,
}: AdminEditUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<"student" | "teacher" | "admin">("student")
  const [isActive, setIsActive] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    if (user) {
      setRole(user.role as "student" | "teacher" | "admin")
      setIsActive(user.isActive)
      setFirstName(user.firstName)
      setLastName(user.lastName)
      setEmail(user.email)
    }
  }, [user])

  if (!isOpen || !user) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      setError(null)

      // Perform updates if changed
      const promises = []

      if (role !== user.role) {
        promises.push(adminService.updateUserRole(user.id, role))
      }

      if (isActive !== user.isActive) {
        promises.push(adminService.toggleUserStatus(user.id))
      }

      if (firstName !== user.firstName || lastName !== user.lastName) {
        promises.push(
          adminService.updateUserDetails(user.id, { firstName, lastName }),
        )
      }

      if (email !== user.email) {
        promises.push(adminService.updateUserEmail(user.id, email))
      }

      if (promises.length > 0) {
        await Promise.all(promises)
        onSuccess()
        onClose()
      } else {
        onClose() // No changes
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Personal Info */}
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
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
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
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

          {/* Section: Account Settings */}
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
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
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
                  onClick={() => setIsActive(!isActive)}
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
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:from-teal-700 hover:to-teal-600 shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Save Changes</span>
                  <CheckCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
