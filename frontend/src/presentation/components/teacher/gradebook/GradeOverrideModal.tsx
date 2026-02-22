import * as React from "react"
import { cn } from "@/shared/utils/cn"
import { Edit2, X, RotateCcw } from "lucide-react"
import type { FieldErrors } from "react-hook-form"
import { useZodForm } from "@/presentation/hooks/shared/useZodForm"
import {
  createGradeOverrideFormSchema,
  type GradeOverrideFormValues,
} from "@/presentation/schemas/gradebook/gradebookSchemas"
import { getFirstFormErrorMessage } from "@/presentation/utils/formErrorMap"

interface GradeOverrideModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (grade: number, feedback: string | null) => void
  onRemoveOverride?: () => void
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
  isSubmitting = false,
  studentName,
  assignmentName,
  currentGrade,
  totalScore,
}: GradeOverrideModalProps) {
  const [error, setError] = React.useState<string | null>(null)
  const {
    register,
    handleSubmit,
    watch,
    reset,
  } = useZodForm({
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
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement

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
      if (modalRef.current) {
        const gradeInput = modalRef.current.querySelector("#grade") as HTMLElement

        if (gradeInput) {
          gradeInput.focus()
        } else {
          const firstElement = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          )[0] as HTMLElement
          firstElement?.focus()
        }
      }
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

  const handleInvalidSubmit = (
    validationErrors: FieldErrors<GradeOverrideFormValues>,
  ) => {
    const firstErrorMessage = getFirstFormErrorMessage(validationErrors)

    if (firstErrorMessage) {
      setError(firstErrorMessage)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isSubmitting ? onClose : undefined}
      />

      <div
        ref={modalRef}
        className={cn(
          "relative w-full max-w-md mx-4 p-6",
          "rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-sm",
          "shadow-xl shadow-black/20",
          "animate-in fade-in-0 zoom-in-95 duration-200",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="grade-override-modal-title"
      >
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className={cn(
            "absolute top-4 right-4 p-1 rounded-lg",
            "text-gray-400 hover:text-white hover:bg-white/10",
            "transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center">
            <Edit2 className="w-8 h-8 text-teal-400" />
          </div>
        </div>

        <h2
          id="grade-override-modal-title"
          className="text-xl font-semibold text-white text-center mb-2"
        >
          Override Grade
        </h2>

        <div className="text-center mb-6">
          <p className="text-gray-400">
            <span className="text-white font-medium">{studentName}</span>
          </p>
          <p className="text-sm text-gray-500">{assignmentName}</p>
        </div>

        <form
          onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
          className="space-y-4"
          noValidate
        >
          <div>
            <label
              htmlFor="grade"
              className="block text-sm font-medium text-gray-400 mb-2"
            >
              New Grade (0 - {totalScore})
            </label>
            <input
              type="number"
              id="grade"
              step="0.01"
              inputMode="decimal"
              {...gradeField}
              value={grade}
              onChange={(event) => {
                gradeField.onChange(event)
                if (error) setError(null)
              }}
              min={0}
              max={totalScore}
              disabled={isSubmitting}
              className={cn(
                "w-full px-4 py-3 rounded-xl",
                "bg-white/5 border border-white/10",
                "text-white placeholder-gray-500",
                "focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200",
              )}
              placeholder={`Enter grade (max ${totalScore})`}
            />
          </div>

          <div>
            <label
              htmlFor="feedback"
              className="block text-sm font-medium text-gray-400 mb-2"
            >
              Feedback (optional)
            </label>
            <textarea
              id="feedback"
              {...feedbackField}
              value={feedback}
              onChange={(event) => {
                feedbackField.onChange(event)
                if (error) setError(null)
              }}
              disabled={isSubmitting}
              rows={3}
              className={cn(
                "w-full px-4 py-3 rounded-xl resize-none",
                "bg-white/5 border border-white/10",
                "text-white placeholder-gray-500",
                "focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200",
              )}
              placeholder="Add a note about this grade change..."
            />
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={cn(
                "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
                "border border-white/20 text-white",
                "hover:bg-white/10 transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "flex-1 px-4 py-3 rounded-xl text-sm font-semibold",
                "bg-teal-600 text-white",
                "hover:bg-teal-700 transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              {isSubmitting ? "Saving..." : "Save Grade"}
            </button>
          </div>

          {onRemoveOverride && currentGrade !== null && (
            <button
              type="button"
              onClick={onRemoveOverride}
              disabled={isSubmitting}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-2 text-sm",
                "text-gray-400 hover:text-white",
                "transition-colors duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            >
              <RotateCcw className="w-4 h-4" />
              Reset to auto-calculated grade
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
