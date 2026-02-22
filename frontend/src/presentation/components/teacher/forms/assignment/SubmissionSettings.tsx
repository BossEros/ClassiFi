import { RefreshCw } from "lucide-react"
import { useFormContext } from "react-hook-form"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/Card"
import { Input } from "@/presentation/components/ui/Input"
import {
  type AssignmentFormValues,
} from "@/presentation/schemas/assignment/assignmentSchemas"
import { getFieldErrorMessage } from "@/presentation/utils/formErrorMap"

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
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <RefreshCw className="w-5 h-5 text-emerald-300" />
          </div>
          <CardTitle>Submission Settings</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
          <div>
            <p className="text-sm font-medium text-gray-200">
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
            <div className="w-11 h-6 rounded-full bg-gray-700 peer-checked:bg-emerald-500 peer-focus:ring-2 peer-focus:ring-emerald-500/50 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow-lg after:transition-transform peer-checked:after:translate-x-5" />
          </label>
        </div>

        {allowResubmission && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="maxAttempts"
                className="block pl-3 text-sm font-medium text-white"
              >
                Max Attempts
              </label>

              <div className="w-28">
                <Input
                  id="maxAttempts"
                  type="number"
                  inputMode="numeric"
                  value={maxAttempts ?? ""}
                  onChange={(event) => handleMaxAttemptsChange(event.target.value)}
                  disabled={isLoading}
                  placeholder="Unlimited"
                  className={`h-10 w-full bg-[#1A2130] border-white/10 px-3 text-center text-white placeholder-gray-500 rounded-lg transition-all duration-200 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50 ${
                    maxAttemptsError ? "border-red-500/50" : ""
                  }`}
                  min={1}
                  max={99}
                />
              </div>
            </div>

            {maxAttemptsError && (
              <p className="text-xs text-red-400">{maxAttemptsError}</p>
            )}

            <p className="pl-3 text-xs text-gray-500">
              Leave empty for unlimited attempts.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
