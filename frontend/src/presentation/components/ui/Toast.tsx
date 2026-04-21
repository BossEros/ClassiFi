import * as React from "react"
import { cn } from "@/shared/utils/cn"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"

export type ToastVariant = "success" | "error" | "info"

export interface ToastProps {
  id: string
  message: string
  variant?: ToastVariant
  duration?: number
  onDismiss: (id: string) => void
}

const variantStyles: Record<
  ToastVariant,
  { bg: string; icon: React.ReactNode }
> = {
  success: {
    bg: "bg-emerald-50 border-emerald-200",
    icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
  },
  error: {
    bg: "bg-rose-50 border-rose-200",
    icon: <AlertCircle className="w-5 h-5 text-rose-600" />,
  },
  info: {
    bg: "bg-sky-50 border-sky-200",
    icon: <Info className="w-5 h-5 text-sky-600" />,
  },
}

export function Toast({
  id,
  message,
  variant = "success",
  duration = 4000,
  onDismiss,
}: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [isLeaving, setIsLeaving] = React.useState(false)
  const [isPaused, setIsPaused] = React.useState(false)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)

  const handleDismiss = React.useCallback(() => {
    setIsLeaving(true)
    setTimeout(() => {
      onDismiss(id)
    }, 300) // Match animation duration
  }, [id, onDismiss])

  const startTimer = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => {
      handleDismiss()
    }, duration)
  }, [duration, handleDismiss])

  React.useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setIsVisible(true), 10)
    startTimer()

    return () => {
      clearTimeout(enterTimer)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [startTimer])

  React.useEffect(() => {
    if (isPaused) {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    } else {
      startTimer()
    }
  }, [isPaused, startTimer])

  const styles = variantStyles[variant]

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg",
        "w-full max-w-full min-w-0 transition-all duration-300 ease-out sm:ml-auto sm:min-w-[320px] sm:w-auto sm:max-w-md",
        styles.bg,
        isVisible && !isLeaving
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0",
      )}
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "error" ? "assertive" : "polite"}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex-shrink-0">{styles.icon}</div>
      <p className="text-sm text-slate-800 font-medium flex-1 break-words">
        {message}
      </p>
      <button
        onClick={handleDismiss}
        className="p-1 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4 text-slate-500" />
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
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[11050] px-3 sm:inset-x-auto sm:right-6 sm:top-6 sm:px-0">
      <div className="mx-auto flex w-full max-w-[min(100%,28rem)] flex-col gap-3 pointer-events-auto sm:mx-0 sm:w-auto sm:max-w-none">
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
    </div>
  )
}
