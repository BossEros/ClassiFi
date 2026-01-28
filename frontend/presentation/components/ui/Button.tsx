import * as React from "react"
import { cn } from "@/shared/utils/cn"
import { Loader2 } from "lucide-react"

export { Button }

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  variant?: "primary" | "secondary" | "success" | "danger" | "ghost"
  size?: "sm" | "md" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      isLoading,
      disabled,
      variant = "primary",
      size = "md",
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"

    const variants = {
      primary:
        "bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:from-teal-700 hover:to-teal-600 active:opacity-90 shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 hover:-translate-y-0.5",
      secondary:
        "bg-white/8 text-slate-100 border border-white/10 hover:bg-white/12 hover:border-white/20 active:bg-white/10",
      success:
        "bg-emerald-600 text-white hover:bg-emerald-700 active:opacity-90",
      danger: "bg-rose-600 text-white hover:bg-rose-700 active:opacity-90",
      ghost:
        "text-slate-300 hover:bg-white/8 hover:text-slate-100 active:bg-white/10",
    }

    const sizes = {
      sm: "h-9 px-4 py-2 text-sm",
      md: "h-12 px-6 py-3 text-sm",
      lg: "h-14 px-8 py-4 text-base",
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading || disabled}
        ref={ref}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {children}
      </button>
    )
  },
)
Button.displayName = "Button"

