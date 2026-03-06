import { useNavigate } from "react-router-dom"
import { Avatar } from "@/presentation/components/ui/Avatar"
import type { User } from "@/business/models/auth/types"
import { NotificationBadge } from "./NotificationBadge"

interface TopBarProps {
  user: User | null
  userInitials: string
  onProfileClick?: () => void
}

function getRoleLabel(user: User | null): string {
  if (!user) {
    return "User"
  }

  return user.role.charAt(0).toUpperCase() + user.role.slice(1)
}

/**
 * Creates a standardized top bar configuration for dashboard pages.
 *
 * @param user - The current user object containing profile information.
 * @param userInitials - The user's initials for avatar fallback.
 * @param onProfileClick - Optional custom handler for profile button click. Defaults to navigating to settings.
 * @returns An object containing the main top bar JSX element.
 */
export function useTopBar({ user, userInitials, onProfileClick }: TopBarProps) {
  const navigate = useNavigate()

  const handleProfileClick =
    onProfileClick || (() => navigate("/dashboard/settings"))

  return {
    main: (
      <div className="h-16 shrink-0 border-b border-slate-200 bg-[#FCFDFD] px-6 lg:px-8">
        <div className="flex h-full w-full items-center justify-end gap-4">
          <NotificationBadge />

          <div className="h-8 w-px bg-slate-200" />

          <button
            onClick={handleProfileClick}
            className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {user ? `${user.firstName} ${user.lastName}` : "User"}
              </p>
              <p className="text-xs text-slate-500">{getRoleLabel(user)}</p>
            </div>

            <Avatar
              size="sm"
              src={user?.avatarUrl}
              fallback={userInitials}
              alt={user ? `${user.firstName} ${user.lastName}` : "User"}
              className="border border-slate-200"
            />
          </button>
        </div>
      </div>
    ),
  }
}
