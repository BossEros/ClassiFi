import {
  FileCode,
  FileUp,
  Calendar,
  Code,
  Image as ImageIcon,
  ChevronDown,
  Upload,
  Trash2,
  LoaderCircle,
} from "lucide-react"
import Editor from "@monaco-editor/react"
import { Input } from "@/presentation/components/ui/Input"
import { Textarea } from "@/presentation/components/ui/Textarea"
import { Select } from "@/presentation/components/ui/Select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/Card"
import { DatePicker } from "@/presentation/components/ui/DatePicker"
import { TimePicker } from "@/presentation/components/ui/TimePicker"
import {
  programmingLanguageOptions,
  type CourseworkFormData,
  type FormErrors,
} from "@/presentation/hooks/useCourseworkForm"
import { formatTimeRemaining } from "@/shared/utils/dateUtils"
import { getMonacoLanguage } from "@/shared/utils/monacoUtils"
import {
  TestCaseList,
  type PendingTestCase,
} from "@/presentation/components/forms/TestCaseList"
import type {
  TestCase,
  CreateTestCaseRequest,
  UpdateTestCaseRequest,
} from "@/shared/types/testCase"

interface BasicInfoFormProps {
  formData: CourseworkFormData
  errors: FormErrors
  isLoading: boolean
  isUploadingDescriptionImage: boolean
  showTemplateCode: boolean
  setShowTemplateCode: (show: boolean) => void
  onDescriptionImageUpload: (file: File) => Promise<void>
  onDescriptionImageRemove: () => Promise<void>
  onInputChange: (
    field: keyof CourseworkFormData,
    value: string | number | boolean | null,
  ) => void

  // Test Case Props
  testCases: TestCase[]
  pendingTestCases: PendingTestCase[]
  isLoadingTestCases: boolean
  isEditMode: boolean
  assignmentId?: string
  onAddTestCase: (data: CreateTestCaseRequest) => Promise<void>
  onAddPendingTestCase: (data: PendingTestCase) => void
  onUpdateTestCase: (id: number, data: UpdateTestCaseRequest) => Promise<void>
  onUpdatePendingTestCase: (tempId: string, data: PendingTestCase) => void
  onDeleteTestCase: (id: number) => Promise<void>
  onDeletePendingTestCase: (tempId: string) => void
}

function mapTemplateFileNameToProgrammingLanguage(
  fileName: string,
): CourseworkFormData["programmingLanguage"] {
  const lowerCaseFileName = fileName.toLowerCase()

  if (lowerCaseFileName.endsWith(".py")) {
    return "python"
  }

  if (lowerCaseFileName.endsWith(".java")) {
    return "java"
  }

  if (lowerCaseFileName.endsWith(".c")) {
    return "c"
  }

  return ""
}

function mapMonacoLanguageToTemplatePath(monacoLanguage: string): string {
  if (monacoLanguage === "python") {
    return "template-code.py"
  }

  if (monacoLanguage === "java") {
    return "template-code.java"
  }

  if (monacoLanguage === "c") {
    return "template-code.c"
  }

  return "template-code.txt"
}

