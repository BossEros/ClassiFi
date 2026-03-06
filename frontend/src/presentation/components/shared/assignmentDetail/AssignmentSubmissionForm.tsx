import type { ChangeEvent, RefObject } from "react"
import { CheckCircle, Eye, FileCode, Play, RefreshCw, Upload, UploadCloud } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import { formatFileSize } from "@/presentation/utils/formatUtils"
import type { ProgrammingLanguage } from "@/business/models/assignment/types"
import { cn } from "@/shared/utils/cn"

interface AssignmentSubmissionFormProps {
  isTeacher: boolean
  canResubmit: boolean
  hasSubmitted: boolean
  variant?: "dark" | "light"
  programmingLanguage: ProgrammingLanguage
  fileInputRef: RefObject<HTMLInputElement | null>
  selectedFile: File | null
  fileError: string | null
  isRunningPreview: boolean
  isSubmitting: boolean
  onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void
  onFilePreview: () => void
  onClearFile: () => void
  onRunPreviewTests: () => void
  onSubmit: () => void
}

function getAcceptedExtensions(programmingLanguage: ProgrammingLanguage): string {
  if (programmingLanguage === "python") {
    return ".py,.ipynb"
  }

  if (programmingLanguage === "java") {
    return ".java,.jar"
  }

  return ".c,.h"
}

function getAcceptedLabel(programmingLanguage: ProgrammingLanguage): string {
  if (programmingLanguage === "python") {
    return "Accepted: .py, .ipynb"
  }

  if (programmingLanguage === "java") {
    return "Accepted: .java, .jar"
  }

  return "Accepted: .c, .h"
}

export function AssignmentSubmissionForm({
  isTeacher,
  canResubmit,
  hasSubmitted,
  variant = "dark",
  programmingLanguage,
  fileInputRef,
  selectedFile,
  fileError,
  isRunningPreview,
  isSubmitting,
  onFileSelect,
  onFilePreview,
  onClearFile,
  onRunPreviewTests,
  onSubmit,
}: AssignmentSubmissionFormProps) {
  const isLight = variant === "light"

  if (isTeacher) {
    return null
  }

  if (!canResubmit) {
    return (
      <Card className={isLight ? "border-slate-200 bg-white shadow-sm" : "border-white/10 bg-white/5 backdrop-blur-sm"}>
        <CardContent className="py-8">
          <div className="text-center">
            <CheckCircle className={`mx-auto mb-4 h-12 w-12 ${isLight ? "text-emerald-600" : "text-green-400"}`} />
            <p className={`mb-1 font-medium ${isLight ? "text-slate-900" : "text-gray-300"}`}>Assignment Submitted</p>
            <p className={`text-sm ${isLight ? "text-slate-500" : "text-gray-500"}`}>
              Resubmission is not allowed for this assignment.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={isLight ? "border-slate-200 bg-white shadow-sm" : undefined}>
      <CardHeader>
        <CardTitle className={cn("flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}>
          <UploadCloud className={`h-5 w-5 ${isLight ? "text-teal-700" : "text-teal-400"}`} />
          {hasSubmitted ? "Resubmit Assignment" : "Submit Assignment"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="file-upload"
              className={cn(
                "group block w-full cursor-pointer rounded-xl border border-dashed p-8 transition-all",
                isLight
                  ? "border-2 border-teal-300 bg-gradient-to-br from-teal-50 via-white to-slate-50 shadow-sm hover:border-teal-500 hover:from-teal-100 hover:to-slate-100"
                  : "border-white/20 hover:border-teal-500/50 hover:bg-white/[0.02]",
              )}
            >
              <input
                id="file-upload"
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={onFileSelect}
                accept={getAcceptedExtensions(programmingLanguage)}
              />

              <div className="text-center">
                <div
                  className={cn(
                    "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110",
                    isLight ? "bg-teal-100 ring-4 ring-white" : "bg-white/5",
                  )}
                >
                  <Upload className={`h-7 w-7 ${isLight ? "text-teal-700" : "text-teal-400"}`} />
                </div>
                <p className={`mb-1 text-base font-semibold ${isLight ? "text-slate-900" : "text-gray-200"}`}>Click to select file</p>
                <p className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-gray-500"}`}>
                  {getAcceptedLabel(programmingLanguage)}
                </p>
                <p className={`mt-2 text-xs font-medium ${isLight ? "text-slate-500" : "text-gray-600"}`}>Maximum file size: 10MB</p>
              </div>
            </label>

            {fileError && <p className={`mt-2 text-sm ${isLight ? "text-rose-600" : "text-red-400"}`}>{fileError}</p>}

            {selectedFile && !fileError && (
              <div className={cn("mt-4 rounded-lg border p-4", isLight ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCode className={`h-5 w-5 ${isLight ? "text-teal-600" : "text-teal-400"}`} />
                    <div>
                      <p className={`font-medium ${isLight ? "text-slate-900" : "text-gray-300"}`}>{selectedFile.name}</p>
                      <p className={`text-sm ${isLight ? "text-slate-500" : "text-gray-500"}`}>{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={onFilePreview}
                      className={cn(
                        "h-8 w-auto px-3 text-xs",
                        isLight
                          ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <Eye className="mr-2 h-3.5 w-3.5" />
                      Preview
                    </Button>
                    <button
                      type="button"
                      onClick={onClearFile}
                      className={cn("p-1 transition-colors", isLight ? "text-slate-400 hover:text-slate-900" : "text-gray-400 hover:text-white")}
                    >
                      X
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedFile && !fileError && (
              <Button
                onClick={onRunPreviewTests}
                disabled={isRunningPreview || isSubmitting}
                className={cn(
                  "group mt-4 h-11 w-full transition-all duration-300",
                  isLight
                    ? "border border-slate-300 bg-white text-slate-900 shadow-sm hover:bg-slate-100"
                    : "bg-gradient-to-r from-gray-800 to-gray-900 border border-white/10 shadow-lg shadow-black/20 hover:from-black hover:to-gray-900",
                )}
              >
                {isRunningPreview ? (
                  <>
                    <RefreshCw className={`mr-2 h-4 w-4 animate-spin ${isLight ? "text-teal-600" : "text-teal-400"}`} />
                    <span className={isLight ? "text-slate-700" : "text-gray-300"}>Running Tests...</span>
                  </>
                ) : (
                  <>
                    <Play className={`mr-2 h-4 w-4 transition-transform group-hover:scale-110 ${isLight ? "text-teal-600" : "text-teal-400"}`} />
                    <span className={`font-medium ${isLight ? "text-slate-900" : "text-gray-200"}`}>Run Tests</span>
                  </>
                )}
              </Button>
            )}
          </div>

          <Button onClick={onSubmit} disabled={!selectedFile || isSubmitting || !!fileError} className="w-full">
            {isSubmitting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Submit Assignment
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
