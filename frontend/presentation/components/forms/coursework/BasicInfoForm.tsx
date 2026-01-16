import { FileCode, Calendar, Code, ChevronDown, Trophy } from "lucide-react";
import Editor from "@monaco-editor/react";
import { Input } from "@/presentation/components/ui/Input";
import { Textarea } from "@/presentation/components/ui/Textarea";
import { Select } from "@/presentation/components/ui/Select";
import { DatePicker } from "@/presentation/components/ui/DatePicker";
import { TimePicker } from "@/presentation/components/ui/TimePicker";
import {
  programmingLanguageOptions,
  type CourseworkFormData,
  type FormErrors,
} from "@/presentation/hooks/useCourseworkForm";
import { formatTimeRemaining } from "@/shared/utils/dateUtils";
import {
  TestCaseList,
  type PendingTestCase,
} from "@/presentation/components/forms/TestCaseList";
import type {
  TestCase,
  CreateTestCaseRequest,
  UpdateTestCaseRequest,
} from "@/shared/types/testCase";

interface BasicInfoFormProps {
  formData: CourseworkFormData;
  errors: FormErrors;
  isLoading: boolean;
  showTemplateCode: boolean;
  setShowTemplateCode: (show: boolean) => void;
  onInputChange: (
    field: keyof CourseworkFormData,
    value: string | number | boolean | null
  ) => void;

  // Test Case Props
  testCases: TestCase[];
  pendingTestCases: PendingTestCase[];
  isLoadingTestCases: boolean;
  isEditMode: boolean;
  assignmentId?: string;
  onAddTestCase: (data: CreateTestCaseRequest) => Promise<void>;
  onAddPendingTestCase: (data: PendingTestCase) => void;
  onUpdateTestCase: (id: number, data: UpdateTestCaseRequest) => Promise<void>;
  onUpdatePendingTestCase: (tempId: string, data: PendingTestCase) => void;
  onDeleteTestCase: (id: number) => Promise<void>;
  onDeletePendingTestCase: (tempId: string) => void;
}

