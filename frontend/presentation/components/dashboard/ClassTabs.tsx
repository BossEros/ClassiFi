import React from "react"
import { ClipboardList, Users, Calendar } from "lucide-react"

export type ClassTab = "coursework" | "students" | "calendar"

interface ClassTabsProps {
  activeTab: ClassTab
  onTabChange: (tab: ClassTab) => void
  children: React.ReactNode
  className?: string
}

export const ClassTabs: React.FC<ClassTabsProps> = ({
  activeTab,
  onTabChange,
  children,
  className = "",
}) => {
  const tabs: Array<{ id: ClassTab; label: string; icon: React.ElementType }> =
    [
      { id: "coursework", label: "Coursework", icon: ClipboardList },
      { id: "students", label: "Students", icon: Users },
      { id: "calendar", label: "Calendar", icon: Calendar },
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
    }
  }

  return (
    <div className={className}>
      {/* Tab Bar */}
      <div role="tablist" className="flex gap-2 border-b border-white/10 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${tab.id}-panel`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                isActive
                  ? "text-teal-400 border-teal-500"
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
        aria-labelledby={activeTab}
      >
        {children}
      </div>
    </div>
  )
}
