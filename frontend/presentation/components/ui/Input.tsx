import * as React from 'react'
import { cn } from '@/shared/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hasError, ...props }, ref) => {
    return (
      <input
        type={type}
        autoComplete="off"
        aria-invalid={hasError ? 'true' : undefined}
        className={cn(
          'flex h-12 w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder:text-gray-500 transition-all duration-200',
          'hover:bg-white/10 hover:border-white/20',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-white/10',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/5',
          // Error state
          hasError && 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50',
          // Dark theme styling for number input spinner buttons
          '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          '[appearance:textfield]',
          // Dark theme styling for datetime-local picker
          '[&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer',
          '[&::-webkit-datetime-edit]:text-white [&::-webkit-datetime-edit-fields-wrapper]:text-white',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
