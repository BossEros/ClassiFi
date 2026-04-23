import { useEffect, useState } from "react"
import { Menu } from "lucide-react"
import { Sidebar } from "./Sidebar"
import { cn } from "@/shared/utils/cn"

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
  topBar?: {
    main: React.ReactNode
  }
}

export function DashboardLayout({
  children,
  className,
  topBar,
}: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebarCollapsed")
    return saved === "true"
  })
  const [mobileSidebarToggle, setMobileSidebarToggle] = useState<(() => void) | null>(null)

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(isCollapsed))
  }, [isCollapsed])

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => !prev)
  }

  const handleRegisterMobileToggle = (toggleFn: () => void) => {
    setMobileSidebarToggle(() => toggleFn)
  }

  return (
    <div className="h-screen overflow-hidden bg-[#F9FAFB] flex">
      {/* Sidebar */}
      <div
        className={cn(
          "flex-shrink-0 transition-all duration-300",
          "w-0 lg:w-auto",
          isCollapsed ? "lg:w-16" : "lg:w-56",
        )}
      >
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
          onRegisterMobileToggle={handleRegisterMobileToggle}
        />
      </div>

      {/* Vertical Separator - full height */}
      <div className="hidden lg:block w-px bg-white/10"></div>

      {/* Right side: Top bar + main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="relative z-[100] flex items-stretch">
          {/* Mobile sidebar toggle — lives in the top bar row on mobile only */}
          {mobileSidebarToggle && (
            <button
              onClick={mobileSidebarToggle}
              className={cn(
                "lg:hidden flex h-16 w-14 shrink-0 items-center justify-center border-b border-r border-slate-200 bg-[#FCFDFD] text-slate-700 transition-colors hover:bg-slate-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600",
              )}
              aria-label="Open menu"
              aria-controls="dashboard-sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1 min-w-0">{topBar?.main}</div>
        </div>
        <main
          className={cn("flex-1 min-w-0 overflow-y-auto", "h-full", className)}
        >
          <div
            className={cn(
              "w-full p-4 sm:p-6 transition-[max-width,margin] duration-300 lg:px-8 lg:pb-8",
              isCollapsed
                ? "lg:mr-auto lg:max-w-screen-2xl lg:mx-0"
                : "max-w-full lg:max-w-7xl mx-auto",
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
