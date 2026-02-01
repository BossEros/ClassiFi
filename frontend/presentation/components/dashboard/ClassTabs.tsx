import React from "react"
import { ClipboardList, Users, Calendar } from "lucide-react"

type ClassTab = "coursework" | "students" | "calendar"

interface ClassTabsProps {
    activeTab: ClassTab
    onTabChange: (tab: ClassTab) => void
    children: React.ReactNode
}

export const ClassTabs: React.FC<ClassTabsProps> = ({
    activeTab,
    onTabChange,
    children,
}) => {
    const tabs: { id: ClassTab; label: string; icon: React.ElementType }[] = [
        { id: "coursework", label: "Coursework", icon: ClipboardList },
        { id: "students", label: "Students", icon: Users },
        { id: "calendar", label: "Calendar", icon: Calendar },
    ]

    return (
        <div className="flex flex-col h-full">
            <div className="border-b border-white/10 px-6">
                <div className="flex gap-6 overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id

                        return (
                            <button
                                key={tab.id}
                                role="tab"
                                aria-selected={isActive}
                                aria-controls={`${tab.id}-panel`}
                                onClick={() => onTabChange(tab.id)}
                                className={`
                  flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors whitespace-nowrap
                  ${isActive
                                        ? "border-teal-500 text-teal-400"
                                        : "border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700"
                                    }
                `}
                            >
                                <Icon
                                    className={`w-4 h-4 ${isActive ? "text-teal-400" : "text-slate-500"}`}
                                />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
    )
}
