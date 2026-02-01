import React from "react"

interface DateBlockProps {
    date: Date
    className?: string
}

export const DateBlock: React.FC<DateBlockProps> = ({
    date,
    className = "",
}) => {
    const month = date.toLocaleString("default", { month: "short" }).toUpperCase()
    const day = date.getDate().toString().padStart(2, "0")

    return (
        <div
            className={`flex flex-col items-center justify-center w-16 h-16 bg-white/5 border border-white/10 rounded-lg ${className}`}
        >
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {month}
            </span>
            <span className="text-2xl font-bold text-white">{day}</span>
        </div>
    )
}
