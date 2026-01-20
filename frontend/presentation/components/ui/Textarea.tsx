import * as React from 'react'
import { cn } from '@/shared/utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[120px] w-full rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder:text-gray-500 transition-all duration-200',
          'hover:bg-white/10 hover:border-white/20',
          'focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-white/10',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/5',
          hasError && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50',
          'resize-y',
          className
        )}
        ref={ref}
        aria-invalid={hasError ? true : props['aria-invalid']}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
