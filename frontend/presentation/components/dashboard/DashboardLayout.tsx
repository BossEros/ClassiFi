/**
 * Dashboard Layout Component
 * Part of the Presentation Layer - Dashboard Components
 * Wraps sidebar and main content area
 */

import { Sidebar } from './Sidebar'
import { cn } from '@/shared/utils/cn'

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex">
      <Sidebar />
      <main
        className={cn(
          'flex-1 lg:ml-0 overflow-y-auto',
          'min-h-screen',
          className
        )}
      >
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  )
}

