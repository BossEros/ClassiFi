import React from "react"

interface ClassCodeBadgeProps {
    classCode: string
    className?: string
}

export const ClassCodeBadge: React.FC<ClassCodeBadgeProps> = ({
    classCode,
    className = "",
}) => {
    return (
        <span
            className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-mono bg-teal-500/20 border border-teal-500/30 text-teal-400 ${className}`}
        >
            {classCode}
        </span>
    )
}
