import { useState, useEffect } from "react"
import { Sidebar } from "./Sidebar"
import { cn } from "@/shared/utils/cn"

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
  topBar?: {
    sidebar: React.ReactNode | ((isCollapsed: boolean) => React.ReactNode)
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

  // Render sidebar topBar - if it's a function, call it with isCollapsed
  const sidebarTopBar =
    typeof topBar?.sidebar === "function"
      ? topBar.sidebar(isCollapsed)
      : topBar?.sidebar

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 flex">
      {/* Left side: Sidebar with logo - full height */}
      <div
        className={cn(
          "flex flex-col transition-all duration-300",
          isCollapsed ? "lg:w-16" : "w-56",
        )}
      >
        {sidebarTopBar}
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>

      {/* Vertical Separator - full height */}
      <div className="w-px bg-white/10"></div>

      {/* Right side: Top bar + main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="relative z-[9999]">{topBar?.main}</div>
        <main
          className={cn("flex-1 min-w-0 overflow-y-auto", "h-full", className)}
        >
          <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
