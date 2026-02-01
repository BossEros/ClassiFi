import React from "react"
import { User } from "lucide-react"

interface InstructorInfoProps {
  instructorName: string
  className?: string
}

/**
 * Displays instructor information with an icon and name.
 * Used in class headers and detail views to show the instructor assigned to a class.
 *
 * @param instructorName - The full name of the instructor to display.
 * @param className - Optional CSS classes to apply to the container element.
 * @returns A JSX.Element containing the instructor icon and name.
 */
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
