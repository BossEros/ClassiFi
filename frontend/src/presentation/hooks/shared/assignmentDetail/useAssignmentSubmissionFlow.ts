import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react"
import {
  submitAssignment,
  validateFile,
} from "@/business/services/assignmentService"
import {
  getTestResultsForSubmission,
  runTestsPreview,
} from "@/business/services/testService"
import type { Submission } from "@/business/models/assignment"
import type { AssignmentDetail } from "@/business/models/assignment"
import type { User } from "@/business/models/auth"
import type { TestPreviewResult } from "@/business/models/testCase"
import type { ToastVariant } from "@/presentation/components/ui/Toast"

interface UseAssignmentSubmissionFlowOptions {
  assignmentId: string | undefined
  user: User | null
  assignment: AssignmentDetail | null
  setError: Dispatch<SetStateAction<string | null>>
  setSubmissions: Dispatch<SetStateAction<Submission[]>>
  setSubmissionTestResults: Dispatch<SetStateAction<TestPreviewResult | null>>
  showToast: (message: string, variant?: ToastVariant) => void
}

interface UseAssignmentSubmissionFlowResult {
  fileInputRef: RefObject<HTMLInputElement | null>
  selectedFile: File | null
  fileError: string | null
  isSubmitting: boolean
  isRunningPreview: boolean
  previewResults: TestPreviewResult | null
  resultsError: string | null
  expandedPreviewTests: Set<number>
  expandedSubmissionTests: Set<number>
  expandedInitialTests: Set<number>
  handleFileSelect: (event: ChangeEvent<HTMLInputElement>) => void
  clearSelectedFile: () => void
  handleSubmit: () => Promise<void>
  handleRunPreviewTests: () => Promise<void>
  togglePreviewTestExpand: (index: number) => void
  toggleSubmissionTestExpand: (index: number) => void
  toggleInitialTestExpand: (index: number) => void
}

/**
 * Manages assignment submission flow state and side effects.
 *
 * @param options - Submission dependencies and callback setters.
 * @returns Submission UI state and action handlers.
 */
