import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  FileCode,
  Clock,
  Calendar,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Eye,
  Download,
} from "lucide-react"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import { BackButton } from "@/presentation/components/ui/BackButton"
import { formatDateTime } from "@/presentation/utils/dateUtils"
import { useToastStore } from "@/shared/store/useToastStore"
import { CodePreviewModal } from "@/presentation/components/shared/modals/CodePreviewModal"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import { AssignmentSubmissionForm } from "@/presentation/components/shared/assignmentDetail/AssignmentSubmissionForm"
import { AssignmentTestResultsCard } from "@/presentation/components/shared/assignmentDetail/AssignmentTestResultsCard"
import { useAssignmentDetailData } from "@/presentation/hooks/shared/assignmentDetail/useAssignmentDetailData"
import { useAssignmentSubmissionFlow } from "@/presentation/hooks/shared/assignmentDetail/useAssignmentSubmissionFlow"
import { useAssignmentCodePreview } from "@/presentation/hooks/shared/assignmentDetail/useAssignmentCodePreview"

export function AssignmentDetailPage() {
  const navigate = useNavigate()
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const [searchParams] = useSearchParams()
  const showToast = useToastStore((state) => state.showToast)
  const selectedSubmissionIdValue = searchParams.get("submissionId")
  const parsedSelectedSubmissionId = selectedSubmissionIdValue
    ? Number(selectedSubmissionIdValue)
    : NaN
  const selectedSubmissionId =
    Number.isFinite(parsedSelectedSubmissionId) && parsedSelectedSubmissionId > 0
      ? parsedSelectedSubmissionId
      : null

  const {
    user,
    assignment,
    submissions,
    submissionTestResults,
    isLoading,
    error,
    setError,
    setSubmissions,
    setSubmissionTestResults,
  } = useAssignmentDetailData({
    assignmentId,
    navigate,
    selectedSubmissionId,
  })

  const {
    fileInputRef,
    selectedFile,
    fileError,
    isSubmitting,
    isRunningPreview,
    previewResults,
    resultsError,
    expandedPreviewTests,
    expandedSubmissionTests,
    expandedInitialTests,
    handleFileSelect,
    clearSelectedFile,
    handleSubmit,
    handleRunPreviewTests,
    togglePreviewTestExpand,
    toggleSubmissionTestExpand,
    toggleInitialTestExpand,
  } = useAssignmentSubmissionFlow({
    assignmentId,
    user,
    assignment,
    setError,
    setSubmissions,
    setSubmissionTestResults,
    showToast,
  })

  const {
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
  } = useAssignmentCodePreview({
    showToast,
  })

  // Fallback data if assignment is not yet loaded or found
  const tempAssignment = assignment || {
    id: parseInt(assignmentId || "0"),
    assignmentName: "Assignment Title",
    instructions: "Assignment instructions will be loaded from the API",
    instructionsImageUrl: null,
    programmingLanguage: "python",
    deadline: null,
    allowResubmission: true,
    maxAttempts: null,
    isActive: true,
    classId: 0,
    className: "",
  }

  const isTeacher = user?.role === "teacher" || user?.role === "admin"
  const latestSubmission = submissions[0]
  const activeSubmission =
    isTeacher && selectedSubmissionId !== null
      ? submissions.find(
          (submission) => submission.id === selectedSubmissionId,
        ) ?? latestSubmission
      : latestSubmission
  const hasSubmitted = submissions.length > 0
  const canResubmit = tempAssignment.allowResubmission || !hasSubmitted

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user, userInitials })

  const handleClearFile = () => {
    clearPreviewFileName()
    clearSelectedFile()
  }

  return (
    <DashboardLayout topBar={topBar}>
      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading assignment...</p>
          </div>
        </div>
      ) : error && !assignment ? (
        /* Error State */
        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <FileCode className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-gray-300 font-medium mb-2">
              {error.toLowerCase().includes("unauthorized")
                ? "Access Denied"
                : "Error Loading Assignment"}
            </p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            {error.toLowerCase().includes("unauthorized") && (
              <p className="text-xs text-gray-600 mb-4">
                You don't have permission to view this assignment. Make sure
                you're enrolled in the class.
              </p>
            )}
            <BackButton
              to="/dashboard"
              label="Back to Dashboard"
              className="mx-auto"
            />
          </div>
        </div>
      ) : (
        /* Main Content */
        <>
          {/* Page Header */}
          <div className="mb-6 flex flex-col items-stretch">
            <BackButton />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {/* Removed old back button */}
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {tempAssignment.assignmentName}
                  </h1>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs font-medium text-blue-100">
                        {tempAssignment.deadline
                          ? `Due ${formatDateTime(tempAssignment.deadline)}`
                          : "No deadline"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${
                          tempAssignment.allowResubmission
                            ? "text-green-400"
                            : "text-yellow-400"
                        }`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          tempAssignment.allowResubmission
                            ? "text-green-100"
                            : "text-yellow-100"
                        }`}
                      >
                        {tempAssignment.allowResubmission
                          ? tempAssignment.maxAttempts
                            ? `${tempAssignment.maxAttempts} Attempts Allowed`
                            : "Unlimited Attempts"
                          : "Single Submission"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Teacher Actions */}
              {isTeacher && selectedSubmissionId === null && (
                <Button
                  onClick={() =>
                    showToast("Checking for similarities...", "info")
                  }
                  className="w-auto bg-teal-600 hover:bg-teal-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check Similarities
                </Button>
              )}
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Test Results Error Message */}
          {resultsError && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-400 text-sm">{resultsError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Assignment Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Assignment Instructions */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-sm w-full">
                <CardHeader>
                  <CardTitle>Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="block w-full space-y-4">
                    {tempAssignment.instructions && (
                      <p className="text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                        {tempAssignment.instructions}
                      </p>
                    )}

                    {tempAssignment.instructionsImageUrl && (
                      <div className="rounded-xl overflow-hidden border border-white/10 bg-black/20">
                        <img
                          src={tempAssignment.instructionsImageUrl}
                          alt={tempAssignment.assignmentName}
                          className="w-full max-h-[28rem] object-contain bg-black/30"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <AssignmentSubmissionForm
                isTeacher={isTeacher}
                canResubmit={canResubmit}
                hasSubmitted={hasSubmitted}
                programmingLanguage={tempAssignment.programmingLanguage}
                fileInputRef={fileInputRef}
                selectedFile={selectedFile}
                fileError={fileError}
                isRunningPreview={isRunningPreview}
                isSubmitting={isSubmitting}
                onFileSelect={handleFileSelect}
                onFilePreview={() =>
                  openFilePreview(selectedFile, assignment?.programmingLanguage)
                }
                onClearFile={handleClearFile}
                onRunPreviewTests={handleRunPreviewTests}
                onSubmit={handleSubmit}
              />
            </div>

            {/* Right Column - Submission History */}
            <div className="space-y-6">
              {/* Submission Status */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Submission Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {hasSubmitted ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/20">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-gray-300 font-medium">Submitted</p>
                          <p className="text-sm text-gray-500">
                            {submissions.length} submission(s)
                          </p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-white/10">
                        <p className="text-sm text-gray-400 mb-1">
                          {isTeacher && selectedSubmissionId !== null
                            ? "Selected Submission:"
                            : "Latest Submission:"}
                        </p>
                        <p className="text-gray-300 font-mono text-sm">
                          {activeSubmission?.fileName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activeSubmission?.submittedAt &&
                            formatDateTime(activeSubmission.submittedAt)}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={() =>
                              activeSubmission &&
                              openSubmissionPreview(
                                activeSubmission.id,
                                submissions,
                              )
                            }
                            disabled={isPreviewLoading}
                            className="flex-1 h-8 text-xs bg-white/5 border-white/10 hover:bg-white/10 text-gray-300 hover:text-white"
                          >
                            {isPreviewLoading ? (
                              <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 mr-2" />
                            )}
                            Preview
                          </Button>
                          <Button
                            onClick={() =>
                              activeSubmission &&
                              downloadSubmissionFile(activeSubmission.id)
                            }
                            className="flex-1 h-8 text-xs bg-white/5 border-white/10 hover:bg-white/10 text-gray-300 hover:text-white"
                          >
                            <Download className="w-3.5 h-3.5 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>

                      {/* Score / Grade Display */}
                      <div className="pt-4 border-t border-white/10">
                        <p className="text-sm text-gray-400 mb-1">Score:</p>
                        {activeSubmission?.grade !== undefined &&
                        activeSubmission?.grade !== null ? (
                          <div className="flex items-baseline gap-1">
                            <span
                              className={`text-2xl font-bold ${
                                activeSubmission.grade /
                                  (assignment?.totalScore || 100) >=
                                0.75
                                  ? "text-green-400"
                                  : activeSubmission.grade /
                                        (assignment?.totalScore || 100) >=
                                      0.5
                                    ? "text-yellow-400"
                                    : "text-red-400"
                              }`}
                            >
                              {activeSubmission.grade}
                            </span>
                            <span className="text-sm text-gray-500">
                              / {assignment?.totalScore || 100}
                            </span>
                          </div>
                        ) : (
                          <p className="text-gray-500 italic">Not graded yet</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-500/20">
                        <Clock className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-gray-300 font-medium">
                          Not Submitted
                        </p>
                        <p className="text-sm text-gray-500">
                          No submissions yet
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <AssignmentTestResultsCard
                previewResults={previewResults}
                submissionTestResults={submissionTestResults}
                assignmentTestCases={assignment?.testCases}
                showHiddenCases={isTeacher}
                expandedPreviewTests={expandedPreviewTests}
                expandedSubmissionTests={expandedSubmissionTests}
                expandedInitialTests={expandedInitialTests}
                onTogglePreviewTestExpand={togglePreviewTestExpand}
                onToggleSubmissionTestExpand={toggleSubmissionTestExpand}
                onToggleInitialTestExpand={toggleInitialTestExpand}
              />
            </div>
          </div>
        </>
      )}

      {/* Code Preview Modal */}
      <CodePreviewModal
        isOpen={showPreview}
        onClose={closePreview}
        code={previewContent}
        fileName={
          previewFileName || latestSubmission?.fileName || "Code Preview"
        }
        language={previewLanguage}
      />
    </DashboardLayout>
  )
}
