import React from "react"

interface ClassCodeBadgeProps {
  classCode: string
  className?: string
}

/**
 * Renders a styled badge that displays the class code.
 *
 * `@param` classCode - The class code to render inside the badge.
 * `@param` className - Optional extra classes for styling.
 * `@returns` A styled span element containing the class code.
 */
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
