import * as React from "react"
import { cn } from "@/shared/utils/cn"

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg"
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "w-8 h-8 text-xs",
      md: "w-10 h-10 text-sm",
      lg: "w-12 h-12 text-base",
    }

    const getInitials = (name?: string) => {
      if (!name) return "?"
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-500",
          "text-white font-semibold overflow-hidden",
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt || "Avatar"}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{fallback || getInitials(alt)}</span>
        )}
      </div>
    )
  },
)
Avatar.displayName = "Avatar"

export { Avatar }
