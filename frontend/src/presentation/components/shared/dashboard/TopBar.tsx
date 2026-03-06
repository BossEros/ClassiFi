import { useNavigate } from "react-router-dom"
import { Avatar } from "@/presentation/components/ui/Avatar"
import { ChevronRight } from "lucide-react"
import type { User } from "@/business/models/auth/types"
import { NotificationBadge } from "./NotificationBadge"

interface TopBarBreadcrumbItem {
  label: string
  to?: string
}

interface TopBarProps {
  user: User | null
  userInitials: string
  onProfileClick?: () => void
  breadcrumbItems?: TopBarBreadcrumbItem[]
  showProfileButton?: boolean
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
 * @param breadcrumbItems - Optional breadcrumb items displayed on the left side of top bar.
 * @param showProfileButton - Whether to render the profile/settings shortcut in the top bar.
 * @returns An object containing the main top bar JSX element.
 */
export function useTopBar({
  user,
  userInitials,
  onProfileClick,
  breadcrumbItems,
  showProfileButton = true,
}: TopBarProps) {
  const navigate = useNavigate()

  const handleProfileClick =
    onProfileClick || (() => navigate("/dashboard/settings"))

  return {
    main: (
      <div className="h-16 shrink-0 border-b border-slate-200 bg-[#FCFDFD] px-6 lg:px-8">
        <div className="flex h-full w-full items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            {breadcrumbItems && breadcrumbItems.length > 0 ? (
              <div className="flex items-center gap-1.5 overflow-hidden text-sm">
                {breadcrumbItems.map((breadcrumbItem, breadcrumbIndex) => {
                  const isLastBreadcrumb =
                    breadcrumbIndex === breadcrumbItems.length - 1
                  const isClickable = Boolean(breadcrumbItem.to)

                  return (
                    <div
                      key={`${breadcrumbItem.label}-${breadcrumbIndex}`}
                      className="flex items-center gap-1.5 min-w-0"
                    >
                      {isClickable ? (
                        <button
                          type="button"
                          onClick={() => navigate(breadcrumbItem.to!)}
                          className={`cursor-pointer truncate transition-colors ${
                            isLastBreadcrumb
                              ? "font-medium text-slate-900 hover:text-teal-700"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {breadcrumbItem.label}
                        </button>
                      ) : (
                        <span
                          className={`truncate ${isLastBreadcrumb ? "text-slate-900 font-medium" : "text-slate-600"}`}
                        >
                          {breadcrumbItem.label}
                        </span>
                      )}

                      {!isLastBreadcrumb && (
                        <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-4">
            <NotificationBadge />

            {showProfileButton ? <div className="h-8 w-px bg-slate-200" /> : null}

            {showProfileButton ? (
              <button
                onClick={handleProfileClick}
                className="cursor-pointer flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100"
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
            ) : null}
          </div>
        </div>
      </div>
    ),
  }
}



