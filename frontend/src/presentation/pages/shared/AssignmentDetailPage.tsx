import { useEffect, useState, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  Upload,
  FileCode,
  Clock,
  Calendar,
  Code,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Play,
  ChevronDown,
  Eye,
  Download,
  Lock,
} from "lucide-react"
import { DashboardLayout } from "@/presentation/components/dashboard/DashboardLayout"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/Card"
import { Button } from "@/presentation/components/ui/Button"
import { BackButton } from "@/presentation/components/ui/BackButton"
import { getCurrentUser } from "@/business/services/authService"
import {
  submitAssignment,
  getSubmissionHistory,
  getAssignmentSubmissions,
  getAssignmentById,
  validateFile,
  getSubmissionContent,
  getSubmissionDownloadUrl,
} from "@/business/services/assignmentService"
import { formatFileSize } from "@/shared/utils/formatUtils"
import { formatDateTime } from "@/shared/utils/dateUtils"
import { useToast } from "@/presentation/context/ToastContext"
import {
  runTestsPreview,
  type TestPreviewResult,
  getTestResultsForSubmission,
} from "@/business/services/testService"
import type { User } from "@/business/models/auth/types"
import type {
  AssignmentDetail,
  Submission,
} from "@/business/models/assignment/types"
import { CodePreviewModal } from "@/presentation/components/modals/CodePreviewModal"
import { useTopBar } from "@/presentation/components/dashboard/TopBar"