export function useAssignmentSubmissionFlow({
  assignmentId,
  user,
  assignment,
  setError,
  setSubmissions,
  setSubmissionTestResults,
  showToast,
}: UseAssignmentSubmissionFlowOptions): UseAssignmentSubmissionFlowResult {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const submissionAbortRef = useRef<AbortController | null>(null)
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isRunningPreview, setIsRunningPreview] = useState(false)
  const [previewResults, setPreviewResults] =
    useState<TestPreviewResult | null>(null)
  const [expandedPreviewTests, setExpandedPreviewTests] = useState<Set<number>>(
    new Set(),
  )
  const [expandedSubmissionTests, setExpandedSubmissionTests] = useState<
    Set<number>
  >(new Set())
  const [expandedInitialTests, setExpandedInitialTests] = useState<Set<number>>(
    new Set(),
  )
  const [resultsError, setResultsError] = useState<string | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (submissionAbortRef.current) {
        submissionAbortRef.current.abort()
        submissionAbortRef.current = null
      }

      timeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
      timeoutIdsRef.current = []
    }
  }, [])

  // Handle file selection
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      setFileError(null)
      return
    }

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

  /**
   * Wait for the given delay, but resolve immediately if the signal is aborted.
   */
  const abortableDelay = (ms: number, signal: AbortSignal): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (signal.aborted) { resolve(); return }

      const timeoutId = setTimeout(resolve, ms)
      timeoutIdsRef.current.push(timeoutId)

      signal.addEventListener("abort", () => { clearTimeout(timeoutId); resolve() }, { once: true })
    })
  }

  /**
   * Poll for test results with retries (up to 10 attempts, 1s apart).
   * Returns true if results were loaded, false if aborted or all retries exhausted.
   */
  const fetchTestResultsWithRetry = async (
    submissionId: number,
    signal: AbortSignal,
  ): Promise<boolean> => {
    const maxRetries = 10
    const retryDelayMs = 1000

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (signal.aborted) return false

      try {
        const testResults = await getTestResultsForSubmission(submissionId)

        if (signal.aborted) return false

        setSubmissionTestResults(testResults)
        return true
      } catch {

        if (attempt < maxRetries) {
          await abortableDelay(retryDelayMs, signal)
        }
      }
    }

    return false
  }

  // Clear submission form
  const clearSubmissionForm = () => {
    setSelectedFile(null)
    setPreviewResults(null)
    setExpandedPreviewTests(new Set())
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    if (!selectedFile || !user || !assignmentId || !assignment) {
      return
    }

    // Validate file
    const validationError = validateFile(
      selectedFile,
      assignment.programmingLanguage,
    )

    // Set file error if validation fails
    if (validationError) {
      setFileError(validationError)
      return
    }

    // Try to submit the assignment
    try {
      // Set loading state
      setIsSubmitting(true)
      setError(null)
      setResultsError(null)

      // Parse IDs
      const assignmentIdNumber = parseInt(assignmentId, 10)
      const userIdNumber = parseInt(user.id, 10)

      // Submit assignment
      const submission = await submitAssignment({
        assignmentId: assignmentIdNumber,
        studentId: userIdNumber,
        file: selectedFile,
        programmingLanguage: assignment.programmingLanguage,
      })

      // Update submissions state
      setSubmissions((previousSubmissions) => [
        submission,
        ...previousSubmissions,
      ])

      const hasTestCases = (assignment?.testCases?.length ?? 0) > 0

      if (!hasTestCases) {
        clearSubmissionForm()
        setResultsError(null)
        setSubmissionTestResults(null)
        showToast("Assignment submitted successfully!")

        return
      }

      // Clear submission form
      clearSubmissionForm()

      // Create abort controller for test results polling
      submissionAbortRef.current = new AbortController()
      const signal = submissionAbortRef.current.signal

      timeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
      timeoutIdsRef.current = []

      const didLoadTestResults = await fetchTestResultsWithRetry(submission.id, signal)

      // Clean up timeout references
      timeoutIdsRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
      timeoutIdsRef.current = []

      if (didLoadTestResults) {
        showToast("Assignment submitted successfully!")
      } else if (!signal.aborted) {
        setResultsError("Failed to load test results after multiple attempts. Please refresh the page.")
        showToast("Submission successful, but test results failed to load", "error")
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to submit assignment",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Clear selected file
  const clearSelectedFile = () => {
    setSelectedFile(null)
    setFileError(null)
    setPreviewResults(null)
    setExpandedPreviewTests(new Set())
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Shared toggle helper for test expand/collapse state
  const toggleSetItem = (setter: Dispatch<SetStateAction<Set<number>>>, index: number) => {
    setter((previous) => {
      const next = new Set(previous)
      if (next.has(index)) { next.delete(index) } else { next.add(index) }
      return next
    })
  }

  const togglePreviewTestExpand = (index: number) => toggleSetItem(setExpandedPreviewTests, index)
  const toggleSubmissionTestExpand = (index: number) => toggleSetItem(setExpandedSubmissionTests, index)
  const toggleInitialTestExpand = (index: number) => toggleSetItem(setExpandedInitialTests, index)

  // Handle run preview tests
  const handleRunPreviewTests = async () => {
    if (!selectedFile || !assignment || !assignmentId) {
      return
    }

    try {
      setIsRunningPreview(true)
      setPreviewResults(null)

      const fileContent = await selectedFile.text()

      const previewTestResults = await runTestsPreview(
        fileContent,
        assignment.programmingLanguage as "python" | "java" | "c",
        parseInt(assignmentId, 10),
      )

      setPreviewResults(previewTestResults)

      if (previewTestResults.percentage === 100) {
        showToast(
          `All ${previewTestResults.total} tests passed! You can now submit.`,
        )
      } else {
        showToast(
          `${previewTestResults.passed}/${previewTestResults.total} tests passed`,
        )
      }
    } catch (previewError) {
      showToast(
        previewError instanceof Error
          ? previewError.message
          : "Failed to run tests",
        "error",
      )
    } finally {
      setIsRunningPreview(false)
    }
  }

  // Return all the states and functions
  return {
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
  }
}

