import * as React from "react"
import { ChevronDown } from "lucide-react"
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
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, options, onChange, placeholder, onFocus, onBlur, disabled, ...props },
    ref,
  ) => {
    const [isFocused, setIsFocused] = React.useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (onChange) {
        onChange(e.target.value)
      }
    }

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(true)
      onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(false)
      onBlur?.(e)
    }

    return (
      <div className="relative w-full">
        <select
          className={cn(
            "flex h-12 w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-10 text-sm text-white backdrop-blur-sm transition-all duration-200",
            "hover:bg-white/10 hover:border-white/20",
            "focus:outline-none focus:ring-2 focus:ring-teal-600/50 focus:border-teal-600/50 focus:bg-white/10",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/5",
            "[&>option]:bg-slate-900 [&>option]:text-white",
            className,
          )}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          ref={ref}
          {...props}
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

        <ChevronDown
          className={cn(
            "pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 transition-all duration-200",
            isFocused && !disabled ? "rotate-180 text-gray-300" : "text-gray-500",
            disabled && "opacity-50",
          )}
        />
      </div>
    )
  },
)
Select.displayName = "Select"

export { Select }
