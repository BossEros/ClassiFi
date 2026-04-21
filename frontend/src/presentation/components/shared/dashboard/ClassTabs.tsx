import React, { useRef } from "react"
import { ClipboardList, Users, Calendar, BarChart3 } from "lucide-react"
import type { ClassTab } from "@/data/api/class.types"
import { useIsMobile } from "@/presentation/hooks/shared/useMediaQuery"

interface ClassTabsProps {
  activeTab: ClassTab
  onTabChange: (tab: ClassTab) => void
  children: React.ReactNode
  className?: string
  variant?: "dark" | "light"
  showIcons?: boolean
  visibleTabs?: ClassTab[]
}

export const ClassTabs: React.FC<ClassTabsProps> = ({
  activeTab,
  onTabChange,
  children,
  className = "",
  variant = "dark",
  showIcons = true,
  visibleTabs,
}) => {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const isMobileViewport = useIsMobile()
  const shouldUseCompactMobileLayout = variant === "light" && isMobileViewport

  const allTabs: Array<{
    id: ClassTab
    label: string
    icon: React.ElementType
  }> = [
    { id: "assignments", label: "Assignments", icon: ClipboardList },
    { id: "students", label: "Students", icon: Users },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "grades", label: "Grades", icon: BarChart3 },
  ]
  const tabs = visibleTabs
    ? allTabs.filter((tab) => visibleTabs.includes(tab.id))
    : allTabs

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
        className={`mb-8 flex ${
          shouldUseCompactMobileLayout
            ? "gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : variant === "light"
              ? "inline-flex overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm"
              : "gap-2 border-b border-white/10"
        }`}
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
              className={`flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
                shouldUseCompactMobileLayout
                  ? isActive
                    ? "min-h-11 shrink-0 rounded-xl border border-teal-600 bg-teal-600 px-4 py-2.5 font-semibold text-white shadow-sm"
                    : "min-h-11 shrink-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-600 hover:border-slate-400 hover:text-slate-900"
                  : isActive
                    ? variant === "light"
                      ? "px-5 py-2.5 bg-teal-600 text-white"
                      : "px-5 py-2.5 border-b-2 border-teal-500 text-teal-400"
                    : variant === "light"
                      ? `px-5 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 ${!isLast ? "border-r border-slate-200" : ""}`
                      : "px-5 py-2.5 border-b-2 border-transparent text-gray-400 hover:border-gray-600 hover:text-gray-300"
              }`}
            >
              {showIcons && !shouldUseCompactMobileLayout ? (
                <Icon className="w-4 h-4" />
              ) : null}
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
