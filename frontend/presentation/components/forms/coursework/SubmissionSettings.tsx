import { RefreshCw, Check } from "lucide-react";
import { Input } from "@/presentation/components/ui/Input";
import {
  type CourseworkFormData,
  type FormErrors,
} from "@/presentation/hooks/useCourseworkForm";

interface SubmissionSettingsProps {
  formData: CourseworkFormData;
  errors: FormErrors;
  isLoading: boolean;
  onInputChange: (
    field: keyof CourseworkFormData,
    value: string | number | boolean | null
  ) => void;
}

export function SubmissionSettings({
  formData,
  errors,
  isLoading,
  onInputChange,
}: SubmissionSettingsProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <RefreshCw className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">
            Submission Settings
          </h2>
          <p className="text-sm text-gray-400">
            Configure resubmission options
          </p>
        </div>
      </div>
      <div className="space-y-5">
        {/* Allow Resubmission */}
        <div
          className="flex items-center gap-3 p-4 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          onClick={() =>
            onInputChange("allowResubmission", !formData.allowResubmission)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onInputChange("allowResubmission", !formData.allowResubmission);
            }
          }}
          role="checkbox"
          aria-checked={formData.allowResubmission}
          tabIndex={0}
        >
          <div
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
              formData.allowResubmission
                ? "bg-emerald-500 border-emerald-500"
                : "border-white/20 bg-white/5"
            }`}
            aria-hidden="true"
          >
            {formData.allowResubmission && (
              <Check className="w-3.5 h-3.5 text-white" />
            )}
          </div>
          <span className="text-sm text-gray-300 cursor-pointer select-none">
            Allow students to resubmit
          </span>
        </div>

        {/* Max Attempts - Only shown when resubmission is allowed */}
        {formData.allowResubmission && (
          <div className="space-y-2">
            <label
              htmlFor="maxAttempts"
              className="text-sm font-medium text-gray-300"
            >
              Max Attempts
            </label>
            <Input
              id="maxAttempts"
              type="number"
              placeholder="Leave empty for unlimited"
              value={formData.maxAttempts ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                onInputChange(
                  "maxAttempts",
                  value === "" ? null : parseInt(value, 10)
                );
              }}
              disabled={isLoading}
              className={`bg-black/20 border-white/10 text-white placeholder-gray-500 focus:ring-emerald-500/40 focus:border-transparent rounded-xl h-11 ${
                errors.maxAttempts ? "border-red-500/50" : "hover:bg-black/30"
              }`}
              min={1}
              max={99}
            />
            {errors.maxAttempts && (
              <p className="text-xs text-red-400">{errors.maxAttempts}</p>
            )}
            <p className="text-xs text-gray-500">
              Leave empty for unlimited attempts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
