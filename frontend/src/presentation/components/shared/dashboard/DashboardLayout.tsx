import { useEffect, useState } from "react"
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

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(isCollapsed))
  }, [isCollapsed])

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => !prev)
  }

  return (
    <div className="h-screen overflow-hidden bg-[#F9FAFB] flex">
      {/* Sidebar — On mobile: fixed overlay via the Sidebar's own positioning.
          On lg+: sits in the normal flex flow with a set width. The outer div
          is sized only on lg+ so the sidebar never pushes content on mobile. */}
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
        />
      </div>

      {/* Vertical Separator - full height */}
      <div className="hidden lg:block w-px bg-white/10"></div>

      {/* Right side: Top bar + main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="relative z-20">{topBar?.main}</div>
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
