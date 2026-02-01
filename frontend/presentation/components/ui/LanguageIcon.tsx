import React from "react"
import { Code2, FileText } from "lucide-react"

interface LanguageIconProps {
  language: string
  className?: string
}

export const LanguageIcon: React.FC<LanguageIconProps> = ({
  language,
  className = "",
}) => {
  const getLanguageColor = (lang: string): string => {
    const langLower = lang.toLowerCase()
    switch (langLower) {
      case "python":
        return "text-blue-400"
      case "java":
        return "text-orange-400"
      case "c":
      case "c++":
        return "text-purple-400"
      case "pdf":
        return "text-gray-400"
      default:
        return "text-gray-400"
    }
  }

  const colorClass = getLanguageColor(language)

  if (language.toLowerCase() === "pdf") {
    return <FileText className={`w-4 h-4 ${colorClass} ${className}`} />
  }

  return <Code2 className={`w-4 h-4 ${colorClass} ${className}`} />
}
