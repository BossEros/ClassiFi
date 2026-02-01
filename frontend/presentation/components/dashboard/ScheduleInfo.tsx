import React from "react"
import { Clock } from "lucide-react"

interface ScheduleInfoProps {
    days: string[]
    startTime: string
    endTime: string
    className?: string
}

export const ScheduleInfo: React.FC<ScheduleInfoProps> = ({
    days,
    startTime,
    endTime,
    className = "",
}) => {
    if (!days || days.length === 0 || !startTime || !endTime) {
        return null
    }

    const daysText = days.join(", ")
    const scheduleText = `${daysText} ${startTime} - ${endTime}`

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300">{scheduleText}</span>
        </div>
    )
}
