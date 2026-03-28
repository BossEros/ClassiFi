import { useNavigate } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import type { User } from "@/business/models/auth/types"
import { NotificationBadge } from "./NotificationBadge"

interface TopBarBreadcrumbItem {
  label: string
  to?: string
}

interface TopBarProps {
  breadcrumbItems?: TopBarBreadcrumbItem[]
}

interface TopBarProps {
  user?: User | null
  userInitials?: string
  breadcrumbItems?: TopBarBreadcrumbItem[]
  showProfileButton?: boolean
}

/**
 * Creates a standardized top bar configuration for dashboard pages.
 *
 * @param breadcrumbItems - Optional breadcrumb items displayed on the left side of top bar.
 * @returns An object containing the main top bar JSX element.
 */
export function useTopBar({
  breadcrumbItems,
}: TopBarProps = {}) {
  const navigate = useNavigate()

  return {
    main: (
      <div className="h-16 shrink-0 border-b border-slate-200 bg-[#FCFDFD] px-4 pl-14 sm:pl-4 lg:px-8">
        <div className="flex h-full w-full items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            {breadcrumbItems && breadcrumbItems.length > 0 ? (
              <div className="flex items-center gap-1 overflow-hidden text-xs sm:gap-1.5 sm:text-sm">
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
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400 sm:h-4 sm:w-4" />
                      )}
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-4">
            <NotificationBadge />
          </div>
        </div>
      </div>
    ),
  }
}



