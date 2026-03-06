import { cn } from "@/shared/utils/cn"

interface ToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  disabled?: boolean
  className?: string
  variant?: "dark" | "light"
}

/**
 * Toggle switch component for boolean settings.
 * Provides an accessible, animated toggle control.
 */
export function Toggle({
  enabled,
  onChange,
  disabled = false,
  className,
  variant = "dark",
}: ToggleProps) {
  const trackClasses =
    variant === "light"
      ? enabled
        ? "bg-teal-600"
        : "bg-slate-300"
      : enabled
        ? "bg-teal-600"
        : "bg-slate-700"

  const focusOffsetClasses =
    variant === "light"
      ? "focus:ring-offset-white"
      : "focus:ring-offset-slate-900"

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2",
        trackClasses,
        focusOffsetClasses,
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "cursor-pointer",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          enabled ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  )
}
