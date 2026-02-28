import { MessageSquare } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/Card"
import { formatDateTime } from "@/presentation/utils/dateUtils"

interface SubmissionFeedbackCardProps {
  feedback: string | null
  feedbackGivenAt: string | null
}

export function SubmissionFeedbackCard({
  feedback,
  feedbackGivenAt,
}: SubmissionFeedbackCardProps) {
  if (!feedback) {
    return null
  }

  return (
    <Card className="border-blue-500/20 bg-blue-500/5 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-blue-400">
          <MessageSquare className="w-5 h-5" />
          Teacher Feedback
        </CardTitle>
        {feedbackGivenAt && (
          <span className="text-xs text-gray-500">
            {formatDateTime(feedbackGivenAt)}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <div className="bg-black/20 rounded-lg p-4 border border-blue-500/10">
          <p className="text-gray-200 whitespace-pre-wrap leading-relaxed text-sm">
            {feedback}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
