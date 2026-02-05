import { cn } from "@/shared/utils/cn"

interface ToggleProps {
    enabled: boolean
    onChange: (enabled: boolean) => void
    disabled?: boolean
    className?: string
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
}: ToggleProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={disabled}
            onClick={() => onChange(!enabled)}
            className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900",
                enabled ? "bg-teal-600" : "bg-slate-700",
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
