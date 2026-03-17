import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, Pencil, RefreshCw } from "lucide-react"
import { cn } from "@/shared/utils/cn"

interface RenameModuleModalProps {
  isOpen: boolean
  onClose: () => void
  onRename: (name: string) => Promise<void>
  currentName: string
}

/**
 * Modal dialog for renaming a module.
 *
 * @param isOpen - Whether the modal is visible.
 * @param onClose - Callback to close the modal.
 * @param onRename - Async callback to rename the module.
 * @param currentName - The current name of the module being renamed.
 */
export function RenameModuleModal({ isOpen, onClose, onRename, currentName }: RenameModuleModalProps) {
  const [name, setName] = useState(currentName)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setName(currentName)
      setError(null)
    }
  }, [isOpen, currentName])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose, isSubmitting])

  if (!isOpen) return null

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      setError("Module name is required")
      return
    }

    if (trimmedName.length > 255) {
      setError("Module name must not exceed 255 characters")
      return
    }

    if (trimmedName === currentName) {
      onClose()
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await onRename(trimmedName)
      onClose()
    } catch {
      setError("Failed to rename module. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] grid place-items-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-[448px] min-w-[320px] mx-auto flex-shrink-0",
          "rounded-xl border border-slate-200 bg-white",
          "shadow-xl shadow-black/20",
          "animate-in fade-in-0 zoom-in-95 duration-200",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-module-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
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

        {/* Icon */}
        <div className="flex justify-center mb-4 pt-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
            <Pencil className="w-6 h-6 text-teal-600" />
          </div>
        </div>

        {/* Title */}
        <h2 id="rename-module-title" className="text-xl font-semibold text-slate-900 text-center mb-2 px-6">
          Rename Module
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6">
          <div className="space-y-3 mb-6">
            <input
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setError(null)
              }}
              placeholder="Enter module name..."
              autoFocus
              disabled={isSubmitting}
              maxLength={255}
              className={cn(
                "w-full rounded-lg border px-3 py-2.5 text-sm transition-colors duration-200",
                "border-slate-300 bg-white text-slate-900 placeholder-slate-400",
                "focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                error && "border-rose-400 focus:ring-rose-500 focus:border-rose-500",
              )}
            />
            {error && <p className="text-xs text-rose-500">{error}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
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
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className={cn(
                "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
                "bg-teal-600 text-white",
                "hover:bg-teal-700 transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
              {isSubmitting ? "Renaming..." : "Rename"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
