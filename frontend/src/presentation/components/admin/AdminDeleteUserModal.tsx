import * as React from "react"
import { cn } from "@/shared/utils/cn"
import { AlertTriangle, X, Trash2, AlertCircle, Loader2 } from "lucide-react"
import type { AdminUser } from "@/business/services/adminService"

interface AdminDeleteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  user: AdminUser | null
}

export function AdminDeleteUserModal({
  isOpen,
  onClose,
  onConfirm,
  user,
}: AdminDeleteUserModalProps) {
  const [confirmation, setConfirmation] = React.useState("")
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [step, setStep] = React.useState<"warning" | "confirm">("warning")

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setConfirmation("")
      setError(null)
      setStep("warning")
      setIsDeleting(false)
    }
  }, [isOpen])

  // Close on escape key
  React.useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose, isDeleting])

  const handleContinue = () => {
    setStep("confirm")
  }

  const handleDelete = async () => {
    setError(null)
    setIsDeleting(true)

    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user")
      setIsDeleting(false)
    }
  }

  const isConfirmDisabled = confirmation !== "DELETE" || isDeleting

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-md min-w-[450px] mx-4 p-6",
          "rounded-xl border border-red-500/20 bg-slate-900/95 backdrop-blur-sm",
          "shadow-xl shadow-red-500/10",
          "animate-in fade-in-0 zoom-in-95 duration-200",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-user-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className={cn(
            "absolute top-4 right-4 p-1 rounded-lg",
            "text-gray-400 hover:text-white hover:bg-white/10",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-red-500/20">
            {step === "warning" ? (
              <AlertTriangle className="w-8 h-8 text-red-400" />
            ) : (
              <Trash2 className="w-8 h-8 text-red-400" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2
          id="delete-user-title"
          className="text-xl font-semibold text-center mb-2 text-white"
        >
          {step === "warning" ? "Delete User?" : "Confirm Deletion"}
        </h2>

        {step === "warning" ? (
          <>
            {/* User info */}
            <div className="text-center mb-4">
              <p className="text-gray-400 text-sm">
                You are about to delete{" "}
                <span className="text-white font-medium">
                  {user.firstName} {user.lastName}
                </span>
              </p>
            </div>

            <div className="space-y-3 mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-gray-300">
                This action is{" "}
                <span className="text-red-400 font-semibold">
                  permanent and irreversible
                </span>
                . Deleting this user will remove:
              </p>
              <ul className="text-sm text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">â€¢</span>
                  Their profile and personal information
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">â€¢</span>
                  All submissions and assignments
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">â€¢</span>
                  All class enrollments and associations
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
                  "border border-white/20 text-white",
                  "hover:bg-white/10 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                className={cn(
                  "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
                  "bg-red-500/20 border border-red-500/30 text-red-400",
                  "hover:bg-red-500/30 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
                )}
              >
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation form */}
            <p className="text-gray-400 text-center mb-6 text-sm">
              To confirm deletion, please type{" "}
              <span className="text-red-400 font-mono font-semibold">
                DELETE
              </span>{" "}
              below.
            </p>

            <div className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Type DELETE */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Type <span className="text-red-400 font-mono">DELETE</span> to
                  confirm
                </label>
                <input
                  type="text"
                  value={confirmation}
                  onChange={(e) => {
                    setConfirmation(e.target.value.toUpperCase())
                    setError(null)
                  }}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg font-mono",
                    "bg-black/20 border border-white/10",
                    "text-white placeholder-gray-500",
                    "focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent",
                    "transition-all duration-200",
                    confirmation === "DELETE" && "border-red-500/50",
                  )}
                  placeholder="DELETE"
                  disabled={isDeleting}
                  autoFocus
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep("warning")}
                  disabled={isDeleting}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
                    "border border-white/20 text-white",
                    "hover:bg-white/10 transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  Back
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isConfirmDisabled}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2",
                    "bg-red-600 text-white",
                    "hover:bg-red-700 transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete User
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

