import * as React from "react"
import { cn } from "@/shared/utils/cn"

export type SelectOption = {
  value: string
  label: string
}

export interface SelectProps extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "onChange"
> {
  options: SelectOption[]
  onChange?: (value: string) => void
  placeholder?: string
  hasError?: boolean
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, onChange, placeholder, hasError, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(e.target.value)
      }
    }

    return (
      <select
        className={cn(
          "flex h-12 w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-3 text-sm text-white transition-all duration-200",
          "hover:bg-white/10 hover:border-white/20",
          "focus:outline-none focus:ring-2 focus:ring-teal-600/50 focus:border-teal-600/50 focus:bg-white/10",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/5",
          hasError &&
            "border-red-500/50 focus:border-red-500 focus:ring-red-500/50",
          "[&>option]:bg-slate-900 [&>option]:text-white",
          className,
        )}
        onChange={handleChange}
        ref={ref}
        ref={ref}
        {...props}
        aria-invalid={hasError || props["aria-invalid"]}
       >
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  },
)
Select.displayName = "Select"

export { Select }
