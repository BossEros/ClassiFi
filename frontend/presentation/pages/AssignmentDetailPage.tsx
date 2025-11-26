/**
 * Assignment Detail Page Component
 * Part of the Presentation Layer - Pages
 * Displays assignment details and allows students to submit their work
 */

import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload, FileCode, Clock, Calendar, Code, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react'
import { DashboardLayout } from '@/presentation/components/dashboard/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/Card'
import { Button } from '@/presentation/components/ui/Button'
import { getCurrentUser } from '@/business/services/auth/authService'
import {
  submitAssignment,
  getSubmissionHistory,
  getAssignmentSubmissions,
  getAssignmentById,
  formatFileSize,
  validateFile
} from '@/business/services/assignment/assignmentService'
import { useToast } from '@/shared/context/ToastContext'
import type { User } from '@/business/models/auth/types'
import type { AssignmentDetail, Submission } from '@/business/models/assignment/types'

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
          setSubmissions(historyResponse.submissions)
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

      const submission = await submitAssignment(
        parseInt(assignmentId),
        parseInt(user.id),
        selectedFile,
        assignment.programmingLanguage
      )

      // Add new submission to history
      setSubmissions([submission, ...submissions])

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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Temporary assignment data (replace with actual data from API)
  const tempAssignment = assignment || {
    id: parseInt(assignmentId || '0'),
    title: 'Assignment Title',
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
            <Button onClick={() => navigate('/dashboard')} className="w-auto">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      ) : (
        /* Main Content */
        <>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">{tempAssignment.title}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Code className="w-4 h-4" />
                  {tempAssignment.programmingLanguage.charAt(0).toUpperCase() + tempAssignment.programmingLanguage.slice(1)}
                </span>
                <span className="text-gray-600">•</span>
                <span className="flex items-center gap-1.5 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  Due {tempAssignment.deadline.toLocaleDateString()}
                </span>
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
          <Card>
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
                      className="block w-full p-8 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-purple-500/50 hover:bg-white/5 transition-colors"
                    >
                      <input
                        id="file-upload"
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                        accept={tempAssignment.programmingLanguage === 'python' ? '.py,.ipynb' : '.java,.jar'}
                      />
                      <div className="text-center">
                        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-300 font-medium mb-1">Click to select file</p>
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
            <Card>
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
          <Card>
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
                      {latestSubmission?.submittedAt && new Date(latestSubmission.submittedAt).toLocaleString()}
                    </p>
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

          {/* Submission History / Student List */}
          {isTeacher ? (
            <Card>
              <CardHeader>
                <CardTitle>Student Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                {submissions.length > 0 ? (
                  <div className="space-y-3">
                    {submissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => {
                          // TODO: View submission details
                          showToast(`Viewing submission by ${submission.studentName || 'Student'}`)
                        }}
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
                          {new Date(submission.submittedAt).toLocaleString()}
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
          ) : (
            submissions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Submission History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {submissions.map((submission, index) => (
                      <div
                        key={submission.id}
                        className="p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-gray-300 font-medium text-sm">
                            Submission #{submission.submissionNumber}
                          </p>
                          {index === 0 && (
                            <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                              Latest
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 font-mono mb-1">{submission.fileName}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(submission.fileSize)} •{' '}
                          {new Date(submission.submittedAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      </div>
        </>
      )}
    </DashboardLayout>
  )
}
