import { useNavigate } from "react-router-dom"
import { Avatar } from "@/presentation/components/ui/Avatar"
import { BookOpen } from "lucide-react"
import type { User } from "@/business/models/auth/types"
import { NotificationBadge } from "./NotificationBadge"

interface TopBarProps {
  user: User | null
  userInitials: string
  onProfileClick?: () => void
}

/**
 * Creates a standardized top bar configuration for dashboard pages.
 *
 * @param user - The current user object containing profile information.
 * @param userInitials - The user's initials for avatar fallback.
 * @param onProfileClick - Optional custom handler for profile button click. Defaults to navigating to settings.
 * @returns An object containing sidebar and main top bar JSX elements.
 */
export function useTopBar({ user, userInitials, onProfileClick }: TopBarProps) {
  const navigate = useNavigate()

  const handleProfileClick =
    onProfileClick || (() => navigate("/dashboard/settings"))

  return {
    sidebar: (isCollapsed: boolean) => (
      <div
        className={`h-16 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-center shrink-0 transition-all duration-300 ${isCollapsed ? "lg:px-0 lg:pl-2" : "px-6"}`}
      >
        <div
          className={`flex items-center ${isCollapsed ? "lg:gap-0" : "gap-3"}`}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <h1
            className={`text-xl font-bold text-white tracking-tight transition-all duration-300 ${isCollapsed ? "lg:opacity-0 lg:w-0 lg:overflow-hidden lg:ml-0" : "opacity-100"}`}
          >
            ClassiFi
          </h1>
        </div>
      </div>
    ),
    main: (
      <div className="h-16 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 flex items-center px-6 lg:px-8 shrink-0">
        <div className="flex items-center justify-end w-full gap-4">
          {/* Notifications */}
          <NotificationBadge />

          {/* Separator */}
          <div className="h-8 w-px bg-white/20"></div>

          {/* User Profile */}
          <button
            onClick={handleProfileClick}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">
                {user ? `${user.firstName} ${user.lastName}` : "User"}
              </p>
              <p className="text-xs text-slate-400">
                {user
                  ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                  : "Student"}
              </p>
            </div>
            <Avatar
              size="sm"
              src={user?.avatarUrl}
              fallback={userInitials}
              alt={user ? `${user.firstName} ${user.lastName}` : "User"}
            />
          </button>
        </div>
      </div>
    ),
  }
}
