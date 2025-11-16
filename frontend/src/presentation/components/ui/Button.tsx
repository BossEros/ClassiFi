/**
 * Button Component
 * Part of the Presentation Layer - UI Components
 */

import * as React from 'react'
import { cn } from '@/shared/utils/cn'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-colors duration-200',
          'h-12 px-6 py-3 w-full',
          'bg-gradient-to-r from-purple-600 to-indigo-600 text-white',
          'hover:from-purple-700 hover:to-indigo-700',
          'active:opacity-90',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
          'disabled:pointer-events-none disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
