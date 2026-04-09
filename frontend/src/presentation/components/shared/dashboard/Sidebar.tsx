import { useState, useEffect, useCallback } from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  Home,
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  Bell,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { cn } from "@/shared/utils/cn"
import { useAuthStore } from "@/shared/store/useAuthStore"
import { Avatar } from "@/presentation/components/ui/Avatar"
import { ProfileDropdown } from "./ProfileDropdown"
import type { NavigationItem } from "@/data/api/class.types"
import type { User } from "@/data/api/auth.types"

const DESKTOP_SIDEBAR_MEDIA_QUERY = "(min-width: 1024px)"

function getIsDesktopViewport(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  return window.matchMedia(DESKTOP_SIDEBAR_MEDIA_QUERY).matches
}

type CompatibleMediaQueryList = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void
}

const teacherNavigationItems = [
  { id: "home", label: "Dashboard", path: "/dashboard", icon: Home },
  {
    id: "classes",
    label: "Classes",
    path: "/dashboard/classes",
    icon: BookOpen,
  },
  {
    id: "assignments",
    label: "Assignments",
    path: "/dashboard/assignments",
    icon: ClipboardList,
  },
  {
    id: "calendar",
    label: "Calendar",
    path: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    id: "notifications",
    label: "Notifications",
    path: "/dashboard/notifications",
    icon: Bell,
  },
]

const studentNavigationItems = [
  { id: "home", label: "Dashboard", path: "/dashboard", icon: Home },
  {
    id: "classes",
    label: "Classes",
    path: "/dashboard/classes",
    icon: BookOpen,
  },
  {
    id: "assignments",
    label: "Assignments",
    path: "/dashboard/assignments",
    icon: ClipboardList,
  },
  {
    id: "calendar",
    label: "Calendar",
    path: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    id: "notifications",
    label: "Notifications",
    path: "/dashboard/notifications",
    icon: Bell,
  },
]

const adminNavigationItems = [
  { id: "home", label: "Dashboard", path: "/dashboard", icon: Home },
  { id: "users", label: "Users", path: "/dashboard/users", icon: Users },
  {
    id: "classes",
    label: "Classes",
    path: "/dashboard/classes",
    icon: BookOpen,
  },
  {
    id: "enrollments",
    label: "Enrollments",
    path: "/dashboard/enrollments",
    icon: GraduationCap,
  },
  {
    id: "notifications",
    label: "Notifications",
    path: "/dashboard/notifications",
    icon: Bell,
  },
]

interface SidebarProps {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onRegisterMobileToggle?: (toggleFn: () => void) => void
  onMobileOpenChange?: (isOpen: boolean) => void
}

interface SidebarNavItemProps {
  item: NavigationItem
  onClick?: () => void
  isCollapsed?: boolean
}

interface SidebarContentProps {
  isCollapsed: boolean
  onToggleCollapse?: () => void
  onRegisterMobileToggle?: (toggleFn: () => void) => void
  onMobileOpenChange?: (isOpen: boolean) => void
  user: User | null
}

function SidebarNavItem({
  item,
  onClick,
  isCollapsed = false,
}: SidebarNavItemProps) {
  const Icon = item.icon
  const isHomeRoute = item.path === "/dashboard"

  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      end={isHomeRoute}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200",
          "text-gray-300 hover:text-white hover:bg-white/10 text-sm font-medium",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
          isActive &&
          "bg-white/20 text-white shadow-md shadow-black/20",
          isCollapsed && "lg:justify-center lg:px-2",
        )
      }
      title={isCollapsed ? item.label : undefined}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className={cn("font-medium", isCollapsed && "lg:hidden")}>
        {item.label}
      </span>
    </NavLink>
  )
}

export function Sidebar({
  isCollapsed = false,
  onToggleCollapse,
  onRegisterMobileToggle,
  onMobileOpenChange,
}: SidebarProps) {
  const user = useAuthStore((state) => state.user)
  const location = useLocation()
  const sidebarInstanceKey = `${location.key}:${location.pathname}${location.search}${location.hash}`

  return (
    <SidebarContent
      key={sidebarInstanceKey}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
      onRegisterMobileToggle={onRegisterMobileToggle}
      onMobileOpenChange={onMobileOpenChange}
      user={user}
    />
  )
}