export function BasicInfoForm({
  formData,
  errors,
  isLoading,
  isUploadingDescriptionImage,
  showTemplateCode,
  setShowTemplateCode,
  onDescriptionImageUpload,
  onDescriptionImageRemove,
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
  // Parse deadline once to avoid errors and double-parsing
  const deadlineDate = formData.deadline ? new Date(formData.deadline) : null
  const isValidDeadline = deadlineDate && !Number.isNaN(deadlineDate.getTime())

  // Parse assignmentId once
  const parsedId = assignmentId ? parseInt(assignmentId, 10) : Number.NaN
  const validAssignmentId = !Number.isNaN(parsedId) ? parsedId : undefined
  const isDescriptionImageBusy = isLoading || isUploadingDescriptionImage
  const templateCodeMonacoLanguage = getMonacoLanguage(
    formData.programmingLanguage || "",
  )
  const templateCodeEditorPath =
    mapMonacoLanguageToTemplatePath(templateCodeMonacoLanguage)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <FileCode className="w-5 h-5 text-blue-300" />
          </div>
          <CardTitle>Basic Information</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-6">
          {/* Coursework Title */}
          <div className="space-y-2">
            <label
              htmlFor="assignmentName"
              className="block text-sm font-medium text-gray-200"
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
              className={`h-11 bg-[#1A2130] border-white/10 text-white placeholder:text-gray-500 rounded-xl transition-all duration-200 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50 ${
                errors.assignmentName ? "border-red-500/50" : ""
              }`}
              maxLength={150}
            />
            {errors.assignmentName && (
              <p className="text-xs text-red-400">{errors.assignmentName}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-200"
            >
              Description
            </label>

            <div
              className={`overflow-hidden rounded-xl border bg-[#1A2130] transition-all duration-200 hover:bg-[#1A2130] hover:border-white/20 focus-within:bg-[#1A2130] focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500/50 ${
                errors.description ? "border-red-500/50" : "border-white/10"
              }`}
            >
              <Textarea
                id="description"
                placeholder="Write clear instructions for your students…"
                value={formData.description}
                onChange={(e) => onInputChange("description", e.target.value)}
                disabled={isLoading}
                className="min-h-[140px] w-full resize-y rounded-none border-0 bg-transparent px-4 py-3 text-sm leading-relaxed text-white placeholder:text-gray-500 shadow-none ring-0 transition-none hover:bg-transparent focus:border-0 focus:bg-transparent focus:ring-0 focus:outline-none"
                rows={6}
              />

              {/* Attached Image Preview */}
              {formData.descriptionImageUrl && (
                <div className="mx-3 mb-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    <ImageIcon className="h-3 w-3" />
                    Attachment
                  </div>

                  <div className="rounded-lg overflow-hidden border border-white/10 bg-black/20">
                    <img
                      src={formData.descriptionImageUrl}
                      alt={
                        formData.descriptionImageAlt || "Coursework description"
                      }
                      className="w-full max-h-64 object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Bottom Toolbar */}
              <div className="flex items-center justify-between border-t border-white/[0.06] px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <label
                    htmlFor="description-image-upload"
                    className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-all duration-200 ${
                      isDescriptionImageBusy
                        ? "text-slate-600 cursor-not-allowed"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] cursor-pointer"
                    }`}
                  >
                    {isUploadingDescriptionImage ? (
                      <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {isUploadingDescriptionImage
                      ? "Uploading…"
                      : formData.descriptionImageUrl
                        ? "Replace image"
                        : "Attach image"}
                  </label>

                  <input
                    id="description-image-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    disabled={isDescriptionImageBusy}
                    className="hidden"
                    onChange={(event) => {
                      const selectedImageFile = event.target.files?.[0]

                      if (selectedImageFile) {
                        void onDescriptionImageUpload(selectedImageFile)
                      }

                      event.currentTarget.value = ""
                    }}
                  />

                  {formData.descriptionImageUrl && (
                    <>
                      <div className="h-3.5 w-px bg-white/[0.08]" />

                      <button
                        type="button"
                        onClick={() => void onDescriptionImageRemove()}
                        disabled={isDescriptionImageBusy}
                        className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-red-400/80 hover:text-red-300 hover:bg-red-500/[0.08] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {errors.description && (
              <p className="text-xs text-red-400">{errors.description}</p>
            )}
          </div>

          {/* Programming Language & Total Score */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Programming Language */}
            <div className="space-y-2">
              <label
                htmlFor="programmingLanguage"
                className="block text-sm font-medium text-gray-200"
              >
                Programming Language <span className="text-red-400">*</span>
              </label>
              <Select
                id="programmingLanguage"
                options={programmingLanguageOptions}
                value={formData.programmingLanguage}
                onChange={(value) =>
                  onInputChange("programmingLanguage", value)
                }
                disabled={isLoading}
                className={`h-11 py-0 bg-[#1A2130] border-white/10 rounded-xl transition-all duration-200 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50 ${
                  formData.programmingLanguage ? "text-white" : "text-gray-500"
                } ${
                  errors.programmingLanguage
                    ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20"
                    : ""
                }`}
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
                className="block text-sm font-medium text-gray-200"
              >
                Total Score <span className="text-red-400">*</span>
              </label>
              <div className="relative group">
                <Input
                  id="totalScore"
                  type="number"
                  value={formData.totalScore ?? ""}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === "") {
                      onInputChange("totalScore", null)
                      return
                    }
                    const parsed = parseInt(val, 10)
                    if (!Number.isNaN(parsed)) {
                      onInputChange("totalScore", parsed)
                    }
                  }}
                  placeholder="Enter total score"
                  min="1"
                  disabled={isLoading}
                  className={`h-11 w-full pr-16 bg-[#1A2130] border-white/10 text-white placeholder:text-gray-500 rounded-xl transition-all duration-200 hover:bg-[#1A2130] hover:border-white/20 focus:bg-[#1A2130] focus:ring-blue-500/20 focus:border-blue-500/50 ${
                    errors.totalScore ? "border-red-500/50" : ""
                  }`}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium pointer-events-none group-focus-within:text-blue-400 transition-colors">
                  Points
                </div>
              </div>
              {errors.totalScore && (
                <p className="text-xs text-red-400">{errors.totalScore}</p>
              )}
            </div>
          </div>

          {/* Deadline - Full Width Section */}
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePicker
                label="Deadline Date"
                labelClassName="text-gray-200"
                value={formData.deadline}
                triggerStyle={{ backgroundColor: "#1A2130" }}
                onChange={(dateIso) => {
                  const time = formData.deadline.split("T")[1]?.slice(0, 5) || ""
                  const date = dateIso ? dateIso.split("T")[0] : ""
                  if (date) {
                    onInputChange("deadline", time ? `${date}T${time}` : date)
                  } else {
                    onInputChange("deadline", "")
                  }
                }}
                error={errors.deadline}
                minDate={new Date()}
                disabled={isLoading}
              />
              <TimePicker
                label="Deadline Time"
                labelClassName="text-gray-200"
                value={formData.deadline.split("T")[1]?.slice(0, 5) || ""}
                triggerStyle={{ backgroundColor: "#1A2130" }}
                onChange={(timeVal) => {
                  const date = formData.deadline.split("T")[0]
                  if (!date) {
                    return
                  }

                  if (timeVal) {
                    onInputChange("deadline", `${date}T${timeVal}`)
                  } else {
                    onInputChange("deadline", date)
                  }
                }}
                disabled={isLoading}
              />
            </div>

            {/* Quick Preset Buttons */}
          </div>

          {/* Deadline Preview */}
          {isValidDeadline && deadlineDate && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-400 font-medium uppercase tracking-wider mb-1">
                    Selected Deadline
                  </p>
                  <p className="text-sm text-white font-medium">
                    {deadlineDate.toLocaleString("en-US", {
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
                    {formatTimeRemaining(deadlineDate)}
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
                      formData.scheduledDate
                        ? "text-purple-400"
                        : "text-gray-400"
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
                    onInputChange("scheduledDate", null)
                  } else {
                    const now = new Date()
                    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
                    const todayDateOnly = now.toISOString().split("T")[0]
                    onInputChange(
                      "scheduledDate",
                      todayDateOnly,
                    )
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
                    labelClassName="text-gray-200"
                    required
                    value={formData.scheduledDate}
                    onChange={(dateIso) => {
                      const time =
                        formData.scheduledDate?.split("T")[1]?.slice(0, 5) ||
                        ""
                      const date = dateIso ? dateIso.split("T")[0] : ""
                      if (date) {
                        onInputChange(
                          "scheduledDate",
                          time ? `${date}T${time}` : date,
                        )
                      } else {
                        onInputChange("scheduledDate", null)
                      }
                    }}
                    minDate={new Date()}
                    disabled={isLoading}
                  />
                  <TimePicker
                    label="Release Time"
                    labelClassName="text-gray-200"
                    required
                    value={
                      formData.scheduledDate.split("T")[1]?.slice(0, 5) ||
                      ""
                    }
                    onChange={(timeVal) => {
                      const date = formData.scheduledDate?.split("T")[0]

                      if (!date) {
                        return
                      }

                      if (timeVal) {
                        onInputChange("scheduledDate", `${date}T${timeVal}`)
                      } else {
                        onInputChange("scheduledDate", date)
                      }
                    }}
                    error={errors.scheduledDate}
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

        {/* Template Code */}
        <div className="space-y-2 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setShowTemplateCode(!showTemplateCode)}
            className="flex items-center gap-2 text-sm font-medium text-gray-200 hover:text-white transition-colors"
          >
            <Code className="w-4 h-4" />
            Template Code
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                showTemplateCode ? "rotate-180" : ""
              }`}
            />
          </button>

          {showTemplateCode && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-xs text-gray-300">
                Provide starter/template code that will be excluded from
                similarity analysis. Students won't be flagged for using this
                code.
              </p>

              <div className="rounded-xl overflow-hidden border border-white/10">
                <Editor
                  key={templateCodeMonacoLanguage}
                  height="300px"
                  theme="vs-dark"
                  language={templateCodeMonacoLanguage}
                  path={templateCodeEditorPath}
                  value={formData.templateCode}
                  onChange={(value) =>
                    onInputChange("templateCode", value || "")
                  }
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

                {/* Template Code Toolbar */}
                <div className="flex items-center justify-between border-t border-white/[0.06] bg-black/20 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <label
                      htmlFor="template-code-upload"
                      className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] cursor-pointer transition-all duration-200"
                    >
                      <FileUp className="w-3.5 h-3.5" />
                      Upload file
                    </label>

                    <input
                      id="template-code-upload"
                      type="file"
                      accept=".py,.java,.cpp,.c,.cs,.js,.ts,.jsx,.tsx,.rb,.go,.rs,.php,.swift,.kt,.scala,.r,.m,.h,.hpp,.txt"
                      className="hidden"
                      onChange={(event) => {
                        const selectedFile = event.target.files?.[0]

                        if (selectedFile) {
                          const detectedTemplateProgrammingLanguage =
                            mapTemplateFileNameToProgrammingLanguage(
                              selectedFile.name,
                            )

                          if (
                            detectedTemplateProgrammingLanguage &&
                            detectedTemplateProgrammingLanguage !==
                              formData.programmingLanguage
                          ) {
                            onInputChange(
                              "programmingLanguage",
                              detectedTemplateProgrammingLanguage,
                            )
                          }

                          const reader = new FileReader()

                          reader.onload = (e) => {
                            const content = e.target?.result

                            if (typeof content === "string") {
                              onInputChange("templateCode", content)
                            }
                          }

                          reader.readAsText(selectedFile)
                        }

                        event.currentTarget.value = ""
                      }}
                    />

                    {formData.templateCode && (
                      <>
                        <div className="h-3.5 w-px bg-white/[0.08]" />

                        <button
                          type="button"
                          onClick={() => onInputChange("templateCode", "")}
                          className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-red-400/80 hover:text-red-300 hover:bg-red-500/[0.08] transition-all duration-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Clear
                        </button>
                      </>
                    )}
                  </div>

                  {formData.templateCode && (
                    <span className="text-[11px] tabular-nums text-slate-500">
                      {formData.templateCode.split("\n").length} lines ·{" "}
                      {formData.templateCode.length} chars
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test Cases Section */}
        <TestCaseList
          testCases={testCases}
          pendingTestCases={pendingTestCases}
          isLoading={isLoadingTestCases}
          isEditMode={isEditMode}
          assignmentId={validAssignmentId}
          onAdd={onAddTestCase}
          onAddPending={onAddPendingTestCase}
          onUpdate={onUpdateTestCase}
          onUpdatePending={onUpdatePendingTestCase}
          onDelete={onDeleteTestCase}
          onDeletePending={onDeletePendingTestCase}
        />
      </CardContent>
    </Card>
  )
}
