import { useState } from "react"
import {
  getSubmissionContent,
  getSubmissionDownloadUrl,
} from "@/business/services/assignmentService"
import type { Submission } from "@/business/models/assignment/types"
import type { ToastVariant } from "@/presentation/components/ui/Toast"

interface UseAssignmentCodePreviewOptions {
  showToast: (message: string, variant?: ToastVariant) => void
}

interface UseAssignmentCodePreviewResult {
  showPreview: boolean
  previewContent: string
  previewLanguage: string
  previewFileName: string
  isPreviewLoading: boolean
  openFilePreview: (
    file: File | null,
    programmingLanguage?: string,
  ) => Promise<void>
  openSubmissionPreview: (
    submissionId: number,
    submissions: Submission[],
  ) => Promise<void>
  downloadSubmissionFile: (submissionId: number) => Promise<void>
  clearPreviewFileName: () => void
  closePreview: () => void
}

/**
 * Handles assignment code preview and submission file download actions.
 *
 * @param options - Toast notifier dependency.
 * @returns Preview modal state and preview/download handlers.
 */
export function useAssignmentCodePreview({
  showToast,
}: UseAssignmentCodePreviewOptions): UseAssignmentCodePreviewResult {
  const [showPreview, setShowPreview] = useState(false)
  const [previewContent, setPreviewContent] = useState("")
  const [previewLanguage, setPreviewLanguage] = useState("")
  const [previewFileName, setPreviewFileName] = useState("")
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  const openFilePreview = async (
    file: File | null,
    programmingLanguage?: string,
  ) => {
    if (!file) {
      return
    }

    try {
      const fileContent = await file.text()
      setPreviewContent(fileContent)
      setPreviewLanguage(programmingLanguage || "plaintext")
      setPreviewFileName(file.name)
      setShowPreview(true)
    } catch (previewError) {
      console.error("Failed to read file:", previewError)
      showToast("Failed to read file content", "error")
    }
  }

  const openSubmissionPreview = async (
    submissionId: number,
    submissions: Submission[],
  ) => {
    try {
      setIsPreviewLoading(true)

      const selectedSubmission = submissions.find(
        (submission) => submission.id === submissionId,
      )
      if (selectedSubmission) {
        setPreviewFileName(selectedSubmission.fileName)
      }

      const submissionContent = await getSubmissionContent(submissionId)
      setPreviewContent(submissionContent.content)
      setPreviewLanguage(submissionContent.language || "plaintext")
      setShowPreview(true)
    } catch (previewError) {
      console.error("Failed to load submission content:", previewError)
      showToast("Failed to load submission content", "error")
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const downloadSubmissionFile = async (submissionId: number) => {
    try {
      const downloadUrl = await getSubmissionDownloadUrl(submissionId)
      window.open(downloadUrl, "_blank")
    } catch (downloadError) {
      console.error("Failed to download submission:", downloadError)
      showToast("Failed to download submission", "error")
    }
  }

  const clearPreviewFileName = () => {
    setPreviewFileName("")
  }

  const closePreview = () => {
    setShowPreview(false)
  }

  return {
    showPreview,
    previewContent,
    previewLanguage,
    previewFileName,
    isPreviewLoading,
    openFilePreview,
    openSubmissionPreview,
    downloadSubmissionFile,
    clearPreviewFileName,
    closePreview,
  }
}