function SidebarContent({
  isCollapsed,
  onToggleCollapse,
  onRegisterMobileToggle,
  onMobileOpenChange,
  user,
}: SidebarContentProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isDesktopViewport, setIsDesktopViewport] = useState(
    getIsDesktopViewport,
  )
  const shouldRenderCollapsedDesktopSidebar =
    isCollapsed && isDesktopViewport
  const shouldShowMobileDrawerCloseButton = isMobileOpen && !isDesktopViewport

  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen(false)
  }, [])

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileOpen((previousIsMobileOpen) => !previousIsMobileOpen)
  }, [])

  // Register the toggle function with the parent so it can be placed in the top bar
  useEffect(() => {
    onRegisterMobileToggle?.(toggleMobileSidebar)
  }, [onRegisterMobileToggle, toggleMobileSidebar])

  // Notify parent of mobile open state changes
  useEffect(() => {
    onMobileOpenChange?.(isMobileOpen)
  }, [isMobileOpen, onMobileOpenChange])

  // Close sidebar on Escape key
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      closeMobileSidebar()
    }
  }, [closeMobileSidebar])

  useEffect(() => {
    if (isMobileOpen) {
      document.addEventListener("keydown", handleEscapeKey)
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey)
    }
  }, [isMobileOpen, handleEscapeKey])

  useEffect(() => {
    const desktopMediaQueryList = window.matchMedia(
      DESKTOP_SIDEBAR_MEDIA_QUERY,
    ) as CompatibleMediaQueryList

    const syncDesktopViewportState = (matchesDesktopViewport: boolean) => {
      setIsDesktopViewport(matchesDesktopViewport)

      if (matchesDesktopViewport) {
        closeMobileSidebar()
      }
    }

    syncDesktopViewportState(desktopMediaQueryList.matches)

    const handleDesktopViewportChange = (event: MediaQueryListEvent) => {
      syncDesktopViewportState(event.matches)
    }

    if (desktopMediaQueryList.addEventListener) {
      desktopMediaQueryList.addEventListener(
        "change",
        handleDesktopViewportChange,
      )
    } else {
      desktopMediaQueryList.addListener?.(handleDesktopViewportChange)
    }

    return () => {
      if (desktopMediaQueryList.removeEventListener) {
        desktopMediaQueryList.removeEventListener(
          "change",
          handleDesktopViewportChange,
        )
      } else {
        desktopMediaQueryList.removeListener?.(handleDesktopViewportChange)
      }
    }
  }, [closeMobileSidebar])

  useEffect(() => {
    if (!isMobileOpen) {
      return
    }

    const previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousBodyOverflow
    }
  }, [isMobileOpen])

  return (
    <>
      {/* Sidebar */}
      <aside
        id="dashboard-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-[60] lg:static",
          "relative flex h-full w-72 flex-col bg-[#11211F] shadow-2xl backdrop-blur-xl lg:shadow-none",
          "transform transition-all duration-300 ease-in-out lg:transform-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          shouldRenderCollapsedDesktopSidebar ? "lg:w-16" : "lg:w-56",
        )}
        style={{
          "--sidebar-width": shouldRenderCollapsedDesktopSidebar
            ? "64px"
            : "224px",
        } as React.CSSProperties}
      >
        <div
          className={cn(
            "h-16 bg-[#11211F] backdrop-blur-xl border-b border-white/10 flex items-center justify-center shrink-0 transition-all duration-300",
            shouldRenderCollapsedDesktopSidebar ? "px-2" : "px-4",
          )}
        >
          {shouldRenderCollapsedDesktopSidebar ? (
            onToggleCollapse ? (
              <button
                onClick={onToggleCollapse}
                className={cn(
                  "hidden lg:flex w-full items-center justify-center px-2 py-2.5 text-slate-300 hover:text-white transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                )}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            ) : null
          ) : (
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src="/logo-white.png"
                  alt="ClassiFi logo"
                  className="w-8.5 h-8.5 object-contain"
                />
                <h1
                  className="font-expletus text-xl font-normal text-white tracking-tight whitespace-nowrap"
                >
                  ClassiFi
                </h1>
              </div>

              {(onToggleCollapse || shouldShowMobileDrawerCloseButton) && (
                <button
                  onClick={
                    shouldShowMobileDrawerCloseButton
                      ? closeMobileSidebar
                      : onToggleCollapse
                  }
                  className={cn(
                    "shrink-0 items-center justify-center text-slate-300 hover:text-white transition-colors",
                    shouldShowMobileDrawerCloseButton
                      ? "inline-flex"
                      : "hidden lg:flex",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                  )}
                  aria-label={
                    shouldShowMobileDrawerCloseButton
                      ? "Close sidebar"
                      : "Collapse sidebar"
                  }
                >
                  <PanelLeftClose className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {(user?.role === "student"
            ? studentNavigationItems
            : user?.role === "admin"
              ? adminNavigationItems
              : teacherNavigationItems
          ).map((item) => (
            <SidebarNavItem
              key={item.id}
              item={item}
              onClick={closeMobileSidebar}
              isCollapsed={shouldRenderCollapsedDesktopSidebar}
            />
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-white/10 space-y-1.5">
          {user && (
            <ProfileDropdown
              user={user}
              userInitials={`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()}
              isSidebarCollapsed={shouldRenderCollapsedDesktopSidebar}
            >
              <div
                className={cn(
                  "flex items-center gap-2 min-w-0",
                  shouldRenderCollapsedDesktopSidebar && "lg:justify-center",
                )}
              >
                <Avatar
                  size="sm"
                  src={user.avatarUrl}
                  fallback={`${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="border border-slate-200 flex-shrink-0"
                />
                <div
                  className={cn(
                    "min-w-0 text-left",
                    shouldRenderCollapsedDesktopSidebar && "lg:hidden",
                  )}
                >
                  <p className="text-sm font-semibold text-slate-100 truncate">
                    {user.firstName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </p>
                </div>
              </div>
            </ProfileDropdown>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-[50] bg-slate-950/55 backdrop-blur-[1px] lg:hidden"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}
    </>
  )
}

