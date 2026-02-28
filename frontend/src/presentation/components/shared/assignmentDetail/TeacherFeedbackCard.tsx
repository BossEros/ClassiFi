import { useEffect, useState } from "react"
import { MessageSquare, Save, RefreshCw } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import { useToastStore } from "@/shared/store/useToastStore"
import { saveSubmissionFeedback } from "@/business/services/assignmentService"
import type { Submission } from "@/shared/types/submission"
import { formatDateTime } from "@/presentation/utils/dateUtils"

interface TeacherFeedbackCardProps {
  submissionId: number
  initialFeedback: string | null
  feedbackGivenAt: string | null
  onFeedbackSaved: (updatedSubmission: Submission) => void
}

export function TeacherFeedbackCard({
  submissionId,
  initialFeedback,
  feedbackGivenAt,
  onFeedbackSaved,
}: TeacherFeedbackCardProps) {
  const [feedback, setFeedback] = useState(initialFeedback || "")
  const [isSaving, setIsSaving] = useState(false)
  const showToast = useToastStore((state) => state.showToast)
  const isDirty = feedback !== (initialFeedback || "")

  useEffect(() => {
    setFeedback(initialFeedback || "")
  }, [initialFeedback, submissionId])

  const handleSave = async () => {
    if (!feedback.trim()) {
      showToast("Feedback cannot be empty", "error")
      return
    }

    try {
      setIsSaving(true)
      const updatedSubmission = await saveSubmissionFeedback(
        submissionId,
        feedback,
      )
      showToast("Feedback saved successfully", "success")
      onFeedbackSaved(updatedSubmission)
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Failed to save feedback",
        "error",
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-400" />
          Teacher Feedback
        </CardTitle>
        {feedbackGivenAt && (
          <span className="text-xs text-gray-500">
            Last updated: {formatDateTime(feedbackGivenAt)}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Add your feedback for this submission..."
            className="w-full min-h-[120px] bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 resize-y"
            disabled={isSaving}
          />
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving || !isDirty || !feedback.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-900/20"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Feedback
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
