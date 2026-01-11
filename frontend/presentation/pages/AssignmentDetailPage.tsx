import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Upload, FileCode, Clock, Calendar, Code, CheckCircle, RefreshCw, AlertCircle, Play, ChevronDown, Eye, Download } from 'lucide-react'
import { DashboardLayout } from '@/presentation/components/dashboard/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/Card'
import { Button } from '@/presentation/components/ui/Button'
import { BackButton } from '@/presentation/components/ui/BackButton'
import { getCurrentUser } from '@/business/services/authService'
import {
  submitAssignment,
  getSubmissionHistory,
  getAssignmentSubmissions,
  getAssignmentById,
  validateFile,

  getSubmissionContent,
  getSubmissionDownloadUrl
} from '@/business/services/assignmentService'
import { formatFileSize } from '@/shared/utils/formatUtils'
import { formatDateTime } from '@/shared/utils/dateUtils'
import { useToast } from '@/shared/context/ToastContext'
import { runTestsPreview, type TestPreviewResult, getTestResultsForSubmission } from '@/business/services/testService'
import type { User } from '@/business/models/auth/types'
import type { AssignmentDetail, Submission } from '@/business/models/assignment/types'
import { CodePreviewModal } from '@/presentation/components/modals/CodePreviewModal'


export function AssignmentDetailPage() {
  const navigate = useNavigate()
  const { assignmentId } = useParams<{ assignmentId: string }>()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<User | null>(null)
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isRunningPreview, setIsRunningPreview] = useState(false)
  const [previewResults, setPreviewResults] = useState<TestPreviewResult | null>(null)
  const [expandedPreviewTests, setExpandedPreviewTests] = useState<Set<number>>(new Set())
  const [submissionTestResults, setSubmissionTestResults] = useState<TestPreviewResult | null>(null)
  const [expandedSubmissionTests, setExpandedSubmissionTests] = useState<Set<number>>(new Set())

  // Preview Modal State
  const [showPreview, setShowPreview] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  const [previewLanguage, setPreviewLanguage] = useState('')
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate('/login')
      return
    }

    setUser(currentUser)

    // Fetch assignment data
    const fetchAssignmentData = async () => {
      if (!assignmentId || !currentUser) {
        setError('Assignment not found')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch assignment details
        const assignmentData = await getAssignmentById(
          parseInt(assignmentId),
          parseInt(currentUser.id)
        )
        setAssignment(assignmentData)

        // Fetch submissions based on role
        if (currentUser.role === 'student') {
          const historyResponse = await getSubmissionHistory(
            parseInt(assignmentId),
            parseInt(currentUser.id)
          )

          // Sort submissions by submissionNumber descending (newest first)
          // This ensures consistent ordering with handleSubmit (which prepends)
          // and ensures submissions[0] is interpreted as the latest in the render logic
          const sortedSubmissions = [...historyResponse.submissions].sort((a, b) => b.submissionNumber - a.submissionNumber)
          setSubmissions(sortedSubmissions)

          // Fetch test results for the latest submission
          const latestSubmission = sortedSubmissions.find(s => s.isLatest) || sortedSubmissions[0]

          if (latestSubmission) {
            try {
              const results = await getTestResultsForSubmission(latestSubmission.id)
              setSubmissionTestResults(results)
            } catch (e) {
              console.error('Failed to load test results for latest submission', e)
            }
          }
        } else if (currentUser.role === 'teacher' || currentUser.role === 'admin') {
          // Fetch all submissions for teacher
          const allSubmissions = await getAssignmentSubmissions(
            parseInt(assignmentId),
            true // latest only
          )
          setSubmissions(allSubmissions)
        }
      } catch (err) {
        console.error('Failed to fetch assignment data:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load coursework. Please try again.'
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

  const handleSubmit = async () => {
    if (!selectedFile || !user || !assignmentId || !assignment) return

    // Final validation
    const validationError = validateFile(selectedFile, assignment.programmingLanguage)
    if (validationError) {
      setFileError(validationError)
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const submission = await submitAssignment({
        assignmentId: parseInt(assignmentId),
        studentId: parseInt(user.id),
        file: selectedFile,
        programmingLanguage: assignment.programmingLanguage
      })

      // Add new submission to history
      setSubmissions([submission, ...submissions])

      // Clear preview results
      setPreviewResults(null)
      setExpandedPreviewTests(new Set())

      // Fetch and show new submission test results
      try {
        const results = await getTestResultsForSubmission(submission.id)
        setSubmissionTestResults(results)
      } catch (e) {
        console.error('Failed to load test results for new submission', e)
      }

      // Clear selected file
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      showToast('Coursework submitted successfully!')
    } catch (err) {
      console.error('Failed to submit assignment:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit coursework')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearFile = () => {
    setSelectedFile(null)
    setFileError(null)
    setPreviewResults(null)
    setExpandedPreviewTests(new Set())
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const togglePreviewTestExpand = (index: number) => {
    setExpandedPreviewTests(prev => {
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
    setExpandedSubmissionTests(prev => {
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
        assignment.programmingLanguage as 'python' | 'java' | 'c',
        parseInt(assignmentId)
      )

      setPreviewResults(results)

      if (results.percentage === 100) {
        showToast(`All ${results.total} tests passed! You can now submit.`)
      } else {
        showToast(`${results.passed}/${results.total} tests passed`)
      }
    } catch (err) {
      console.error('Failed to run preview tests:', err)
      showToast(err instanceof Error ? err.message : 'Failed to run tests')
    } finally {
      setIsRunningPreview(false)
    }
  }


  const handleSubmissionPreview = async (submissionId: number) => {
    try {
      setIsPreviewLoading(true)
      const data = await getSubmissionContent(submissionId)
      setPreviewContent(data.content)
      setPreviewLanguage(data.language || 'plaintext')
      setShowPreview(true)
    } catch (err) {
      console.error('Failed to load submission content:', err)
      showToast('Failed to load submission content', 'error')
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const handleSubmissionDownload = async (submissionId: number) => {
    try {
      const url = await getSubmissionDownloadUrl(submissionId)
      window.open(url, '_blank')
    } catch (err) {
      console.error('Failed to download submission:', err)
      showToast('Failed to download submission', 'error')
    }
  }

  // Fallback data if assignment is not yet loaded or found
  const tempAssignment = assignment || {
    id: parseInt(assignmentId || '0'),
    assignmentName: 'Assignment Title',
    description: 'Assignment description will be loaded from the API',
    programmingLanguage: 'python',
    deadline: new Date(),
    allowResubmission: true,
    isActive: true,
    classId: 0,
    className: ''
  }

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin'
  const latestSubmission = submissions[0]
  const hasSubmitted = submissions.length > 0
  const canResubmit = tempAssignment.allowResubmission || !hasSubmitted

  return (
    <DashboardLayout>
      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading coursework...</p>
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
              {error.toLowerCase().includes('unauthorized') ? 'Access Denied' : 'Error Loading Coursework'}
            </p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            {error.toLowerCase().includes('unauthorized') && (
              <p className="text-xs text-gray-600 mb-4">
                You don't have permission to view this coursework. Make sure you're enrolled in the class.
              </p>
            )}
            <BackButton to="/dashboard" label="Back to Dashboard" className="mx-auto" />
          </div>
        </div>
      ) : (
        /* Main Content */
        <>
          {/* Page Header */}
          <div className="mb-6">
            <BackButton />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {/* Removed old back button */}
                <div>
                  <h1 className="text-2xl font-bold text-white">{tempAssignment.assignmentName}</h1>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs font-medium text-blue-100">
                        Due {formatDateTime(tempAssignment.deadline)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                      <RefreshCw className={`w-3.5 h-3.5 ${tempAssignment.allowResubmission ? 'text-green-400' : 'text-yellow-400'}`} />
                      <span className={`text-xs font-medium ${tempAssignment.allowResubmission ? 'text-green-100' : 'text-yellow-100'}`}>
                        {tempAssignment.allowResubmission ? (
                          tempAssignment.maxAttempts
                            ? `${tempAssignment.maxAttempts} Attempts Allowed`
                            : 'Unlimited Attempts'
                        ) : (
                          'Single Submission'
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Teacher Actions */}
              {isTeacher && (
                <Button
                  onClick={() => showToast('Checking for similarities...', 'info')}
                  className="w-auto bg-purple-600 hover:bg-purple-700"
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Assignment Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Assignment Description */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 whitespace-pre-wrap">{tempAssignment.description}</p>
                </CardContent>
              </Card>

              {/* File Upload Section - Only for Students */}
              {!isTeacher && canResubmit && (
                <Card>
                  <CardHeader>
                    <CardTitle>{hasSubmitted ? 'Resubmit Coursework' : 'Submit Coursework'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* File Input */}
                      <div>
                        <label
                          htmlFor="file-upload"
                          className="block w-full p-8 border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-purple-500/50 hover:bg-white/[0.02] transition-all group"
                        >
                          <input
                            id="file-upload"
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileSelect}
                            accept={
                              tempAssignment.programmingLanguage === 'python'
                                ? '.py,.ipynb'
                                : tempAssignment.programmingLanguage === 'java'
                                  ? '.java,.jar'
                                  : '.c,.h'
                            }
                          />
                          <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                              <Upload className="w-6 h-6 text-purple-400" />
                            </div>
                            <p className="text-gray-200 font-medium mb-1">Click to select file</p>
                            <p className="text-sm text-gray-500">
                              {tempAssignment.programmingLanguage === 'python'
                                ? 'Accepted: .py, .ipynb'
                                : 'Accepted: .java, .jar'}
                            </p>
                            <p className="text-xs text-gray-600 mt-2">Maximum file size: 10MB</p>
                          </div>
                        </label>

                        {/* File Error */}
                        {fileError && (
                          <p className="mt-2 text-sm text-red-400">{fileError}</p>
                        )}

                        {/* Selected File Info */}
                        {selectedFile && !fileError && (
                          <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <FileCode className="w-5 h-5 text-purple-400" />
                                <div>
                                  <p className="text-gray-300 font-medium">{selectedFile.name}</p>
                                  <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                                </div>
                              </div>
                              <button
                                onClick={handleClearFile}
                                className="text-gray-400 hover:text-white transition-colors"
                              >
                                ✕
                              </button>
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
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin text-purple-400" />
                                <span className="text-gray-300">Running Tests...</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2 text-purple-400 group-hover:scale-110 transition-transform" />
                                <span className="text-gray-200 font-medium">Run Tests</span>
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
                            Submit Coursework
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
                      <p className="text-gray-300 font-medium mb-1">Coursework Submitted</p>
                      <p className="text-sm text-gray-500">
                        Resubmission is not allowed for this coursework.
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
                          <p className="text-sm text-gray-500">{submissions.length} submission(s)</p>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-white/10">
                        <p className="text-sm text-gray-400 mb-1">Latest Submission:</p>
                        <p className="text-gray-300 font-mono text-sm">{latestSubmission?.fileName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {latestSubmission?.submittedAt && formatDateTime(latestSubmission.submittedAt)}
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button
                            onClick={() => latestSubmission && handleSubmissionPreview(latestSubmission.id)}
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
                            onClick={() => latestSubmission && handleSubmissionDownload(latestSubmission.id)}
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
                        {latestSubmission?.grade !== undefined && latestSubmission?.grade !== null ? (
                          <div className="flex items-baseline gap-1">
                            <span className={`text-2xl font-bold ${latestSubmission.grade >= 75
                              ? 'text-green-400'
                              : latestSubmission.grade >= 50
                                ? 'text-yellow-400'
                                : 'text-red-400'
                              }`}>
                              {latestSubmission.grade}
                            </span>
                            <span className="text-sm text-gray-500">/ 100</span>
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
                        <p className="text-gray-300 font-medium">Not Submitted</p>
                        <p className="text-sm text-gray-500">No submissions yet</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Test Results Card - Handles both Preview and Submission results */}
              {(previewResults || submissionTestResults) && (() => {
                const activeResults = previewResults || submissionTestResults
                if (!activeResults) return null
                const isPreview = !!previewResults
                const expandedSet = isPreview ? expandedPreviewTests : expandedSubmissionTests
                const toggleFn = isPreview ? togglePreviewTestExpand : toggleSubmissionTestExpand

                return (
                  <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="flex items-center gap-2">
                        <Code className="w-5 h-5 text-purple-400" />
                        {isPreview ? 'Preview Test Results' : 'Test Results'}
                      </CardTitle>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${activeResults.percentage === 100
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>
                        {activeResults.passed}/{activeResults.total} Passed ({activeResults.percentage}%)
                      </span>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {activeResults.results.map((result, index) => {
                          const isAccepted = result.status === 'Accepted'
                          const isExpanded = expandedSet.has(index)

                          return (
                            <div key={index} className="rounded-lg border border-white/5 overflow-hidden bg-black/20">
                              <button
                                onClick={() => !result.isHidden && toggleFn(index)}
                                className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono border ${isAccepted
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                    }`}>
                                    {index + 1}
                                  </span>
                                  <div className="flex flex-col items-start">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-gray-200">
                                        {result.name}
                                      </span>
                                      {result.isHidden && (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-gray-500 border border-white/5 uppercase tracking-wider font-semibold">
                                          Hidden
                                        </span>
                                      )}
                                    </div>
                                    <span className={`text-xs ${isAccepted ? 'text-green-500/70' : 'text-red-500/70'}`}>
                                      {result.status}
                                    </span>
                                  </div>
                                </div>
                                {!result.isHidden && (
                                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                )}
                              </button>

                              {isExpanded && !result.isHidden && (
                                <div className="border-t border-white/5 bg-gray-950/50 p-4 space-y-4">
                                  <div className="grid grid-cols-1 gap-4">
                                    <div>
                                      <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                                        Input
                                      </p>
                                      <div className="p-3 bg-black/40 rounded-lg border border-white/5 max-h-60 overflow-y-auto custom-scrollbar">
                                        <pre className={`text-xs font-mono whitespace-pre-wrap ${!result.input ? 'text-gray-500 italic' : 'text-gray-300'}`}>
                                          {result.input || '(No input required)'}
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
                                          <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">{result.expectedOutput}</pre>
                                        </div>
                                      </div>
                                    )}

                                    {(result.actualOutput || !isAccepted) && (
                                      <div>
                                        <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-1.5 flex items-center gap-1.5">
                                          <span className={`w-1 h-1 rounded-full ${isAccepted ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                          Actual
                                        </p>
                                        <div className={`p-3 rounded-lg border max-h-60 overflow-y-auto custom-scrollbar ${isAccepted
                                          ? 'bg-green-500/5 border-green-500/10'
                                          : 'bg-red-500/5 border-red-500/10'
                                          }`}>
                                          <pre className={`text-xs font-mono whitespace-pre-wrap ${isAccepted ? 'text-green-300' : 'text-red-300'
                                            } ${!result.actualOutput ? 'italic opacity-50' : ''}`}>
                                            {result.actualOutput || '(No output generated)'}
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
                                        <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap">{result.errorMessage}</pre>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
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
                            onClick={() => handleSubmissionPreview(submission.id)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-gray-300 font-medium text-sm">
                                {submission.studentName || 'Unknown Student'}
                              </p>
                              <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                                Submitted
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 font-mono mb-1">{submission.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(submission.fileSize)} •{' '}
                              {formatDateTime(submission.submittedAt)}
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
        fileName={latestSubmission?.fileName || 'Code Preview'}
        language={previewLanguage}
      />
    </DashboardLayout>
  )
}
