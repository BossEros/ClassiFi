import type { ChangeEvent, RefObject } from "react"
import { CheckCircle, Eye, FileCode, Play, RefreshCw, Upload } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import { formatFileSize } from "@/presentation/utils/formatUtils"
import type { ProgrammingLanguage } from "@/business/models/assignment/types"

interface AssignmentSubmissionFormProps {
  isTeacher: boolean
  canResubmit: boolean
  hasSubmitted: boolean
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
  if (isTeacher) {
    return null
  }

  if (!canResubmit) {
    return (
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardContent className="py-8">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <p className="text-gray-300 font-medium mb-1">Assignment Submitted</p>
            <p className="text-sm text-gray-500">
              Resubmission is not allowed for this assignment.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{hasSubmitted ? "Resubmit Assignment" : "Submit Assignment"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="file-upload"
              className="block w-full p-8 border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-teal-500/50 hover:bg-white/[0.02] transition-all group"
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
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-6 h-6 text-teal-400" />
                </div>
                <p className="text-gray-200 font-medium mb-1">Click to select file</p>
                <p className="text-sm text-gray-500">{getAcceptedLabel(programmingLanguage)}</p>
                <p className="text-xs text-gray-600 mt-2">Maximum file size: 10MB</p>
              </div>
            </label>

            {fileError && <p className="mt-2 text-sm text-red-400">{fileError}</p>}

            {selectedFile && !fileError && (
              <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileCode className="w-5 h-5 text-teal-400" />
                    <div>
                      <p className="text-gray-300 font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={onFilePreview}
                      className="h-8 w-auto px-3 text-xs bg-white/5 border-white/10 hover:bg-white/10 text-gray-300 hover:text-white"
                    >
                      <Eye className="w-3.5 h-3.5 mr-2" />
                      Preview
                    </Button>
                    <button
                      onClick={onClearFile}
                      className="text-gray-400 hover:text-white transition-colors p-1"
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
                className="w-full mt-4 h-11 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-black hover:to-gray-900 border border-white/10 shadow-lg shadow-black/20 transition-all duration-300 group"
              >
                {isRunningPreview ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin text-teal-400" />
                    <span className="text-gray-300">Running Tests...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2 text-teal-400 group-hover:scale-110 transition-transform" />
                    <span className="text-gray-200 font-medium">Run Tests</span>
                  </>
                )}
              </Button>
            )}
          </div>

          <Button
            onClick={onSubmit}
            disabled={!selectedFile || isSubmitting || !!fileError}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Submit Assignment
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
