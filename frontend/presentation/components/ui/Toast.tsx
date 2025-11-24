/**
 * Toast Component
 * Part of the Presentation Layer - UI Components
 * Displays temporary notification messages
 */

import * as React from 'react'
import { cn } from '@/shared/utils/cn'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastProps {
  id: string
  message: string
  variant?: ToastVariant
  duration?: number
  onDismiss: (id: string) => void
}

const variantStyles: Record<ToastVariant, { bg: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-green-500/20 border-green-500/30',
    icon: <CheckCircle className="w-5 h-5 text-green-400" />
  },
  error: {
    bg: 'bg-red-500/20 border-red-500/30',
    icon: <AlertCircle className="w-5 h-5 text-red-400" />
  },
  info: {
    bg: 'bg-blue-500/20 border-blue-500/30',
    icon: <Info className="w-5 h-5 text-blue-400" />
  }
}

export function Toast({ id, message, variant = 'success', duration = 4000, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [isLeaving, setIsLeaving] = React.useState(false)

  React.useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setIsVisible(true), 10)

    // Auto-dismiss after duration
    const dismissTimer = setTimeout(() => {
      handleDismiss()
    }, duration)

    return () => {
      clearTimeout(enterTimer)
      clearTimeout(dismissTimer)
    }
  }, [duration])

  const handleDismiss = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onDismiss(id)
    }, 300) // Match animation duration
  }

  const styles = variantStyles[variant]

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-lg',
        'transition-all duration-300 ease-out',
        styles.bg,
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100'
          : 'translate-x-full opacity-0'
      )}
      role="alert"
    >
      {styles.icon}
      <p className="text-sm text-white font-medium flex-1">{message}</p>
      <button
        onClick={handleDismiss}
        className="p-1 rounded hover:bg-white/10 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  )
}

export interface ToastContainerProps {
  toasts: Array<{
    id: string
    message: string
    variant?: ToastVariant
  }>
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          variant={toast.variant}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
}
