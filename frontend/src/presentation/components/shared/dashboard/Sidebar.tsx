import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import {
  Home,
  BookOpen,
  Menu,
  X,
  LogOut,
  Settings,
  Users,
  GraduationCap,
  Calendar,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import { cn } from "@/shared/utils/cn"
import { logoutUser } from "@/business/services/authService"
import { useAuthStore } from "@/shared/store/useAuthStore"
import type { NavigationItem } from "@/business/models/dashboard/types"

const teacherNavigationItems = [
  { id: "home", label: "Dashboard", path: "/dashboard", icon: Home },
  {
    id: "classes",
    label: "Classes",
    path: "/dashboard/classes",
    icon: BookOpen,
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
}

interface SidebarNavItemProps {
  item: NavigationItem
  onClick?: () => void
  isCollapsed?: boolean
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
}: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logoutUser()
    navigate("/login")
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors shadow-lg"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40",
          "h-full bg-[#11211F] backdrop-blur-xl",
          "flex flex-col relative",
          "transform transition-all duration-300 ease-in-out lg:transform-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-16" : "w-56",
        )}
      >
        <div
          className={cn(
            "h-16 bg-[#11211F] backdrop-blur-xl border-b border-white/10 flex items-center justify-center shrink-0 transition-all duration-300",
            isCollapsed ? "px-2" : "px-4",
          )}
        >
          {isCollapsed ? (
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
                <h1 className="text-xl font-bold text-white tracking-tight whitespace-nowrap">
                  ClassiFi
                </h1>
              </div>

              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className={cn(
                    "hidden lg:flex shrink-0 items-center justify-center text-slate-300 hover:text-white transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                  )}
                  aria-label="Collapse sidebar"
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
              onClick={() => setIsMobileOpen(false)}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>

        {/* Bottom Section - Settings & Logout */}
        <div className="p-3 border-t border-white/10 space-y-1.5">
          <SidebarNavItem
            item={{
              id: "settings",
              label: "Settings",
              path: "/dashboard/settings",
              icon: Settings,
            }}
            onClick={() => setIsMobileOpen(false)}
            isCollapsed={isCollapsed}
          />
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
              isCollapsed && "lg:justify-center lg:px-2",
            )}
            title={isCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className={cn("font-medium", isCollapsed && "lg:hidden")}>
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
