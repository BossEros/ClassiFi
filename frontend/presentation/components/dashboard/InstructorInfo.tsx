import React from "react"
import { User } from "lucide-react"

interface InstructorInfoProps {
    instructorName: string
    className?: string
}

export const InstructorInfo: React.FC<InstructorInfoProps> = ({
    instructorName,
    className = "",
}) => {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <User className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300">{instructorName}</span>
        </div>
    )
}
