import { useEffect, useRef, useCallback, useState } from "react"
import { createPortal } from "react-dom"
import { X, Trash2, RefreshCw, AlertTriangle } from "lucide-react"
import { cn } from "@/shared/utils/cn"

interface DeleteModuleModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  moduleName: string
  assignmentCount: number
}

/**
 * Confirmation modal for deleting a module. Warns that all assignments inside will be deleted.
 *
 * @param isOpen - Whether the modal is visible.
 * @param onClose - Callback to close the modal.
 * @param onConfirm - Async callback to delete the module.
 * @param moduleName - Name of the module being deleted.
 * @param assignmentCount - Number of assignments that will be deleted.
 */
export function DeleteModuleModal({ isOpen, onClose, onConfirm, moduleName, assignmentCount }: DeleteModuleModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Reset isDeleting when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsDeleting(false)
    }
  }, [isOpen])

  // Focus management: capture previous focus, auto-focus dialog, restore on close
  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current = document.activeElement as HTMLElement | null

    // Auto-focus the dialog after a frame so the portal has rendered
    requestAnimationFrame(() => {
      dialogRef.current?.focus()
    })

    return () => {
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  // Focus trap + Escape key
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) {
        onClose()
        return
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )

        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            event.preventDefault()
            first.focus()
          }
        }
      }
    },
    [isDeleting, onClose],
  )

  useEffect(() => {
    if (!isOpen) return

    window.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsDeleting(true)

    try {
      await onConfirm()
      onClose()
    } catch {
      setIsDeleting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] grid place-items-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-[448px] min-w-[320px] mx-auto p-6 flex-shrink-0",
          "rounded-xl border border-slate-200 bg-white",
          "shadow-xl shadow-black/20",
          "animate-in fade-in-0 zoom-in-95 duration-200",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-module-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          aria-label="Close"
          className={cn(
            "absolute top-4 right-4 cursor-pointer rounded-lg p-1",
            "text-slate-400 hover:text-slate-900 hover:bg-slate-100",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning icon */}
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
        </div>

        {/* Title */}
        <h2 id="delete-module-title" className="text-xl font-semibold text-slate-900 text-center mb-2">
          Delete Module
        </h2>

        {/* Description */}
        <p className="text-slate-500 text-center mb-4">
          Are you sure you want to delete <span className="font-semibold text-slate-900">{moduleName}</span>?
          This action cannot be undone.
        </p>

        {assignmentCount > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-6">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{assignmentCount}</span>{" "}
              {assignmentCount === 1 ? "assignment" : "assignments"} inside this module will also be permanently deleted,
              including all student submissions.
            </p>
          </div>
        )}

        {assignmentCount === 0 && <div className="mb-6" />}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
              "border border-slate-300 bg-white text-slate-700",
              "hover:bg-slate-50 transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
              "bg-red-500 text-white",
              "hover:bg-red-600 transition-colors duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {isDeleting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {isDeleting ? "Deleting..." : "Delete Module"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
