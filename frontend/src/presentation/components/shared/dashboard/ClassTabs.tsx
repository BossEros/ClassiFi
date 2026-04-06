import React, { useRef } from "react"
import { ClipboardList, Users, Calendar, BarChart3 } from "lucide-react"
import type { ClassTab } from "@/data/api/class.types"

interface ClassTabsProps {
  activeTab: ClassTab
  onTabChange: (tab: ClassTab) => void
  children: React.ReactNode
  className?: string
  variant?: "dark" | "light"
  showIcons?: boolean
}

export const ClassTabs: React.FC<ClassTabsProps> = ({
  activeTab,
  onTabChange,
  children,
  className = "",
  variant = "dark",
  showIcons = true,
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
        className={`mb-8 flex ${variant === "light" ? "inline-flex overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm" : "gap-2 border-b border-white/10"}`}
      >
        {tabs.map((tab, index) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const isLast = index === tabs.length - 1

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
              className={`flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? variant === "light"
                    ? "bg-teal-600 text-white"
                    : "border-b-2 border-teal-500 text-teal-400"
                  : variant === "light"
                    ? `text-slate-600 hover:bg-slate-50 hover:text-slate-900 ${!isLast ? "border-r border-slate-200" : ""}`
                    : "border-b-2 border-transparent text-gray-400 hover:border-gray-600 hover:text-gray-300"
              }`}
            >
              {showIcons ? <Icon className="w-4 h-4" /> : null}
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

