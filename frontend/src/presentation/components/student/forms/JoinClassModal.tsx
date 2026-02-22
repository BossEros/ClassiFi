import { useState, useEffect } from "react"
import { X, Check, RefreshCw, Users } from "lucide-react"
import { Input } from "@/presentation/components/ui/Input"
import { Button } from "@/presentation/components/ui/Button"
import { joinClass } from "@/business/services/studentDashboardService"
import type { FieldErrors } from "react-hook-form"
import { useZodForm } from "@/presentation/hooks/shared/useZodForm"
import { getFirstFormErrorMessage } from "@/presentation/utils/formErrorMap"
import {
  joinClassFormSchema,
  type JoinClassFormValues,
} from "@/presentation/schemas/class/classSchemas"
import type { Class } from "@/business/models/dashboard/types"

interface JoinClassModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (classInfo: Class) => void
  studentId: number
}

export function JoinClassModal({
  isOpen,
  onClose,
  onSuccess,
  studentId,
}: JoinClassModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, watch, setValue, reset } = useZodForm({
    schema: joinClassFormSchema,
    defaultValues: {
      classCode: "",
    },
    mode: "onSubmit",
  })

  const classCodeValue = watch("classCode")
  const classCodeField = register("classCode")

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      reset({ classCode: "" })
      setError(null)
    }
  }, [isOpen, reset])

  const handleClassCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert to uppercase and remove spaces
    const value = e.target.value.toUpperCase().replace(/\s/g, "")
    setValue("classCode", value, {
      shouldDirty: true,
      shouldTouch: true,
    })
    if (error) setError(null)
  }

  const handleJoinClassSubmit = async (formValues: JoinClassFormValues) => {
    setError(null)

    const trimmedCode = formValues.classCode.trim()

    setIsSubmitting(true)
    try {
      const response = await joinClass(studentId, trimmedCode)

      if (!response.success) {
        setError(response.message)
        return
      }

      if (response.classInfo) {
        // Cast is safe: API returns ISO date strings compatible with ISODateString
        onSuccess(response.classInfo as Class)
      }
      onClose()
    } catch {
      setError("Failed to join class. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleJoinClassInvalid = (
    validationErrors: FieldErrors<JoinClassFormValues>,
  ) => {
    const trimmedCode = classCodeValue.trim()
    void trimmedCode // satisfy unused var while keeping it trimmed before call per instruction

    const firstErrorMessage = getFirstFormErrorMessage(validationErrors)

    if (firstErrorMessage) {
      setError(firstErrorMessage)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[448px] min-w-[320px] flex-shrink-0 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/20">
              <Users className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Join Class</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                Enter the code provided by your teacher
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(handleJoinClassSubmit, handleJoinClassInvalid)}
          className="space-y-6 w-full"
        >
          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Class Code Input */}
          <div className="space-y-3 w-full">
            <label
              htmlFor="classCode"
              className="block text-sm font-medium text-white"
            >
              Class Code
            </label>
            <Input
              id="classCode"
              type="text"
              placeholder="Enter class code (e.g., ABC123)"
              {...classCodeField}
              value={classCodeValue}
              onChange={handleClassCodeChange}
              disabled={isSubmitting}
              maxLength={8}
              className={`text-center text-lg font-mono tracking-widest uppercase ${error ? "border-red-500/50" : ""}`}
              autoFocus
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Ask your teacher for the class code. It's usually 6-8 characters.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !classCodeValue.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Join Class
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
