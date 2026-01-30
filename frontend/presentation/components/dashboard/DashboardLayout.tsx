import { Sidebar } from "./Sidebar"
import { cn } from "@/shared/utils/cn"

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
  topBar?: {
    sidebar: React.ReactNode
    main: React.ReactNode
  }
}

export function DashboardLayout({
  children,
  className,
  topBar,
}: DashboardLayoutProps) {
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 flex">
      {/* Left side: Sidebar with logo - full height */}
      <div className="flex flex-col w-56">
        {topBar?.sidebar}
        <Sidebar />
      </div>

      {/* Vertical Separator - full height */}
      <div className="w-px bg-white/10"></div>

      {/* Right side: Top bar + main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {topBar?.main}
        <main
          className={cn(
            "flex-1 min-w-0 overflow-y-auto",
            "h-full",
            className,
          )}
        >
          <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
