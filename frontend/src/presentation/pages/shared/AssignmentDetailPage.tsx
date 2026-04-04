import { useEffect, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle,
  ClipboardCheck,
  Clock,
  Copy,
  Download,
  Eye,
  FileCode,
  MessageSquare,
  Monitor,
  RefreshCw,
  Save,
  ScrollText,
  User,
  X,
} from "lucide-react"
import Editor from "@monaco-editor/react"
import { DashboardLayout } from "@/presentation/components/shared/dashboard/DashboardLayout"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import { formatDateTime } from "@/presentation/utils/dateUtils"
import { useToastStore } from "@/shared/store/useToastStore"
import { useTopBar } from "@/presentation/components/shared/dashboard/TopBar"
import { AssignmentSubmissionForm } from "@/presentation/components/shared/assignmentDetail/AssignmentSubmissionForm"
import { AssignmentTestResultsCard } from "@/presentation/components/shared/assignmentDetail/AssignmentTestResultsCard"
import { useAssignmentDetailData } from "@/presentation/hooks/shared/assignmentDetail/useAssignmentDetailData"
import { useAssignmentSubmissionFlow } from "@/presentation/hooks/shared/assignmentDetail/useAssignmentSubmissionFlow"
import { useAssignmentCodePreview } from "@/presentation/hooks/shared/assignmentDetail/useAssignmentCodePreview"
import { GradeOverrideModal } from "@/presentation/components/teacher/gradebook/GradeOverrideModal"
import { useGradeOverride } from "@/presentation/hooks/teacher/useGradebook"
import type { Submission } from "@/data/api/assignment.types"
import { getMonacoLanguage } from "@/presentation/utils/monacoUtils"
import {
  getAssignmentSubmissions,
  saveSubmissionFeedback,
} from "@/business/services/assignmentService"
import { cn } from "@/shared/utils/cn"
import { dashboardTheme } from "@/presentation/constants/dashboardTheme"

interface CodePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  code: string
  fileName: string
  language?: string
  variant?: "dark" | "light"
}

