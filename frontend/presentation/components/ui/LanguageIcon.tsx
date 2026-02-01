import React from "react"
import { Code2, FileText } from "lucide-react"

type Language = "python" | "java" | "c" | "pdf"

interface LanguageIconProps {
    language: Language | string // loose typing to handle potential string inputs
    className?: string
}

const languageConfig: Record<
    string,
    { icon: React.ElementType; color: string; label: string }
> = {
    python: {
        icon: Code2,
        color: "text-blue-500",
        label: "Python",
    },
    java: {
        icon: Code2,
        color: "text-orange-500",
        label: "Java",
    },
    c: {
        icon: Code2,
        color: "text-slate-400",
        label: "C",
    },
    pdf: {
        icon: FileText,
        color: "text-red-400",
        label: "PDF",
    },
}

export const LanguageIcon: React.FC<LanguageIconProps> = ({
    language,
    className = "",
}) => {
    const normalizedLang = language.toLowerCase()
    const config = languageConfig[normalizedLang] || {
        icon: FileText,
        color: "text-slate-400",
        label: language,
    }

    const IconComponent = config.icon

    return (
        <div
            className={`flex items-center gap-1.5 ${className}`}
            title={config.label}
        >
            <IconComponent className={`w-4 h-4 ${config.color}`} />
            <span className="text-xs font-medium text-slate-400 uppercase">
                {config.label}
            </span>
        </div>
    )
}