export function BasicInfoForm({
  formData,
  errors,
  isLoading,
  showTemplateCode,
  setShowTemplateCode,
  onInputChange,
  // Test Case props pass-through
  testCases,
  pendingTestCases,
  isLoadingTestCases,
  isEditMode,
  assignmentId,
  onAddTestCase,
  onAddPendingTestCase,
  onUpdateTestCase,
  onUpdatePendingTestCase,
  onDeleteTestCase,
  onDeletePendingTestCase,
}: BasicInfoFormProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <FileCode className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">
            Basic Information
          </h2>
          <p className="text-sm text-gray-400">
            Enter the coursework details below
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Coursework Title */}
        <div className="space-y-2">
          <label
            htmlFor="assignmentName"
            className="text-sm font-medium text-gray-300"
          >
            Coursework Title <span className="text-red-400">*</span>
          </label>
          <Input
            id="assignmentName"
            type="text"
            placeholder="e.g., Fibonacci Sequence Implementation"
            value={formData.assignmentName}
            onChange={(e) => onInputChange("assignmentName", e.target.value)}
            disabled={isLoading}
            className={`bg-black/20 border-white/10 text-white placeholder-gray-500 focus:ring-blue-500/40 focus:border-transparent rounded-xl h-11 transition-all ${
              errors.assignmentName ? "border-red-500/50" : "hover:bg-black/30"
            }`}
            maxLength={150}
          />
          {errors.assignmentName && (
            <p className="text-xs text-red-400">{errors.assignmentName}</p>
          )}
          <p className="text-xs text-gray-500">
            {formData.assignmentName.length}/150 characters
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label
            htmlFor="description"
            className="text-sm font-medium text-gray-300"
          >
            Description <span className="text-red-400">*</span>
          </label>
          <Textarea
            id="description"
            placeholder="Provide detailed instructions for your students..."
            value={formData.description}
            onChange={(e) => onInputChange("description", e.target.value)}
            disabled={isLoading}
            className={`bg-black/20 border-white/10 text-white placeholder-gray-500 focus:ring-blue-500/40 focus:border-transparent rounded-xl transition-all resize-y min-h-[120px] ${
              errors.description ? "border-red-500/50" : "hover:bg-black/30"
            }`}
            rows={5}
          />
          {errors.description && (
            <p className="text-xs text-red-400">{errors.description}</p>
          )}
          <p className="text-xs text-gray-500">Minimum 10 characters</p>
        </div>

        {/* Programming Language & Total Score */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Programming Language */}
          <div className="space-y-2">
            <label
              htmlFor="programmingLanguage"
              className="text-sm font-medium text-gray-300 flex items-center gap-2"
            >
              <Code className="w-4 h-4 text-blue-400" />
              Programming Language <span className="text-red-400">*</span>
            </label>
            <Select
              id="programmingLanguage"
              options={programmingLanguageOptions}
              value={formData.programmingLanguage}
              onChange={(value) => onInputChange("programmingLanguage", value)}
              disabled={isLoading}
              className={errors.programmingLanguage ? "border-red-500/50" : ""}
              placeholder="Select language"
            />
            {errors.programmingLanguage && (
              <p className="text-xs text-red-400">
                {errors.programmingLanguage}
              </p>
            )}
          </div>

          {/* Total Score */}
          <div className="space-y-2">
            <label
              htmlFor="totalScore"
              className="text-sm font-medium text-gray-300 flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-yellow-500" />
              Total Score <span className="text-red-400">*</span>
            </label>
            <div className="relative group">
              <Input
                id="totalScore"
                type="number"
                value={formData.totalScore}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    onInputChange("totalScore", ""); // Allow clearing the input (will need casting in parent if strictly number)
                    return;
                  }
                  const parsed = parseInt(val, 10);
                  if (!Number.isNaN(parsed)) {
                    onInputChange("totalScore", parsed);
                  }
                }}
                placeholder="100"
                min="1"
                disabled={isLoading}
                className="h-11 bg-black/20 border-white/10 text-white focus:ring-yellow-500/40 focus:border-yellow-500/40 rounded-xl hover:bg-black/30 w-full pr-16 transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium pointer-events-none group-focus-within:text-yellow-500/80 transition-colors">
                Points
              </div>
            </div>
          </div>
        </div>

        {/* Deadline - Full Width Section */}
        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DatePicker
              label="Deadline Date"
              value={formData.deadline}
              onChange={(dateIso) => {
                const time =
                  formData.deadline.split("T")[1]?.slice(0, 5) || "23:59";
                const date = dateIso ? dateIso.split("T")[0] : "";
                if (date) {
                  onInputChange("deadline", `${date}T${time}`);
                }
              }}
              error={errors.deadline}
              minDate={new Date()}
              disabled={isLoading}
            />
            <TimePicker
              label="Deadline Time"
              value={formData.deadline.split("T")[1]?.slice(0, 5) || "23:59"}
              onChange={(timeVal) => {
                const date = formData.deadline.split("T")[0];
                if (date && timeVal) {
                  onInputChange("deadline", `${date}T${timeVal}`);
                }
              }}
              disabled={isLoading}
            />
          </div>

          {/* Quick Preset Buttons */}
        </div>

        {/* Deadline Preview */}
        {formData.deadline && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-400 font-medium uppercase tracking-wider mb-1">
                  Selected Deadline
                </p>
                <p className="text-sm text-white font-medium">
                  {new Date(formData.deadline).toLocaleString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-orange-400 font-medium uppercase tracking-wider mb-1">
                  Time remaining
                </p>
                <p className="text-sm font-medium text-white font-mono">
                  {formatTimeRemaining(formData.deadline)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Scheduled Release */}
        <div className="space-y-4 pt-6 border-t border-white/10">
          <div
            className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
              formData.scheduledDate
                ? "bg-purple-500/10 border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                : "bg-white/5 border-white/10 hover:border-white/20"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-xl transition-colors ${
                  formData.scheduledDate ? "bg-purple-500/20" : "bg-white/5"
                }`}
              >
                <Calendar
                  className={`w-5 h-5 ${
                    formData.scheduledDate ? "text-purple-400" : "text-gray-400"
                  }`}
                />
              </div>
              <div className="space-y-1">
                <h3
                  className={`text-sm font-semibold transition-colors ${
                    formData.scheduledDate ? "text-white" : "text-gray-300"
                  }`}
                >
                  Scheduled Release
                </h3>
                <p className="text-xs text-gray-400">
                  Automatically publish this coursework at a future date and
                  time
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={!!formData.scheduledDate}
              onClick={() => {
                if (formData.scheduledDate) {
                  onInputChange("scheduledDate", null);
                } else {
                  const now = new Date();
                  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                  onInputChange(
                    "scheduledDate",
                    now.toISOString().slice(0, 16)
                  );
                }
              }}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                formData.scheduledDate ? "bg-purple-600" : "bg-white/10"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
                  formData.scheduledDate ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {formData.scheduledDate && (
            <div className="animate-in slide-in-from-top-2 fade-in duration-300 pl-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  label="Release Date"
                  value={formData.scheduledDate}
                  onChange={(dateIso) => {
                    const time =
                      formData.scheduledDate?.split("T")[1]?.slice(0, 5) ||
                      "00:00";
                    const date = dateIso ? dateIso.split("T")[0] : "";
                    if (date) {
                      onInputChange("scheduledDate", `${date}T${time}`);
                    } else {
                      onInputChange("scheduledDate", null);
                    }
                  }}
                  minDate={new Date()}
                  disabled={isLoading}
                />
                <TimePicker
                  label="Release Time"
                  value={
                    formData.scheduledDate.split("T")[1]?.slice(0, 5) || "00:00"
                  }
                  onChange={(timeVal) => {
                    const date = formData.scheduledDate?.split("T")[0];
                    if (date && timeVal) {
                      onInputChange("scheduledDate", `${date}T${timeVal}`);
                    }
                  }}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
        </div>

        {errors.deadline && (
          <p className="text-xs text-red-400">{errors.deadline}</p>
        )}
      </div>

      {/* Template Code (Optional) */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={() => setShowTemplateCode(!showTemplateCode)}
          className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
        >
          <Code className="w-4 h-4" />
          Template Code (Optional)
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              showTemplateCode ? "rotate-180" : ""
            }`}
          />
        </button>

        {showTemplateCode && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <p className="text-xs text-gray-500">
              Provide starter/template code that will be excluded from
              similarity analysis. Students won't be flagged for using this
              code.
            </p>
            <div className="rounded-xl overflow-hidden border border-white/10">
              <Editor
                height="300px"
                theme="vs-dark"
                language={formData.programmingLanguage || "plaintext"}
                value={formData.templateCode}
                onChange={(value) => onInputChange("templateCode", value || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 16, bottom: 16 },
                  fontFamily:
                    "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            </div>
            {formData.templateCode && (
              <div className="flex justify-end px-2">
                <p className="text-xs text-gray-500">
                  {formData.templateCode.split("\n").length} lines •{" "}
                  {formData.templateCode.length} characters
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Test Cases Section */}
      <TestCaseList
        testCases={testCases}
        pendingTestCases={pendingTestCases}
        isLoading={isLoadingTestCases}
        isEditMode={isEditMode}
        assignmentId={
          assignmentId && !Number.isNaN(parseInt(assignmentId as string, 10))
            ? parseInt(assignmentId as string, 10)
            : undefined
        }
        onAdd={onAddTestCase}
        onAddPending={onAddPendingTestCase}
        onUpdate={onUpdateTestCase}
        onUpdatePending={onUpdatePendingTestCase}
        onDelete={onDeleteTestCase}
        onDeletePending={onDeletePendingTestCase}
      />
    </div>
  );
}
