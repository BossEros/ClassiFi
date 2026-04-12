import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/shared/utils/cn"
import { X } from "lucide-react"

interface GradeModalShellProps {
  isOpen: boolean
  onClose: () => void
  isSubmitting: boolean
  variant: "dark" | "light"
  titleId: string
  children: React.ReactNode
}

/**
 * Shared modal shell for grade-related modals.
 * Handles backdrop, container, close button, keyboard navigation, and focus management.
 */
export function GradeModalShell({
  isOpen,
  onClose,
  isSubmitting,
  variant,
  titleId,
  children,
}: GradeModalShellProps) {
  const isLight = variant === "light"
  const modalRef = React.useRef<HTMLDivElement>(null)
  const previousFocusRef = React.useRef<HTMLElement | null>(null)
  const previousIsOpenRef = React.useRef<boolean>(false)

  React.useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
    }
  }, [isOpen])

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose()
        return
      }

      if (event.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )

        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (!firstElement || !lastElement) return

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus()
            event.preventDefault()
          }
        } else if (document.activeElement === lastElement) {
          firstElement.focus()
          event.preventDefault()
        }
      }
    }

    const wasOpen = previousIsOpenRef.current
    previousIsOpenRef.current = isOpen

    if (!isOpen && wasOpen) {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
      return
    }

    if (!isOpen) return

    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    setTimeout(() => {
      if (!modalRef.current) return

      const gradeInput = modalRef.current.querySelector("#grade") as HTMLElement
      if (gradeInput) {
        gradeInput.focus()
        return
      }

      const firstElement = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )[0] as HTMLElement
      firstElement?.focus()
    }, 0)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose, isSubmitting])

  if (!isOpen || typeof document === "undefined") {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />

      <div
        ref={modalRef}
        className={cn(
          "relative mx-4 w-[calc(100%-2rem)] max-w-[480px] flex-shrink-0 p-6 sm:min-w-[420px] sm:p-8",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          isLight
            ? "rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40"
            : "rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-md shadow-2xl shadow-black/50",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className={cn(
            "absolute right-4 top-4 rounded-xl p-2 transition-colors duration-200",
            isLight
              ? "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
              : "text-slate-400 hover:bg-white/10 hover:text-white",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <X className="h-5 w-5" />
        </button>

        {children}
      </div>
    </div>,
    document.body,
  )
}
