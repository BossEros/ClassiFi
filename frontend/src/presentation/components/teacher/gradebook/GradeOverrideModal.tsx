import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/shared/utils/cn"
import { Edit2, RotateCcw, X } from "lucide-react"
import type { FieldErrors } from "react-hook-form"
import { useZodForm } from "@/presentation/hooks/shared/useZodForm"
import { createGradeOverrideFormSchema, type GradeOverrideFormValues } from "@/presentation/schemas/gradebook/gradebookSchemas"
import { getFirstFormErrorMessage } from "@/presentation/utils/formErrorMap"

interface GradeOverrideModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (grade: number, feedback: string | null) => void
  onRemoveOverride?: () => void
  variant?: "dark" | "light"
  isSubmitting?: boolean
  studentName: string
  assignmentName: string
  currentGrade: number | null
  totalScore: number
}

export function GradeOverrideModal({
  isOpen,
  onClose,
  onSubmit,
  onRemoveOverride,
  variant = "dark",
  isSubmitting = false,
  studentName,
  assignmentName,
  currentGrade,
  totalScore,
}: GradeOverrideModalProps) {
  const isLight = variant === "light"
  const [error, setError] = React.useState<string | null>(null)
  const { register, handleSubmit, watch, reset } = useZodForm({
    schema: createGradeOverrideFormSchema(totalScore),
    defaultValues: {
      grade: currentGrade?.toString() ?? "",
      feedback: "",
    },
    mode: "onSubmit",
  })

  const gradeField = register("grade")
  const feedbackField = register("feedback")
  const grade = watch("grade")
  const feedback = watch("feedback")

  const modalRef = React.useRef<HTMLDivElement>(null)
  const previousFocusRef = React.useRef<HTMLElement | null>(null)
  const previousIsOpenRef = React.useRef<boolean>(false)

  React.useEffect(() => {
    if (isOpen) {
      reset({
        grade: currentGrade?.toString() ?? "",
        feedback: "",
      })
      setError(null)
      previousFocusRef.current = document.activeElement as HTMLElement
    }
  }, [isOpen, currentGrade, reset])

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
      if (!modalRef.current) {
        return
      }

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

  const handleValidSubmit = (formValues: GradeOverrideFormValues) => {
    setError(null)

    const parsedGrade = Number.parseFloat(formValues.grade)
    onSubmit(parsedGrade, formValues.feedback.trim() || null)
  }

  const handleInvalidSubmit = (validationErrors: FieldErrors<GradeOverrideFormValues>) => {
    const firstErrorMessage = getFirstFormErrorMessage(validationErrors)

    if (firstErrorMessage) {
      setError(firstErrorMessage)
    }
  }

  if (!isOpen || typeof document === "undefined") {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!isSubmitting ? onClose : undefined} />

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
        aria-labelledby="grade-override-modal-title"
      >
        <button
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

        <div className="mb-5 flex justify-center">
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full border",
              isLight ? "border-teal-200 bg-teal-50" : "border-teal-500/20 bg-teal-500/10",
            )}
          >
            <Edit2 className={`h-6 w-6 ${isLight ? "text-teal-600" : "text-teal-400"}`} />
          </div>
        </div>

        <h2
          id="grade-override-modal-title"
          className={`mb-1 text-center text-xl font-semibold ${isLight ? "text-slate-900" : "text-white"}`}
        >
          {currentGrade === null ? "Set Grade" : "Override Grade"}
        </h2>

        <div className="mb-6 text-center">
          <p className={isLight ? "text-slate-600" : "text-slate-300"}>
            For <span className={isLight ? "font-medium text-slate-900" : "font-medium text-white"}>{studentName}</span>
          </p>
          <p className={`mt-1 text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>{assignmentName}</p>
        </div>

        <form onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)} className="space-y-5" noValidate>
          <div>
            <label
              htmlFor="grade"
              className={`mb-2 flex items-center justify-between text-sm font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}
            >
              <span>{currentGrade === null ? "Grade" : "New Grade"}</span>
              <span className={`text-xs font-normal ${isLight ? "text-slate-400" : "text-slate-500"}`}>Max: {totalScore}</span>
            </label>

            <div className="relative">
              <input
                type="number"
                id="grade"
                step="0.01"
                inputMode="decimal"
                {...gradeField}
                value={grade}
                onChange={(event) => {
                  gradeField.onChange(event)
                  if (error) {
                    setError(null)
                  }
                }}
                min={0}
                max={totalScore}
                disabled={isSubmitting}
                className={cn(
                  "w-full rounded-xl px-4 py-2.5 text-base",
                  "appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                  isLight
                    ? "border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400"
                    : "border border-white/10 bg-slate-950/50 text-white placeholder-slate-500",
                  "transition-all duration-200 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  error && "border-red-500/50 focus:border-red-500 focus:ring-red-500/20",
                )}
                placeholder="0.00"
              />
              <div className="pointer-events-none absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2">
                <span className={`font-medium ${isLight ? "text-slate-400" : "text-slate-600"}`}>/</span>
                <span className={`font-medium ${isLight ? "text-slate-500" : "text-slate-500"}`}>{totalScore}</span>
              </div>
            </div>
          </div>

          {currentGrade !== null && (
            <div>
              <label
                htmlFor="feedback"
                className={`mb-2 flex items-center justify-between text-sm font-medium ${isLight ? "text-slate-700" : "text-slate-300"}`}
              >
                <span>Feedback</span>
                <span className={`text-xs font-normal ${isLight ? "text-slate-400" : "text-slate-500"}`}>Optional</span>
              </label>
              <textarea
                id="feedback"
                {...feedbackField}
                value={feedback}
                onChange={(event) => {
                  feedbackField.onChange(event)
                  if (error) {
                    setError(null)
                  }
                }}
                disabled={isSubmitting}
                rows={3}
                className={cn(
                  "w-full resize-none rounded-xl px-4 py-3 text-sm",
                  isLight
                    ? "border border-slate-300 bg-slate-50 text-slate-900 placeholder-slate-400"
                    : "border border-white/10 bg-slate-950/50 text-white placeholder-slate-500",
                  "transition-all duration-200 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
                placeholder="Explain the reason for this grade override..."
              />
            </div>
          )}

          {error && (
            <div className={cn("rounded-lg border p-3", isLight ? "border-rose-200 bg-rose-50" : "border-red-500/20 bg-red-500/10")}>
              <p className={`text-center text-sm font-medium ${isLight ? "text-rose-700" : "text-red-400"}`}>{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={cn(
                "flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                isLight
                  ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  : "border border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 active:scale-[0.98]",
                isLight ? "bg-teal-600 shadow-sm shadow-teal-200 hover:bg-teal-700" : "bg-teal-600 shadow-lg shadow-teal-500/20 hover:bg-teal-500 hover:shadow-teal-500/30",
                `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${isLight ? "focus-visible:ring-offset-white" : "focus-visible:ring-offset-slate-900"}`,
                "disabled:cursor-not-allowed disabled:transform-none disabled:opacity-50 disabled:shadow-none",
              )}
            >
              {isSubmitting ? "Saving..." : currentGrade === null ? "Set Grade" : "Confirm Override"}
            </button>
          </div>

          {onRemoveOverride && currentGrade !== null && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onRemoveOverride}
                disabled={isSubmitting}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  isLight
                    ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    : "text-slate-400 hover:bg-red-500/10 hover:text-red-400",
                  !isLight && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400",
                  isLight && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Auto-Calculated Grade
              </button>
            </div>
          )}
        </form>
      </div>
    </div>,
    document.body,
  )
}
