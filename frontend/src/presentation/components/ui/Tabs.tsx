import * as React from "react"
import { cn } from "@/shared/utils/cn"

interface Tab {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={cn("flex border-b border-white/10", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const Icon = tab.icon

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200",
              "border-b-2 -mb-px",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
              isActive
                ? "border-teal-500 text-teal-500"
                : "border-transparent text-slate-400 hover:text-slate-300 hover:border-white/20",
            )}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

interface TabPanelProps {
  children: React.ReactNode
  className?: string
}

export function TabPanel({ children, className }: TabPanelProps) {
  return <div className={cn("py-4", className)}>{children}</div>
}
