import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Home,
  Grid3x3,
  Menu,
  X,
  LogOut,
  Settings,
  Users,
  GraduationCap,
  Calendar,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { NavItem } from "./NavItem"
import { cn } from "@/shared/utils/cn"
import { logoutUser } from "@/business/services/authService"
import { useAuthStore } from "@/shared/store/useAuthStore"

const teacherNavigationItems = [
  { id: "home", label: "Dashboard", path: "/dashboard", icon: Home },
  {
    id: "classes",
    label: "Classes",
    path: "/dashboard/classes",
    icon: Grid3x3,
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
    icon: Grid3x3,
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
    icon: Grid3x3,
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
          "h-full bg-slate-900/95 backdrop-blur-xl",
          "flex flex-col relative",
          "transform transition-all duration-300 ease-in-out lg:transform-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-16" : "w-56",
        )}
      >
        {/* Desktop Toggle Button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={cn(
              "hidden lg:flex absolute -right-3 top-6 z-50",
              "w-6 h-6 items-center justify-center",
              "rounded-full bg-slate-800 border border-white/20",
              "text-gray-400 hover:text-white hover:bg-slate-700",
              "transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
            )}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {(user?.role === "student"
            ? studentNavigationItems
            : user?.role === "admin"
              ? adminNavigationItems
              : teacherNavigationItems
          ).map((item) => (
            <NavItem
              key={item.id}
              item={item}
              onClick={() => setIsMobileOpen(false)}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>

        {/* Bottom Section - Settings & Logout */}
        <div className="p-3 border-t border-white/10 space-y-1.5">
          <NavItem
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
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
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
