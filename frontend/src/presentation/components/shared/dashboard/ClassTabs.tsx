import React, { useRef } from "react"
import { ClipboardList, Users, Calendar, BarChart3 } from "lucide-react"
import type { ClassTab } from "@/shared/types/class"

interface ClassTabsProps {
  activeTab: ClassTab
  onTabChange: (tab: ClassTab) => void
  children: React.ReactNode
  className?: string
  variant?: "dark" | "light"
}

export const ClassTabs: React.FC<ClassTabsProps> = ({
  activeTab,
  onTabChange,
  children,
  className = "",
  variant = "dark",
}) => {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const tabs: Array<{ id: ClassTab; label: string; icon: React.ElementType }> =
    [
      { id: "assignments", label: "Assignments", icon: ClipboardList },
      { id: "students", label: "Students", icon: Users },
      { id: "calendar", label: "Calendar", icon: Calendar },
      { id: "grades", label: "Grades", icon: BarChart3 },
    ]

  const handleKeyDown = (e: React.KeyboardEvent, tabId: ClassTab) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onTabChange(tabId)
    }

    // Arrow key navigation
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault()
      const currentIndex = tabs.findIndex((t) => t.id === activeTab)
      const nextIndex =
        e.key === "ArrowLeft"
          ? (currentIndex - 1 + tabs.length) % tabs.length
          : (currentIndex + 1) % tabs.length

      onTabChange(tabs[nextIndex].id)
      tabRefs.current[nextIndex]?.focus()
    }
  }

  return (
    <div className={className}>
      {/* Tab Bar */}
      <div
        role="tablist"
        className={`mb-6 flex gap-2 border-b ${variant === "light" ? "border-slate-200" : "border-white/10"}`}
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el
              }}
              id={`${tab.id}-tab`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.id}-panel`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                isActive
                  ? variant === "light"
                    ? "border-teal-600 text-teal-700"
                    : "text-teal-400 border-teal-500"
                  : variant === "light"
                    ? "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    : "text-gray-400 border-transparent hover:text-gray-300 hover:border-gray-600"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div
        role="tabpanel"
        id={`${activeTab}-panel`}
        aria-labelledby={`${activeTab}-tab`}
      >
        {children}
      </div>
    </div>
  )
}
