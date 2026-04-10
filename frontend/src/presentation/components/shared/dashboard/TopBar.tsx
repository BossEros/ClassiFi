import { useNavigate } from "react-router-dom"
import { ArrowLeft, ChevronRight } from "lucide-react"
import type { User } from "@/data/api/auth.types"
import { useIsMobile } from "@/presentation/hooks/shared/useMediaQuery"
import { NotificationBadge } from "./NotificationBadge"

interface TopBarBreadcrumbItem {
  label: string
  to?: string
}

interface TopBarProps {
  user?: User | null
  userInitials?: string
  breadcrumbItems?: TopBarBreadcrumbItem[]
  showProfileButton?: boolean
}

function getMobileBackBreadcrumb(
  breadcrumbItems: TopBarBreadcrumbItem[],
): TopBarBreadcrumbItem | null {
  for (
    let breadcrumbIndex = breadcrumbItems.length - 2;
    breadcrumbIndex >= 0;
    breadcrumbIndex -= 1
  ) {
    const breadcrumbItem = breadcrumbItems[breadcrumbIndex]

    if (breadcrumbItem?.to) {
      return breadcrumbItem
    }
  }

  return null
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
  const isMobileViewport = useIsMobile()
  const resolvedBreadcrumbItems = breadcrumbItems ?? []
  const hasBreadcrumbs = resolvedBreadcrumbItems.length > 0
  const currentMobileBreadcrumb = hasBreadcrumbs
    ? resolvedBreadcrumbItems[resolvedBreadcrumbItems.length - 1]
    : null
  const mobileBackBreadcrumb =
    hasBreadcrumbs && resolvedBreadcrumbItems.length > 1
      ? getMobileBackBreadcrumb(resolvedBreadcrumbItems)
      : null

  return {
    main: (
      <div className="h-16 shrink-0 border-b border-slate-200 bg-[#FCFDFD] px-4 lg:px-8">
        <div className="flex h-full w-full items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            {isMobileViewport && currentMobileBreadcrumb ? (
              <div className="flex min-w-0 items-center gap-3 sm:hidden">
                {mobileBackBreadcrumb ? (
                  <button
                    type="button"
                    onClick={() => navigate(mobileBackBreadcrumb.to!)}
                    aria-label={`Go back to ${mobileBackBreadcrumb.label}`}
                    className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FCFDFD]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>
                ) : null}

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {currentMobileBreadcrumb.label}
                  </p>
                </div>
              </div>
            ) : hasBreadcrumbs ? (
              <div className="flex items-center gap-1 overflow-hidden text-xs sm:gap-1.5 sm:text-sm">
                {resolvedBreadcrumbItems.map((breadcrumbItem, breadcrumbIndex) => {
                  const isLastBreadcrumb =
                    breadcrumbIndex === resolvedBreadcrumbItems.length - 1
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

