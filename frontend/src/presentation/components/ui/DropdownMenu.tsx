import * as React from "react"
import { cn } from "@/shared/utils/cn"
import { MoreVertical } from "lucide-react"

interface DropdownMenuItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  variant?: "default" | "danger"
  onClick: () => void
}

interface DropdownMenuProps {
  items: DropdownMenuItem[]
  className?: string
  triggerLabel?: string
  variant?: "dark" | "light"
}

export function DropdownMenu({
  items,
  className,
  triggerLabel = "Actions",
  variant = "dark",
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close menu on escape key
  React.useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [])

  return (
    <div ref={menuRef} className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2 rounded-lg transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2",
          variant === "light"
            ? "hover:bg-slate-100 focus-visible:ring-offset-white"
            : "hover:bg-white/10 focus-visible:ring-offset-slate-900",
          isOpen && (variant === "light" ? "bg-slate-100" : "bg-white/10"),
        )}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={triggerLabel}
      >
        <MoreVertical
          className={cn(
            "w-5 h-5",
            variant === "light" ? "text-slate-500" : "text-gray-400",
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2 z-50",
            "min-w-[160px] overflow-hidden py-1",
            variant === "light"
              ? "rounded-lg border border-slate-200 bg-white"
              : "rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur-sm",
            "shadow-lg shadow-black/20",
            "animate-in fade-in-0 zoom-in-95 duration-150",
          )}
          role="menu"
        >
          {items.map((item) => {
            const Icon = item.icon

            return (
              <button
                key={item.id}
                onClick={() => {
                  item.onClick()
                  setIsOpen(false)
                }}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm text-left font-medium",
                  "transition-colors duration-150",
                  item.variant === "danger"
                    ? variant === "light"
                      ? "text-red-600 hover:bg-rose-100 hover:text-red-700"
                      : "text-red-400 hover:bg-red-500/10"
                    : variant === "light"
                      ? "text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                      : "text-gray-300 hover:bg-white/10",
                )}
                role="menuitem"
              >
                {Icon && <Icon className="w-4 h-4" />}
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
