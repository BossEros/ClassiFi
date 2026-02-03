import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Home,
  Grid3x3,
  List,
  Clock,
  Menu,
  X,
  LogOut,
  FileText,
  Settings,
  Users,
  GraduationCap,
  Calendar,
  Bell,
} from "lucide-react"
import { NavItem } from "./NavItem"
import { cn } from "@/shared/utils/cn"
import { logoutUser } from "@/business/services/authService"
import { getCurrentUser } from "@/business/services/authService"
import type { User } from "@/business/models/auth/types"

const teacherNavigationItems = [
  { id: "home", label: "Home", path: "/dashboard", icon: Home },
  {
    id: "classes",
    label: "Classes",
    path: "/dashboard/classes",
    icon: Grid3x3,
  },
  { id: "tasks", label: "All Tasks", path: "/dashboard/tasks", icon: List },
  {
    id: "history",
    label: "Analysis History",
    path: "/dashboard/history",
    icon: Clock,
  },
  {
    id: "notifications",
    label: "Notifications",
    path: "/dashboard/notifications",
    icon: Bell,
  },
]

const studentNavigationItems = [
  { id: "home", label: "Home", path: "/dashboard", icon: Home },
  {
    id: "classes",
    label: "Classes",
    path: "/dashboard/classes",
    icon: Grid3x3,
  },
  {
    id: "assignments",
    label: "Coursework",
    path: "/dashboard/assignments",
    icon: FileText,
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

export function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [user, setUser] = useState<User | null>(() => getCurrentUser())
  const navigate = useNavigate()

  // Listen for storage changes (when avatar is updated)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user") {
        const updatedUser = getCurrentUser()
        setUser(updatedUser)
      }
    }

    // Listen for custom event dispatched within the same tab
    const handleUserUpdate = () => {
      const updatedUser = getCurrentUser()
      setUser(updatedUser)
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("userUpdated", handleUserUpdate)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("userUpdated", handleUserUpdate)
    }
  }, [])

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
          "w-56 h-full bg-slate-900/95 backdrop-blur-xl",
          "flex flex-col",
          "transform transition-transform duration-300 ease-in-out lg:transform-none",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
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
          />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">Sign Out</span>
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
