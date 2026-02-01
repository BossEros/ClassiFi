import React, { useMemo } from "react"

interface GradeDisplayProps {
    grade: number | null | undefined
    maxGrade?: number
    className?: string
}

export const GradeDisplay: React.FC<GradeDisplayProps> = ({
    grade,
    maxGrade = 100,
    className = "",
}) => {
    const percentage = useMemo(() => {
        if (grade === null || grade === undefined || maxGrade === 0) return 0
        return (grade / maxGrade) * 100
    }, [grade, maxGrade])

    const colorClass = useMemo(() => {
        if (grade === null || grade === undefined) return "text-slate-500"
        if (percentage >= 90) return "text-green-500"
        if (percentage >= 80) return "text-teal-500"
        if (percentage >= 70) return "text-amber-500"
        if (percentage >= 60) return "text-orange-500"
        return "text-red-500"
    }, [percentage, grade])

    const displayText =
        grade !== null && grade !== undefined ? `${grade}/${maxGrade}` : "N/A"

    return (
        <div className={`flex flex-col items-end ${className}`}>
            <span className={`text-xl font-bold ${colorClass}`}>{displayText}</span>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Grade
            </span>
        </div>
    )
}
