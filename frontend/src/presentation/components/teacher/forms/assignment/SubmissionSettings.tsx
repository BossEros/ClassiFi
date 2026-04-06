import { RotateCcw } from "lucide-react"
import { useFormContext } from "react-hook-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/Card"
import { Input } from "@/presentation/components/ui/Input"
import { type AssignmentFormValues } from "@/presentation/schemas/assignment/assignmentSchemas"
import { getFieldErrorMessage } from "@/presentation/utils/formErrorMap"
import { assignmentFormTheme } from "@/presentation/constants/assignmentFormTheme"

interface SubmissionSettingsProps {
  isLoading: boolean
}

export function SubmissionSettings({ isLoading }: SubmissionSettingsProps) {
  const {
    watch,
    setValue,
    clearErrors,
    formState: { errors: formErrors },
  } = useFormContext<AssignmentFormValues>()
  const allowResubmission = watch("allowResubmission")
  const maxAttempts = watch("maxAttempts")
  const maxAttemptsError = getFieldErrorMessage(formErrors, "maxAttempts")

  const handleAllowResubmissionChange = (allowValue: boolean) => {
    setValue("allowResubmission", allowValue, {
      shouldDirty: true,
      shouldTouch: true,
    })
    clearErrors("allowResubmission")
  }

  const handleMaxAttemptsChange = (rawValue: string) => {
    setValue("maxAttempts", rawValue === "" ? null : parseInt(rawValue, 10), {
      shouldDirty: true,
      shouldTouch: true,
    })
    clearErrors("maxAttempts")
  }

  return (
    <Card className={assignmentFormTheme.sectionCard}>
      <CardHeader className={assignmentFormTheme.sectionHeader}>
        <div className="flex items-center gap-3">
          <RotateCcw className="h-5 w-5 text-teal-700" />
          <CardTitle className="text-slate-900">Submission Settings</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div>
            <p className="text-sm font-medium text-slate-700">
              Allow students to resubmit
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={allowResubmission}
              onChange={(event) =>
                handleAllowResubmissionChange(event.target.checked)
              }
              disabled={isLoading}
              className="sr-only peer"
            />
            <div className="h-6 w-11 rounded-full bg-slate-300 transition-colors peer-checked:bg-teal-600 peer-focus:ring-2 peer-focus:ring-teal-500/30 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:content-[''] peer-checked:after:translate-x-5" />
          </label>
        </div>

        {allowResubmission && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="maxAttempts"
                className="block pl-3 text-sm font-medium text-slate-700"
              >
                Max Attempts
              </label>

              <div className="w-28">
                <Input
                  id="maxAttempts"
                  type="number"
                  inputMode="numeric"
                  value={maxAttempts ?? ""}
                  onChange={(event) =>
                    handleMaxAttemptsChange(event.target.value)
                  }
                  disabled={isLoading}
                  placeholder="Unlimited"
                  className={`h-10 w-full rounded-lg border px-3 text-center text-slate-800 placeholder:text-slate-400 shadow-sm transition-all duration-200 hover:border-slate-400 focus:border-teal-500/60 focus:ring-teal-500/20 ${
                    maxAttemptsError
                      ? "border-rose-400 bg-rose-50/50"
                      : "border-slate-300 bg-white"
                  }`}
                  min={1}
                  max={99}
                />
              </div>
            </div>

            {maxAttemptsError && (
              <p className="text-xs text-rose-600">{maxAttemptsError}</p>
            )}

            <p className="pl-3 text-xs text-slate-500">
              Leave empty for unlimited attempts.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
