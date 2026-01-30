import { useState, useEffect } from "react"
import { DashboardLayout } from "@/presentation/components/dashboard/DashboardLayout"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import { Avatar } from "@/presentation/components/ui/Avatar"
import { getCurrentUser } from "@/business/services/authService"
import type { User } from "@/business/models/auth/types"
import {
  Settings,
  User as UserIcon,
  Lock,
  Mail,
  Bell,
  Camera,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import {
  ChangePasswordModal,
  DeleteAccountModal,
  AvatarUploadModal,
} from "@/presentation/components/settings"

export function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false)
  const [isAvatarUploadOpen, setIsAvatarUploadOpen] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
  }, [])

  const handleAvatarSuccess = (avatarUrl: string) => {
    // Update user state to reflect new avatar
    if (user) {
      setUser({ ...user, avatarUrl })
    }
  }

  const handlePasswordChangeSuccess = () => {
    // Optionally show a toast or refresh user data
  }

  if (!user) return null

  const userInitials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/20">
            <Settings className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              Settings
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Manage your account preferences and security
            </p>
          </div>
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
              <CardDescription>Manage your alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      Email Notifications
                    </p>
                    <p className="text-xs text-slate-300 truncate">
                      Receive updates via email
                    </p>
                  </div>
                  {/* Placeholder Toggle */}
                  <div className="w-10 h-6 bg-teal-600 rounded-full relative cursor-pointer shrink-0">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="opacity-50">
                    <p className="text-sm font-medium text-white">
                      Push Notifications
                    </p>
                    <p className="text-xs text-slate-300">Coming soon</p>
                  </div>
                </div>
              </div>
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