export function AssignmentDetailPage() {
  const navigate = useNavigate()
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const submissionAbortRef = useRef<AbortController | null>(null)
  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([])

  const [user, setUser] = useState<User | null>(null)
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isRunningPreview, setIsRunningPreview] = useState(false)
  const [previewResults, setPreviewResults] =
    useState<TestPreviewResult | null>(null)
  const [expandedPreviewTests, setExpandedPreviewTests] = useState<Set<number>>(
    new Set(),
  )
  const [submissionTestResults, setSubmissionTestResults] =
    useState<TestPreviewResult | null>(null)
  const [expandedSubmissionTests, setExpandedSubmissionTests] = useState<
    Set<number>
  >(new Set())
  const [expandedInitialTests, setExpandedInitialTests] = useState<Set<number>>(
    new Set(),
  )
  const [resultsError, setResultsError] = useState<string | null>(null)

  // Preview Modal State
  const [showPreview, setShowPreview] = useState(false)
  const [previewContent, setPreviewContent] = useState("")
  const [previewLanguage, setPreviewLanguage] = useState("")
  const [previewFileName, setPreviewFileName] = useState("")
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

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
  const hasSubmitted = submissions.length > 0
  const canResubmit = tempAssignment.allowResubmission || !hasSubmitted

  const userInitials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "?"

  const topBar = useTopBar({ user, userInitials })

  // Cleanup effect for abort controller and timers
  useEffect(() => {
    return () => {
      // Abort any ongoing submission result fetching
      if (submissionAbortRef.current) {
        submissionAbortRef.current.abort()
        submissionAbortRef.current = null
      }
      // Clear any pending timeouts
      timeoutIdsRef.current.forEach((id) => clearTimeout(id))
      timeoutIdsRef.current = []
    }
  }, [])

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate("/login")
      return
    }

    setUser(currentUser)

    // Fetch assignment data
    const fetchAssignmentData = async () => {
      if (!assignmentId || !currentUser) {
        setError("Assignment not found")
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch assignment details
        const assignmentData = await getAssignmentById(
          parseInt(assignmentId),
          parseInt(currentUser.id),
        )
        setAssignment(assignmentData)

        // Fetch submissions based on role
        if (currentUser.role === "student") {
          const historyResponse = await getSubmissionHistory(
            parseInt(assignmentId),
            parseInt(currentUser.id),
          )

          // Sort submissions by submissionNumber descending (newest first)
          // This ensures consistent ordering with handleSubmit (which prepends)
          // and ensures submissions[0] is interpreted as the latest in the render logic
          const sortedSubmissions = [...historyResponse.submissions].sort(
            (a, b) => b.submissionNumber - a.submissionNumber,
          )
          setSubmissions(sortedSubmissions)

          // Fetch test results for the latest submission
          const latestSubmission =
            sortedSubmissions.find((s) => s.isLatest) || sortedSubmissions[0]

          if (latestSubmission) {
            try {
              const results = await getTestResultsForSubmission(
                latestSubmission.id,
              )
              setSubmissionTestResults(results)
            } catch (e) {
              console.error(
                "Failed to load test results for latest submission",
                e,
              )
            }
          }
        } else if (
          currentUser.role === "teacher" ||
          currentUser.role === "admin"
        ) {
          // Fetch all submissions for teacher
          const allSubmissions = await getAssignmentSubmissions(
            parseInt(assignmentId),
            true, // latest only
          )
          setSubmissions(allSubmissions)
        }
      } catch (err) {
        console.error("Failed to fetch assignment data:", err)
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load assignment. Please try again."
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssignmentData()
  }, [navigate, assignmentId])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      setFileError(null)
      return
    }

    // Validate file if assignment data is available
    if (assignment) {
      const validationError = validateFile(file, assignment.programmingLanguage)
      if (validationError) {
        setFileError(validationError)
        setSelectedFile(null)
        return
      }
    }

    setFileError(null)
    setSelectedFile(file)
  }

  const fetchTestResultsWithRetry = async (
    submissionId: number,
    signal: AbortSignal,
  ): Promise<boolean> => {
    const MAX_RETRIES = 10
    const RETRY_DELAY_MS = 1000

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      if (signal.aborted) return false

      try {
        const results = await getTestResultsForSubmission(submissionId)
        if (!signal.aborted) {
          setSubmissionTestResults(results)
          return true
        }
        return false
      } catch (e) {
        console.error(`Attempt ${attempt} failed to load results`, e)

        if (attempt === MAX_RETRIES) {
          if (!signal.aborted) {
            console.error("Failed to load test results after all retries", e)
          }
          return false
        }

        if (!signal.aborted) {
          await new Promise<void>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
              if (!signal.aborted) {
                resolve()
              } else {
                reject(new Error("Aborted"))
              }
            }, RETRY_DELAY_MS)

            timeoutIdsRef.current.push(timeoutId)
            signal.addEventListener(
              "abort",
              () => {
                clearTimeout(timeoutId)
                reject(new Error("Aborted"))
              },
              { once: true },
            )
          })
        }
      }
    }

    return false
  }

  const clearSubmissionForm = () => {
    setSelectedFile(null)
    setPreviewResults(null)
    setExpandedPreviewTests(new Set())
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile || !user || !assignmentId || !assignment) return

    const validationError = validateFile(
      selectedFile,
      assignment.programmingLanguage,
    )
    if (validationError) {
      setFileError(validationError)
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)
      setResultsError(null)

      const submission = await submitAssignment({
        assignmentId: parseInt(assignmentId),
        studentId: parseInt(user.id),
        file: selectedFile,
        programmingLanguage: assignment.programmingLanguage,
      })

      setSubmissions((prev) => [submission, ...prev])
      clearSubmissionForm()

      submissionAbortRef.current = new AbortController()
      const signal = submissionAbortRef.current.signal

      timeoutIdsRef.current.forEach((id) => clearTimeout(id))
      timeoutIdsRef.current = []

      try {
        const success = await fetchTestResultsWithRetry(submission.id, signal)

        if (!success && !signal.aborted) {
          setResultsError(
            "Failed to load test results after multiple attempts. Please refresh the page.",
          )
          showToast(
            "Submission successful, but test results failed to load",
            "error",
          )
        } else if (success) {
          showToast("Assignment submitted successfully!")
        }
      } catch (abortError) {
        if (abortError instanceof Error && abortError.message !== "Aborted") {
          throw abortError
        }
      } finally {
        timeoutIdsRef.current.forEach((id) => clearTimeout(id))
        timeoutIdsRef.current = []
      }
    } catch (err) {
      console.error("Failed to submit assignment:", err)
      setError(
        err instanceof Error ? err.message : "Failed to submit assignment",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    setFileError(null)
    setPreviewResults(null)
    setPreviewFileName("")
    setExpandedPreviewTests(new Set())
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const togglePreviewTestExpand = (index: number) => {
    setExpandedPreviewTests((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const toggleSubmissionTestExpand = (index: number) => {
    setExpandedSubmissionTests((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const toggleInitialTestExpand = (index: number) => {
    setExpandedInitialTests((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const handleRunPreviewTests = async () => {
    if (!selectedFile || !assignment || !assignmentId) return

    try {
      setIsRunningPreview(true)
      setPreviewResults(null)

      // Read file content
      const fileContent = await selectedFile.text()

      // Run preview tests
      const results = await runTestsPreview(
        fileContent,
        assignment.programmingLanguage as "python" | "java" | "c",
        parseInt(assignmentId),
      )

      setPreviewResults(results)

      if (results.percentage === 100) {
        showToast(`All ${results.total} tests passed! You can now submit.`)
      } else {
        showToast(`${results.passed}/${results.total} tests passed`)
      }
    } catch (err) {
      console.error("Failed to run preview tests:", err)
      showToast(err instanceof Error ? err.message : "Failed to run tests")
    } finally {
      setIsRunningPreview(false)
    }
  }

  const handleFilePreview = async () => {
    if (!selectedFile) return

    try {
      const content = await selectedFile.text()
      setPreviewContent(content)
      setPreviewLanguage(assignment?.programmingLanguage || "plaintext")
      setPreviewFileName(selectedFile.name)
      setShowPreview(true)
    } catch (err) {
      console.error("Failed to read file:", err)
      showToast("Failed to read file content", "error")
    }
  }

  const handleSubmissionPreview = async (submissionId: number) => {
    try {
      setIsPreviewLoading(true)
      const submission = submissions.find((s) => s.id === submissionId)
      if (submission) {
        setPreviewFileName(submission.fileName)
      }
      const data = await getSubmissionContent(submissionId)
      setPreviewContent(data.content)
      setPreviewLanguage(data.language || "plaintext")
      setShowPreview(true)
    } catch (err) {
      console.error("Failed to load submission content:", err)
      showToast("Failed to load submission content", "error")
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const handleSubmissionDownload = async (submissionId: number) => {
    try {
      const url = await getSubmissionDownloadUrl(submissionId)
      window.open(url, "_blank")
    } catch (err) {
      console.error("Failed to download submission:", err)
      showToast("Failed to download submission", "error")
    }
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
              {isTeacher && (
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

              {/* File Upload Section - Only for Students */}
              {!isTeacher && canResubmit && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {hasSubmitted
                        ? "Resubmit Assignment"
                        : "Submit Assignment"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* File Input */}
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
                            onChange={handleFileSelect}
                            accept={
                              tempAssignment.programmingLanguage === "python"
                                ? ".py,.ipynb"
                                : tempAssignment.programmingLanguage === "java"
                                  ? ".java,.jar"
                                  : ".c,.h"
                            }
                          />
                          <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <Upload className="w-6 h-6 text-teal-400" />
                            </div>
                            <p className="text-gray-200 font-medium mb-1">
                              Click to select file
                            </p>
                            <p className="text-sm text-gray-500">
                              {tempAssignment.programmingLanguage === "python"
                                ? "Accepted: .py, .ipynb"
                                : tempAssignment.programmingLanguage === "java"
                                  ? "Accepted: .java, .jar"
                                  : "Accepted: .c, .h"}
                            </p>
                            <p className="text-xs text-gray-600 mt-2">
                              Maximum file size: 10MB
                            </p>
                          </div>
                        </label>

                        {/* File Error */}
                        {fileError && (
                          <p className="mt-2 text-sm text-red-400">
                            {fileError}
                          </p>
                        )}

                        {/* Selected File Info */}
                        {selectedFile && !fileError && (
                          <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FileCode className="w-5 h-5 text-teal-400" />
                                <div>
                                  <p className="text-gray-300 font-medium">
                                    {selectedFile.name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {formatFileSize(selectedFile.size)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={handleFilePreview}
                                  className="h-8 w-auto px-3 text-xs bg-white/5 border-white/10 hover:bg-white/10 text-gray-300 hover:text-white"
                                >
                                  <Eye className="w-3.5 h-3.5 mr-2" />
                                  Preview
                                </Button>
                                <button
                                  onClick={handleClearFile}
                                  className="text-gray-400 hover:text-white transition-colors p-1"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Run Tests Button */}
                        {selectedFile && !fileError && (
                          <Button
                            onClick={handleRunPreviewTests}
                            disabled={isRunningPreview || isSubmitting}
                            className="w-full mt-4 h-11 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-black hover:to-gray-900 border border-white/10 shadow-lg shadow-black/20 transition-all duration-300 group"
                          >
                            {isRunningPreview ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin text-teal-400" />
                                <span className="text-gray-300">
                                  Running Tests...
                                </span>
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2 text-teal-400 group-hover:scale-110 transition-transform" />
                                <span className="text-gray-200 font-medium">
                                  Run Tests
                                </span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Submit Button */}
                      <Button
                        onClick={handleSubmit}
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
              )}

              {/* Resubmission Not Allowed Message - Only for Students */}
              {!isTeacher && !canResubmit && (
                <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                  <CardContent className="py-8">
                    <div className="text-center">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400" />
                      <p className="text-gray-300 font-medium mb-1">
                        Assignment Submitted
                      </p>
                      <p className="text-sm text-gray-500">
                        Resubmission is not allowed for this assignment.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
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
                          Latest Submission:
                        </p>
                        <p className="text-gray-300 font-mono text-sm">
                          {latestSubmission?.fileName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {latestSubmission?.submittedAt &&
                            formatDateTime(latestSubmission.submittedAt)}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={() =>
                              latestSubmission &&
                              handleSubmissionPreview(latestSubmission.id)
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
                              latestSubmission &&
                              handleSubmissionDownload(latestSubmission.id)
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
                        {latestSubmission?.grade !== undefined &&
                        latestSubmission?.grade !== null ? (
                          <div className="flex items-baseline gap-1">
                            <span
                              className={`text-2xl font-bold ${
                                latestSubmission.grade /
                                  (assignment?.totalScore || 100) >=
                                0.75
                                  ? "text-green-400"
                                  : latestSubmission.grade /
                                        (assignment?.totalScore || 100) >=
                                      0.5
                                    ? "text-yellow-400"
                                    : "text-red-400"
                              }`}
                            >
                              {latestSubmission.grade}
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

              {/* Test Results Card - Handles Preview, Submission, and Initial Test Cases */}
              {(previewResults ||
                submissionTestResults ||
                (assignment?.testCases && assignment.testCases.length > 0)) &&
                (() => {
                  const activeResults = previewResults || submissionTestResults
                  const isPreview = !!previewResults

                  // If we have actual results (preview or submission)
                  if (activeResults) {
                    const expandedSet = isPreview
                      ? expandedPreviewTests
                      : expandedSubmissionTests
                    const toggleFn = isPreview
                      ? togglePreviewTestExpand
                      : toggleSubmissionTestExpand
                    const resultCount = activeResults.results.length

                    return (
                      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="flex items-center gap-2">
                            <Code className="w-5 h-5 text-purple-400" />
                            {resultCount === 1 ? "Test Case" : "Test Cases"}
                          </CardTitle>
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                              activeResults.percentage === 100
                                ? "bg-green-500/10 text-green-400 border-green-500/20"
                                : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            }`}
                          >
                            {activeResults.passed}/{activeResults.total} Passed
                            ({activeResults.percentage}%)
                          </span>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {activeResults.results
                              .map((r, i) => ({ ...r, originalIndex: i }))
                              .filter((r) => !r.isHidden)
                              .map(({ originalIndex, ...result }) => {
                                const isAccepted = result.status === "Accepted"
                                const isExpanded =
                                  expandedSet.has(originalIndex)

                                return (
                                  <div
                                    key={originalIndex}
                                    className="rounded-lg border border-white/5 overflow-hidden bg-black/20"
                                  >
                                    <button
                                      onClick={() => toggleFn(originalIndex)}
                                      className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span
                                          className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono border ${
                                            isAccepted
                                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                                              : "bg-red-500/10 text-red-400 border-red-500/20"
                                          }`}
                                        >
                                          {originalIndex + 1}
                                        </span>
                                        <div className="flex flex-col items-start">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-200">
                                              {result.name}
                                            </span>
                                          </div>
                                          <span
                                            className={`text-xs ${
                                              isAccepted
                                                ? "text-green-500/70"
                                                : "text-red-500/70"
                                            }`}
                                          >
                                            {result.status}
                                          </span>
                                        </div>
                                      </div>
                                      <ChevronDown
                                        className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                                          isExpanded ? "rotate-180" : ""
                                        }`}
                                      />
                                    </button>

                                    {isExpanded && (
                                      <div className="border-t border-white/5 bg-gray-950/50 p-4 space-y-4">
                                        <div className="grid grid-cols-1 gap-4">
                                          <div>
                                            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                                              <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                                              Input
                                            </p>
                                            <div className="p-3 bg-black/40 rounded-lg border border-white/5 max-h-60 overflow-y-auto custom-scrollbar">
                                              <pre
                                                className={`text-xs font-mono whitespace-pre-wrap ${
                                                  !result.input
                                                    ? "text-gray-500 italic"
                                                    : "text-gray-300"
                                                }`}
                                              >
                                                {result.input ||
                                                  "(No input required)"}
                                              </pre>
                                            </div>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                          {result.expectedOutput && (
                                            <div>
                                              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                                                <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                                                Expected
                                              </p>
                                              <div className="p-3 bg-black/40 rounded-lg border border-white/5 max-h-60 overflow-y-auto custom-scrollbar">
                                                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                                                  {result.expectedOutput}
                                                </pre>
                                              </div>
                                            </div>
                                          )}

                                          {(result.actualOutput ||
                                            !isAccepted) && (
                                            <div>
                                              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                                                <span
                                                  className={`w-1 h-1 rounded-full ${
                                                    isAccepted
                                                      ? "bg-green-500"
                                                      : "bg-red-500"
                                                  }`}
                                                ></span>
                                                Actual
                                              </p>
                                              <div
                                                className={`p-3 rounded-lg border max-h-60 overflow-y-auto custom-scrollbar ${
                                                  isAccepted
                                                    ? "bg-green-500/5 border-green-500/10"
                                                    : "bg-red-500/5 border-red-500/10"
                                                }`}
                                              >
                                                <pre
                                                  className={`text-xs font-mono whitespace-pre-wrap ${
                                                    isAccepted
                                                      ? "text-green-300"
                                                      : "text-red-300"
                                                  } ${
                                                    !result.actualOutput
                                                      ? "italic opacity-50"
                                                      : ""
                                                  }`}
                                                >
                                                  {result.actualOutput ||
                                                    "(No output generated)"}
                                                </pre>
                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        {result.errorMessage && (
                                          <div>
                                            <p className="text-[10px] uppercase tracking-wider font-semibold text-red-500 mb-1.5 flex items-center gap-1.5">
                                              <span className="w-1 h-1 rounded-full bg-red-500"></span>
                                              Error
                                            </p>
                                            <div className="p-3 bg-red-950/20 rounded-lg border border-red-500/20 max-h-60 overflow-y-auto custom-scrollbar">
                                              <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap">
                                                {result.errorMessage}
                                              </pre>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}

                            {activeResults.results.some((r) => r.isHidden) && (
                              <div className="relative rounded-lg border border-white/5 overflow-hidden bg-black/20 group select-none">
                                {/* Blurred Background Content (Simulating standard rows) */}
                                <div className="absolute inset-0 flex flex-col pointer-events-none opacity-40 blur-[2px]">
                                  {/* Fake Row 1 */}
                                  <div className="flex items-center justify-between p-3 border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                      <div className="w-6 h-6 rounded-md bg-teal-500/10 border border-teal-500/20"></div>
                                      <div className="h-4 w-32 bg-gray-700/20 rounded"></div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="h-4 w-4 bg-gray-700/20 rounded"></div>
                                    </div>
                                  </div>
                                  {/* Fake Row 2 */}
                                  <div className="flex items-center justify-between p-3 border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                      <div className="w-6 h-6 rounded-md bg-teal-500/10 border border-teal-500/20"></div>
                                      <div className="h-4 w-24 bg-gray-700/20 rounded"></div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="h-4 w-4 bg-gray-700/20 rounded"></div>
                                    </div>
                                  </div>
                                  {/* Fake Row 3 */}
                                  <div className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-6 h-6 rounded-md bg-teal-500/10 border border-teal-500/20"></div>
                                      <div className="h-4 w-40 bg-gray-700/20 rounded"></div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="h-4 w-4 bg-gray-700/20 rounded"></div>
                                    </div>
                                  </div>
                                </div>

                                {/* Foreground Content */}
                                <div className="relative p-8 flex flex-col items-center justify-center text-center z-10 bg-black/40 backdrop-blur-sm">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-b from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-3 shadow-xl">
                                    <Lock className="w-5 h-5 text-gray-300" />
                                  </div>
                                  <p className="text-sm font-medium text-gray-200">
                                    {
                                      activeResults.results.filter(
                                        (r) => r.isHidden,
                                      ).length
                                    }{" "}
                                    Hidden Case
                                    {activeResults.results.filter(
                                      (r) => r.isHidden,
                                    ).length !== 1
                                      ? "s"
                                      : ""}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1 max-w-[240px]">
                                    These test cases are hidden to test your
                                    solution against edge cases.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  }

                  // Initial display of test cases (before running any tests)
                  // Show list of test cases from assignment details
                  if (
                    assignment?.testCases &&
                    assignment.testCases.length > 0
                  ) {
                    const testCases = assignment.testCases
                    const resultCount = testCases.length

                    return (
                      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="flex items-center gap-2">
                            <Code className="w-5 h-5 text-teal-400" />
                            {resultCount === 1 ? "Test Case" : "Test Cases"}
                          </CardTitle>
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">
                            {resultCount} {resultCount === 1 ? "Case" : "Cases"}
                          </span>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {testCases
                              .map((tc, i) => ({ ...tc, originalIndex: i }))
                              .filter((tc) => !tc.isHidden)
                              .map(({ originalIndex, ...testCase }) => {
                                const isExpanded =
                                  expandedInitialTests.has(originalIndex)

                                return (
                                  <div
                                    key={testCase.id}
                                    className="rounded-lg border border-white/5 overflow-hidden bg-black/20"
                                  >
                                    <button
                                      onClick={() =>
                                        toggleInitialTestExpand(originalIndex)
                                      }
                                      className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors text-left"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono border bg-teal-500/10 text-teal-400 border-teal-500/20">
                                          {originalIndex + 1}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium text-gray-200">
                                            {testCase.name}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        {isExpanded ? (
                                          <ChevronDown className="w-4 h-4 text-gray-500" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4 text-gray-500 -rotate-90" />
                                        )}
                                      </div>
                                    </button>

                                    {isExpanded && (
                                      <div className="border-t border-white/5 bg-gray-950/50 p-4 space-y-4">
                                        {testCase.input ||
                                        testCase.expectedOutput ? (
                                          <>
                                            <div className="grid grid-cols-1 gap-4">
                                              <div>
                                                <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                                                  <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                                                  Input
                                                </p>
                                                <div className="p-3 bg-black/40 rounded-lg border border-white/5 max-h-60 overflow-y-auto custom-scrollbar">
                                                  <pre
                                                    className={`text-xs font-mono whitespace-pre-wrap ${
                                                      !testCase.input
                                                        ? "text-gray-500 italic"
                                                        : "text-gray-300"
                                                    }`}
                                                  >
                                                    {testCase.input ||
                                                      "(No input required)"}
                                                  </pre>
                                                </div>
                                              </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                              {testCase.expectedOutput && (
                                                <div>
                                                  <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                                                    <span className="w-1 h-1 rounded-full bg-gray-500"></span>
                                                    Expected Output
                                                  </p>
                                                  <div className="p-3 bg-black/40 rounded-lg border border-white/5 max-h-60 overflow-y-auto custom-scrollbar">
                                                    <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                                                      {testCase.expectedOutput}
                                                    </pre>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </>
                                        ) : (
                                          <p className="text-xs text-gray-500 italic">
                                            No details available.
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}

                            {testCases.some((tc) => tc.isHidden) && (
                              <div className="relative rounded-lg border border-white/5 overflow-hidden bg-black/20 group select-none">
                                {/* Blurred Background Content (Simulating standard rows) */}
                                <div className="absolute inset-0 flex flex-col pointer-events-none opacity-40 blur-[2px]">
                                  {/* Fake Row 1 */}
                                  <div className="flex items-center justify-between p-3 border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                      <div className="w-6 h-6 rounded-md bg-teal-500/10 border border-teal-500/20"></div>
                                      <div className="h-4 w-32 bg-gray-700/20 rounded"></div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="h-4 w-4 bg-gray-700/20 rounded"></div>
                                    </div>
                                  </div>
                                  {/* Fake Row 2 */}
                                  <div className="flex items-center justify-between p-3 border-b border-white/5">
                                    <div className="flex items-center gap-3">
                                      <div className="w-6 h-6 rounded-md bg-teal-500/10 border border-teal-500/20"></div>
                                      <div className="h-4 w-24 bg-gray-700/20 rounded"></div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="h-4 w-4 bg-gray-700/20 rounded"></div>
                                    </div>
                                  </div>
                                  {/* Fake Row 3 */}
                                  <div className="flex items-center justify-between p-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-6 h-6 rounded-md bg-teal-500/10 border border-teal-500/20"></div>
                                      <div className="h-4 w-40 bg-gray-700/20 rounded"></div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="h-4 w-4 bg-gray-700/20 rounded"></div>
                                    </div>
                                  </div>
                                </div>

                                {/* Foreground Content */}
                                <div className="relative p-8 flex flex-col items-center justify-center text-center z-10 bg-black/40 backdrop-blur-sm">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-b from-white/10 to-transparent border border-white/10 flex items-center justify-center mb-3 shadow-xl">
                                    <Lock className="w-5 h-5 text-gray-300" />
                                  </div>
                                  <p className="text-sm font-medium text-gray-200">
                                    {
                                      testCases.filter((tc) => tc.isHidden)
                                        .length
                                    }{" "}
                                    Hidden Case
                                    {testCases.filter((tc) => tc.isHidden)
                                      .length !== 1
                                      ? "s"
                                      : ""}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1 max-w-[240px]">
                                    These test cases are hidden to test your
                                    solution against edge cases.
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  }

                  return null
                })()}

              {/* Student List - only for Teachers */}
              {isTeacher && (
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
                            onClick={() =>
                              handleSubmissionPreview(submission.id)
                            }
                          >
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-gray-300 font-medium text-sm">
                                {submission.studentName || "Unknown Student"}
                              </p>
                              <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                                Submitted
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 font-mono mb-1">
                              {submission.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(submission.fileSize)} •{" "}
                              {formatDateTime(submission.submittedAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400 text-sm">
                          No submissions yet
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}

      {/* Code Preview Modal */}
      <CodePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        code={previewContent}
        fileName={
          previewFileName || latestSubmission?.fileName || "Code Preview"
        }
        language={previewLanguage}
      />
    </DashboardLayout>
  )
}