function CodePreviewModal({
  isOpen,
  onClose,
  code,
  fileName,
  language = "plaintext",
  variant = "dark",
}: CodePreviewModalProps) {
  const isLight = variant === "light"
  const showToast = useToastStore((state) => state.showToast)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      showToast("Code copied to clipboard", "success")
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      showToast("Failed to copy code", "error")
    }
  }

  const monacoLanguage = getMonacoLanguage(language)

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div
        className={cn(
          "relative flex h-full sm:h-[80vh] w-full max-w-full sm:max-w-2xl lg:max-w-4xl flex-col overflow-hidden rounded-none sm:rounded-2xl border shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200",
          isLight
            ? "border-slate-200 bg-white"
            : "border-white/10 bg-[#1e1e1e] ring-1 ring-white/5",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between border-b px-6 py-4",
            isLight
              ? "border-slate-200 bg-slate-50"
              : "border-white/5 bg-[#1e1e1e]",
          )}
        >
          <div className="flex flex-col">
            <h3
              className={`flex items-center gap-2 text-lg font-semibold tracking-tight ${isLight ? "text-slate-900" : "text-gray-200"}`}
            >
              {fileName}
            </h3>
            <p
              className={`font-mono text-xs ${isLight ? "text-slate-500" : "text-gray-500"}`}
            >
              {`${language.charAt(0).toUpperCase() + language.slice(1)} | ${code.split("\n").length} lines`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleCopy}
              className={cn(
                "!h-8 !w-auto !px-3 text-xs font-normal",
                isLight
                  ? "border border-slate-300 !bg-white text-slate-600 hover:!bg-slate-100 hover:text-slate-900"
                  : "!border-white/10 !bg-transparent text-gray-400 hover:!bg-white/5 hover:text-white",
              )}
            >
              {isCopied ? (
                <>
                  <Check
                    className={`mr-1.5 h-3.5 w-3.5 ${isLight ? "text-emerald-600" : "text-green-400"}`}
                  />
                  <span
                    className={isLight ? "text-emerald-700" : "text-green-400"}
                  >
                    Copied
                  </span>
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={onClose}
              className={cn(
                "ml-2 rounded-lg p-2 transition-colors",
                isLight
                  ? "text-slate-400 hover:bg-slate-100 hover:text-slate-900"
                  : "text-gray-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1">
          <Editor
            height="100%"
            language={monacoLanguage}
            value={code}
            theme={isLight ? "vs" : "vs-dark"}
            options={{
              readOnly: true,
              minimap: { enabled: true },
              scrollBeyondLastLine: false,
              fontSize: 14,
              fontFamily: "JetBrains Mono, Menlo, Monaco, Consolas, monospace",
              padding: { top: 16, bottom: 16 },
              lineNumbers: "on",
              renderLineHighlight: "all",
              smoothScrolling: true,
              cursorBlinking: "smooth",
              cursorSmoothCaretAnimation: "on",
              formatOnPaste: true,
              automaticLayout: true,
            }}
          />
        </div>
      </div>
    </div>
  )
}

interface TeacherFeedbackCardProps {
  submissionId: number
  initialFeedback: string | null
  feedbackGivenAt: string | null
  onFeedbackSaved: (updatedSubmission: Submission) => void
  variant?: "dark" | "light"
}

function TeacherFeedbackCard({
  submissionId,
  initialFeedback,
  feedbackGivenAt,
  onFeedbackSaved,
  variant = "dark",
}: TeacherFeedbackCardProps) {
  const isLight = variant === "light"
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
    <Card
      className={
        isLight
          ? "border-slate-200 bg-white shadow-sm"
          : "border-white/10 bg-white/5 backdrop-blur-sm"
      }
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle
          className={`flex items-center gap-2 ${isLight ? "text-slate-900" : "text-white"}`}
        >
          <MessageSquare
            className={`h-5 w-5 ${isLight ? "text-blue-600" : "text-blue-400"}`}
          />
          Teacher Feedback
        </CardTitle>
        {feedbackGivenAt && (
          <span
            className={`text-xs ${isLight ? "text-slate-500" : "text-gray-500"}`}
          >
            Last updated: {formatDateTime(feedbackGivenAt)}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <textarea
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          maxLength={2000}
          placeholder="Add your feedback for this submission..."
          className={cn(
            "min-h-[120px] w-full resize-y rounded-lg border p-3 text-sm focus:outline-none",
            isLight
              ? "border-slate-300 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:border-blue-400"
              : "border-white/10 bg-black/20 text-gray-200 placeholder:text-gray-500 focus:border-blue-500/50",
          )}
          disabled={isSaving}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving || !isDirty || !feedback.trim()}
            className={
              isLight
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-blue-600 text-white shadow-sm shadow-blue-900/20 hover:bg-blue-700"
            }
          >
            {isSaving ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Feedback
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface SubmissionFeedbackCardProps {
  feedback: string | null
  feedbackGivenAt: string | null
  variant?: "dark" | "light"
}

function SubmissionFeedbackCard({
  feedback,
  feedbackGivenAt,
  variant = "dark",
}: SubmissionFeedbackCardProps) {
  const isLight = variant === "light"

  if (!feedback) {
    return null
  }

  return (
    <Card
      className={
        isLight
          ? "border-blue-200 bg-blue-50/70 shadow-sm"
          : "border-blue-500/20 bg-blue-500/5 backdrop-blur-sm"
      }
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle
          className={`flex items-center gap-2 ${isLight ? "text-blue-700" : "text-blue-400"}`}
        >
          <MessageSquare className="h-5 w-5" />
          Teacher Feedback
        </CardTitle>
        {feedbackGivenAt && (
          <span
            className={`text-xs ${isLight ? "text-slate-500" : "text-gray-500"}`}
          >
            {formatDateTime(feedbackGivenAt)}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            "rounded-lg border p-4",
            isLight
              ? "border-blue-200 bg-white"
              : "border-blue-500/10 bg-black/20",
          )}
        >
          <p
            className={`whitespace-pre-wrap text-sm leading-relaxed ${isLight ? "text-slate-700" : "text-gray-200"}`}
          >
            {feedback}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function getScoreClasses(scoreRatio: number) {
  if (scoreRatio >= 0.9) {
    return "text-emerald-700"
  }

  if (scoreRatio >= 0.75) {
    return "text-sky-700"
  }

  if (scoreRatio >= 0.6) {
    return "text-amber-700"
  }

  if (scoreRatio >= 0.4) {
    return "text-orange-700"
  }

  return "text-rose-700"
}

function getDisplayedSubmissionGrade(
  submission: Submission | undefined,
): number | null {
  return submission?.grade ?? null
}

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
    Number.isFinite(parsedSelectedSubmissionId) &&
    parsedSelectedSubmissionId > 0
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

  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false)
  const { override, removeOverride, isOverriding } = useGradeOverride()

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
  } = useAssignmentCodePreview({ showToast })

  const tempAssignment = assignment || {
    id: parseInt(assignmentId || "0"),
    assignmentName: "Assignment Title",
    instructions: "Assignment instructions will be loaded from the API",
    instructionsImageUrl: null,
    programmingLanguage: "python",
    deadline: null,
    allowResubmission: true,
    maxAttempts: null,
    enableSimilarityPenalty: false,
    isActive: true,
    classId: 0,
    className: "",
  }

  const isTeacher = user?.role === "teacher" || user?.role === "admin"
  const isLightAssignmentView = true
  const latestSubmission = submissions[0]
  const activeSubmission =
    isTeacher && selectedSubmissionId !== null
      ? (submissions.find(
          (submission) => submission.id === selectedSubmissionId,
        ) ?? latestSubmission)
      : latestSubmission
  const hasSubmitted = submissions.length > 0
  const canResubmit = tempAssignment.allowResubmission || !hasSubmitted
  const assignmentTotalScore = assignment?.totalScore || 100
  const displayedSubmissionGrade = getDisplayedSubmissionGrade(activeSubmission)
  const activeScoreRatio =
    displayedSubmissionGrade !== null
      ? displayedSubmissionGrade / assignmentTotalScore
      : null
  const selectedStudentName = activeSubmission?.studentName?.trim() || "Student"
  const isViewingTeacherSubmissionDetail =
    isTeacher && selectedSubmissionId !== null && Boolean(activeSubmission)

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?"
  const assignmentDetailPath = assignmentId
    ? `/dashboard/assignments/${assignmentId}${selectedSubmissionId !== null ? `?submissionId=${selectedSubmissionId}` : ""}`
    : undefined

  const breadcrumbItems = [
    { label: "Classes", to: "/dashboard/classes" },
    ...(tempAssignment.classId > 0
      ? [
          {
            label: tempAssignment.className || "Class Overview",
            to: `/dashboard/classes/${tempAssignment.classId}`,
          },
        ]
      : []),
    {
      label: assignment?.assignmentName || "Assignment Overview",
      to: assignmentDetailPath,
    },
  ]

  const topBar = useTopBar({ user, userInitials, breadcrumbItems })

  const handleClearFile = () => {
    clearPreviewFileName()
    clearSelectedFile()
  }

  const updateSubmissionInState = (updatedSubmission: Submission) => {
    setSubmissions((previousSubmissions) =>
      previousSubmissions.map((submission) =>
        submission.id === updatedSubmission.id
          ? { ...submission, ...updatedSubmission }
          : submission,
      ),
    )
  }

  const handleFeedbackSaved = (updatedSubmission: Submission) => {
    updateSubmissionInState(updatedSubmission)
  }

  const refreshTeacherSubmissions = async () => {
    if (!assignmentId || !user || !(user.role === "teacher" || user.role === "admin")) {
      return
    }

    const refreshedSubmissions = await getAssignmentSubmissions(
      parseInt(assignmentId, 10),
      true,
    )

    setSubmissions(refreshedSubmissions)
  }

  const handleOpenOverrideModal = () => {
    if (!activeSubmission) {
      return
    }

    setIsOverrideModalOpen(true)
  }

  const handleCloseOverrideModal = () => {
    if (isOverriding) {
      return
    }

    setIsOverrideModalOpen(false)
  }

  const handleOverrideSubmit = async (
    overriddenGradeValue: number,
    overrideFeedbackText: string | null,
  ) => {
    if (!activeSubmission) {
      return
    }

    try {
      await override(
        activeSubmission.id,
        overriddenGradeValue,
        overrideFeedbackText,
      )

      await refreshTeacherSubmissions()

      showToast("Score overridden successfully", "success")
      setIsOverrideModalOpen(false)
    } catch (overrideError) {
      showToast(
        overrideError instanceof Error
          ? overrideError.message
          : "Failed to override score",
        "error",
      )
    }
  }

  const handleRemoveOverride = async () => {
    if (!activeSubmission) {
      return
    }

    try {
      await removeOverride(activeSubmission.id)

      await refreshTeacherSubmissions()

      showToast("Score override removed", "success")
      setIsOverrideModalOpen(false)
    } catch (removeOverrideError) {
      showToast(
        removeOverrideError instanceof Error
          ? removeOverrideError.message
          : "Failed to remove score override",
        "error",
      )
    }
  }

  return (
    <DashboardLayout topBar={topBar}>
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div
              className={`mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 ${isLightAssignmentView ? "border-slate-200 border-t-teal-500" : "border-white/30 border-t-white"}`}
            ></div>
            <p
              className={
                isLightAssignmentView ? "text-slate-500" : "text-gray-400"
              }
            >
              Loading assignment...
            </p>
          </div>
        </div>
      ) : error && !assignment ? (
        <div className="flex items-center justify-center py-20">
          <div className="max-w-md text-center">
            <div
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${isLightAssignmentView ? "border border-rose-200 bg-rose-50" : "bg-red-500/20"}`}
            >
              <FileCode
                className={`h-8 w-8 ${isLightAssignmentView ? "text-rose-500" : "text-red-400"}`}
              />
            </div>
            <p
              className={`mb-2 font-medium ${isLightAssignmentView ? "text-slate-900" : "text-gray-300"}`}
            >
              {error.toLowerCase().includes("unauthorized")
                ? "Access Denied"
                : "Error Loading Assignment"}
            </p>
            <p
              className={`mb-4 text-sm ${isLightAssignmentView ? "text-slate-500" : "text-gray-500"}`}
            >
              {error}
            </p>
            {error.toLowerCase().includes("unauthorized") && (
              <p
                className={`mb-4 text-xs ${isLightAssignmentView ? "text-slate-400" : "text-gray-600"}`}
              >
                You do not have permission to view this assignment. Make sure
                you are enrolled in the class.
              </p>
            )}
            <Button
              onClick={() => navigate("/dashboard")}
              className={
                isLightAssignmentView
                  ? "mx-auto w-auto bg-teal-600 px-4 hover:bg-teal-700"
                  : "mx-auto w-auto"
              }
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
            <div
              className={cn(
                "space-y-4",
                isViewingTeacherSubmissionDetail && "w-full",
              )}
            >
              <div className="space-y-3">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                  <h1 className={dashboardTheme.pageTitle}>
                    {tempAssignment.assignmentName}
                  </h1>

                  {isViewingTeacherSubmissionDetail && (
                    <div className="inline-flex items-center gap-2 self-start rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-900 shadow-sm lg:self-auto">
                      <User className="h-4 w-4 text-amber-700" />
                      <span>
                        Reviewing submission from{" "}
                        <span className="text-amber-950">
                          {selectedStudentName}
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-800 shadow-sm">
                    <Calendar className="h-4 w-4 text-blue-700" />
                    <span>
                      {tempAssignment.deadline
                        ? `Due ${formatDateTime(tempAssignment.deadline)}`
                        : "No deadline"}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-800 shadow-sm">
                    <RefreshCw
                      className={`h-4 w-4 ${tempAssignment.allowResubmission ? "text-emerald-700" : "text-amber-700"}`}
                    />
                    <span>
                      {tempAssignment.allowResubmission
                        ? tempAssignment.maxAttempts
                          ? `${tempAssignment.maxAttempts} Attempts Allowed`
                          : "Unlimited Attempts"
                        : "Single Submission"}
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2 text-sm font-semibold text-violet-800 shadow-sm">
                    <CheckCircle className="h-4 w-4 text-violet-700" />
                    <span>{assignmentTotalScore} Points</span>
                  </div>
                </div>
              </div>
            </div>

            {isTeacher && selectedSubmissionId === null && (
              <Button
                onClick={() =>
                  showToast("Checking for similarities...", "info")
                }
                className="w-auto bg-teal-600 hover:bg-teal-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Similarities
              </Button>
            )}
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          {resultsError && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <p className="text-sm text-amber-700">{resultsError}</p>
            </div>
          )}

          {tempAssignment.enableSimilarityPenalty && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-amber-950">
                    Similarity-based deduction is enabled for this assignment
                  </p>
                  <p className="text-sm leading-6 text-amber-900">
                    Similarity does not zero the score by itself. Matches from
                    75% to 84% are warning-only, and deductions begin at 85%.
                    Template code is excluded and the automatic deduction is
                    capped at 20%.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="w-full border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <ScrollText className="h-5 w-5 text-blue-700" />
                    Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="block w-full space-y-4">
                    {tempAssignment.instructions && (
                      <p className="whitespace-pre-wrap break-words leading-relaxed text-slate-600">
                        {tempAssignment.instructions}
                      </p>
                    )}

                    {tempAssignment.instructionsImageUrl && (
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                        <img
                          src={tempAssignment.instructionsImageUrl}
                          alt={tempAssignment.assignmentName}
                          className="max-h-[28rem] w-full object-contain bg-slate-50"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Mobile: show desktop prompt instead of submission form */}
              <div className="lg:hidden rounded-xl border border-sky-200 bg-sky-50 p-4">
                <div className="flex items-start gap-3">
                  <Monitor className="h-5 w-5 shrink-0 text-sky-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-sky-900">
                      Code submission requires a desktop
                    </p>
                    <p className="mt-1 text-xs text-sky-700">
                      Open this page on a computer to write and submit your
                      code. You can still view assignment details, instructions,
                      and your submission status here.
                    </p>
                  </div>
                </div>
              </div>

              {/* Desktop: full submission form */}
              <div className="hidden lg:block">
                <AssignmentSubmissionForm
                  isTeacher={isTeacher}
                  canResubmit={canResubmit}
                  hasSubmitted={hasSubmitted}
                  variant="light"
                  programmingLanguage={tempAssignment.programmingLanguage}
                  fileInputRef={fileInputRef}
                  selectedFile={selectedFile}
                  fileError={fileError}
                  isRunningPreview={isRunningPreview}
                  isSubmitting={isSubmitting}
                  onFileSelect={handleFileSelect}
                  onFilePreview={() =>
                    openFilePreview(
                      selectedFile,
                      assignment?.programmingLanguage,
                    )
                  }
                  onClearFile={handleClearFile}
                  onRunPreviewTests={handleRunPreviewTests}
                  onSubmit={handleSubmit}
                />
              </div>
            </div>

            <div className="space-y-6">
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <ClipboardCheck className="h-5 w-5 text-emerald-700" />
                    Submission Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {hasSubmitted ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                        <div>
                          <p className="font-medium text-slate-900">
                            Submitted
                          </p>
                          <p className="text-sm text-slate-500">
                            {submissions.length} submission(s)
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-4">
                        <p className="mb-1 text-sm text-slate-500">
                          {isTeacher && selectedSubmissionId !== null
                            ? "Selected Submission:"
                            : "Latest Submission:"}
                        </p>
                        <p className="text-sm font-mono text-slate-800">
                          {activeSubmission?.fileName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {activeSubmission?.submittedAt &&
                            formatDateTime(activeSubmission.submittedAt)}
                        </p>

                        <div className="mt-3 flex gap-2">
                          <Button
                            onClick={() =>
                              activeSubmission &&
                              openSubmissionPreview(
                                activeSubmission.id,
                                submissions,
                              )
                            }
                            disabled={isPreviewLoading}
                            className="h-8 flex-1 border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          >
                            {isPreviewLoading ? (
                              <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Eye className="mr-2 h-3.5 w-3.5" />
                            )}
                            Preview
                          </Button>
                          <Button
                            onClick={() =>
                              activeSubmission &&
                              downloadSubmissionFile(activeSubmission.id)
                            }
                            className="h-8 flex-1 border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Download className="mr-2 h-3.5 w-3.5" />
                            Download
                          </Button>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-4">
                        <p className="mb-1 text-sm text-slate-500">Score:</p>
                        {displayedSubmissionGrade !== null ? (
                          <div className="space-y-2">
                            <div className="flex items-baseline gap-0.5 tabular-nums">
                              <span
                                className={cn(
                                  "text-2xl font-semibold tracking-tight",
                                  getScoreClasses(activeScoreRatio ?? 0),
                                )}
                              >
                                {displayedSubmissionGrade}
                              </span>
                              <span className="text-md font-medium tracking-tight text-slate-600">
                                /{assignmentTotalScore}
                              </span>
                            </div>

                            {activeSubmission?.isGradeOverridden && (
                              <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                                This score was manually adjusted by the teacher.
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="italic text-slate-500">
                            Not graded yet
                          </p>
                        )}
                      </div>

                      {isTeacher && (
                        <div className="space-y-2 border-t border-slate-200 pt-4">
                          <Button
                            onClick={handleOpenOverrideModal}
                            className="h-9 w-full bg-blue-600 text-xs hover:bg-blue-700"
                          >
                            Override Score
                          </Button>
                          {activeSubmission?.isGradeOverridden && (
                            <p className="text-xs text-blue-700">
                              Score has a manual override
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                      <div>
                        <p className="font-medium text-slate-900">
                          Not Submitted
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
                variant="light"
                expandedPreviewTests={expandedPreviewTests}
                expandedSubmissionTests={expandedSubmissionTests}
                expandedInitialTests={expandedInitialTests}
                onTogglePreviewTestExpand={togglePreviewTestExpand}
                onToggleSubmissionTestExpand={toggleSubmissionTestExpand}
                onToggleInitialTestExpand={toggleInitialTestExpand}
              />

              {activeSubmission && isTeacher && (
                <TeacherFeedbackCard
                  submissionId={activeSubmission.id}
                  initialFeedback={activeSubmission.teacherFeedback ?? null}
                  feedbackGivenAt={activeSubmission.feedbackGivenAt ?? null}
                  onFeedbackSaved={handleFeedbackSaved}
                  variant="light"
                />
              )}

              {activeSubmission &&
                !isTeacher &&
                activeSubmission.teacherFeedback && (
                  <SubmissionFeedbackCard
                    feedback={activeSubmission.teacherFeedback}
                    feedbackGivenAt={activeSubmission.feedbackGivenAt ?? null}
                    variant="light"
                  />
                )}
            </div>
          </div>
        </>
      )}

      <CodePreviewModal
        isOpen={showPreview}
        onClose={closePreview}
        code={previewContent}
        fileName={
          previewFileName || latestSubmission?.fileName || "Code Preview"
        }
        language={previewLanguage}
        variant="light"
      />

      {activeSubmission && isTeacher && (
        <GradeOverrideModal
          isOpen={isOverrideModalOpen}
          onClose={handleCloseOverrideModal}
          onSubmit={handleOverrideSubmit}
          onRemoveOverride={
            activeSubmission.isGradeOverridden
              ? handleRemoveOverride
              : undefined
          }
          variant="light"
          isSubmitting={isOverriding}
          studentName={activeSubmission.studentName || "Student"}
          assignmentName={tempAssignment.assignmentName}
          currentGrade={displayedSubmissionGrade}
          totalScore={assignmentTotalScore}
        />
      )}
    </DashboardLayout>
  )
}
