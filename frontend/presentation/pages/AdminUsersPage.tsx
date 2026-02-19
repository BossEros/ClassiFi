import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  MoreVertical,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Trash2,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Filter,
  ChevronDown,
  User as UserIcon,
} from "lucide-react"
import { DashboardLayout } from "@/presentation/components/dashboard/DashboardLayout"
import { Avatar } from "@/presentation/components/ui/Avatar"
import { AdminUserModal } from "@/presentation/components/admin/AdminUserModal"
import { AdminEditUserModal } from "@/presentation/components/admin/AdminEditUserModal"
import { AdminDeleteUserModal } from "@/presentation/components/admin/AdminDeleteUserModal"
import { getCurrentUser } from "@/business/services/authService"
import { useToast } from "@/shared/context/ToastContext"
import * as adminService from "@/business/services/adminService"
import type { AdminUser } from "@/business/services/adminService"
import type { User } from "@/business/models/auth/types"
import { useDebouncedValue } from "@/presentation/hooks/useDebouncedValue"
import { useDocumentClick } from "@/presentation/hooks/useDocumentClick"
import { useRequestState } from "@/presentation/hooks/useRequestState"

export function AdminUsersPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
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
    const user = getCurrentUser()
    if (!user) {
      navigate("/login")
      return
    }
    if (user.role !== "admin") {
      navigate("/dashboard")
      return
    }
    setCurrentUser(user)
  }, [navigate])

  useEffect(() => {
    if (currentUser) {
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

  return (
    <DashboardLayout>
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
