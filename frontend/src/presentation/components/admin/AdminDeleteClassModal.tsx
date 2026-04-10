import { useEffect, useState } from "react"
import { AlertCircle, AlertTriangle, ChevronLeft, Loader2, Trash2, X } from "lucide-react"
import { cn } from "@/shared/utils/cn"
import type { AdminClass } from "@/business/services/adminService"

interface AdminDeleteClassModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  classData: AdminClass | null
}

/**
 * Two-step confirmation modal for deleting a class.
 * Step 1: Warning with list of consequences.
 * Step 2: Type "DELETE" to confirm.
 */
export function AdminDeleteClassModal({ isOpen, onClose, onConfirm, classData }: AdminDeleteClassModalProps) {
  if (!isOpen || !classData) {
    return null
  }

  return (
    <DeleteClassModalContent
      onClose={onClose}
      onConfirm={onConfirm}
      classData={classData}
    />
  )
}

interface DeleteClassModalContentProps {
  onClose: () => void
  onConfirm: () => Promise<void>
  classData: AdminClass
}

function DeleteClassModalContent({
  onClose,
  onConfirm,
  classData,
}: DeleteClassModalContentProps) {
  const [confirmation, setConfirmation] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<"warning" | "confirm">("warning")

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [onClose, isDeleting])

  const handleDelete = async () => {
    setError(null)
    setIsDeleting(true)

    try {
      await onConfirm()
      onClose()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to delete class")
      setIsDeleting(false)
    }
  }

  const isConfirmDisabled = confirmation !== "DELETE" || isDeleting

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isDeleting ? onClose : undefined}
      />

      <div
        className={cn(
          "relative w-full max-w-160 mx-4 p-6",
          "rounded-3xl border border-rose-200 bg-white",
          "shadow-xl",
          "animate-in fade-in-0 zoom-in-95 duration-200",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-class-title"
      >
        <button
          onClick={onClose}
          disabled={isDeleting}
          className={cn(
            "absolute top-4 right-4 cursor-pointer rounded-lg p-1",
            "text-slate-400 hover:bg-slate-100 hover:text-slate-700",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
            {step === "warning" ? (
              <AlertTriangle className="h-8 w-8 text-rose-600" />
            ) : (
              <Trash2 className="h-8 w-8 text-rose-600" />
            )}
          </div>
        </div>

        <h2
          id="delete-class-title"
          className="mb-2 text-center text-xl font-semibold text-slate-900"
        >
          {step === "warning" ? "Delete Class?" : "Confirm Deletion"}
        </h2>

        {step === "warning" ? (
          <>
            <div className="text-center mb-4">
              <p className="text-sm text-slate-500">
                You are about to delete{" "}
                <span className="font-medium text-slate-900">{classData.className}</span>
              </p>
              <p className="mt-1 text-xs font-mono text-slate-400">
                Code: {classData.classCode}
              </p>
            </div>

            <div className="mb-6 space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm text-slate-600">
                This action is{" "}
                <span className="font-semibold text-rose-700">permanent and irreversible</span>.
                Deleting this class will remove:
              </p>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-rose-500">&bull;</span>
                  All class information and settings
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-rose-500">&bull;</span>
                  All assignments and their submissions
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-rose-500">&bull;</span>
                  All student enrollments ({classData.studentCount} students)
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-rose-500">&bull;</span>
                  All plagiarism reports and analysis data
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                type="button"
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
                  "border border-slate-300 bg-white text-slate-700",
                  "hover:bg-slate-100 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                )}
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                onClick={() => setStep("confirm")}
                type="button"
                className={cn(
                  "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
                  "bg-red-600 text-white",
                  "hover:bg-red-700 transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
                )}
              >
                <AlertTriangle className="h-4 w-4" />
                Continue
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mb-6 text-center text-sm text-slate-500">
              To confirm deletion, please type{" "}
              <span className="font-mono font-semibold text-rose-700">DELETE</span>{" "}
              below.
            </p>

            <div className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <p className="text-sm text-rose-700">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">
                  Type <span className="font-mono text-rose-700">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={confirmation}
                  onChange={(event) => {
                    setConfirmation(event.target.value.toUpperCase())
                    setError(null)
                  }}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg font-mono",
                    "border border-slate-300 bg-white",
                    "text-slate-900 placeholder-slate-300",
                    "focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent",
                    "transition-all duration-200",
                    confirmation === "DELETE" && "border-rose-400",
                  )}
                  placeholder="DELETE"
                  disabled={isDeleting}
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep("warning")}
                  disabled={isDeleting}
                  type="button"
                  className={cn(
                    "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
                    "border border-slate-300 bg-white text-slate-700",
                    "hover:bg-slate-100 transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isConfirmDisabled}
                  className={cn(
                    "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
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
                      Delete Class
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
