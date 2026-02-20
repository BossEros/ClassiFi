import { Card, CardContent, CardHeader, CardTitle } from "@/presentation/components/ui/Card"
import { formatDateTime } from "@/presentation/utils/dateUtils"
import { formatFileSize } from "@/presentation/utils/formatUtils"
import type { Submission } from "@/business/models/assignment/types"

interface TeacherSubmissionListCardProps {
  isTeacher: boolean
  submissions: Submission[]
  onPreviewSubmission: (submissionId: number) => void
}

export function TeacherSubmissionListCard({
  isTeacher,
  submissions,
  onPreviewSubmission,
}: TeacherSubmissionListCardProps) {
  if (!isTeacher) {
    return null
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Student Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        {submissions.length > 0 ? (
          <div className="space-y-3">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer group"
                onClick={() => onPreviewSubmission(submission.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-gray-300 font-medium text-sm">
                    {submission.studentName || "Unknown Student"}
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                    Submitted
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono mb-1">{submission.fileName}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(submission.fileSize)} • {formatDateTime(submission.submittedAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No submissions yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
