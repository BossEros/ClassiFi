import * as React from "react"
import { cn } from "@/shared/utils/cn"
import { PlusCircle } from "lucide-react"
import type { FieldErrors } from "react-hook-form"
import { useZodForm } from "@/presentation/hooks/shared/useZodForm"
import { createSetGradeFormSchema, type SetGradeFormValues } from "@/presentation/schemas/gradebook/gradebookSchemas"
import { getFirstFormErrorMessage } from "@/presentation/utils/formErrorMap"
import { GradeModalShell } from "./GradeModalShell"

const MODAL_TITLE_ID = "set-grade-modal-title"

interface SetGradeModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (grade: number) => void
  variant?: "dark" | "light"
  isSubmitting?: boolean
  studentName: string
  assignmentName: string
  totalScore: number
}

/**
 * Modal for setting a grade on a submission that has not yet been graded.
 * Used when the submission has no existing grade (e.g., manual grading or no test cases).
 */
export function SetGradeModal({
  isOpen,
  onClose,
  onSubmit,
  variant = "dark",
  isSubmitting = false,
  studentName,
  assignmentName,
  totalScore,
}: SetGradeModalProps) {
  const isLight = variant === "light"
  const [error, setError] = React.useState<string | null>(null)

  const { register, handleSubmit, watch, reset } = useZodForm({
    schema: createSetGradeFormSchema(totalScore),
    defaultValues: { grade: "" },
    mode: "onSubmit",
  })

  const gradeField = register("grade")
  const grade = watch("grade")

  React.useEffect(() => {
    if (isOpen) {
      reset({ grade: "" })
      setError(null)
    }
  }, [isOpen, reset])

  const handleValidSubmit = (formValues: SetGradeFormValues) => {
    setError(null)
    onSubmit(Number.parseFloat(formValues.grade))
  }

  const handleInvalidSubmit = (validationErrors: FieldErrors<SetGradeFormValues>) => {
    const firstErrorMessage = getFirstFormErrorMessage(validationErrors)
    if (firstErrorMessage) {
      setError(firstErrorMessage)
    }
  }

  return (
    <GradeModalShell
      isOpen={isOpen}
      onClose={onClose}
      isSubmitting={isSubmitting}
      variant={variant}
      titleId={MODAL_TITLE_ID}
    >
      <div className="mb-5 flex justify-center">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full border",
            isLight ? "border-teal-200 bg-teal-50" : "border-teal-500/20 bg-teal-500/10",
          )}
        >
          <PlusCircle className={`h-6 w-6 ${isLight ? "text-teal-600" : "text-teal-400"}`} />
        </div>
      </div>

      <h2
        id={MODAL_TITLE_ID}
        className={`mb-1 text-center text-xl font-semibold ${isLight ? "text-slate-900" : "text-white"}`}
      >
        Set Grade
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
            <span>Grade</span>
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
                if (error) setError(null)
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
            {isSubmitting ? "Saving..." : "Set Grade"}
          </button>
        </div>
      </form>
    </GradeModalShell>
  )
}
